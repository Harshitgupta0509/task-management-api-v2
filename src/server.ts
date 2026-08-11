import app from "./app.js";

import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { logger } from "./lib/logger.js";

async function startServer() {
    try {
        await prisma.$connect();

        logger.info(
            "Database connected"
        );

        app.listen(
            env.PORT,
            () => {
                logger.info(
                    {
                        port: env.PORT,
                    },
                    "Server started"
                );
            }
        );
    } catch (error) {
        logger.error(
            {
                err: error,
            },
            "Failed to start server"
        );

        await prisma.$disconnect();

        process.exit(1);
    }
}

startServer();