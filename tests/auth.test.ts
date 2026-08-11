import {
    describe,
    expect,
    it,
} from "vitest";

import request from "supertest";

import app from "../src/app.js";

describe("Health endpoint", () => {
    it("should return API status", async () => {
        const response = await request(app)
            .get("/");

        expect(response.status).toBe(200);

        expect(response.body).toEqual({
            message: "Task Management API V2 is running",
        });
    });
});

describe("Auth validation", () => {
    it("should reject invalid registration input", async () => {
        const response = await request(app)
            .post("/auth/register")
            .send({
                name: "H",
                email: "not-an-email",
                password: "12",
            });

        expect(response.status).toBe(400);

        expect(response.body.message).toBe(
            "Validation failed"
        );
    });
});