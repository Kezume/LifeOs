import { db } from "@/lib/db";
import {
  userWhatsappConnections,
  financeAccounts,
  financeTransactions,
  financeCategories,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { awardXpDirect } from "@/modules/gamification/services/gamification.service";
import {
  parseFinancialTextMessage,
  parseReceiptImage,
} from "./whatsapp-parser.service";

/**
 * Internal processor for WhatsApp transactions (called by webhook or simulation)
 */
export async function executeWhatsappTransaction(params: {
  userId: string;
  defaultAccountId?: string | null;
  text?: string;
  receiptBase64?: string;
  receiptFileName?: string;
}) {
  // 1. Ensure user has an account to record into
  let targetAccountId = params.defaultAccountId;
  if (!targetAccountId) {
    const existing = await db
      .select({ id: financeAccounts.id })
      .from(financeAccounts)
      .where(eq(financeAccounts.userId, params.userId))
      .limit(1);

    if (existing.length > 0) {
      targetAccountId = existing[0].id;
    } else {
      const [newAcc] = await db
        .insert(financeAccounts)
        .values({
          userId: params.userId,
          name: "Dompet Utama (WhatsApp)",
          accountType: "cash",
          openingBalance: "0",
        })
        .returning();
      targetAccountId = newAcc.id;
    }
  }

  // 2. Handle Receipt photo vs Text message
  if (params.receiptBase64) {
    const receipt = await parseReceiptImage({
      base64Data: params.receiptBase64,
      fileName: params.receiptFileName,
    });

    let categoryId: string | null = null;
    const [cat] = await db
      .select({ id: financeCategories.id })
      .from(financeCategories)
      .where(
        and(
          eq(financeCategories.userId, params.userId),
          eq(financeCategories.name, "Belanja & Struk")
        )
      )
      .limit(1);

    if (cat) {
      categoryId = cat.id;
    }

    let finalTxDate = new Date();
    if (receipt.date) {
      const timePart = receipt.time || "12:00:00";
      const candidate = new Date(`${receipt.date}T${timePart}`);
      if (!isNaN(candidate.getTime())) {
        finalTxDate = candidate;
      } else {
        const dateOnly = new Date(receipt.date);
        if (!isNaN(dateOnly.getTime())) {
          finalTxDate = dateOnly;
        }
      }
    }

    const [tx] = await db
      .insert(financeTransactions)
      .values({
        userId: params.userId,
        accountId: targetAccountId,
        categoryId,
        type: "expense",
        amount: String(receipt.totalAmount || 0),
        description: `Struk: ${receipt.merchant} (${receipt.items.slice(0, 2).join(", ") || "Belanja"})`,
        source: "whatsapp_receipt",
        rawMessage: params.receiptFileName || "Foto Struk Belanja",
        transactionDate: finalTxDate,
      })
      .returning();

    // Award XP directly without session redirect
    await awardXpDirect({
      userId: params.userId,
      sourceType: "finance",
      sourceId: tx.id,
      eventKey: `wa_receipt_${tx.id}`,
      xpAmount: 30,
      description: `WhatsApp Struk OCR: ${receipt.merchant} (Rp ${(receipt.totalAmount || 0).toLocaleString("id-ID")})`,
    });

    await db
      .update(userWhatsappConnections)
      .set({ lastSyncAt: new Date() })
      .where(eq(userWhatsappConnections.userId, params.userId));

    return {
      success: true,
      transaction: tx,
      summary: {
        type: "expense",
        amount: receipt.totalAmount,
        description: receipt.merchant,
        items: receipt.items,
        source: "whatsapp_receipt",
        rawOcrText: receipt.rawOcrText,
        parserSource: receipt.parserSource,
      },
      botReply: `✅ *Struk Belanja Berhasil Dicatat!*\n\n🏪 Toko: *${receipt.merchant}*\n💰 Nominal: *Rp ${(receipt.totalAmount || 0).toLocaleString("id-ID")}*\n🛒 Item: ${receipt.items.join(", ") || "-"}\n📅 Tanggal: ${receipt.date}\n🔍 OCR Engine: ${receipt.parserSource}\n⭐ +30 XP diberikan ke LifeOS Anda!`,
    };
  }

  if (params.text) {
    const parsed = parseFinancialTextMessage(params.text);
    if (!parsed) {
      return {
        success: false,
        error: "Format pesan tidak dikenali. Contoh: 'Kopi 22rb' atau 'Gaji 5jt'",
        botReply: `⚠️ Format pesan tidak dikenali.\n\nContoh yang didukung:\n• "Kopi Kenangan 22rb"\n• "Bensin Pertamax 50k"\n• "Makan siang 35.000"\n• "Transfer gaji 8.5jt"`,
      };
    }

    const [tx] = await db
      .insert(financeTransactions)
      .values({
        userId: params.userId,
        accountId: targetAccountId,
        type: parsed.type,
        amount: String(parsed.amount),
        description: parsed.description,
        source: "whatsapp_text",
        rawMessage: params.text,
        transactionDate: new Date(),
      })
      .returning();

    await awardXpDirect({
      userId: params.userId,
      sourceType: "finance",
      sourceId: tx.id,
      eventKey: `wa_text_${tx.id}`,
      xpAmount: 25,
      description: `WhatsApp Auto-Log: ${parsed.description} (Rp ${parsed.amount.toLocaleString("id-ID")})`,
    });

    await db
      .update(userWhatsappConnections)
      .set({ lastSyncAt: new Date() })
      .where(eq(userWhatsappConnections.userId, params.userId));

    const symbol = parsed.type === "income" ? "📈 Pemasukan" : "📉 Pengeluaran";
    return {
      success: true,
      transaction: tx,
      summary: {
        type: parsed.type,
        amount: parsed.amount,
        description: parsed.description,
        source: "whatsapp_text",
      },
      botReply: `✅ *Transaksi Berhasil Dicatat!*\n\n${symbol}: *Rp ${parsed.amount.toLocaleString("id-ID")}*\n📝 Catatan: ${parsed.description}\n🏷️ Kategori perkiraan: ${parsed.categoryGuess}\n⭐ +25 XP diberikan ke LifeOS Anda!`,
    };
  }

  return {
    success: false,
    error: "Pesan atau foto tidak ditemukan.",
    botReply: "Silakan kirim foto struk atau pesan teks belanja Anda.",
  };
}
