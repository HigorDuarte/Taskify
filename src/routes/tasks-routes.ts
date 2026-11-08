import { ensureAuthenticated } from "@/middlewares/ensure-authenticated";
import { TasksControllers } from "@/controllers/tasks-controllers";
import { Router } from "express";

const tasksControllers = new TasksControllers

const tasksRoutes = Router()

tasksRoutes.use(ensureAuthenticated)

tasksRoutes.patch("/:taskId", tasksControllers.update)
tasksRoutes.delete("/:taskId", tasksControllers.delete)

export {tasksRoutes}