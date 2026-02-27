import * as dotenv from "dotenv";
// Load .env.local first (Next.js convention), then fall back to .env
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
