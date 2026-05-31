"use client"

import { Check } from "lucide-react"
import { BILL_STATUS_LABELS, BILL_STATUS_ORDER } from "@/lib/constants"
import type { BillStatus } from "@/generated/prisma/enums"
import { cn } from "@/lib/utils"

interface StatusStepperProps {
  currentStatus: BillStatus
}

export function StatusStepper({ currentStatus }: StatusStepperProps) {
  const currentIndex = BILL_STATUS_ORDER.indexOf(currentStatus)

  return (
    <div className="flex items-center w-full">
      {BILL_STATUS_ORDER.map((status, index) => {
        const isDone = index < currentIndex
        const isCurrent = index === currentIndex

        return (
          <div key={status} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                  isDone && "border-green-500 bg-green-500 text-white",
                  isCurrent && "border-primary bg-primary text-primary-foreground",
                  !isDone && !isCurrent && "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  isCurrent && "text-primary",
                  isDone && "text-green-600",
                  !isDone && !isCurrent && "text-muted-foreground"
                )}
              >
                {BILL_STATUS_LABELS[status]}
              </span>
            </div>
            {index < BILL_STATUS_ORDER.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-2 mb-5 transition-colors",
                  index < currentIndex ? "bg-green-500" : "bg-muted-foreground/20"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
