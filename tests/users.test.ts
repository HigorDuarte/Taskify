import { describe, expect, it } from "vitest"
import { prisma } from "@/database/prisma"
import request from "supertest"
import { app } from "@/app"
import { createAndAuthUser } from "./helpers"

describe("POST /users", () => {
    it("should create a user and not return the password hash", async () => {
        const response = await request(app).post("/users").send({
            name: "Test User",
            email: "test@email.com",
            password: "123456",
        })

        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty("id")
        expect(response.body.email).toBe("test@email.com")
        expect(response.body).not.toHaveProperty("passwordHash")
    })

    it("should return 409 when the email is already registered", async () => {
        const firstResponse = await request(app).post("/users").send({
            name: "User Test",
            email: "test@email.com",
            password: "123456",
        })
        expect(firstResponse.status).toBe(201)

        const secondResponse = await request(app).post("/users").send({
            name: "User Test",
            email: "test@email.com",
            password: "123456",
        })

        expect(secondResponse.status).toBe(409)
        expect(secondResponse.body.message).toBe("This email already exists")
    })
})

describe("DELETE /users/:id", () => {
    it("should return 401 if no token is provided", async () => {
        const createUserResponse = await request(app).post("/users").send({
            name: "Test User",
            email: "test@email.com",
            password: "123456",
        })

        const { id } = createUserResponse.body

        const response = await request(app).delete(`/users/${id}`)

        expect(response.status).toBe(401)
    })

    it("should be able to delete own account", async () => {
        const { token, user } = await createAndAuthUser()

        const response = await request(app)
            .delete(`/users/${user.id}`)
            .set("Authorization", `Bearer ${token}`)

        expect(response.status).toBe(204)

        const deletedUser = await prisma.user.findUnique({ where: { id: user.id } })
        expect(deletedUser).toBeNull()
    })

    it("should return 404 if a user tries to delete another account", async () => {
        const userA = await createAndAuthUser()
        const userB = await createAndAuthUser(false, "other@email.com")

        const response = await request(app)
            .delete(`/users/${userB.user.id}`)
            .set("Authorization", `Bearer ${userA.token}`)

        expect(response.status).toBe(404)
        expect(response.body.message).toBe("User not found")
    })

    it("should return 401 if the user has active projects", async () => {
        const { token, user } = await createAndAuthUser()

        await prisma.project.create({
            data: {
                title: "Project Test",
                status: "ACTIVE",
                ownerId: user.id,
            },
        })

        const response = await request(app)
            .delete(`/users/${user.id}`)
            .set("Authorization", `Bearer ${token}`)

        expect(response.status).toBe(401)
        expect(response.body.message).toBe("The user has active projects to do")
    })
})

describe("GET /users", () => {
    it("should return all users for an admin", async () => {
        const { token } = await createAndAuthUser(true, "admin@email.com")
        await createAndAuthUser(false, "other@email.com")

        const response = await request(app)
            .get("/users")
            .set("Authorization", `Bearer ${token}`)

        expect(response.status).toBe(200)
        expect(response.body).toHaveLength(2)
        expect(response.body[0]).not.toHaveProperty("passwordHash")
    })

    it("shouldn't return the users if the user is not an admin", async () => {
        const { token } = await createAndAuthUser()

        const response = await request(app)
            .get("/users")
            .set("Authorization", `Bearer ${token}`)

        expect(response.status).toBe(403)
        expect(response.body.message).toBe("You don't have authorization")
    })
})