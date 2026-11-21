import fs from "fs";
import path from "path";
import { createWorker } from "tesseract.js";
import { parseReceiptText } from "../src/modules/finance/services/whatsapp-parser.service";

async function runBenchmark() {
  const dir = "d:/Programming/LifeOS/datasets/srd";
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".jpg")).slice(0, 12);
  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "tesseract.js",
    "src",
    "worker-script",
    "node",
    "index.js"
  );

  console.log(`Starting benchmark on ${files.length} receipt images from SRD dataset...`);
  const worker = await createWorker("ind+eng", 1, { workerPath });

  const results: any[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fullPath = path.join(dir, file);
    const buf = fs.readFileSync(fullPath);

    const t0 = Date.now();
    const ret = await worker.recognize(buf);
    const duration = Date.now() - t0;

    const raw = ret.data.text || "";
    const parsed = parseReceiptText(raw);

    results.push({
      file,
      duration: `${(duration / 1000).toFixed(1)}s`,
      merchant: parsed.merchant,
      date: parsed.date,
      time: parsed.time,
      total: parsed.totalAmount,
      itemCount: parsed.items.length,
      itemsSample: parsed.items.slice(0, 3).join(", "),
      rawLines: raw.split("\n").map(l => l.trim()).filter(Boolean),
    });

    console.log(`[${i + 1}/${files.length}] ${file}: Merchant='${parsed.merchant}', Date='${parsed.date}', Time='${parsed.time || "-"}', Total=${parsed.totalAmount}, Items=${parsed.items.length}`);
  }

  await worker.terminate();

  console.log("\n=== BENCHMARK TABLE ===");
  console.table(
    results.map((r) => ({
      File: r.file,
      Merchant: r.merchant.slice(0, 25),
      Date: r.date,
      Time: r.time || "-",
      Total: r.total,
      Items: r.itemCount,
      Duration: r.duration,
    }))
  );

  // Write detailed findings for inspection
  fs.writeFileSync(
    "d:/Programming/LifeOS/datasets/benchmark-results.json",
    JSON.stringify(results, null, 2)
  );
  console.log("\nWrote detailed results to d:/Programming/LifeOS/datasets/benchmark-results.json");
}

runBenchmark().catch(console.error);
