import { describe, expect, it } from "vitest"
import request from "supertest"
import { app } from "@/app"

describe("POST /sessions", () => {
    it("should authenticate the user and return the token without the password hash", async () => {
        const userResponse = await request(app).post("/users").send({
            name: "User Test",
            email: "test@email.com",
            password: "123456",
        })
        expect(userResponse.status).toBe(201)

        const sessionResponse = await request(app).post("/sessions").send({
            email: "test@email.com",
            password: "123456",
        })

        expect(sessionResponse.status).toBe(200)
        expect(typeof sessionResponse.body.token).toBe("string")
        expect(sessionResponse.body.user.email).toBe("test@email.com")
        expect(sessionResponse.body.user).not.toHaveProperty("passwordHash")
    })

    it("should return 401 when the email does not exist", async () => {
        const response = await request(app).post("/sessions").send({
            email: "example@email.com",
            password: "123456",
        })

        expect(response.status).toBe(401)
        expect(response.body.message).toBe("Invalid email or password")
    })

    it("should return 401 when the password is wrong", async () => {
        const userResponse = await request(app).post("/users").send({
            name: "User Test",
            email: "test@email.com",
            password: "123456",
        })
        expect(userResponse.status).toBe(201)

        const response = await request(app).post("/sessions").send({
            email: "test@email.com",
            password: "654321",
        })

        expect(response.status).toBe(401)
        expect(response.body.message).toBe("Invalid email or password")
    })
})