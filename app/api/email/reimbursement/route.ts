import { NextResponse } from "next/server"
import {
  sendReimbursementSubmittedEmail,
  sendReimbursementApprovedEmail,
  sendReimbursementRejectedEmail,
  sendReimbursementPaidEmail,
} from "@/lib/email/send"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, ...params } = body

    switch (type) {
      case "submitted":
        await sendReimbursementSubmittedEmail(
          params.orgEmail,
          params.orgName,
          params.fosterName,
          params.amount,
          params.category,
          params.description,
        )
        break

      case "approved":
        await sendReimbursementApprovedEmail(
          params.fosterEmail,
          params.fosterName,
          params.amount,
          params.category,
          params.notes,
        )
        break

      case "rejected":
        await sendReimbursementRejectedEmail(
          params.fosterEmail,
          params.fosterName,
          params.amount,
          params.category,
          params.notes,
        )
        break

      case "paid":
        await sendReimbursementPaidEmail(
          params.fosterEmail,
          params.fosterName,
          params.amount,
          params.category,
          params.paymentDate,
          params.paymentMethod,
        )
        break

      default:
        return NextResponse.json({ error: "Invalid email type" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reimbursement email route error:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
