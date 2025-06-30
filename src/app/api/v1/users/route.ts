import { type NextRequest } from "next/server";

import { ipAddress } from "@vercel/functions";
import { db } from "@/server/db";
import { ratelimit } from "@/server/ratelimit";
import { parseCommaSeparatedString, toIntEachItems } from "@/lib/utils";

import { eq, inArray, and, asc, desc, sql } from "drizzle-orm";
import {
  users,
  departments,
  periods,
  positions,
  departmentToUser,
  periodToUser,
  positionToUser,
} from "@/server/db/schema";

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get users with pagination, sorting, and filtering
 *     description: Returns a paginated list of users and supports sorting and filtering by period year, department, and position.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [name, username]
 *           default: name
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *       - in: query
 *         name: periodYears
 *         schema:
 *           type: string
 *         description: Comma-separated list of period years to filter by
 *         example: 2024,2025
 *       - in: query
 *         name: departmentIds
 *         schema:
 *           type: string
 *         description: Comma-separated list of department IDs to filter by
 *         example: clxyiaefx000027iyasyypajs,clxygtnjl0000oe7smg1mkztp
 *       - in: query
 *         name: positionNames
 *         schema:
 *           type: string
 *         description: Comma-separated list of position names to filter by
 *         example: ketua,wakil ketua,staff
 *     responses:
 *       200:
 *         $ref: '#/components/responses/UsersResponse'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

type OrderBy = "name" | "email" | "username";

export async function GET(request: NextRequest) {
  try {
    const ip = ipAddress(request) as string;

    const { success, reset } = await ratelimit.limit(ip);

    if (!success) {
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          timestamp: new Date().toISOString(),
          code: "TOO_MANY_REQUESTS",
          metadata: {
            resetTimestamp: reset,
          },
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = Math.max(1, Number(searchParams.get("page")) ?? 1);
    const limit = Math.min(
      50,
      Math.max(1, Number(searchParams.get("limit") ?? 10))
    );
    const orderBy = (searchParams.get("orderBy") ?? "name") as OrderBy;
    const order = (searchParams.get("order") as "asc" | "desc") ?? "asc";
    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Optionals
    const periodYears = toIntEachItems(
      parseCommaSeparatedString(searchParams.get("periodYears") ?? "")
    );
    const departmentIds = parseCommaSeparatedString(
      searchParams.get("departmentIds") ?? ""
    );
    const positionNames = parseCommaSeparatedString(
      searchParams.get("positionNames") ?? ""
    );

    const filters = [];

    if (periodYears.length > 0) {
      filters.push(inArray(periods.year, periodYears));
    }

    if (departmentIds.length > 0) {
      filters.push(inArray(departments.id, departmentIds));
    }

    if (positionNames.length > 0) {
      filters.push(inArray(positions.name, positionNames));
    }

    const rawUsers = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        image: users.image,
        bio: users.bio,
        departmentId: departments.id,
        departmentName: departments.name,
        departmentAcronym: departments.acronym,
        departmentPeriodYear: departments.periodYear,
        departmentImage: departments.image,
        periodId: periods.id,
        periodYear: periods.year,
        periodName: periods.name,
        positionId: positions.id,
        positionName: positions.name,
        positionDepartmentId: positions.departmentId,
      })
      .from(users)
      .leftJoin(departmentToUser, eq(users.id, departmentToUser.userId))
      .leftJoin(departments, eq(departmentToUser.departmentId, departments.id))
      .leftJoin(positionToUser, eq(users.id, positionToUser.userId))
      .leftJoin(positions, eq(positionToUser.positionId, positions.id))
      .leftJoin(periodToUser, eq(users.id, periodToUser.userId))
      .leftJoin(periods, eq(periodToUser.periodId, periods.id))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(order === "asc" ? asc(users[orderBy]) : desc(users[orderBy]))
      .offset(skip)
      .limit(limit);

    const countResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${users.id})`,
      })
      .from(users)
      .leftJoin(departmentToUser, eq(users.id, departmentToUser.userId))
      .leftJoin(departments, eq(departmentToUser.departmentId, departments.id))
      .leftJoin(positionToUser, eq(users.id, positionToUser.userId))
      .leftJoin(positions, eq(positionToUser.positionId, positions.id))
      .leftJoin(periodToUser, eq(users.id, periodToUser.userId))
      .leftJoin(periods, eq(periodToUser.periodId, periods.id))
      .where(filters.length > 0 ? and(...filters) : undefined);

    // Calculate total pages
    const total = countResult[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    const usersGroup = Object.values(
      rawUsers.reduce((acc, row) => {
        if (!acc[row.id]) {
          acc[row.id] = {
            id: row.id,
            name: row.name,
            username: row.username,
            image: row.image,
            bio: row.bio,
            departments: [],
            periods: [],
            positions: [],
          };
        }

        if (row.departmentId) {
          acc[row.id].departments.push({
            id: row.departmentId,
            name: row.departmentName,
            acronym: row.departmentAcronym,
            periodYear: row.departmentPeriodYear,
            image: row.departmentImage,
          });
        }

        if (row.periodId) {
          acc[row.id].periods.push({
            id: row.periodId,
            year: row.periodYear,
            name: row.periodName,
          });
        }

        if (row.positionId) {
          acc[row.id].positions.push({
            id: row.positionId,
            name: row.positionName,
            departmentId: row.positionDepartmentId,
          });
        }
        return acc;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, {} as Record<string, any>)
    );

    return new Response(
      JSON.stringify({
        data: usersGroup,
        timestamp: new Date().toISOString(),
        code: "SUCCESS",
        metadata: {
          total,
          page,
          limit,
          totalPages,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error fetching news:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        timestamp: new Date().toISOString(),
        code: "INTERNAL_SERVER_ERROR",
        metadata: {
          message: error.message,
        },
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
