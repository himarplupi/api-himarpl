import { promises as fs } from "fs";
import neatCsv from "neat-csv";

import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import {
  users,
  positionToUser,
  departmentToUser,
  periods,
  periodToUser,
  departments,
  positions,
  programs,
  posts,
  postTags,
  postToPostTag,
} from "@/server/db/schema";
import { createId } from "@paralleldrive/cuid2";

async function main() {
  await departmentMigration();
  await generatePositions();
  await postMigration();
  await userMigration();
}

async function generatePositions() {
  console.log("\n\nPOSITION GENERATION STARTED\n\n");

  const departmentsResult = await db
    .select({
      id: departments.id,
      acronym: departments.acronym,
    })
    .from(departments)
    .where(eq(departments.periodYear, 2025));

  const pimpinan = [
    {
      name: "ketua",
    },
    {
      name: "wakil ketua",
    },
  ];

  const sekretaris = [
    {
      name: "sekretaris",
    },
  ];

  const bendahara = [
    {
      name: "bendahara",
    },
  ];

  const staff = [
    {
      name: "staff",
    },
  ];

  const data = departmentsResult
    .map((department) => {
      if (department.acronym === "pimpinan") {
        return pimpinan.map((position) => ({
          id: createId(),
          name: `${position.name}`,
          departmentId: department.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
      }

      if (department.acronym === "sekretaris") {
        return sekretaris.map((position) => ({
          id: createId(),
          name: `${position.name}`,
          departmentId: department.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
      }

      if (department.acronym === "bendahara") {
        return bendahara.map((position) => ({
          id: createId(),
          name: `${position.name}`,
          departmentId: department.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
      }

      return [
        ...pimpinan.map((position) => ({
          id: createId(),
          name: `${position.name}`,
          departmentId: department.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        ...staff.map((position) => ({
          id: createId(),
          name: `${position.name}`,
          departmentId: department.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      ];
    })
    .flat();

  for (const position of data) {
    await db.insert(positions).values(position);
  }
}

async function departmentMigration() {
  console.log("\n\nDEPARTMENT MIGRATION STARTED\n\n");

  // DEFINE DEPARTMENT CSV TYPE
  type DepartmentCSV = {
    id: string;
    name: string;
    acronym: string;
    image: string;
    description: string;
    type: "BE" | "DP";
    createdAt: string;
    updatedAt: string;
    programs: string;
  };

  const departmentContent = await fs.readFile(
    `./drizzle/exports/departments.csv`,
    {
      encoding: "utf8",
    }
  );
  const departmentsData = await neatCsv<DepartmentCSV>(departmentContent);

  // insert departments
  for (const department of departmentsData) {
    const Ids = createId();
    await db.insert(departments).values({
      id: Ids,
      name: department.name,
      acronym: department.acronym,
      image: department.image,
      type: department.type,
      periodYear: 2025,
      description: department.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    department.id = Ids;
  }

  // Mapping String programs
  const departmentsWithProgramsArray = departmentsData.map((department) => {
    return {
      ...department,
      programs: JSON.parse(department.programs) as string[],
    };
  });

  // Flattening the array of programs into a single array
  const programsData = departmentsWithProgramsArray
    .map((department) => {
      return department.programs.map((program) => {
        return {
          id: createId(),
          content: program,
          departmentId: department.id,
        };
      });
    })
    .flat();

  // insert programs
  for (const program of programsData) {
    await db.insert(programs).values(program);
  }
}

async function postMigration() {
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

async function userMigration() {
  console.log("\n\nUSER MIGRATION STARTED\n\n");

  // DEFINE USER CSV TYPE
  type UserCSV = {
    id: string;
    name: string;
    email: string;
    emailVerified: string;
    image: string;
    username: string;
    bio: string;
    position: string;
    role: string;
    lastLoginAt: string;
    createdAt: string;
    updatedAt: string;
    departmentId: string;
    periods: string;
  };

  // READ USER CSV
  const userContent = await fs.readFile(`./drizzle/exports/users.csv`, {
    encoding: "utf8",
  });

  const usersData = await neatCsv<UserCSV>(userContent);

  // Get positions
  const positionsData = await db
    .select({
      id: positions.id,
      name: positions.name,
      departmentId: positions.departmentId,
    })
    .from(positions);

  // Insert users
  for (const user of usersData) {
    const Ids = createId();
    await db.insert(users).values({
      id: Ids,
      name: user.name,
      email: user.email,
      emailVerified: validateDate(user.emailVerified),
      image: validateNull(user.image),
      username: user.username,
      bio: validateNull(user.bio),
      role: user.role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: validateDate(user.lastLoginAt),
    });
    user.id = Ids;
  }

  console.log("\n\nSETTING USER RELATIONS\n\n");

  // Set user relations
  for (const user of usersData) {
    // Find position
    const position = positionsData.find(
      (pos) =>
        pos.name.trim().toLocaleLowerCase() ===
          user.position.trim().toLocaleLowerCase() &&
        pos.departmentId === user.departmentId
    );

    // Set position relation if found
    if (position) {
      await db.insert(positionToUser).values({
        positionId: position.id,
        userId: user.id,
      });
    }

    // Set department relation if exists
    if (validateNull(user.departmentId)) {
      await db.insert(departmentToUser).values({
        departmentId: user.departmentId,
        userId: user.id,
      });
    }

    // Set period relation
    const period = await db
      .select({ id: periods.id })
      .from(periods)
      .where(eq(periods.year, 2025))
      .limit(1);
    if (period.length > 0) {
      await db.insert(periodToUser).values({
        periodId: period[0].id,
        userId: user.id,
      });
    }
  }
}

main()
  .then(() => {
    console.log("done");
  })
  .catch((e) => {
    console.log(e);
  });

function validateNull(value: string) {
  if (value === "null") {
    return null;
  }
  return value;
}

function validateDate(value: string | undefined | null): Date | null {
  if (!value || value === "null") return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}
