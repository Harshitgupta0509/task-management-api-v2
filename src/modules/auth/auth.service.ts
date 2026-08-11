import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import type {
    RegisterInput,
    LoginInput,
} from "./auth.schema.js";

export async function registerUser(
    data: RegisterInput
) {
    const existingUser = await prisma.user.findUnique({
        where: {
            email: data.email,
        },
    });

    if (existingUser) {
        throw new AppError(
            "User already exists",
            409
        );
    }

    const hashedPassword = await bcrypt.hash(
        data.password,
        10
    );

    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
        },

        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
        },
    });

    return user;
}

export async function loginUser(
    data: LoginInput
) {
    const user = await prisma.user.findUnique({
        where: {
            email: data.email,
        },
    });

    if (!user) {
        throw new AppError(
            "Invalid email or password",
            401
        );
    }

    const passwordMatches = await bcrypt.compare(
        data.password,
        user.password
    );

    if (!passwordMatches) {
        throw new AppError(
            "Invalid email or password",
            401
        );
    }

    const token = jwt.sign(
        {
            userId: user.id,
        },
        env.JWT_SECRET,
        {
            expiresIn:
                env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
        }
    );

    return {
        token,

        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
    };
}