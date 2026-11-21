"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--background)] text-center">
      <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xl font-bold text-red-500 mb-4">
        !
      </div>
      <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
        Terjadi Kesalahan Sistem
      </h2>
      <p className="text-xs text-[var(--muted)] max-w-sm mb-6">
        Sistem mengalami kendala saat memproses halaman ini. Silakan muat ulang.
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 text-xs font-medium rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors cursor-pointer"
      >
        Coba Lagi
      </button>
    </div>
  );
}
