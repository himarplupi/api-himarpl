import { promises as fs } from "fs";
import neatCsv from "neat-csv";

import { db } from "@/server/db/index";
import { eq } from "drizzle-orm";
import {
  postTags,
  posts,
  programs,
  departments,
  periods,
  positions,
  socialMedias,
  verificationTokens,
  sessions,
  accounts,
  users,
  postToPostTag,
  positionToUser,
  departmentToUser,
  periodToUser,
} from "@/server/db/schema";
import { createId } from "@paralleldrive/cuid2";

async function main() {
  await clearDatabase();

  await generatePeriods();
  await departmentMigration();
  await generatePositions();
  await postTagMigration();
  await userMigration();
  await accountMigration();
  await socialMediaMigration();
}

async function generatePositions() {
  console.log("\n\nPOSITION GENERATION STARTED\n\n");

  const departmentsResult = await db
    .select({
      id: departments.id,
      acronym: departments.acronym,
    })
    .from(departments);

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

  // Insert positions in batches
  for (const position of data) {
    await db.insert(positions).values(position);
  }

  // Insert administrator position
  await db.insert(positions).values({
    id: createId(),
    name: "administrator",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

async function generatePeriods() {
  console.log("\n\nPERIOD GENERATION STARTED\n\n");

  const periodsData = [
    {
      id: createId(),
      year: 2024,
      name: "ascendia",
      logo: "https://cdn.jsdelivr.net/gh/himarplupi/assets-himarpl@main/images/logo/logo-ascendia.svg",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: createId(),
      year: 2025,
      name: "devoria",
      logo: "https://cdn.jsdelivr.net/gh/himarplupi/assets-himarpl@main/images/logo/devoria/logo-devoria.svg",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Insert periods
  for (const period of periodsData) {
    await db.insert(periods).values(period);
  }
}

async function socialMediaMigration() {
  console.log("\n\nSOCIAL MEDIA MIGRATION STARTED\n\n");

  // DEFINE SOCIAL MEDIA CSV TYPE
  type SocialMediaCSV = {
    name: string;
    username: string;
    url: string;
    userId: string;
  };

  // READ SOCIAL MEDIA CSV
  const socialMediaContent = await fs.readFile(
    `./drizzle/exports/social_media.csv`,
    {
      encoding: "utf8",
    }
  );

  const socialMediasData = await neatCsv<SocialMediaCSV>(socialMediaContent);

  // Insert social media entries
  for (const socialMedia of socialMediasData) {
    await db.insert(socialMedias).values({
      name: socialMedia.name,
      username: socialMedia.username,
      url: socialMedia.url,
      userId: socialMedia.userId,
    });
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
    programs: string; // this should mapped to programs table
  };

  const departmentContent = await fs.readFile(
    `./drizzle/exports/department.csv`,
    {
      encoding: "utf8",
    }
  );
  const departmentsData = await neatCsv<DepartmentCSV>(departmentContent);

  // Insert departments
  for (const department of departmentsData) {
    await db.insert(departments).values({
      id: department.id,
      name: department.name,
      acronym: department.acronym,
      image: department.image,
      type: department.type,
      periodYear: 2024,
      description: department.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
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

  // Insert programs
  for (const program of programsData) {
    await db.insert(programs).values(program);
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
    await db.insert(users).values({
      id: user.id,
      name: validateNull(user.name),
      email: validateNull(user.email),
      emailVerified:
        user.emailVerified === "null" ? null : new Date(user.emailVerified),
      image: validateNull(user.image),
      username: validateNull(user.username),
      bio: validateNull(user.bio),
      role: user.role,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
      lastLoginAt:
        user.lastLoginAt === "null" ? null : new Date(user.lastLoginAt),
    });
  }

  console.log("\n\nSETTING USER RELATIONS\n\n");

  // Set user relations
  for (const user of usersData) {
    console.log(user);

    // Find position
    const position = positionsData.find(
      (pos) =>
        pos.name === user.position && pos.departmentId === user.departmentId
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
      .where(eq(periods.year, 2024))
      .limit(1);
    if (period.length > 0) {
      await db.insert(periodToUser).values({
        periodId: period[0].id,
        userId: user.id,
      });
    }
  }
}

async function accountMigration() {
  console.log("\n\nACCOUNT MIGRATION STARTED\n\n");
  // DEFINE ACCOUNT CSV TYPE
  type AccountCSV = {
    id: string;
    name: string;
    type: string;
    userId: string;
    provider: string;
    providerAccountId: string;
    refresh_token: string;
    access_token: string;
    expires_at: string;
    token_type: string;
  };

  // READ ACCOUNT CSV
  const accountContent = await fs.readFile(`./drizzle/exports/account.csv`, {
    encoding: "utf8",
  });

  const accountsData = await neatCsv<AccountCSV>(accountContent);

  // Insert accounts
  for (const account of accountsData) {
    await db.insert(accounts).values({
      id: account.id,
      userId: account.userId,
      type: account.type,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      refreshToken: validateNull(account.refresh_token),
      accessToken: validateNull(account.access_token),
      expiresAt: account.expires_at ? parseInt(account.expires_at) : null,
      tokenType: validateNull(account.token_type),
      scope: null,
      idToken: null,
      sessionState: null,
    });
  }
}

async function postTagMigration() {
  console.log("\n\nPOST-TAG MIGRATION STARTED\n\n");
  // DEFINE POST TAG CSV TYPE
  type PostTagCSV = {
    id: string;
    title: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
    parentId: string;
  };

  // READ POST TAG CSV
  const postTagContent = await fs.readFile(`./drizzle/exports/post-tag.csv`, {
    encoding: "utf8",
  });

  const postTagsData = await neatCsv<PostTagCSV>(postTagContent);

  // Insert post tags
  for (const postTag of postTagsData) {
    await db.insert(postTags).values({
      id: postTag.id,
      title: postTag.title,
      slug: postTag.slug,
      createdAt: new Date(postTag.createdAt),
      updatedAt: new Date(postTag.updatedAt),
      parentId: validateNull(postTag.parentId),
    });
  }
}

async function clearDatabase() {
  // Delete all records in reverse order of dependencies
  await db.delete(postToPostTag);
  await db.delete(postTags);
  await db.delete(posts);
  await db.delete(programs);
  await db.delete(positionToUser);
  await db.delete(departmentToUser);
  await db.delete(periodToUser);
  await db.delete(departments);
  await db.delete(periods);
  await db.delete(positions);
  await db.delete(socialMedias);
  await db.delete(verificationTokens);
  await db.delete(sessions);
  await db.delete(accounts);
  await db.delete(users);
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
