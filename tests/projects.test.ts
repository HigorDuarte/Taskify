import { createAndAuthenticateUser } from "./helpers";
import {expect, describe, it, beforeEach, afterAll} from "vitest"
import request from "supertest";
import { app } from "@/app";
import { prisma } from "@/database/prisma";

describe(`POST /projects`, () => {
    beforeEach(async () => {
        await prisma.user.deleteMany()
    })
    
    afterAll(async () => {
        await prisma.$disconnect()
    })

    it("should create an project", async () => {
        const {token, user} = await createAndAuthenticateUser()

        const createProjectResponse = await request(app).post("/projects").send({
            title: "Test Project",
            description: "Test Description"
        }).set("Authorization", `Bearer ${token}`)
        
        expect(createProjectResponse.status).toBe(201)
        expect(createProjectResponse.body).toHaveProperty("id")
    })
    
    it("shouldn't create an project if the user is not authenticated", async () => {
        const createProjectResponse = await request(app).post("/projects")
        .send({
            title: "Test Project",
            description: "Test Description"
        })

        expect(createProjectResponse.status).toBe(401)
        expect(createProjectResponse.body.message).toBe(`Invalid JWT token`)
    })
})