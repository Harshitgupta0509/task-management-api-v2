import {
    beforeAll,
    afterAll,
    describe,
    expect,
    it,
} from "vitest";

import request from "supertest";

import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

describe("Task Management API integration", () => {
    let token: string;
    let taskId: number;

    const testUser = {
        name: "Test User",
        email: "integration@test.com",
        password: "12345678",
    };

    beforeAll(async () => {
        await prisma.task.deleteMany();
        await prisma.user.deleteMany();
    });

    afterAll(async () => {
        await prisma.task.deleteMany();
        await prisma.user.deleteMany();

        await prisma.$disconnect();
    });

    it("should register a user", async () => {
        const response = await request(app)
            .post("/auth/register")
            .send(testUser);

        expect(response.status).toBe(201);

        expect(response.body.user.email).toBe(
            testUser.email
        );
    });

    it("should login and return JWT", async () => {
        const response = await request(app)
            .post("/auth/login")
            .send({
                email: testUser.email,
                password: testUser.password,
            });

        expect(response.status).toBe(200);

        expect(response.body.token).toBeDefined();

        token = response.body.token;
    });

    it("should create a task", async () => {
        const response = await request(app)
            .post("/tasks")
            .set(
                "Authorization",
                `Bearer ${token}`
            )
            .send({
                title: "Integration test task",
                description: "Created by Vitest",
            });

        expect(response.status).toBe(201);

        expect(response.body.task.title).toBe(
            "Integration test task"
        );

        taskId = response.body.task.id;
    });

    it("should get user's tasks", async () => {
        const response = await request(app)
            .get("/tasks")
            .set(
                "Authorization",
                `Bearer ${token}`
            );

        expect(response.status).toBe(200);

        expect(response.body.tasks.length)
            .toBeGreaterThan(0);
    });

    it("should update the task", async () => {
        const response = await request(app)
            .patch(`/tasks/${taskId}`)
            .set(
                "Authorization",
                `Bearer ${token}`
            )
            .send({
                completed: true,
            });

        expect(response.status).toBe(200);

        expect(
            response.body.task.completed
        ).toBe(true);
    });

    it("should prevent another user from accessing user's task", async () => {
        // Create a task belonging to User A
        const createResponse = await request(app)
            .post("/tasks")
            .set(
                "Authorization",
                `Bearer ${token}`
            )
            .send({
                title: "Private task",
                description: "Only User A should access this",
            });

        expect(createResponse.status).toBe(201);

        const privateTaskId =
            createResponse.body.task.id;

        // Register User B
        const secondUser = {
            name: "Second User",
            email: "second@test.com",
            password: "12345678",
        };

        const registerResponse = await request(app)
            .post("/auth/register")
            .send(secondUser);

        expect(registerResponse.status).toBe(201);

        // Login User B
        const loginResponse = await request(app)
            .post("/auth/login")
            .send({
                email: secondUser.email,
                password: secondUser.password,
            });

        expect(loginResponse.status).toBe(200);

        const secondUserToken =
            loginResponse.body.token;

        // User B tries to access User A's task
        const response = await request(app)
            .get(`/tasks/${privateTaskId}`)
            .set(
                "Authorization",
                `Bearer ${secondUserToken}`
            );

        expect(response.status).toBe(404);

        expect(response.body.message).toBe(
            "Task not found"
        );
    });

    it("should delete the task", async () => {
        const response = await request(app)
            .delete(`/tasks/${taskId}`)
            .set(
                "Authorization",
                `Bearer ${token}`
            );

        expect(response.status).toBe(204);
    });
});

