import { AppError } from "@/utils/AppError";
import { Request, Response, NextFunction } from "express";

export function verifyUserAuthorization(role: string[]){
    return(request: Request, response: Response, next: NextFunction) => {
        if(!role.includes(request.user.role)){
            throw new AppError(`You don't have authorization`, 403)
        }

        next()
    }
}