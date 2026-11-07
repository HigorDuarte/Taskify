import { AppError } from "@/utils/AppError";
import { Request, Response } from "express";
import { prisma } from "@/database/prisma";
import { authConfig } from "@/config/auth"
import { sign } from "jsonwebtoken";
import { compare } from "bcrypt";
import { z } from "zod";

export class SessionsController{
    async create(request:Request, response: Response){
        
        const bodySchema = z.object({
            email: z.email().trim().toLowerCase(),
            password: z.string()
        })
        
        const {email, password} = bodySchema.parse(request.body)

        const user = await prisma.user.findUnique({where: {email}})

        if(!user) throw new AppError("Invalid email or password", 401)

        const passwordMatched = await compare(password, user.passwordHash)

        if(!passwordMatched) throw new AppError(`Invalid email or password`, 401)
        
        const { expiresIn, secret } = authConfig.jwt

        const token = sign({role: user.role}, secret, {
            subject: user.id,
            expiresIn: expiresIn
        })

        const {passwordHash:_, ...userWithoutPassword} = user

        response.json({token, user: userWithoutPassword})
    }
}