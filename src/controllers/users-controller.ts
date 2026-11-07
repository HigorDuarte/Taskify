import { Request, Response } from "express"
import { AppError } from "@/utils/AppError"
import { prisma } from "@/database/prisma"
import { hash } from "bcrypt"
import { z } from "zod"

class UsersControllers{
    async create(request: Request, response: Response){

        const bodySchema = z.object({
            name: z.string().min(1).trim(),
            email: z.email().trim().toLowerCase(),
            password: z.string().min(6)
        })

        const {name,email,password} = bodySchema.parse(request.body)

        const userEmailExists = await prisma.user.findUnique({where: {email}})

        if(userEmailExists) throw new AppError("This email already exists", 409)

        const passwordHash = await hash(password, 10)

        const user = await prisma.user.create({
            data: {name, email, passwordHash}
        })

        const {passwordHash:_, ...userWithoutPassword} = user

        response.status(201).json(userWithoutPassword)
    }

    async index(request: Request, response: Response){
        const allUsers = await prisma.user.findMany({omit: {passwordHash: true}})
        
        if(!allUsers) throw new AppError("Nenhum usuário no banco")

        return response.json(allUsers)
    }

    async delete(request: Request, response: Response){
        
        const paramsSchema = z.object({
            id: z.uuid()
        })

        const { id } = paramsSchema.parse(request.params)

        if(request.user.role === "USER" && id !== request.user.user_id) throw new AppError(`User not found`, 404)

        const user = await prisma.user.findUnique({where: {id}})

        if(!user) throw new AppError(`User not found`, 404)

        const activeProject = await prisma.project.count({where: {status: "ACTIVE", ownerId: id}})

        if(activeProject > 0) throw new AppError(`The user has active projects to do`, 409)

        await prisma.user.delete({where: {id}})
        
        return response.status(204).send()
    }
}

export {UsersControllers}