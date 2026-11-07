import { findProjectOrFail } from "@/utils/findProjectsOrFail"
import { findTaskOrFail } from "@/utils/findTaskOrFail"
import { AppError } from "@/utils/AppError"
import { prisma } from "@/database/prisma"
import {Request, Response} from "express"
import z from "zod"

export class TasksControllers{

    async create(request: Request, response: Response){
        const bodySchema = z.object({
            title: z.string().trim().min(1),
            description: z.string().trim().optional(),
        })
        const { title, description } = bodySchema.parse(request.body)

        const paramsSchema = z.object({
            projectId: z.uuid()
        })
        const { projectId } = paramsSchema.parse(request.params)

        await findProjectOrFail(projectId, request.user)
         
        const task = await prisma.task.create({data: {title, description, projectId}})

        response.status(201).json(task)
    }

    async index(request: Request, response: Response){
        const paramsSchema = z.object({
            projectId: z.uuid()
        })
        const {projectId} = paramsSchema.parse(request.params)

        await findProjectOrFail(projectId, request.user)

        //refatorar
        const tasks = await prisma.task.findMany({where: {projectId}})

        return response.json(tasks)
    }

    async update(request: Request, response: Response){ 
        const bodySchema = z.object({
            title: z.string().trim().min(1).optional(),
            description: z.string().trim().optional(),
            status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional()
        })
        const {title, description, status} = bodySchema.parse(request.body)
        
        const paramsSchema = z.object({
            taskId: z.uuid()
        })
        const {taskId} = paramsSchema.parse(request.params)

        const task = await findTaskOrFail(taskId, request.user)

        const updatedTask = await prisma.task.update({where: {id: task.id}, data: {title, description, status} })
    
        return response.json(updatedTask)
    }

    async delete(request: Request, response: Response){
        
        const paramsSchema = z.object({
            taskId: z.uuid()
        })
        const {taskId} = paramsSchema.parse(request.params)
        
        const task = await findTaskOrFail(taskId, request.user)

        if(task.status !== "DONE") throw new AppError(`Task is not finished`, 409)

        await prisma.task.delete({where: {id: taskId}})

        response.status(204).send()
    }
}