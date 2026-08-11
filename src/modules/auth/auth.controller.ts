import type {
    Request,
    Response,
} from "express";

import type {
    RegisterInput,
    LoginInput,
} from "./auth.schema.js";

import {
    registerUser,
    loginUser,
} from "./auth.service.js";

export async function register(
    req: Request,
    res: Response
) {
    const { body } = res.locals.validated as {
        body: RegisterInput;
    };

    const user = await registerUser(body);

    res.status(201).json({
        message: "User registered successfully",
        user,
    });
}

export async function login(
    req: Request,
    res: Response
) {
    const { body } = res.locals.validated as {
        body: LoginInput;
    };

    const result = await loginUser(body);

    res.status(200).json({
        message: "Login successful",
        ...result,
    });
}