import { authConfig } from "@/config/auth"
import { AppError } from "@/utils/AppError"
import { NextFunction, Request, Response } from "express"
import { verify } from "jsonwebtoken"

interface TokenPayload {
    role: string
    sub: string,
}

export function ensureAuthenticated(request: Request, response: Response, next: NextFunction){
    
    const authHeader = request.headers.authorization
    
    if(!authHeader) throw new AppError(`Invalid JWT token`, 401)
    
        try {

        const [,token] = authHeader.split(" ")

        const {role, sub: user_id} = verify(token, authConfig.jwt.secret) as TokenPayload 

        request.user = {
            role,
            user_id
        }

        
        } catch (error) {
            throw new AppError("Invalid JWT token", 401)
        }
    
    return next()
}