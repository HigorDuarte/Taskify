import { Router } from "express";
import { UsersControllers } from "@/controllers/users-controller";
import { ensureAuthenticated } from "@/middlewares/ensure-authenticated";
import { verifyUserAuthorization } from "@/middlewares/verify-user-authorization";

const usersControllers = new UsersControllers()

const usersRoutes = Router()

usersRoutes.post("/", usersControllers.create)

usersRoutes.use(ensureAuthenticated)

usersRoutes.delete("/:id", usersControllers.delete)
usersRoutes.get("/", verifyUserAuthorization(["ADMIN"]), usersControllers.index)

export {usersRoutes}