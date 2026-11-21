import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--background)] text-center">
      <div className="w-12 h-12 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center text-xl font-bold text-[var(--primary)] mb-4">
        404
      </div>
      <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
        Halaman Tidak Ditemukan
      </h2>
      <p className="text-xs text-[var(--muted)] max-w-sm mb-6">
        Halaman yang Anda tuju mungkin telah dipindahkan atau belum tersedia.
      </p>
      <Link
        href="/dashboard"
        className="px-4 py-2 text-xs font-medium rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors"
      >
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
