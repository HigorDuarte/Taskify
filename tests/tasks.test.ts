import { createAndAuthUser, createAuthUserAndAuthProject, createTask } from "./helpers"
import { describe, expect, it } from "vitest"
import { randomUUID } from "node:crypto"
import { prisma } from "@/database/prisma"
import request from "supertest"
import { app } from "@/app"

describe("POST /projects/:projectId/tasks", () => {
    it("should create a task in the user's project", async () => {
        const { token, project } = await createAuthUserAndAuthProject()

        const response = await createTask(token, project.body.id)

        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty("id")
        expect(response.body.title).toBe("Test Task")
        expect(response.body.projectId).toBe(project.body.id)
    })

    it("should return 401 if the user is not authenticated", async () => {
        const { project } = await createAuthUserAndAuthProject()

        const response = await request(app)
            .post(`/projects/${project.body.id}/tasks`)
            .send({ title: "Test Task" })

        expect(response.status).toBe(401)
    })

    it("should return 404 if the project does not exist", async () => {
        const { token } = await createAndAuthUser()

        const response = await createTask(token, randomUUID())

        expect(response.status).toBe(404)
    })

    it("should return 404 if the project belongs to another user", async () => {
        const { project } = await createAuthUserAndAuthProject()
        const userB = await createAndAuthUser(false, "other@email.com")

        const response = await createTask(userB.token, project.body.id)

        expect(response.status).toBe(404)
    })

    it("should return 400 if the title is empty", async () => {
        const { token, project } = await createAuthUserAndAuthProject()

        const response = await createTask(token, project.body.id, { title: "" })

        expect(response.status).toBe(400)
    })
})

describe("GET /projects/:projectId/tasks", () => {
    it("should return the tasks of the project", async () => {
        const { token, project } = await createAuthUserAndAuthProject()
        await createTask(token, project.body.id, { title: "Task 1" })
        await createTask(token, project.body.id, { title: "Task 2" })

        const response = await request(app)
            .get(`/projects/${project.body.id}/tasks`)
            .set("Authorization", `Bearer ${token}`)

        expect(response.status).toBe(200)
        expect(response.body).toHaveLength(2)
    })

    it("should return 401 if the user is not authenticated", async () => {
        const { project } = await createAuthUserAndAuthProject()

        const response = await request(app).get(`/projects/${project.body.id}/tasks`)

        expect(response.status).toBe(401)
    })

    it("should return 404 if the project belongs to another user", async () => {
        const { project } = await createAuthUserAndAuthProject()
        const userB = await createAndAuthUser(false, "other@email.com")

        const response = await request(app)
            .get(`/projects/${project.body.id}/tasks`)
            .set("Authorization", `Bearer ${userB.token}`)

        expect(response.status).toBe(404)
    })
})

describe("PATCH /tasks/:taskId", () => {
    it("should update a task", async () => {
        const { token, project } = await createAuthUserAndAuthProject()
        const task = await createTask(token, project.body.id)

        const response = await request(app)
            .patch(`/tasks/${task.body.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ title: "Updated Task", status: "IN_PROGRESS" })

        expect(response.status).toBe(200)
        expect(response.body.title).toBe("Updated Task")
        expect(response.body.status).toBe("IN_PROGRESS")
    })

    it("should return 401 if the user is not authenticated", async () => {
        const { token, project } = await createAuthUserAndAuthProject()
        const task = await createTask(token, project.body.id)

        const response = await request(app)
            .patch(`/tasks/${task.body.id}`)
            .send({ title: "Updated Task" })

        expect(response.status).toBe(401)
    })

    it("should return 404 if the task does not exist", async () => {
        const { token } = await createAndAuthUser()

        const response = await request(app)
            .patch(`/tasks/${randomUUID()}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ title: "Updated Task" })

        expect(response.status).toBe(404)
    })

    it("should return 404 if the task belongs to another user", async () => {
        const { token, project } = await createAuthUserAndAuthProject()
        const task = await createTask(token, project.body.id)
        const userB = await createAndAuthUser(false, "other@email.com")

        const response = await request(app)
            .patch(`/tasks/${task.body.id}`)
            .set("Authorization", `Bearer ${userB.token}`)
            .send({ title: "Hacked" })

        expect(response.status).toBe(404)
    })

    it("should return 400 if the status is invalid", async () => {
        const { token, project } = await createAuthUserAndAuthProject()
        const task = await createTask(token, project.body.id)

        const response = await request(app)
            .patch(`/tasks/${task.body.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ status: "INVALID_STATUS" })

        expect(response.status).toBe(400)
    })
})

describe("DELETE /tasks/:taskId", () => {
    it("should delete a task when it is DONE", async () => {
        const { token, project } = await createAuthUserAndAuthProject()
        const task = await createTask(token, project.body.id)

        await request(app)
            .patch(`/tasks/${task.body.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ status: "DONE" })

        const response = await request(app)
            .delete(`/tasks/${task.body.id}`)
            .set("Authorization", `Bearer ${token}`)

        expect(response.status).toBe(204)

        const deletedTask = await prisma.task.findUnique({ where: { id: task.body.id } })
        expect(deletedTask).toBeNull()
    })

    it("should return 409 if the task is not DONE", async () => {
        const { token, project } = await createAuthUserAndAuthProject()
        const task = await createTask(token, project.body.id)

        const response = await request(app)
            .delete(`/tasks/${task.body.id}`)
            .set("Authorization", `Bearer ${token}`)

        expect(response.status).toBe(409)
        expect(response.body.message).toBe("Task is not finished")
    })

    it("should return 401 if the user is not authenticated", async () => {
        const { token, project } = await createAuthUserAndAuthProject()
        const task = await createTask(token, project.body.id)

        const response = await request(app).delete(`/tasks/${task.body.id}`)

        expect(response.status).toBe(401)
    })

    it("should return 404 if the task does not exist", async () => {
        const { token } = await createAndAuthUser()

        const response = await request(app)
            .delete(`/tasks/${randomUUID()}`)
            .set("Authorization", `Bearer ${token}`)

        expect(response.status).toBe(404)
    })

    it("should return 404 if the task belongs to another user", async () => {
        const { token, project } = await createAuthUserAndAuthProject()
        const task = await createTask(token, project.body.id)
        const userB = await createAndAuthUser(false, "other@email.com")

        const response = await request(app)
            .delete(`/tasks/${task.body.id}`)
            .set("Authorization", `Bearer ${userB.token}`)

        expect(response.status).toBe(404)
    })
})