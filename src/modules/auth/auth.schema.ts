import { z } from "zod";

export const registerBodySchema = z.object({
    name: z
        .string()
        .min(2, "Name must be at least 2 characters"),

    email: z
        .string()
        .email("Invalid email address"),

    password: z
        .string()
        .min(6, "Password must be at least 6 characters"),
});

export const loginBodySchema = z.object({
    email: z
        .string()
        .email("Invalid email address"),

    password: z
        .string()
        .min(1, "Password is required"),
});

export const registerSchema = z.object({
    body: registerBodySchema,
});

export const loginSchema = z.object({
    body: loginBodySchema,
});

export type RegisterInput = z.infer<
    typeof registerBodySchema
>;

export type LoginInput = z.infer<
    typeof loginBodySchema
>;