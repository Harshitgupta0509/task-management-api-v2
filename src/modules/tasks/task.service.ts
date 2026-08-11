import { prisma } from "../../lib/prisma.js";

import type {
    CreateTaskInput,
    UpdateTaskInput,
    GetTasksQuery,

} from "./task.schema.js";
import { AppError } from "../../utils/app-error.js";
export async function createTask(
    userId: number,
    data: CreateTaskInput
) {
    return prisma.task.create({
        data: {
            title: data.title,
            description: data.description,
            userId,
        },
    });
}

export async function getTasks(
    userId: number,
    query: GetTasksQuery
) {
    const {
        page,
        limit,
        completed,
        search,
        sortBy,
        order,
    } = query;

    const skip = (page - 1) * limit;

    const where = {
        userId,

        ...(completed !== undefined && {
            completed,
        }),

        ...(search && {
            OR: [
                {
                    title: {
                        contains: search,
                        mode: "insensitive" as const,
                    },
                },
                {
                    description: {
                        contains: search,
                        mode: "insensitive" as const,
                    },
                },
            ],
        }),
    };

    const [tasks, total] = await Promise.all([
        prisma.task.findMany({
            where,

            skip,

            take: limit,

            orderBy: {
                [sortBy]: order,
            },
        }),

        prisma.task.count({
            where,
        }),
    ]);

    return {
        tasks,

        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(
                total / limit
            ),
        },
    };
}

export async function getTaskById(
    userId: number,
    taskId: number
) {
    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            userId,
        },
    });

    if (!task) {
        throw new AppError(
            "Task not found",
            404
        );
    }

    return task;
}

export async function updateTask(
    userId: number,
    taskId: number,
    data: UpdateTaskInput
) {
    const existingTask =
        await prisma.task.findFirst({
            where: {
                id: taskId,
                userId,
            },
        });

    if (!existingTask) {
        throw new AppError(
            "Task not found",
            404
        );
    }

    return prisma.task.update({
        where: {
            id: taskId,
        },

        data,
    });
}

export async function deleteTask(
    userId: number,
    taskId: number
) {
    const result = await prisma.task.deleteMany({
        where: {
            id: taskId,
            userId,
        },
    });

    if (result.count === 0) {
        throw new AppError(
            "Task not found",
            404
        );
    }
}