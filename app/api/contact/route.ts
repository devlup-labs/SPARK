import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: NextRequest) {
  /* ── 1. Auth guard ── */
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized — please sign in first." }, { status: 401 });
  }

  /* ── 2. Parse body ── */
  let body: {
    category: string;
    subject: string;
    name: string;
    message: string;
    priority: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { category, subject, name, message, priority } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  /* ── 3. Build email ── */
  const senderEmail = session.user.email;
  const senderName  = name || session.user.name || "Anonymous";

  const htmlBody = `
    <div style="font-family:monospace;background:#03040d;color:#e8f4ff;padding:32px;border-radius:8px;border:1px solid rgba(0,245,255,0.2)">
      <div style="border-bottom:1px solid rgba(0,245,255,0.15);padding-bottom:16px;margin-bottom:24px">
        <h2 style="margin:0;color:#00f5ff;letter-spacing:0.1em;font-size:18px">⚡ SPARK SUPPORT REQUEST</h2>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:rgba(0,245,255,0.5);width:120px">TYPE</td>       <td style="color:#e8f4ff">${category}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(0,245,255,0.5)">PRIORITY</td>   <td style="color:#e8f4ff">${priority.toUpperCase()}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(0,245,255,0.5)">FROM</td>        <td style="color:#e8f4ff">${senderName}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(0,245,255,0.5)">EMAIL</td>       <td style="color:#00f5ff">${senderEmail}</td></tr>
      </table>
      <div style="margin-top:24px;border-top:1px solid rgba(0,245,255,0.1);padding-top:20px">
        <p style="margin:0 0 8px;color:rgba(0,245,255,0.5);letter-spacing:0.08em;font-size:12px">MESSAGE</p>
        <p style="margin:0;white-space:pre-wrap;line-height:1.7;color:#e8f4ff">${message.trim()}</p>
      </div>
      <div style="margin-top:24px;border-top:1px solid rgba(0,245,255,0.08);padding-top:16px">
        <p style="margin:0;font-size:11px;color:rgba(0,245,255,0.3)">Sent from SPARK Landing Page · ${new Date().toUTCString()}</p>
      </div>
    </div>
  `;

  /* ── 3. Send via Nodemailer (Gmail SMTP) ── */
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const receiverEmail = process.env.GMAIL_RECEIVER_EMAIL || process.env.GMAIL_USER;

  try {
    await transporter.sendMail({
      from:     `"SPARK Support" <${process.env.GMAIL_USER}>`,
      to:       receiverEmail,
      replyTo:  senderEmail,
      subject:  subject || `[SPARK] ${category}`,
      html:     htmlBody,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact/send] nodemailer error:", err);
    return NextResponse.json({ error: "Failed to send email. Check server config." }, { status: 500 });
  }
}
