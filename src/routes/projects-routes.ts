import { ensureAuthenticated } from "@/middlewares/ensure-authenticated";

import { ProjectsControllers } from "@/controllers/projects-controllers";

import { Router } from "express";

const projectsControllers = new ProjectsControllers() 

const projectsRoutes = Router()

projectsRoutes.get("/", ensureAuthenticated, projectsControllers.index)
projectsRoutes.post("/", ensureAuthenticated, projectsControllers.create)
projectsRoutes.patch("/:id", ensureAuthenticated, projectsControllers.update)
projectsRoutes.delete("/:id", ensureAuthenticated, projectsControllers.delete)

export {projectsRoutes}