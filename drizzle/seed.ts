import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { users, posts, postTags, postToPostTag } from "@/server/db/schema";
import { createId } from "@paralleldrive/cuid2";

async function main() {
  await postsMigration();
}

async function postsMigration() {
  console.log("\n\nPOSTS MIGRATION STARTED\n\n");

  const userIds = await db
    .select({
      id: users.id,
    })
    .from(users)
    .limit(2);

  const postsData = [
    {
      id: createId(),
      authorId: userIds[0].id,
      title: "test berita",
      metaTitle: "meta test berita",
      slug: "berita",
      content: "this is a test berita content",
      rawHtml: "<p>this is a test berita content</p>",
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: Date.now().toString(),
    },
    {
      id: createId(),
      authorId: userIds[1].id,
      title: "test berita 2",
      metaTitle: "meta test berita 2",
      slug: "berita-2",
      content: "this is a test berita 2 content",
      rawHtml: "<p>this is a test berita 2 content</p>",
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: Date.now().toString(),
    },
  ];

  for (const post of postsData) {
    await db.insert(posts).values(post);

    // set post tag relation
    const postTag = await db
      .select({ id: postTags.id })
      .from(postTags)
      .where(eq(postTags.title, "berita"))
      .limit(1);

    await db.insert(postToPostTag).values({
      postId: post.id,
      postTagId: postTag[0].id,
    });
  }
}

main()
  .then(() => {
    console.log("done");
  })
  .catch((e) => {
    console.log(e);
  });
