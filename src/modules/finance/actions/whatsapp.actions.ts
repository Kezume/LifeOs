"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import {
  userWhatsappConnections,
  financeAccounts,
  financeTransactions,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { awardXpAction } from "@/modules/gamification/actions/gamification.actions";
import { executeWhatsappTransaction } from "../services/whatsapp-tx.service";
import {
  parseReceiptImage,
  normalizePhoneNumber,
} from "../services/whatsapp-parser.service";

export { executeWhatsappTransaction };

export async function getWhatsappConnection(userId: string) {
  const [conn] = await db
    .select()
    .from(userWhatsappConnections)
    .where(eq(userWhatsappConnections.userId, userId))
    .limit(1);

  return conn || null;
}

export async function saveWhatsappConnectionAction(data: {
  phoneNumber: string;
  defaultAccountId?: string | null;
}) {
  const user = await requireUser();
  const normalized = normalizePhoneNumber(data.phoneNumber);

  const existing = await getWhatsappConnection(user.id);
  const randomCode = `LIFE-${Math.floor(1000 + Math.random() * 9000)}`;

  if (existing) {
    const [updated] = await db
      .update(userWhatsappConnections)
      .set({
        phoneNumber: normalized,
        defaultAccountId: data.defaultAccountId || null,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(userWhatsappConnections.id, existing.id))
      .returning();

    revalidatePath("/finance");
    return { success: true, connection: updated };
  } else {
    const [created] = await db
      .insert(userWhatsappConnections)
      .values({
        userId: user.id,
        phoneNumber: normalized,
        pairingCode: randomCode,
        defaultAccountId: data.defaultAccountId || null,
        isActive: true,
      })
      .returning();

    revalidatePath("/finance");
    return { success: true, connection: created };
  }
}

export async function disconnectWhatsappAction() {
  const user = await requireUser();
  const existing = await getWhatsappConnection(user.id);

  if (existing) {
    await db
      .update(userWhatsappConnections)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(userWhatsappConnections.id, existing.id));
  }

  revalidatePath("/finance");
  return { success: true };
}

/**
 * Scan receipt only without saving to DB yet (for preview & edit workflow)
 */
export async function scanReceiptAction(data: {
  receiptBase64: string;
  receiptFileName?: string;
}) {
  await requireUser();
  const parsed = await parseReceiptImage({
    base64Data: data.receiptBase64,
    fileName: data.receiptFileName,
  });

  return {
    success: true,
    result: parsed,
  };
}

/**
 * Save confirmed receipt transaction
 */
export async function confirmReceiptTransactionAction(data: {
  merchant: string;
  totalAmount: number;
  date?: string;
  time?: string;
  items?: string[];
  accountId?: string;
}) {
  const user = await requireUser();
  const conn = await getWhatsappConnection(user.id);

  let targetAccountId = data.accountId || conn?.defaultAccountId;
  if (!targetAccountId) {
    const existing = await db
      .select({ id: financeAccounts.id })
      .from(financeAccounts)
      .where(eq(financeAccounts.userId, user.id))
      .limit(1);

    if (existing.length > 0) {
      targetAccountId = existing[0].id;
    } else {
      const [newAcc] = await db
        .insert(financeAccounts)
        .values({
          userId: user.id,
          name: "Dompet Utama (Struk)",
          accountType: "cash",
          openingBalance: "0",
        })
        .returning();
      targetAccountId = newAcc.id;
    }
  }

  let finalTxDate = new Date();
  if (data.date) {
    const timePart = data.time || "12:00:00";
    const candidate = new Date(`${data.date}T${timePart}`);
    if (!isNaN(candidate.getTime())) {
      finalTxDate = candidate;
    } else {
      const dateOnly = new Date(data.date);
      if (!isNaN(dateOnly.getTime())) {
        finalTxDate = dateOnly;
      }
    }
  }

  const [tx] = await db
    .insert(financeTransactions)
    .values({
      userId: user.id,
      accountId: targetAccountId,
      type: "expense",
      amount: String(data.totalAmount),
      description: `Struk: ${data.merchant} (${(data.items || []).slice(0, 2).join(", ") || "Belanja"})`,
      source: "whatsapp_receipt",
      rawMessage: `Struk ${data.merchant}`,
      transactionDate: finalTxDate,
    })
    .returning();

  await awardXpAction({
    sourceType: "finance",
    sourceId: tx.id,
    eventKey: `wa_receipt_confirmed_${tx.id}`,
    xpAmount: 30,
    description: `Struk Belanja Terverifikasi: ${data.merchant} (Rp ${data.totalAmount.toLocaleString("id-ID")})`,
  });

  revalidatePath("/finance");
  revalidatePath("/dashboard");

  const formattedDateStr = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(finalTxDate);

  return {
    success: true,
    transaction: tx,
    confirmedDate: data.date,
    botReply: `✅ *Struk Belanja Berhasil Diverifikasi & Dicatat!*\n\n🏪 Toko: *${data.merchant}*\n💰 Total: *Rp ${data.totalAmount.toLocaleString("id-ID")}*\n📅 Tanggal: *${formattedDateStr}* ${data.time ? `(${data.time})` : ""}\n🛒 Item: ${(data.items || []).join(", ") || "-"}\n⭐ +30 XP berhasil diklaim!`,
  };
}

/**
 * Simulator action for testing directly in the web UI
 */
export async function simulateWhatsappSubmissionAction(data: {
  messageText?: string;
  receiptBase64?: string;
  receiptFileName?: string;
}) {
  const user = await requireUser();
  const conn = await getWhatsappConnection(user.id);

  const res = await executeWhatsappTransaction({
    userId: user.id,
    defaultAccountId: conn?.defaultAccountId,
    text: data.messageText,
    receiptBase64: data.receiptBase64,
    receiptFileName: data.receiptFileName,
  });

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return res;
}
