"use client"

import { useEffect, useState } from "react"
import { BILL_STATUS_LABELS, BILL_STATUS_ORDER } from "@/lib/constants"
import type { BillStatus } from "@/generated/prisma/enums"

type Bill = {
  id: string
  billNumber: number
  status: BillStatus
  destination: string
  origin: string | null
  description: string | null
}

const STATUS_COLORS: Record<BillStatus, string> = {
  RECEIVED: "bg-blue-100 text-blue-700",
  GOODS_WITHDRAWN: "bg-yellow-100 text-yellow-700",
  DISPATCHED: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
}

export default function LiffPage() {
  const [displayName, setDisplayName] = useState("")
  const [lineUserId, setLineUserId] = useState("")
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updating, setUpdating] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null)
  const [photoCount, setPhotoCount] = useState<Record<string, number>>({})

  useEffect(() => {
    const init = async () => {
      try {
        const liff = (await import("@line/liff")).default
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })

        if (!liff.isLoggedIn()) {
          liff.login()
          return
        }

        const profile = await liff.getProfile()
        setDisplayName(profile.displayName)
        setLineUserId(profile.userId)

        const [billsRes] = await Promise.all([
          fetch(`/api/liff/bills?lineUserId=${profile.userId}`),
        ])

        if (!billsRes.ok) {
          const err = await billsRes.json()
          throw new Error(err.error ?? "เกิดข้อผิดพลาด")
        }

        setBills(await billsRes.json())
      } catch (e) {
        setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  async function handlePhotoUpload(bill: Bill, files: FileList) {
    if (!files.length || !lineUserId) return
    setUploadingPhoto(bill.id)
    try {
      const form = new FormData()
      form.append("lineUserId", lineUserId)
      Array.from(files).forEach(f => form.append("files", f))
      const res = await fetch(`/api/liff/bills/${bill.id}/photos`, { method: "POST", body: form })
      const text = await res.text()
      if (!res.ok) {
        let msg = "อัปโหลดไม่สำเร็จ"
        try { msg = JSON.parse(text).error ?? msg } catch { /* ignore */ }
        throw new Error(msg)
      }
      const uploaded = JSON.parse(text)
      setPhotoCount(prev => ({ ...prev, [bill.id]: (prev[bill.id] ?? 0) + uploaded.length }))
      alert(`✅ อัปโหลดรูปสำเร็จ ${uploaded.length} รูป`)
    } catch (e) {
      alert(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ")
    } finally {
      setUploadingPhoto(null)
    }
  }

  async function updateStatus(bill: Bill) {
    const currentIndex = BILL_STATUS_ORDER.indexOf(bill.status)
    const nextStatus = BILL_STATUS_ORDER[currentIndex + 1]
    if (!nextStatus || !lineUserId) return

    setUpdating(bill.id)
    try {
      const res = await fetch(`/api/liff/bills/${bill.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineUserId, status: nextStatus }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "เกิดข้อผิดพลาด")
      }
      setBills(prev =>
        prev.map(b => (b.id === bill.id ? { ...b, status: nextStatus } : b))
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
    } finally {
      setUpdating(null)
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
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <p className="text-red-500 font-medium">{error}</p>
          <p className="text-sm text-gray-400 mt-1">กรุณาติดต่อผู้ดูแลระบบ</p>
        </div>
      </div>
    )
  }

  const activeBills = bills.filter(b => b.status !== "COMPLETED")
  const completedBills = bills.filter(b => b.status === "COMPLETED")

  return (
    <div className="max-w-lg mx-auto pb-8">
      <div className="bg-green-600 text-white px-4 py-5">
        <p className="text-sm opacity-80">JG ระบบขนส่ง</p>
        <p className="text-lg font-semibold mt-0.5">สวัสดี, {displayName}</p>
      </div>

      <div className="px-4 mt-4">
        <a
          href="/liff/new"
          className="block w-full bg-green-600 text-white font-medium py-3 rounded-xl text-center active:bg-green-700"
        >
          + สร้างบิลใหม่
        </a>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {activeBills.length === 0 && completedBills.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            ยังไม่มีบิล กดสร้างบิลใหม่ได้เลย
          </div>
        )}

        {activeBills.length > 0 && (
          <>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">กำลังดำเนินการ</p>
            {activeBills.map(bill => {
              const nextStatus = BILL_STATUS_ORDER[BILL_STATUS_ORDER.indexOf(bill.status) + 1]
              const isUpdating = updating === bill.id
              return (
                <div key={bill.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">บัตรคิวที่ {bill.description ?? "-"}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {bill.origin ? `${bill.origin} → ` : ""}{bill.destination}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[bill.status]}`}>
                      {BILL_STATUS_LABELS[bill.status]}
                    </span>
                  </div>
                  {bill.status === "DISPATCHED" && (
                    <label className={`mt-3 flex items-center justify-center gap-2 w-full border border-green-600 text-green-700 text-sm font-medium py-2.5 rounded-lg cursor-pointer active:bg-green-50 ${uploadingPhoto === bill.id ? "opacity-60 pointer-events-none" : ""}`}>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        className="hidden"
                        onChange={e => e.target.files && handlePhotoUpload(bill, e.target.files)}
                      />
                      📷 {uploadingPhoto === bill.id
                        ? "กำลังอัปโหลด..."
                        : photoCount[bill.id]
                          ? `ถ่ายรูปเพิ่ม (${photoCount[bill.id]} รูปแล้ว)`
                          : "ถ่ายรูปหลักฐาน"}
                    </label>
                  )}
                  {nextStatus && (
                    <button
                      onClick={() => updateStatus(bill)}
                      disabled={isUpdating}
                      className="mt-2 w-full bg-green-600 text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-60 active:bg-green-700"
                    >
                      {isUpdating ? "กำลังอัปเดต..." : `→ ${BILL_STATUS_LABELS[nextStatus]}`}
                    </button>
                  )}
                </div>
              )
            })}
          </>
        )}

        {completedBills.length > 0 && (
          <>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mt-4">เสร็จสิ้นแล้ว</p>
            {completedBills.map(bill => (
              <div key={bill.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 opacity-60">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">บัตรคิวที่ {bill.description ?? "-"}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {bill.origin ? `${bill.origin} → ` : ""}{bill.destination}
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                    เสร็จสิ้น
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
