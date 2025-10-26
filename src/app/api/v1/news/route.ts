import { type NextRequest } from "next/server";

import { ipAddress } from "@vercel/functions";
import { db } from "@/server/db";
import { ratelimit } from "@/server/ratelimit";
import { posts, postToPostTag, postTags, users } from "@/server/db/schema";
import { eq, sql, and, desc, asc } from "drizzle-orm";

/**
 * @swagger
 * /api/v1/news:
 *   get:
 *     tags:
 *       - News
 *     summary: Get news posts with 'berita' tag
 *     description: Returns paginated news posts with 'berita' tag and supports sorting and filtering
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
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter news by title
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NewsResponse'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

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
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 10)));
    const order = (searchParams.get("order") as "asc" | "desc") ?? "desc";
    const search = searchParams.get("search") ?? "";

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    const filters = [eq(postTags.title, "berita"), sql`${posts.publishedAt} IS NOT NULL`];

    if (search.length > 0) {
      filters.push(sql`LOWER(${posts.title}) LIKE LOWER(${`%${search}%`})`);
    }

    const [rawPosts, totalResult] = await Promise.all([
      db
        .select({
          id: posts.id,
          title: posts.title,
          metaTitle: posts.metaTitle,
          slug: posts.slug,
          content: posts.content,
          image: posts.image,
          link: posts.link,
          publishedAt: posts.publishedAt,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          authorId: posts.authorId,
          authorName: users.name,
          authorUsername: users.username,
          authorImage: users.image,
          postTagTitle: postTags.title,
          postTagSlug: postTags.slug,
        })
        .from(posts)
        .leftJoin(users, eq(posts.authorId, users.id))
        .leftJoin(postToPostTag, eq(posts.id, postToPostTag.postId))
        .leftJoin(postTags, eq(postToPostTag.postTagId, postTags.id))
        .where(and(...filters))
        .orderBy(order === "asc" ? asc(posts.publishedAt) : desc(posts.publishedAt))
        .offset(skip)
        .limit(limit),

      db
        .select({
          count: sql`COUNT(*)`,
        })
        .from(posts)
        .leftJoin(postToPostTag, eq(posts.id, postToPostTag.postId))
        .leftJoin(postTags, eq(postToPostTag.postTagId, postTags.id))
        .where(and(...filters)),
    ]);

    // Calculate total pages and total result
    const total = Number(totalResult[0]?.count ?? 0);
    const totalPages = Math.ceil(total / limit);

    const newsGroup = Object.values(
      rawPosts.reduce((acc, row) => {
        if (!acc[row.id]) {
          acc[row.id] = {
            id: row.id,
            title: row.title,
            metaTitle: row.metaTitle,
            slug: row.slug,
            content: row.content,
            image: row.image,
            publishedAt: row.publishedAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            author: {
              id: row.authorId,
              name: row.authorName,
              username: row.authorUsername,
              image: row.authorImage,
            },
            postTags: [],
          };
        }

        if (row.postTagTitle && row.postTagSlug) {
          acc[row.id].postTags.push({
            title: row.postTagTitle,
            slug: row.postTagSlug,
          });
        }
        return acc;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, {} as Record<string, any>)
    );

    return new Response(
      JSON.stringify({
        data: newsGroup,
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
