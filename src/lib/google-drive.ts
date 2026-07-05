import { google } from "googleapis"
import { Readable } from "stream"

function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: "service_account",
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  })
  return google.drive({ version: "v3", auth })
}

export async function uploadToDrive(
  file: File,
  billNumber: number,
  billDate?: Date
): Promise<{ id: string; url: string; filename: string }> {
  const drive = getDriveClient()

  const buffer = Buffer.from(await file.arrayBuffer())
  const stream = Readable.from(buffer)

  const dateStr = (billDate ?? new Date()).toLocaleDateString("th-TH", {
    day: "2-digit", month: "2-digit", year: "2-digit",
  }).replace(/\//g, "-")
  const ext = file.name.split(".").pop() ?? "jpg"
  const filename = `บิล-${billNumber}_${dateStr}_${Date.now()}.${ext}`

  const requestBody: Record<string, unknown> = { name: filename }
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
  if (folderId) requestBody.parents = [folderId]

  const res = await drive.files.create({
    requestBody,
    media: { mimeType: file.type, body: stream },
    fields: "id, webViewLink",
  })

  await drive.permissions.create({
    fileId: res.data.id!,
    requestBody: { role: "reader", type: "anyone" },
  })

  return {
    id: res.data.id!,
    url: res.data.webViewLink!,
    filename,
  }
}
