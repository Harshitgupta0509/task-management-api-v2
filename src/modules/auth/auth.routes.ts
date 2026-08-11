import { Router } from "express";

import {
    register,
    login,
} from "./auth.controller.js";

import {
    registerSchema,
    loginSchema,
} from "./auth.schema.js";

import {
    validate,
} from "../../middleware/validate.middleware.js";
import { rateLimit } from "express-rate-limit";
const router = Router();
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
});
router.post(
    "/register",
    authLimiter,
    validate(registerSchema),
    register
);

router.post(
    "/login",
    authLimiter,
    validate(loginSchema),
    login
);

export default router;