import type {
    Request,
    Response,
    NextFunction,
} from "express";

import type { ZodType } from "zod";

export function validate(
    schema: ZodType<Record<string, unknown>>
) {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const result = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query,
        });

        if (!result.success) {
            res.status(400).json({
                message: "Validation failed",
                errors: result.error.issues,
            });

            return;
        }

        res.locals.validated = {
            ...(res.locals.validated ?? {}),
            ...result.data,
        };

        next();
    };
}