import { prisma } from "@/database/prisma"
import request from "supertest"
import { app } from "@/app"
 
export async function createAndAuthUser(isAdmin = false, email = "test@email.com") {
    const userResponse = await request(app).post("/users").send({
        name: "Test User",
        email,
        password: "123456",
    })
 
    // Promove ANTES do login, porque o role vai dentro do token
    if (isAdmin) {
        await prisma.user.update({
            where: { email },
            data: { role: "ADMIN" },
        })
    }
 
    const authResponse = await request(app).post("/sessions").send({
        email,
        password: "123456",
    })
 
    return { token: authResponse.body.token as string, user: userResponse.body }
}
 
export async function createProject(
    token: string,
    data: { title: string; description?: string } = {
        title: "Test Project",
        description: "Test Description",
    }
) {
    return request(app)
        .post("/projects")
        .set("Authorization", `Bearer ${token}`)
        .send(data)
}
 
export async function createAuthUserAndAuthProject() {
    const { token, user } = await createAndAuthUser()
    const project = await createProject(token)
 
    return { token, user, project }
}
 
export async function createTask(
    token: string,
    projectId: string,
    data: { title: string; description?: string } = {
        title: "Test Task",
        description: "Test Description",
    }
) {
    return request(app)
        .post(`/projects/${projectId}/tasks`)
        .set("Authorization", `Bearer ${token}`)
        .send(data)
}
