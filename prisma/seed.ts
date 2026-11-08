import { prisma } from "@/database/prisma"
import { hash } from "bcrypt"
import z from "zod"

async function main(){
    
    const seedSchema = z.object({
        ADMIN_NAME: z.string().min(1).trim(),
        ADMIN_EMAIL: z.email().toLowerCase().trim(),
        ADMIN_PASSWORD: z.string().min(6)
    })
    
    const {ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD} = seedSchema.parse(process.env)

    const hashPassword = await hash(ADMIN_PASSWORD, 10)

    await prisma.user.upsert({
        where: {email: ADMIN_EMAIL},
        update: {},
        create: {name: ADMIN_NAME,email:ADMIN_EMAIL,passwordHash: hashPassword, role: "ADMIN"}
    })

}

main()
.catch((error) => {
    console.error(error)
    process.exit(1)
})
.finally(async () => {
    await prisma.$disconnect()
})