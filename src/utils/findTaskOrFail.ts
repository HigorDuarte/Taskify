import { prisma } from "@/database/prisma";
import { AppError } from "./AppError";

export async function findTaskOrFail(taskId: string, user: {user_id: string, role: string}){
    //task.id //request.user 

    const task = await prisma.task.findUnique({where: {id: taskId}, include:{project: true}}) 

    if(!task) throw new AppError(`Task not found`, 404)

    if(user.role === "USER" && task.project.ownerId !== user.user_id) throw new AppError(`Task not found`, 404)

    return task

}