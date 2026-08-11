import { Router } from "express";

import {
    authenticate,
} from "../../middleware/auth.middleware.js";

import {
    validate,
} from "../../middleware/validate.middleware.js";

import {
    createTaskController,
    getTasksController,
    getTaskByIdController,
    updateTaskController,
    deleteTaskController,
} from "./task.controller.js";

import {
    createTaskSchema,
    updateTaskSchema,
    taskIdSchema,
    getTasksSchema
} from "./task.schema.js";

const router = Router();

router.use(authenticate);

router.post(
    "/",
    validate(createTaskSchema),
    createTaskController
);

router.get(
    "/",
    validate(getTasksSchema),
    getTasksController
);
router.get(
    "/:id",
    validate(taskIdSchema),
    getTaskByIdController
);

router.patch(
    "/:id",
    validate(taskIdSchema),
    validate(updateTaskSchema),
    updateTaskController
);

router.delete(
    "/:id",
    validate(taskIdSchema),
    deleteTaskController
);

export default router;