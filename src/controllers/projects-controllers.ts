import { prisma } from "@/database/prisma"
import { AppError } from "@/utils/AppError"
import {Request, Response} from "express"
import z from "zod"

export class ProjectsControllers{
    async create(request: Request, response: Response){
        const bodySchema = z.object({
            title: z.string().trim().min(1),
            description: z.string().trim().optional(),               
        })

        const { title, description } = bodySchema.parse(request.body)
        
        const project = await prisma.project.create({data: {title, description, ownerId: request.user.user_id}}) 
    
        return response.status(201).json(project)
    }

    async delete(request: Request, response: Response){
        
        const paramsSchema = z.object({
            id: z.uuid()
        })

        const {id} = paramsSchema.parse(request.params)        

        const project = await prisma.project.findUnique({where: {id}})  

        if(!project) throw new AppError("Project not found", 404)

        if(request.user.role === "USER" && project.ownerId !== request.user.user_id) throw new AppError(`Project not found`, 404)
        
        await prisma.project.delete({where: {id}})

        return response.status(204).send()
    }

    async update(request: Request, response: Response){
        const paramsSchema = z.object({
            id: z.uuid()
        })         

        const bodySchema = z.object({
            title: z.string().min(1).trim().optional(),
            description: z.string().trim().optional(),
            status: z.enum(["ACTIVE", "COMPLETED"]).optional()
        })

        const {id} = paramsSchema.parse(request.params)
        const {title, description, status} = bodySchema.parse(request.body)

        //pegando o projeto especifico
        const projectUpdate = await prisma.project.findUnique({where: {id}})

        if(!projectUpdate) throw new AppError(`Project not found`, 404)

        if(request.user.role === "USER" && request.user.user_id !== projectUpdate.ownerId) throw new AppError(`Project not found`, 404)

        //atualiza o projeto do user 
        const updatedProject = await prisma.project.update({where: {id}, data: {title, description, status}})

        return response.status(200).json(updatedProject)
    }

    async index(request: Request, response: Response){

        const where = request.user.role === "ADMIN" ? {} : {ownerId: request.user.user_id}

        const projects = await prisma.project.findMany({where})

        return response.json(projects)
    }
}