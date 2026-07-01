import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true, name: true } });
console.log(admins);
await prisma.$disconnect();
