import type { BillStatus } from "@/generated/prisma/enums"

export const BILL_STATUS_LABELS: Record<BillStatus, string> = {
  RECEIVED: "รับบิล",
  GOODS_WITHDRAWN: "เบิกสินค้า",
  DISPATCHED: "ประกอบและจัดส่ง",
  COMPLETED: "เสร็จสิ้น",
}

export const BILL_STATUS_ORDER: BillStatus[] = [
  "RECEIVED",
  "GOODS_WITHDRAWN",
  "DISPATCHED",
  "COMPLETED",
]

export const BILL_STATUS_COLORS: Record<BillStatus, string> = {
  RECEIVED: "bg-blue-100 text-blue-700",
  GOODS_WITHDRAWN: "bg-yellow-100 text-yellow-700",
  DISPATCHED: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
}
