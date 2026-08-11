import {
    describe,
    expect,
    it,
} from "vitest";

import request from "supertest";

import app from "../src/app.js";

describe("Task authentication", () => {
    it("should reject task request without JWT", async () => {
        const response = await request(app)
            .get("/tasks");

        expect(response.status).toBe(401);
    });
});