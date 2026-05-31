import { messagingApi } from "@line/bot-sdk"
import { BILL_STATUS_LABELS } from "./constants"
import type { BillStatus } from "@/generated/prisma/enums"

const client = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
})

export async function notifyCustomer(lineUserId: string, billNumber: number, status: BillStatus) {
  const statusLabel = BILL_STATUS_LABELS[status]
  const message =
    status === "COMPLETED"
      ? `✅ บิล #${billNumber} จัดส่งเสร็จสิ้นแล้ว ขอบคุณที่ใช้บริการ บริษัท จตุรโชคกรุ๊ป จำกัด`
      : `📦 บิล #${billNumber} อัปเดตสถานะ: ${statusLabel}`

  await client.pushMessage({
    to: lineUserId,
    messages: [{ type: "text", text: message }],
  })
}
