CREATE TABLE "HomepageSelection" ("id" TEXT NOT NULL, "courseIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], CONSTRAINT "HomepageSelection_pkey" PRIMARY KEY ("id"));
