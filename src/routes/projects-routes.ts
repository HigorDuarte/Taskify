import { ensureAuthenticated } from "@/middlewares/ensure-authenticated";

import { ProjectsControllers } from "@/controllers/projects-controllers";

import { Router } from "express";
import { TasksControllers } from "@/controllers/tasks-controllers";

const tasksControllers = new TasksControllers()
const projectsControllers = new ProjectsControllers() 

const projectsRoutes = Router()

projectsRoutes.use(ensureAuthenticated)

projectsRoutes.get("/", projectsControllers.index)
projectsRoutes.post("/", projectsControllers.create)
projectsRoutes.patch("/:id", projectsControllers.update)
projectsRoutes.delete("/:id", projectsControllers.delete)

projectsRoutes.get("/:projectId/tasks", tasksControllers.index)
projectsRoutes.post("/:projectId/tasks", tasksControllers.create)

export {projectsRoutes}