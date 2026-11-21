"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Smartphone,
  Send,
  Upload,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Loader2,
  FileText,
  Copy,
  Check,
  Zap,
  ChevronDown,
  ChevronUp,
  Store,
  DollarSign,
  Calendar,
  Camera,
  MessageSquare,
} from "lucide-react";
import {
  saveWhatsappConnectionAction,
  disconnectWhatsappAction,
  simulateWhatsappSubmissionAction,
  scanReceiptAction,
  confirmReceiptTransactionAction,
} from "../actions/whatsapp.actions";
import { UserWhatsappConnection } from "@/lib/db/schema";
import { ParsedReceiptResult } from "../services/whatsapp-parser.service";

interface WhatsAppSyncAccount {
  id: string;
  name: string;
  accountType: string;
}

interface WhatsAppSyncCardProps {
  connection: UserWhatsappConnection | null;
  accounts: WhatsAppSyncAccount[];
  onTransactionConfirmed?: (confirmedDate: string) => void;
}

export function WhatsAppSyncCard({ connection, accounts, onTransactionConfirmed }: WhatsAppSyncCardProps) {
  const [phoneNumber, setPhoneNumber] = useState(connection?.phoneNumber || "");
  const [selectedAccountId, setSelectedAccountId] = useState(connection?.defaultAccountId || accounts[0]?.id || "");
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (connection?.phoneNumber) {
      setPhoneNumber(connection.phoneNumber);
    }
    if (connection?.defaultAccountId) {
      setSelectedAccountId(connection.defaultAccountId);
    }
  }, [connection?.phoneNumber, connection?.defaultAccountId]);

  // Simulator state
  const [simMode, setSimMode] = useState<"text" | "receipt">("receipt");
  const [simText, setSimText] = useState("");
  const [simFile, setSimFile] = useState<File | null>(null);
  const [simPreview, setSimPreview] = useState<string | null>(null);
  const [simResponse, setSimResponse] = useState<string | null>(null);
  const [isSimulating, startSimTransition] = useTransition();

  // Receipt Scan & Review State
  const [scannedResult, setScannedResult] = useState<ParsedReceiptResult | null>(null);
  const [editableMerchant, setEditableMerchant] = useState("");
  const [editableAmount, setEditableAmount] = useState("");
  const [editableDate, setEditableDate] = useState("");
  const [showRawOcr, setShowRawOcr] = useState(false);
  const [isScanning, startScanTransition] = useTransition();

  const handleSaveConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setStatusMessage({ type: "error", text: "Nomor WhatsApp wajib diisi." });
      return;
    }

    startTransition(async () => {
      try {
        const res = await saveWhatsappConnectionAction({
          phoneNumber: phoneNumber.trim(),
          defaultAccountId: selectedAccountId || undefined,
        });
        if (res.success) {
          setStatusMessage({ type: "success", text: "Nomor WhatsApp berhasil dihubungkan!" });
          setTimeout(() => setStatusMessage(null), 3000);
        }
      } catch (err: unknown) {
        setStatusMessage({ type: "error", text: err instanceof Error ? err.message : "Gagal menyimpan koneksi." });
      }
    });
  };

  const handleDisconnect = () => {
    startTransition(async () => {
      try {
        await disconnectWhatsappAction();
        setStatusMessage({ type: "success", text: "Koneksi WhatsApp dinonaktifkan." });
        setTimeout(() => setStatusMessage(null), 3000);
      } catch (err: unknown) {
        setStatusMessage({ type: "error", text: err instanceof Error ? err.message : "Gagal memutuskan koneksi." });
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSimFile(file);
      setScannedResult(null);
      setSimResponse(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSimPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 1: Scan Receipt Image via Real OCR
  const handleScanReceipt = () => {
    if (!simPreview) return;
    setSimResponse(null);
    setScannedResult(null);

    startScanTransition(async () => {
      try {
        const res = await scanReceiptAction({
          receiptBase64: simPreview,
          receiptFileName: simFile?.name,
        });
        if (res.success && res.result) {
          setScannedResult(res.result);
          setEditableMerchant(res.result.merchant);
          setEditableAmount(String(res.result.totalAmount || ""));
          setEditableDate(res.result.date || new Date().toISOString().split("T")[0]);
        }
      } catch (err: unknown) {
        setStatusMessage({
          type: "error",
          text: err instanceof Error ? err.message : "Gagal memindai struk.",
        });
      }
    });
  };

  // Step 2: Confirm & Save Receipt Transaction
  const handleConfirmReceipt = () => {
    const amt = parseFloat(editableAmount);
    if (isNaN(amt) || amt <= 0 || !editableMerchant.trim()) {
      setStatusMessage({ type: "error", text: "Nama toko dan nominal wajib diisi dengan benar." });
      return;
    }

    startSimTransition(async () => {
      try {
        const res = await confirmReceiptTransactionAction({
          merchant: editableMerchant.trim(),
          totalAmount: amt,
          date: editableDate,
          time: scannedResult?.time,
          items: scannedResult?.items,
          accountId: selectedAccountId || undefined,
        });

        if (res.success && res.botReply) {
          setSimResponse(res.botReply);
          setScannedResult(null);
          setSimFile(null);
          setSimPreview(null);
          onTransactionConfirmed?.(editableDate);
        }
      } catch (err: unknown) {
        setStatusMessage({
          type: "error",
          text: err instanceof Error ? err.message : "Gagal menyimpan transaksi.",
        });
      }
    });
  };

  // Text message simulation
  const handleSimulateTextSubmit = () => {
    if (!simText.trim()) return;
    setSimResponse(null);

    startSimTransition(async () => {
      try {
        const res = await simulateWhatsappSubmissionAction({
          messageText: simText.trim(),
        });
        if (res.botReply) {
          setSimResponse(res.botReply);
          setSimText("");
        }
      } catch (err: unknown) {
        setSimResponse(err instanceof Error ? err.message : "Gagal memproses simulasi WhatsApp.");
      }
    });
  };

  const copyWebhookUrl = () => {
    const url = `${window.location.origin}/api/webhooks/whatsapp`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isConnected = connection && connection.isActive;

  return (
    <div className="space-y-6">
      {/* 1. Header & Connection Setup */}
      <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-4 border-b border-[var(--border)] gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--foreground)]">
              <Smartphone className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-[var(--foreground)] tracking-tight">
                Integrasi WhatsApp (Auto-Sync)
              </h2>
              <p className="text-[11px] text-[var(--foreground-muted)]">
                Kirim foto struk atau ketik catatan belanja di WhatsApp, transaksi otomatis tercatat di LifeOS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                isConnected
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : "bg-[var(--surface-raised)] text-[var(--foreground-muted)] border-[var(--border)]"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected ? "bg-emerald-500" : "bg-[var(--foreground-muted)]"
                }`}
              />
              {isConnected ? "WhatsApp Terhubung" : "Belum Terhubung"}
            </span>
          </div>
        </div>

        {/* Form setup nomor WA */}
        <form onSubmit={handleSaveConnection} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-medium text-[var(--foreground)]">
                Nomor WhatsApp Pengirim
              </label>
              <input
                key="phone-number-input"
                type="text"
                placeholder="Contoh: 08123456789 atau 628123456789"
                value={phoneNumber || ""}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)] font-mono"
              />
              <p className="text-[10px] text-[var(--foreground-muted)]">
                Format nomor HP lokal maupun internasional didukung (08xx atau 628xx).
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[var(--foreground)]">
                Tujuan Dompet / Rekening
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.accountType})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-[var(--foreground-muted)]">
                Akun default untuk transaksi WhatsApp.
              </p>
            </div>
          </div>

          {statusMessage && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                statusMessage.type === "success"
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-500 border border-red-500/20"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {connection?.pairingCode && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground-muted)]">
                  Kode Pairing: {connection.pairingCode}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isConnected && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 text-xs text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                >
                  Putuskan
                </button>
              )}
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-1.5 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-medium hover:bg-[var(--btn-primary-hover)] transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isConnected ? "Simpan Perubahan" : "Hubungkan WhatsApp"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 2. Interactive WhatsApp Simulator (Real OCR + Verification) */}
      <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--foreground)]" strokeWidth={1.5} />
            <h3 className="text-xs font-semibold text-[var(--foreground)]">
              Simulator WhatsApp (Uji Coba Langsung di Browser)
            </h3>
          </div>
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)]">
            <button
              type="button"
              onClick={() => {
                setSimMode("receipt");
                setSimResponse(null);
              }}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                simMode === "receipt"
                  ? "bg-[var(--surface-card)] text-[var(--foreground)] shadow-xs"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Pindai Struk OCR</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSimMode("text");
                setSimResponse(null);
              }}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                simMode === "text"
                  ? "bg-[var(--surface-card)] text-[var(--foreground)] shadow-xs"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Catatan Teks</span>
            </button>
          </div>
        </div>

        {/* Mode 1: Receipt Photo OCR with Live Preview & Verification */}
        {simMode === "receipt" && (
          <div className="space-y-4">
            {!scannedResult ? (
              <div className="space-y-3">
                <div className="border border-dashed border-[var(--border)] rounded-lg p-5 text-center bg-[var(--surface-raised)]/30 hover:bg-[var(--surface-raised)]/60 transition-colors cursor-pointer relative">
                  <input
                    key="sim-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1.5">
                    <Upload className="w-6 h-6 mx-auto text-[var(--foreground-muted)]" strokeWidth={1.5} />
                    <div className="text-xs font-medium text-[var(--foreground)]">
                      {simFile ? simFile.name : "Klik atau seret foto struk belanja di sini"}
                    </div>
                    <p className="text-[10px] text-[var(--foreground-muted)]">
                      Didukung Tesseract OCR (membaca teks & angka langsung dari foto struk)
                    </p>
                  </div>
                </div>

                {simPreview && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-[var(--foreground)] flex-shrink-0" />
                      <span className="text-xs text-[var(--foreground)] truncate font-medium">
                        {simFile?.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={isScanning}
                      onClick={handleScanReceipt}
                      className="px-4 py-1.5 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-medium hover:bg-[var(--btn-primary-hover)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isScanning ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Membaca Teks Struk (Tesseract OCR)...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          <span>Pindai Teks Struk</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Step 2: Verification & Edit Result Card */
              <div className="p-4 rounded-xl bg-[var(--surface-raised)]/70 border border-[var(--border)] space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-xs font-semibold text-[var(--foreground)]">
                      Hasil Analisis OCR Struk Belanja
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-card)] border border-[var(--border)] text-[var(--foreground-muted)]">
                    Engine: {scannedResult.parserSource === "gemini_vision" ? "Gemini AI" : "Tesseract OCR"}
                  </span>
                </div>

                {/* Editable Detected Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-[var(--foreground-muted)] flex items-center gap-1">
                      <Store className="w-3 h-3" />
                      Nama Toko / Merchant
                    </label>
                    <input
                      type="text"
                      value={editableMerchant}
                      onChange={(e) => setEditableMerchant(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] text-xs text-[var(--foreground)] font-medium focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-[var(--foreground-muted)] flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Total Pembayaran (Rp)
                    </label>
                    <input
                      type="number"
                      value={editableAmount}
                      onChange={(e) => setEditableAmount(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] text-xs text-[var(--foreground)] font-mono font-medium focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-[var(--foreground-muted)] flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Tanggal Transaksi
                      </span>
                      {scannedResult.time && (
                        <span className="font-mono text-[9px] text-[var(--foreground-muted)]">
                          Jam: {scannedResult.time}
                        </span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={editableDate}
                      onChange={(e) => setEditableDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Items preview if detected */}
                {scannedResult.items && scannedResult.items.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] text-[var(--foreground-muted)]">Item terdeteksi:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {scannedResult.items.map((it, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-[var(--surface-card)] text-[10px] text-[var(--foreground)] border border-[var(--border)]"
                        >
                          {it}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw OCR Text Dropdown */}
                {scannedResult.rawOcrText && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowRawOcr(!showRawOcr)}
                      className="text-[10px] text-[var(--foreground-muted)] hover:text-[var(--foreground)] flex items-center gap-1 cursor-pointer"
                    >
                      {showRawOcr ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      <span>{showRawOcr ? "Sembunyikan teks mentah OCR" : "Lihat teks mentah yang dibaca OCR"}</span>
                    </button>
                    {showRawOcr && (
                      <pre className="mt-2 p-2.5 rounded bg-[var(--surface-card)] border border-[var(--border)] text-[10px] font-mono text-[var(--foreground-muted)] whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {scannedResult.rawOcrText}
                      </pre>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => {
                      setScannedResult(null);
                      setSimPreview(null);
                      setSimFile(null);
                    }}
                    className="px-3 py-1.5 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                  >
                    Batal / Scan Ulang
                  </button>
                  <button
                    type="button"
                    disabled={isSimulating}
                    onClick={handleConfirmReceipt}
                    className="px-4 py-1.5 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-medium hover:bg-[var(--btn-primary-hover)] transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isSimulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Konfirmasi & Simpan Transaksi (+30 XP)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mode 2: Text Message Simulation */}
        {simMode === "text" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                key="sim-text-input"
                type="text"
                placeholder="Ketik pesan seperti di WA, contoh: 'Kopi Kenangan 25rb' atau 'Makan siang 45.000'"
                value={simText || ""}
                onChange={(e) => setSimText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSimulateTextSubmit()}
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none"
              />
              <button
                type="button"
                disabled={isSimulating || !simText.trim()}
                onClick={handleSimulateTextSubmit}
                className="h-9 px-4 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-medium hover:bg-[var(--btn-primary-hover)] transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSimulating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Kirim</span>
              </button>
            </div>

            {/* Preset quick buttons */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="text-[var(--foreground-muted)]">Coba contoh:</span>
              {[
                "Kopi Kenangan 22rb",
                "Bensin Pertamax 50k",
                "Makan siang di warteg 35.000",
                "Transfer gaji freelance 2.5jt",
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSimText(preset)}
                  className="px-2 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Simulator Response Preview (WhatsApp Bot Reply) */}
        {simResponse && (
          <div className="p-3.5 rounded-lg bg-[var(--surface-deep)] border border-[var(--border)] text-xs space-y-1.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-[10px] text-[var(--foreground-muted)] font-mono border-b border-[var(--border)] pb-1.5">
              <span>Respon Bot WhatsApp LifeOS:</span>
              <span className="text-emerald-500 font-medium">Tersimpan di Database</span>
            </div>
            <pre className="font-sans whitespace-pre-wrap text-[11px] text-[var(--foreground)] leading-relaxed">
              {simResponse}
            </pre>
          </div>
        )}

        {/* 3. Production Webhook URL display */}
        <div className="pt-3 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px]">
          <div className="text-[var(--foreground-muted)] flex items-center gap-1.5">
            <span>Webhook Endpoint Produksi:</span>
            <code className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)]">
              /api/webhooks/whatsapp
            </code>
          </div>
          <button
            type="button"
            onClick={copyWebhookUrl}
            className="inline-flex items-center gap-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "URL Disalin!" : "Salin Webhook URL"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
