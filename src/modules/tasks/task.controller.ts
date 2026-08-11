import type {
    Request,
    Response,
} from "express";

import type {
    CreateTaskInput,
    UpdateTaskInput,
    GetTasksQuery,
} from "./task.schema.js";

import {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
} from "./task.service.js";

export async function createTaskController(
    req: Request,
    res: Response
) {
    const userId = req.user!.id;

    const { body } = res.locals.validated as {
        body: CreateTaskInput;
    };

    const task = await createTask(
        userId,
        body
    );

    res.status(201).json({
        message: "Task created successfully",
        task,
    });
}

export async function getTasksController(
    req: Request,
    res: Response
) {
    const userId = req.user!.id;

    const { query } =
        res.locals.validated as {
            query: GetTasksQuery;
        };

    const result = await getTasks(
        userId,
        query
    );

    res.status(200).json(result);
}

export async function getTaskByIdController(
    req: Request,
    res: Response
) {
    const userId = req.user!.id;

    const { params } = res.locals.validated as {
        params: {
            id: string;
        };
    };

    const taskId = Number(params.id);

    const task = await getTaskById(
        userId,
        taskId
    );

    res.status(200).json({
        task,
    });
}

export async function updateTaskController(
    req: Request,
    res: Response
) {
    const userId = req.user!.id;

    const validated = res.locals.validated as {
        body: UpdateTaskInput;
        params: {
            id: string;
        };
    };

    const taskId = Number(
        validated.params.id
    );

    const task = await updateTask(
        userId,
        taskId,
        validated.body
    );

    res.status(200).json({
        message: "Task updated successfully",
        task,
    });
}

export async function deleteTaskController(
    req: Request,
    res: Response
) {
    const userId = req.user!.id;

    const { params } = res.locals.validated as {
        params: {
            id: string;
        };
    };

    const taskId = Number(params.id);

    await deleteTask(
        userId,
        taskId
    );

    res.status(204).send();
}