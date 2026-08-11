import { z } from "zod";

export const createTaskBodySchema = z.object({
    title: z
        .string()
        .min(1, "Title is required")
        .max(
            200,
            "Title cannot exceed 200 characters"
        ),

    description: z
        .string()
        .max(
            1000,
            "Description cannot exceed 1000 characters"
        )
        .optional(),
});

export const updateTaskBodySchema = z.object({
    title: z
        .string()
        .min(
            1,
            "Title cannot be empty"
        )
        .max(
            200,
            "Title cannot exceed 200 characters"
        )
        .optional(),

    description: z
        .string()
        .max(
            1000,
            "Description cannot exceed 1000 characters"
        )
        .optional(),

    completed: z
        .boolean()
        .optional(),
});

export const taskIdParamsSchema = z.object({
    id: z
        .string()
        .regex(
            /^\d+$/,
            "Task ID must be a positive integer"
        ),
});
export const getTasksQuerySchema = z.object({
    page: z.coerce
        .number()
        .int()
        .positive()
        .default(1),

    limit: z.coerce
        .number()
        .int()
        .positive()
        .max(100)
        .default(10),

    completed: z
        .enum(["true", "false"])
        .transform((value) => value === "true")
        .optional(),

    search: z
        .string()
        .trim()
        .min(1)
        .optional(),

    sortBy: z
        .enum([
            "createdAt",
            "updatedAt",
            "title",
        ])
        .default("createdAt"),

    order: z
        .enum([
            "asc",
            "desc",
        ])
        .default("desc"),
});

export const createTaskSchema = z.object({
    body: createTaskBodySchema,
});

export const updateTaskSchema = z.object({
    body: updateTaskBodySchema,
});

export const taskIdSchema = z.object({
    params: taskIdParamsSchema,
});
export const getTasksSchema = z.object({
    query: getTasksQuerySchema,
});
export type CreateTaskInput = z.infer<
    typeof createTaskBodySchema
>;

export type UpdateTaskInput = z.infer<
    typeof updateTaskBodySchema
>;
export type GetTasksQuery = z.infer<
    typeof getTasksQuerySchema
>;