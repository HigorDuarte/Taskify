import { afterAll, describe, expect, it, beforeEach } from "vitest";
import { prisma } from "@/database/prisma";
import request from "supertest"
import { app } from "@/app";

describe("POST /sessions", () => {
    beforeEach(async () => {
        await prisma.user.deleteMany()
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    it("should verify if the user exist, and show his token on body", async () =>{
        const userResponse = await request(app).post("/users").send({
            name: "User Test",
            email: "test@email.com",
            password: "123456"
        })
        
        const sessionResponse = await request(app).post("/sessions").send({
            email: "test@email.com",
            password: "123456"
        })        

        expect(userResponse.status).toBe(201)
        
        expect(sessionResponse.status).toBe(200)
        expect(sessionResponse.body.user).not.toHaveProperty("passwordHash")
        expect(typeof sessionResponse.body.token).toBe("string")
    })

    it("should return 401 when the email does not exist", async () => {
        const sessionEmailExampleError = await request(app).post("/sessions").send({
            email: "example@email.com",
            password: "123456"
        })
    
        expect(sessionEmailExampleError.status).toBe(401)
        expect(sessionEmailExampleError.body.message).toBe("Invalid email or password")
    })

    it("should return 401 when the password does not exist", async () => {
        const userCreate = await request(app).post("/users").send({
            name: "User Test",
            email: "test@email.com",
            password: "123456"
        })
        
        const sessionPasswordExampleError = await request(app).post("/sessions").send({
            email: "test@email.com",
            password: "654321"
        })

        expect(userCreate.status).toBe(201)

        expect(sessionPasswordExampleError.status).toBe(401)
        expect(sessionPasswordExampleError.body.message).toBe("Invalid email or password")

    })

    
})