import { PrismaClient } from "@/generated/prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

function getConnectionString() {
  const url = new URL(process.env.DATABASE_URL!)
  url.searchParams.delete("channel_binding")
  return url.toString()
}

function createPrismaClient() {
  const adapter = new PrismaNeon({ connectionString: getConnectionString() })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
