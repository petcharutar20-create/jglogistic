import { auth, signIn } from "@/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect("/dashboard")

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">JG Logistics</CardTitle>
          <CardDescription>บริษัท จตุรโชคกรุ๊ป จำกัด</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server"
              await signIn("line", { redirectTo: "/dashboard" })
            }}
          >
            <Button type="submit" className="w-full bg-[#06C755] hover:bg-[#05a847] text-white">
              เข้าสู่ระบบด้วย LINE
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
