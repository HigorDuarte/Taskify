import dotenv from "dotenv"

dotenv.config({path: ".env.test"})

if(process.env.NODE_ENV !== "test" || !process.env.DATABASE_URL?.endsWith("_test")) throw new Error(`Os testes só podem rodar no banco de teste`)