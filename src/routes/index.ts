import { projectsRoutes } from "./projects-routes"; 
import { sessionsRoutes } from "./sessions-routes";
import { usersRoutes } from "./users-routes";
import { taskRoutes } from "./tasks-routes";
import { Router } from "express";

const routes = Router() 

routes.use("/sessions", sessionsRoutes)
routes.use("/users", usersRoutes)
routes.use("/tasks", taskRoutes)
routes.use("/projects", projectsRoutes)

export { routes }