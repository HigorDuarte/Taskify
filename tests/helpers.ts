import { app } from "@/app"
import { prisma } from "@/database/prisma"
import request from "supertest"

export async function createAndAuthenticateUser(isAdmin = false){

    const userResponse = await request(app).post("/users").send({
        name: "Test User",
        email: "test@email.com",
        password: "123456"
    })

    if(isAdmin){
        await prisma.user.update({
            where: {email: "test@email.com"},
            data: {role: "ADMIN"}
        })
    }

    const authenticatedUser = await request(app).post("/sessions").send({
        email: "test@email.com",
        password: "123456"
    })

    const token = authenticatedUser.body.token

    return { token, user: userResponse.body}

}