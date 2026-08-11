import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),

    PORT: z.coerce
        .number()
        .int()
        .positive()
        .default(3000),

    DATABASE_URL: z
        .string()
        .min(1, "DATABASE_URL is required"),

    JWT_SECRET: z
        .string()
        .min(
            32,
            "JWT_SECRET must contain at least 32 characters"
        ),
    TEST_DATABASE_URL: z.string().url().optional(),

    JWT_EXPIRES_IN: z
        .string()
        .default("7d"),

    CLIENT_ORIGIN: z
        .string()
        .url(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
    console.error(
        "Invalid environment variables:",
        result.error.flatten().fieldErrors
    );

    process.exit(1);
}

export const env = result.data;