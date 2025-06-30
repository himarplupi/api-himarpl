import { type NextRequest } from "next/server";

import { ipAddress } from "@vercel/functions";
import { db } from "@/server/db";
import { ratelimit } from "@/server/ratelimit";
import { departments, periods, programs } from "@/server/db/schema";
import { alias } from "drizzle-orm/sqlite-core";
import { eq, and, like, sql } from "drizzle-orm";

/**
 * @swagger
 * /api/v1/departments:
 *   get:
 *     tags:
 *       - Departments
 *     summary: Get departments by type, year, and optional acronym
 *     description: Returns department data filtered by type (be or dp), period year, and optional acronym
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
 *         name: type
 *         required: false
 *         schema:
 *           type: string
 *           enum: [be, dp]
 *         description: Type of department (be = Badan Eksekutif, dp = Dewan Perwakilan)
 *       - in: query
 *         name: year
 *         required: false
 *         schema:
 *           type: integer
 *           example: 2024
 *         description: Period year of the department
 *       - in: query
 *         name: acronym
 *         required: false
 *         schema:
 *           type: string
 *           example: kominfo
 *         description: Acronym of the department (optional)
 *     responses:
 *       200:
 *         $ref: '#/components/responses/DepartmentsResponse'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

export async function GET(request: NextRequest) {
  try {
    const ip = ipAddress(request) as string;
    const department = alias(departments, "departments");
    const period = alias(periods, "period");
    const program = alias(programs, "program");

    const { success, reset } = await ratelimit.limit(ip);

    if (!success) {
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          timestamp: new Date().toISOString(),
          code: "TOO MANY REQUESTS",
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
    const page = Math.max(1, Number(searchParams.get("page")) ?? 1);
    const limit = Math.min(
      50,
      Math.max(1, Number(searchParams.get("limit") ?? 10))
    );
    const skip = (page - 1) * limit;

    const rawType = searchParams.get("type");
    const type = rawType ? rawType.toLowerCase() : undefined;
    const yearParam = searchParams.get("year");
    const year = yearParam ? Number(yearParam) : undefined;
    const acronym = searchParams.get("acronym")?.toLowerCase() ?? "";

    const filters = [];

    if (type) {
      const validTypes = ["be", "dp"];

      if (!validTypes.includes(type)) {
        return new Response(
          JSON.stringify({
            error: "Invalid type value",
            timestamp: new Date().toISOString(),
            code: "BAD_REQUEST",
            metadata: {
              allowedTypes: validTypes,
            },
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
      filters.push(eq(departments.type, type.toUpperCase()));
    }

    if (year !== undefined && !isNaN(year)) {
      filters.push(eq(departments.periodYear, year));
    }

    if (acronym) {
      filters.push(like(departments.acronym, `%${acronym}%`));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const [flatResult, countResult] = await Promise.all([
      db
        .select({
          id: department.id,
          name: department.name,
          acronym: department.acronym,
          image: department.image,
          description: department.description,
          type: department.type,
          periodYear: department.periodYear,
          period: {
            id: period.id,
            year: period.year,
            name: period.name,
          },
          programs: {
            id: program.id,
            content: program.content,
          },
        })
        .from(department)
        .leftJoin(period, eq(department.periodYear, period.year))
        .leftJoin(program, eq(department.id, program.departmentId))
        .where(whereClause)
        .orderBy(department.acronym)
        .offset(skip)
        .limit(limit),

      db
        .select({
          count: sql`COUNT(*)`,
        })
        .from(department)
        .where(whereClause),
    ]);

    const departmentsGroup = Object.values(
      flatResult.reduce((acc, row) => {
        if (!acc[row.id]) {
          acc[row.id] = {
            id: row.id,
            name: row.name,
            acronym: row.acronym,
            image: row.image,
            description: row.description,
            type: row.type,
            periodYear: row.periodYear,
            period: row.period
              ? {
                  id: row.period.id,
                  year: row.period.year,
                  name: row.period.name,
                }
              : null,
            programs: [],
          };
        }

        if (row.programs) {
          if (row.programs.id && row.programs.content) {
            acc[row.id].programs.push({
              id: row.programs.id,
              content: row.programs.content,
            });
          }
        }
        return acc;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, {} as Record<string, any>)
    );

    const total = Number(countResult[0].count);
    const totalPages = Math.ceil(total / limit);

    return new Response(
      JSON.stringify({
        data: departmentsGroup,
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
    console.error("Error fetching departments", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        timestamp: new Date().toISOString(),
        code: "INTERNAL_ERROR",
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
