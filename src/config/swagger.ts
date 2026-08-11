export const swaggerDocument = {
    openapi: "3.0.3",

    info: {
        title: "Task Management API V2",
        version: "1.0.0",
        description:
            "Task Management API built with TypeScript, Express, Prisma, PostgreSQL, JWT and Zod",
    },

    servers: [
        {
            url: "https://task-management-api-v2.onrender.com",
            description: "Production server",
        },
        {
            url: "http://localhost:3000",
            description: "Local development server",
        },
    ],

    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },

        schemas: {
            User: {
                type: "object",
                properties: {
                    id: {
                        type: "integer",
                    },

                    name: {
                        type: "string",
                    },

                    email: {
                        type: "string",
                        format: "email",
                    },

                    createdAt: {
                        type: "string",
                        format: "date-time",
                    },
                },
            },

            Task: {
                type: "object",

                properties: {
                    id: {
                        type: "integer",
                    },

                    title: {
                        type: "string",
                    },

                    description: {
                        type: "string",
                        nullable: true,
                    },

                    completed: {
                        type: "boolean",
                    },

                    userId: {
                        type: "integer",
                    },

                    createdAt: {
                        type: "string",
                        format: "date-time",
                    },

                    updatedAt: {
                        type: "string",
                        format: "date-time",
                    },
                },
            },
        },
    },

    paths: {
        "/auth/register": {
            post: {
                tags: ["Auth"],

                summary: "Register a new user",

                requestBody: {
                    required: true,

                    content: {
                        "application/json": {
                            schema: {
                                type: "object",

                                required: [
                                    "name",
                                    "email",
                                    "password",
                                ],

                                properties: {
                                    name: {
                                        type: "string",
                                        example: "Harshit",
                                    },

                                    email: {
                                        type: "string",
                                        format: "email",
                                        example: "harshit@example.com",
                                    },

                                    password: {
                                        type: "string",
                                        example: "12345678",
                                    },
                                },
                            },
                        },
                    },
                },

                responses: {
                    "201": {
                        description: "User registered successfully",
                    },

                    "400": {
                        description: "Validation failed",
                    },

                    "409": {
                        description: "User already exists",
                    },
                },
            },
        },

        "/auth/login": {
            post: {
                tags: ["Auth"],

                summary: "Login user",

                requestBody: {
                    required: true,

                    content: {
                        "application/json": {
                            schema: {
                                type: "object",

                                required: [
                                    "email",
                                    "password",
                                ],

                                properties: {
                                    email: {
                                        type: "string",
                                        format: "email",
                                        example: "harshit@example.com",
                                    },

                                    password: {
                                        type: "string",
                                        example: "12345678",
                                    },
                                },
                            },
                        },
                    },
                },

                responses: {
                    "200": {
                        description: "Login successful",
                    },

                    "400": {
                        description: "Validation failed",
                    },

                    "401": {
                        description: "Invalid email or password",
                    },
                },
            },

        },
        "/tasks": {
            get: {
                tags: ["Tasks"],

                summary: "Get authenticated user's tasks",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                parameters: [
                    {
                        name: "page",
                        in: "query",
                        schema: {
                            type: "integer",
                            default: 1,
                        },
                    },

                    {
                        name: "limit",
                        in: "query",
                        schema: {
                            type: "integer",
                            default: 10,
                            maximum: 100,
                        },
                    },

                    {
                        name: "completed",
                        in: "query",
                        schema: {
                            type: "boolean",
                        },
                    },

                    {
                        name: "search",
                        in: "query",
                        schema: {
                            type: "string",
                        },
                    },

                    {
                        name: "sortBy",
                        in: "query",
                        schema: {
                            type: "string",
                            enum: [
                                "createdAt",
                                "updatedAt",
                                "title",
                            ],
                            default: "createdAt",
                        },
                    },

                    {
                        name: "order",
                        in: "query",
                        schema: {
                            type: "string",
                            enum: [
                                "asc",
                                "desc",
                            ],
                            default: "desc",
                        },
                    },
                ],

                responses: {
                    "200": {
                        description: "Tasks returned successfully",
                    },

                    "401": {
                        description: "Authentication required",
                    },
                },
            },

            post: {
                tags: ["Tasks"],

                summary: "Create a task",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                requestBody: {
                    required: true,

                    content: {
                        "application/json": {
                            schema: {
                                type: "object",

                                required: [
                                    "title",
                                ],

                                properties: {
                                    title: {
                                        type: "string",
                                        example: "Learn Swagger",
                                    },

                                    description: {
                                        type: "string",
                                        example:
                                            "Document Task Management API",
                                    },
                                },
                            },
                        },
                    },
                },

                responses: {
                    "201": {
                        description: "Task created successfully",
                    },

                    "400": {
                        description: "Validation failed",
                    },

                    "401": {
                        description: "Authentication required",
                    },
                },
            },
        },

        "/tasks/{id}": {
            get: {
                tags: ["Tasks"],

                summary: "Get a task by ID",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,

                        schema: {
                            type: "integer",
                        },
                    },
                ],

                responses: {
                    "200": {
                        description: "Task returned successfully",
                    },

                    "404": {
                        description: "Task not found",
                    },
                },
            },

            patch: {
                tags: ["Tasks"],

                summary: "Update a task",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,

                        schema: {
                            type: "integer",
                        },
                    },
                ],

                requestBody: {
                    required: true,

                    content: {
                        "application/json": {
                            schema: {
                                type: "object",

                                properties: {
                                    title: {
                                        type: "string",
                                    },

                                    description: {
                                        type: "string",
                                    },

                                    completed: {
                                        type: "boolean",
                                    },
                                },
                            },
                        },
                    },
                },

                responses: {
                    "200": {
                        description: "Task updated successfully",
                    },

                    "400": {
                        description: "Validation failed",
                    },

                    "404": {
                        description: "Task not found",
                    },
                },
            },

            delete: {
                tags: ["Tasks"],

                summary: "Delete a task",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,

                        schema: {
                            type: "integer",
                        },
                    },
                ],

                responses: {
                    "204": {
                        description: "Task deleted successfully",
                    },

                    "404": {
                        description: "Task not found",
                    },
                },
            },
        },
    },
};
