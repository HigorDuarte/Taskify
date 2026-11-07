import { env } from "./env"
import {app} from "./app"

app.listen(env.PORT, () => console.log(`Rodando na porta ${env.PORT}`))