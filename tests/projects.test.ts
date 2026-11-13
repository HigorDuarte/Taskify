
import { createAndAuthUser, createAuthUserAndAuthProject, createProject } from "./helpers"
import { describe, expect, it } from "vitest"
import { randomUUID } from "node:crypto"
import request from "supertest"
import { app } from "@/app"
 
describe("POST /projects", () => {
    it("should create a project", async () => {
        const { user, project } = await createAuthUserAndAuthProject()
 
        expect(project.status).toBe(201)
        expect(project.body).toHaveProperty("id")
        expect(project.body.title).toBe("Test Project")
        expect(project.body.ownerId).toBe(user.id)
    })
 
    it("shouldn't create a project if the user is not authenticated", async () => {
        const response = await request(app).post("/projects").send({
            title: "Test Project",
            description: "Test Description",
        })
 
        expect(response.status).toBe(401)
        expect(response.body.message).toBe("Invalid JWT token")
    })
})
 
describe("DELETE /projects/:id", () => {
    it("should delete a project", async () => {
        const { token, project } = await createAuthUserAndAuthProject()
 
        const response = await request(app)
            .delete(`/projects/${project.body.id}`)
            .set("Authorization", `Bearer ${token}`)
 
        expect(response.status).toBe(204)
    })
 
    it("should return 401 if the user is not authenticated", async () => {
        const { project } = await createAuthUserAndAuthProject()
 
        const response = await request(app).delete(`/projects/${project.body.id}`)
 
        expect(response.status).toBe(401)
    })
 
    it("should return 404 if the project does not exist", async () => {
        const { token } = await createAndAuthUser()
 
        // precisa ser um UUID válido, senão o zod devolve erro de validação em vez de 404
        const response = await request(app)
            .delete(`/projects/${randomUUID()}`)
            .set("Authorization", `Bearer ${token}`)
 
        expect(response.status).toBe(404)
    })
})
 
describe("PATCH /projects/:id", () => {
    it("should update own project", async () => {
        const { token, project } = await createAuthUserAndAuthProject()
 
        const response = await request(app)
            .patch(`/projects/${project.body.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ title: "Updated Title", status: "COMPLETED" })
 
        expect(response.status).toBe(200)
        expect(response.body.title).toBe("Updated Title")
        expect(response.body.status).toBe("COMPLETED")
    })
 
    it("should return 401 if the user is not authenticated", async () => {
        const { project } = await createAuthUserAndAuthProject()
 
        const response = await request(app)
            .patch(`/projects/${project.body.id}`)
            .send({ title: "Updated Title" })
 
        expect(response.status).toBe(401)
    })
 
    it("should return 404 if the project does not exist", async () => {
        const { token } = await createAndAuthUser()
 
        const response = await request(app)
            .patch(`/projects/${randomUUID()}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ title: "Updated Title" })
 
        expect(response.status).toBe(404)
        expect(response.body.message).toBe("Project not found")
    })
 
    it("should return 404 if a user tries to update another user's project", async () => {
        const { project } = await createAuthUserAndAuthProject()
        const userB = await createAndAuthUser(false, "other@email.com")
 
        const response = await request(app)
            .patch(`/projects/${project.body.id}`)
            .set("Authorization", `Bearer ${userB.token}`)
            .send({ title: "Hacked" })
 
        expect(response.status).toBe(404)
        expect(response.body.message).toBe("Project not found")
    })
 
    it("should allow an admin to update another user's project", async () => {
        const { project } = await createAuthUserAndAuthProject()
        const admin = await createAndAuthUser(true, "admin@email.com")
 
        const response = await request(app)
            .patch(`/projects/${project.body.id}`)
            .set("Authorization", `Bearer ${admin.token}`)
            .send({ title: "Updated By Admin" })
 
        expect(response.status).toBe(200)
        expect(response.body.title).toBe("Updated By Admin")
    })
 
    it("should return 400 if the body is invalid", async () => {
        const { token, project } = await createAuthUserAndAuthProject()
 
        const response = await request(app)
            .patch(`/projects/${project.body.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ status: "INVALID_STATUS" })
 
        expect(response.status).toBe(400)
    })
})
 
describe("GET /projects", () => {
    it("should return 401 if the user is not authenticated", async () => {
        const response = await request(app).get("/projects")
 
        expect(response.status).toBe(401)
    })
 
    it("should return only the projects of the logged user", async () => {
        const userA = await createAndAuthUser()
        const userB = await createAndAuthUser(false, "other@email.com")
 
        await createProject(userA.token, { title: "Project A" })
        await createProject(userB.token, { title: "Project B" })
 
        const response = await request(app)
            .get("/projects")
            .set("Authorization", `Bearer ${userA.token}`)
 
        expect(response.status).toBe(200)
        expect(response.body).toHaveLength(1)
        expect(response.body[0].title).toBe("Project A")
    })
 
    it("should return all projects for an admin", async () => {
        const userA = await createAndAuthUser()
        const admin = await createAndAuthUser(true, "admin@email.com")
 
        await createProject(userA.token, { title: "Project A" })
        await createProject(admin.token, { title: "Project Admin" })
 
        const response = await request(app)
            .get("/projects")
            .set("Authorization", `Bearer ${admin.token}`)
 
        expect(response.status).toBe(200)
        expect(response.body).toHaveLength(2)
    })
})
 