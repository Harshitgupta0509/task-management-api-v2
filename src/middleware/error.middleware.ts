import type {
    Request,
    Response,
    NextFunction,
} from "express";

import { AppError } from "../utils/app-error.js";
import { logger } from "../lib/logger.js";

export function errorHandler(
    error: unknown,
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            message: error.message,
        });

        return;
    }

    logger.error(
        {
            err: error,
            method: req.method,
            path: req.path,
        },
        "Unhandled application error"
    );

    res.status(500).json({
        message: "Internal server error",
    });
}