import { NextResponse } from "next/server"
import { validateSignature, messagingApi } from "@line/bot-sdk"
import { prisma } from "@/lib/prisma"
import { BILL_STATUS_LABELS, BILL_STATUS_ORDER } from "@/lib/constants"
import type { BillStatus } from "@/generated/prisma/enums"

const client = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
})

interface LineEvent {
  type: string
  replyToken: string
  source?: { userId?: string }
  message?: { type: string; text?: string }
}

async function reply(replyToken: string, text: string) {
  await client.replyMessage({
    replyToken,
    messages: [{ type: "text", text }],
  })
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("x-line-signature") ?? ""

  const isValid = validateSignature(body, process.env.LINE_CHANNEL_SECRET!, signature)
  if (!isValid) return NextResponse.json({ error: "Invalid signature" }, { status: 400 })

  const events = (JSON.parse(body).events ?? []) as LineEvent[]

  for (const event of events) {
    if (event.type !== "message" || event.message?.type !== "text") continue

    const lineUserId = event.source?.userId
    const text = event.message.text
    if (!lineUserId || !text) continue

    const replyToken = event.replyToken

    const driver = await prisma.user.findUnique({ where: { lineUserId } })
    if (!driver) {
      await reply(replyToken, "ไม่พบข้อมูลพนักงานในระบบ กรุณาล็อกอินผ่านเว็บก่อน")
      continue
    }

    const match = text.trim().match(/^บิล\s*#?(\d+)\s+(.+)$/)
    if (!match) {
      await reply(replyToken, "รูปแบบ: บิล #[เลขบิล] [สถานะ]\nเช่น: บิล #5 เบิกสินค้า")
      continue
    }

    const billNumber = parseInt(match[1])
    const statusText = match[2].trim()
    const statusEntry = Object.entries(BILL_STATUS_LABELS).find(([, label]) => label === statusText)
    const status = statusEntry?.[0] as BillStatus | undefined

    if (!status) {
      await reply(replyToken, `สถานะที่ใช้ได้: ${Object.values(BILL_STATUS_LABELS).join(", ")}`)
      continue
    }

    const bill = await prisma.bill.findUnique({ where: { billNumber } })
    if (!bill || bill.driverId !== driver.id) {
      await reply(replyToken, `ไม่พบบิล #${billNumber} หรือคุณไม่ได้รับมอบหมาย`)
      continue
    }

    const currentIndex = BILL_STATUS_ORDER.indexOf(bill.status)
    const nextIndex = BILL_STATUS_ORDER.indexOf(status)
    if (nextIndex !== currentIndex + 1) {
      await reply(replyToken, `ไม่สามารถเปลี่ยนจาก "${BILL_STATUS_LABELS[bill.status]}" เป็น "${statusText}" ได้`)
      continue
    }

    await prisma.$transaction([
      prisma.bill.update({
        where: { id: bill.id },
        data: {
          status,
          ...(status === "COMPLETED" ? { completedAt: new Date() } : {}),
        },
      }),
      prisma.billStatusHistory.create({
        data: { billId: bill.id, status, updatedBy: driver.id },
      }),
    ])

    await reply(replyToken, `✅ บิล #${billNumber} อัปเดตเป็น "${statusText}" แล้ว`)
  }

  return NextResponse.json({ ok: true })
}
