import { prisma } from "@/database/prisma";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest" 
import { app } from "@/app";

describe("POST /users", () => {
    beforeEach(async () => {
        await prisma.user.deleteMany()
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    it("should create a user and not return the password hash", async () => {
        const response = await request(app).post("/users").send({
            name: "Test User",
            email: "test@email.com",
            password: "123456"
        })
        
        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty("id")
        expect(response.body.email).toBe("test@email.com")
        expect(response.body).not.toHaveProperty("passwordHash")
    }) 
    
    it("should return 409 when the email is already registered", async () => {
        const firstEmailResponse = await request(app).post("/users").send({
            name: "User Test",
            email: "test@email.com",
            password: "123456",
        })

        const secondEmailResponse = await request(app).post("/users").send({
            name: "User Test",
            email: "test@email.com",
            password: "123456",
        })

        expect(firstEmailResponse.status).toBe(201)
        expect(secondEmailResponse.status).toBe(409)
        expect(secondEmailResponse.body.message).toBe("This email already exists")
    })
})