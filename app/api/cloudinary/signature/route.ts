import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { folder, upload_preset } = await req.json().catch(() => ({}) as any)

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Cloudinary env vars missing (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)" },
        { status: 500 },
      )
    }

    const timestamp = Math.floor(Date.now() / 1000)

    // Signature uses a sorted param string excluding api_key and signature
    // You can include folder and upload_preset as applicable.
    const paramsToSign: Record<string, string | number> = { timestamp }
    if (folder) paramsToSign.folder = folder
    if (upload_preset) paramsToSign.upload_preset = upload_preset

    const paramString = Object.keys(paramsToSign)
      .sort()
      .map((k) => `${k}=${paramsToSign[k]}`)
      .join("&")

    const toSign = `${paramString}${apiSecret}`
    const signature = crypto.createHash("sha1").update(toSign).digest("hex")

    return NextResponse.json({
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder: folder || undefined,
      upload_preset: upload_preset || undefined,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 })
  }
}
