import type {
    Request,
    Response,
    NextFunction,
} from "express";

import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

type JwtPayload = {
    userId: number;
};

export function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authorization = req.headers.authorization;

    if (!authorization) {
        res.status(401).json({
            message: "Authentication required",
        });

        return;
    }

    const [type, token] = authorization.split(" ");

    if (type !== "Bearer" || !token) {
        res.status(401).json({
            message: "Invalid authorization header",
        });

        return;
    }

    try {
        const decoded = jwt.verify(
            token,
            env.JWT_SECRET
        ) as JwtPayload;

        req.user = {
            id: decoded.userId,
        };

        next();
    } catch {
        res.status(401).json({
            message: "Invalid or expired token",
        });
    }
}