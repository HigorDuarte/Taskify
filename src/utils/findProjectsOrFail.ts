import { prisma } from "@/database/prisma"
import { AppError } from "./AppError"

export async function findProjectOrFail(projectId: string, user: {role: string, user_id: string}){

    const project = await prisma.project.findUnique({where: {id : projectId}})

    if(!project) throw new AppError(`Project not found`, 404)

    if(user.role === "USER" && project.ownerId !== user.user_id) throw new AppError(`Project not found`, 404)

    return project
} 
