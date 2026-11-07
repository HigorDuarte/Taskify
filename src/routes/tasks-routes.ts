import { ensureAuthenticated } from "@/middlewares/ensure-authenticated";
import { TasksControllers } from "@/controllers/tasks-controllers";
import { Router } from "express";

const tasksControllers = new TasksControllers

const taskRoutes = Router()

taskRoutes.get("/:projectId", ensureAuthenticated, tasksControllers.index)
taskRoutes.patch("/:taskId/tasks", ensureAuthenticated, tasksControllers.update)
taskRoutes.delete("/:taskId/tasks", ensureAuthenticated, tasksControllers.delete)
taskRoutes.post("/:projectId/tasks", ensureAuthenticated, tasksControllers.create)

export {taskRoutes}