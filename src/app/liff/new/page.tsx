"use client"

import { useEffect, useState } from "react"

type Vehicle = {
  id: string
  plateNumber: string
  type: string
  brand: string | null
}

export default function LiffNewBillPage() {
  const [lineUserId, setLineUserId] = useState("")
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const init = async () => {
      try {
        const liff = (await import("@line/liff")).default
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
        if (!liff.isLoggedIn()) { liff.login(); return }
        const profile = await liff.getProfile()
        setLineUserId(profile.userId)
        const res = await fetch(`/api/liff/vehicles?lineUserId=${profile.userId}`)
        if (res.ok) setVehicles(await res.json())
      } catch {
        setError("เกิดข้อผิดพลาด กรุณาลองใหม่")
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!lineUserId || submitting) return
    const data = new FormData(e.currentTarget)
    const destination = (data.get("destination") as string)?.trim()
    const vehicleId = (data.get("vehicleId") as string) || null
    const billDate = (data.get("billDate") as string) || null
    const description = (data.get("description") as string)?.trim() || null
    if (!destination) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/liff/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineUserId, vehicleId, destination, billDate, description }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "เกิดข้อผิดพลาด")
      }
      window.location.href = "/liff"
    } catch (e) {
      alert(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">กำลังโหลด...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  const today = new Date().toISOString().split("T")[0]

  // บังคับสีตัวอักษรใน input ให้ดำ กันโหมดมืดของ LINE WebView ทับสีจนจาง
  const fieldStyle: React.CSSProperties = {
    fontSize: 16,
    color: "#111827",
    WebkitTextFillColor: "#111827",
    colorScheme: "light",
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-green-600 text-white px-4 py-4 flex items-center gap-3">
        <a href="/liff" className="text-white text-xl px-1">←</a>
        <span className="text-base font-semibold">สร้างบิลใหม่</span>
      </div>

      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="billDate" className="block text-sm font-medium text-gray-700 mb-1">
              วันที่บิล *
            </label>
            <input
              id="billDate"
              type="date"
              name="billDate"
              defaultValue={today}
              max={today}
              required
              style={fieldStyle}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-gray-900"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              เลขที่บิล
            </label>
            <input
              id="description"
              type="text"
              name="description"
              placeholder="เช่น INV-001, 2567-0123"
              style={fieldStyle}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-gray-900"
            />
          </div>

          <div>
            <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700 mb-1">
              รถคันที่
            </label>
            <select
              id="vehicleId"
              name="vehicleId"
              style={fieldStyle}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-gray-900"
            >
              <option value="">-- เลือกรถ (ถ้ามี) --</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.plateNumber} — {v.brand ?? ""} {v.type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
              สถานที่จัดส่ง *
            </label>
            <input
              id="destination"
              type="text"
              name="destination"
              placeholder="เช่น บางนา, ลาดกระบัง"
              required
              style={fieldStyle}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-gray-900"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <a
              href="/liff"
              className="flex-1 border border-gray-300 text-gray-700 font-medium py-3 rounded-xl text-sm text-center"
            >
              ยกเลิก
            </a>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-green-600 text-white font-medium py-3 rounded-xl text-sm disabled:opacity-60"
            >
              {submitting ? "กำลังสร้าง..." : "สร้างบิล"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
