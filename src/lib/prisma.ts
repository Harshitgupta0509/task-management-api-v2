import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "../config/env.js";

const connectionString =
    env.NODE_ENV === "test"
        ? env.TEST_DATABASE_URL
        : env.DATABASE_URL;

const adapter = new PrismaPg({
    connectionString,
});

export const prisma = new PrismaClient({
    adapter,
});