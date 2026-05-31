"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Upload, Loader2 } from "lucide-react"

interface PhotoUploadProps {
  billId: string
}

export function PhotoUpload({ billId }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const form = new FormData()
    Array.from(files).forEach((file) => form.append("files", file))

    try {
      const res = await fetch(`/api/bills/${billId}/photos`, {
        method: "POST",
        body: form,
      })
      if (!res.ok) throw new Error()
      toast.success("อัปโหลดรูปภาพสำเร็จ")
      router.refresh()
    } catch {
      toast.error("อัปโหลดไม่สำเร็จ กรุณาลองใหม่")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleUpload}
      />
      <Button
        variant="outline"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 mr-1" />
        )}
        {uploading ? "กำลังอัปโหลด..." : "อัปโหลดรูปภาพ"}
      </Button>
    </div>
  )
}
