import { app } from "@/app"
import request from "supertest"

export async function createAndAuthenticateUser(){
    const userResponse = await request(app).post("/users").send({
        name: "Test User",
        email: "test@email.com",
        password: "123456"
    })

    const {token, user} = userResponse.body

    return {token, user}

}