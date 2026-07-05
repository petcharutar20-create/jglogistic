import { prisma } from "@/lib/prisma"

/**
 * แปลง billDate เป็น "วันของบิล" ที่เที่ยงคืน UTC
 * ให้ตรงกับรูปแบบที่คอลัมน์ billDay เก็บ (ใช้เป็น key จัดกลุ่มเลขรายวัน)
 */
export function toBillDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

/**
 * สร้างบิลพร้อมออกเลขรายวัน (dailyNumber) ที่เริ่มที่ 1 เสมอเมื่อขึ้นวันใหม่
 *
 * คำนวณเลขถัดไปจาก MAX(dailyNumber) ของวันนั้น แล้วสร้างบิลผ่าน callback `build`
 * หากมีการสร้างพร้อมกันจนชน unique([billDay, dailyNumber]) (P2002) จะลองใหม่ด้วยเลขถัดไป
 */
export async function createBillWithDailyNumber<T>(
  billDate: Date,
  build: (fields: { billDay: Date; dailyNumber: number }) => Promise<T>
): Promise<T> {
  const billDay = toBillDay(billDate)

  for (let attempt = 0; attempt < 5; attempt++) {
    const agg = await prisma.bill.aggregate({
      where: { billDay },
      _max: { dailyNumber: true },
    })
    const dailyNumber = (agg._max.dailyNumber ?? 0) + 1

    try {
      return await build({ billDay, dailyNumber })
    } catch (e) {
      const code = (e as { code?: string }).code
      if (code === "P2002" && attempt < 4) continue // เลขชนกัน ลองใหม่
      throw e
    }
  }

  throw new Error("ไม่สามารถออกเลขบิลรายวันได้ กรุณาลองใหม่")
}
