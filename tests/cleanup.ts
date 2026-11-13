import { afterAll, beforeEach } from "vitest"
import { prisma } from "@/database/prisma"

beforeEach(async () => {
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()
})

afterAll(async () => {
    await prisma.$disconnect()
})