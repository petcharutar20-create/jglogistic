import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const rawUrl = process.env.DATABASE_URL ?? "NOT SET"
  const maskedUrl = rawUrl.replace(/:[^:@]+@/, ":***@")

  try {
    await prisma.$queryRaw`SELECT 1 as ok`
    return NextResponse.json({ connected: true, url: maskedUrl })
  } catch (e: unknown) {
    const err = e as Error
    return NextResponse.json(
      { connected: false, error: err.message, url: maskedUrl },
      { status: 500 }
    )
  }
}
