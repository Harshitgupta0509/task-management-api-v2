import express from "express";
import helmet from "helmet";
import cors from "cors";
import { pinoHttp } from "pino-http";

import { logger } from "./lib/logger.js";
import { rateLimit } from "express-rate-limit";
import { env } from "./config/env.js";
import swaggerUi from "swagger-ui-express";

import { swaggerDocument } from "./config/swagger.js";

import authRoutes from "./modules/auth/auth.routes.js";
import taskRoutes from "./modules/tasks/task.routes.js";

import { errorHandler } from "./middleware/error.middleware.js";

const app = express();
app.use(
    pinoHttp({
        logger,
    })
);

app.use(helmet());

app.use(
    cors({
        origin: "http://localhost:5173",
    })
);

app.use(
    express.json({
        limit: "100kb",
    })
);
app.use(
    cors({
        origin: env.CLIENT_ORIGIN,
    })
);
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument)
);

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
});

app.use(apiLimiter);

app.get("/", (req, res) => {
    res.json({
        message: "Task Management API V2 is running",
    });
});

app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);

app.use(errorHandler);

export default app;