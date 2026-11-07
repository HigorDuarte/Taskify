import { Router } from "express";
import { UsersControllers } from "@/controllers/users-controller";
import { ensureAuthenticated } from "@/middlewares/ensure-authenticated";
import { verifyUserAuthorization } from "@/middlewares/verify-user-authorization";

const usersRoutes = Router()

const userControllers = new UsersControllers()

usersRoutes.post("/", userControllers.create)
usersRoutes.delete("/:id", ensureAuthenticated, userControllers.delete)
usersRoutes.get("/", ensureAuthenticated, verifyUserAuthorization(["ADMIN"]), userControllers.index)

export {usersRoutes}