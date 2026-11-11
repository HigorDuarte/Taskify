import { prisma } from "@/database/prisma";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest" 
import { app } from "@/app";
import { createAndAuthenticateUser } from "./helpers";

describe("POST /users", () => {
    beforeEach(async () => {
        await prisma.user.deleteMany()
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    it("should create an user and not return the password hash", async () => {
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
        expect(firstEmailResponse.status).toBe(201)

        const secondEmailResponse = await request(app).post("/users").send({
            name: "User Test",
            email: "test@email.com",
            password: "123456",
        })
        expect(secondEmailResponse.status).toBe(409)
        expect(secondEmailResponse.body.message).toBe("This email already exists")
    })
})

describe("DELETE /users", () => {
    beforeEach(async () => {
        await prisma.user.deleteMany()
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    it("should return 401 if did not return a token", async () => {
        const createUserResponse = await request(app).post(`/users`).send({
            name: "Test User",
            email: "test@email.com",
            password: "123456"
        })
        
        const { userId } = createUserResponse.body

        const deleteUserResponse = await request(app).delete(`/users/${userId}`)

        expect(deleteUserResponse.status).toBe(401)
    })

    it("should be able to delete own acount", async () => {
        const {user, token} = await createAndAuthenticateUser()
        
        const deleteUserResponse = await request(app)
        .delete(`/users/${user.id}`)
        .set("Authorization", `Bearer ${token}`)

        expect(deleteUserResponse.status).toBe(204)
    })
   
    it("should return 404 if a user try to delete others acount", async () => {
        const userA = await createAndAuthenticateUser()

        const userB = await request(app).post("/users").send({
            name: "Second User Test",
            email: "secontest@email.com",
            password: "123456"
        })

        const {id} = userB.body

        const deleteUserResponse = await request(app)
        .delete(`/users/${id}`)
        .set("Authorization", `Bearer ${userA.token}`)
        
        expect(deleteUserResponse.status).toBe(404)
        expect(deleteUserResponse.body.message).toBe(`User not found`)
    })

    it("should return 401 if user has active projects", async () => {
        const {token, user} = await createAndAuthenticateUser()

        await prisma.project.create({
            data: {
                title: "Project Test",
                status: "ACTIVE",
                ownerId: user.id
            }
        })

        const deleteUserResponse = await request(app).delete(`/users/${user.id}`).set("Authorization", `Bearer ${token}`)

        expect(deleteUserResponse.status).toBe(401)

        expect(deleteUserResponse.body.message).toBe("The user has active projects to do")
    })
})