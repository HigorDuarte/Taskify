import "dotenv/config"
import { z } from "zod"

const authSchema = z.object({
    PORT: z.coerce.number().default(3333),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string(),
    JWT_SECRET: z.string().min(32),  
}) 

export const env = authSchema.parse(process.env) 