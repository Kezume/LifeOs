import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userWhatsappConnections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { executeWhatsappTransaction } from "@/modules/finance/services/whatsapp-tx.service";
import { normalizePhoneNumber } from "@/modules/finance/services/whatsapp-parser.service";

export const dynamic = "force-dynamic";

/**
 * GET Handler for WhatsApp Cloud API Webhook Verification (Challenge Handshake)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || "lifeos_whatsapp_verify_token_2026";

    if (mode === "subscribe" && token === expectedToken) {
      return new NextResponse(challenge, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid verification token" }, { status: 403 });
  } catch (err: unknown) {
    console.error("WhatsApp webhook GET error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

/**
 * POST Handler for Incoming WhatsApp Messages & Receipts
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Extract sender phone and message content
    // Supports both standard Meta Cloud API payload and generic/custom WhatsApp gateway format
    let from = "";
    let messageText = "";
    let mediaUrl: string | undefined = undefined;

    // Check Meta Cloud API format
    if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const msg = body.entry[0].changes[0].value.messages[0];
      from = msg.from;
      if (msg.type === "text") {
        messageText = msg.text.body;
      } else if (msg.type === "image") {
        mediaUrl = msg.image?.id || msg.image?.link;
        messageText = msg.image?.caption || "";
      }
    } else {
      // Generic gateway format: { from: "0812...", text: "...", mediaUrl: "..." }
      from = body.from || body.sender || body.phone || "";
      messageText = body.text || body.message || body.body || "";
      mediaUrl = body.mediaUrl || body.imageUrl || body.file;
    }

    if (!from) {
      return NextResponse.json({ error: "Missing sender number" }, { status: 400 });
    }

    const normalizedPhone = normalizePhoneNumber(from);

    // 2. Find user connected with this phone number
    const [conn] = await db
      .select()
      .from(userWhatsappConnections)
      .where(eq(userWhatsappConnections.phoneNumber, normalizedPhone))
      .limit(1);

    if (!conn || !conn.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "Nomor WhatsApp belum terhubung ke akun LifeOS.",
          reply: `⚠️ Nomor Anda (*${normalizedPhone}*) belum terhubung ke LifeOS.\nBuka menu Finance di LifeOS dan masukkan nomor Anda untuk mengaktifkan sinkronisasi otomatis!`,
        },
        { status: 200 }
      );
    }

    // 3. Process the transaction
    const result = await executeWhatsappTransaction({
      userId: conn.userId,
      defaultAccountId: conn.defaultAccountId,
      text: messageText || undefined,
      receiptBase64: mediaUrl && mediaUrl.startsWith("data:") ? mediaUrl : undefined,
      receiptFileName: mediaUrl ? "Struk WhatsApp" : undefined,
    });

    return NextResponse.json({
      success: true,
      processed: result.success,
      reply: result.botReply,
      transaction: result.transaction,
    });
  } catch (err: unknown) {
    console.error("WhatsApp webhook error:", err);
    return NextResponse.json(
      { error: "Internal server error processing WhatsApp webhook" },
      { status: 500 }
    );
  }
}
