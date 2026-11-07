import express from "express"
import { routes } from "./routes"
import { errorHandling } from "./middlewares/error-handling"

const app = express()

app.use(express.json())

app.use(routes)

app.use(errorHandling)

export {app}