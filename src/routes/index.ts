import { projectsRoutes } from "./projects-routes"; 
import { sessionsRoutes } from "./sessions-routes";
import { usersRoutes } from "./users-routes";
import { tasksRoutes } from "./tasks-routes";
import { Router } from "express";

const routes = Router() 

routes.use("/sessions", sessionsRoutes)
routes.use("/users", usersRoutes)
routes.use("/tasks", tasksRoutes)
routes.use("/projects", projectsRoutes)

export { routes }