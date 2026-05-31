import { google } from "googleapis"
import { Readable } from "stream"

function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
    },
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  })
  return google.drive({ version: "v3", auth })
}

export async function uploadToDrive(
  file: File,
  billNumber: number
): Promise<{ id: string; url: string; filename: string }> {
  const drive = getDriveClient()
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!

  const buffer = Buffer.from(await file.arrayBuffer())
  const stream = Readable.from(buffer)
  const filename = `bill-${billNumber}-${Date.now()}-${file.name}`

  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
    },
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
