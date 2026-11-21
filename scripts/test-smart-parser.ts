import fs from "fs";

// Advanced Smart Multi-Format Receipt Parser v2
export function parseReceiptTextSmart(rawText: string) {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let merchant = "Struk Belanja";
  let totalAmount = 0;
  let date = new Date().toISOString().split("T")[0];
  let time: string | undefined = undefined;
  const items: string[] = [];

  // Exclusions regex for POS metadata, addresses, contacts, social media
  const addressRegex = /\b(hwy|highway|ave|avenue|st\b|street|rd\b|road|blvd|boulevard|suite|ste\b|fl\b|floor|jalan|jl\b|jln\b)\b/i;
  const cityStateZipRegex = /\b[A-Z]{2}\s*\d{5}(?:-\d{4})?\b|\b(surabaya|jakarta|jogja|bandung|semarang|medan|bali|long\s*beach|south\s*gate|everett|san\s*fernando|windham)\b/i;
  const phoneFaxRegex = /\b(tel|telp|phone|fax|hp|call|contact|no\.?\s*telp)\b|(?:\(\d{3}\)|\b\d{3}[-.]\d{3}[-.]\d{4}\b)/i;
  const posMetaRegex = /\b(server|cashier|kasir|station|table|meja|check\s*#|order\s*#|order\s*no|reprint|guest|guests|tamu|dine\s*in|take\s*out|pickup|reg\s*\d|terminal|operator|nota\s*no|struk\s*no|id\s*kasir|manager|clerk|register|mc\s*#)\b/i;
  const webSocialRegex = /\b(facebook|instagram|twitter|yelp|zagat|www\.|http|https|\.com|\.co|\.id|e-receipt|website|like us|visit us|follow us)\b/i;
  const tipRegex = /\b(suggested\s*tip|tip\s*suggestions?|tip\b|\b\d+%\s*[:=]?\s*[$£€]?[\d.]+)\b/i;
  const summaryKeywords = /\b(total|subtotal|sub\s*total|subomal|tunai|cash|kembalian|kembali|change|diskon|discount|hemat|pajak|tax|sales\s*tax|pb1|ppn|qris|debit|credit|service|charge|bayar|payment|lunas|balance\s*due)\b/i;
  const headerFooter = /^(jl\b|jln\b|jalan|no\.?\s*(telp|hp|tlp|fax)|alamat|telp|tlp|kasir|nota|struk|terima\s*kasih|thank\s*you|thanks|member|link|http|www\.|e-receipt|terimakasih|terina|barang\s+yang|isa\s+dikembalikan)/i;
  const pureSymbols = /^[\s\-_=|#+~`'"]+$/;

  // 1. TIME DETECTION (Supports 24h & 12h AM/PM)
  for (const rawLine of lines) {
    if (!time) {
      // 12-hour AM/PM: e.g. "12:53:10 PM", "5:51 PM", "11:18 AM", "04:55 PM"
      const time12Match = rawLine.match(/\b([01]?\d):([0-5]\d)(?::([0-5]\d))?\s*(AM|PM)\b/i);
      if (time12Match) {
        let hour = parseInt(time12Match[1], 10);
        const minute = time12Match[2];
        const second = time12Match[3] || "00";
        const meridiem = time12Match[4].toUpperCase();
        if (meridiem === "PM" && hour < 12) hour += 12;
        if (meridiem === "AM" && hour === 12) hour = 0;
        time = `${String(hour).padStart(2, "0")}:${minute}:${second}`;
      } else {
        // 24-hour: e.g. "08:46:36Sheila", "08:49"
        const time24Match = rawLine.match(/\b([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?\b/);
        if (time24Match) {
          time = time24Match[0];
        }
      }
    }
  }

  // 2. MERCHANT DETECTION
  // Priority 1: Recognizable brand/store keywords (scored)
  const storeKeywords = /(indomaret|alfamart|superindo|yomart|starbucks|kfc|mcd|hypermart|transmart|solaria|kopi|toko|warung|cafe|resto|restaurant|bakery|kedai|depot|pasar|outlet|shop|store|mart|market|sushi|teriyaki|grill|bistro|bar|pizza|bowl|kitchen|field|saska|pasta)/i;
  let bestMerchantCandidate = "";
  let bestMerchantScore = -1;

  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    if (pureSymbols.test(line)) continue;
    if (addressRegex.test(line) || phoneFaxRegex.test(line) || posMetaRegex.test(line)) continue;

    const cleaned = line
      .replace(/^[^\w\s]+|[^\w\s]+$/g, "")
      .replace(/\s+[A-Z]{1,2}$/, "")
      .replace(/[^\w\s&.'-]/g, "")
      .trim();

    if (cleaned.length < 3) continue;

    let score = 0;
    if (storeKeywords.test(cleaned)) score += 10;
    // Penalty for isolated single-letter words (e.g. "A 4 a", "48 FS a")
    const words = cleaned.split(/\s+/);
    const shortWords = words.filter((w) => w.length <= 2).length;
    if (shortWords >= words.length / 2) score -= 5;
    // Bonus for proper casing / capital words
    if (/^[A-Z][A-Za-z0-9\s&.'-]+$/.test(cleaned)) score += 3;
    // Penalty for numbers
    if (/\d/.test(cleaned)) score -= 2;

    if (score > bestMerchantScore && cleaned.length >= 4) {
      bestMerchantScore = score;
      bestMerchantCandidate = cleaned;
    }
  }

  if (bestMerchantCandidate) {
    merchant = bestMerchantCandidate;
  }

  // 3. DATE DETECTION & NORMALIZATION (Handles ISO, Indonesian textual, US MM/DD/YYYY, and DD-MM-YYYY)
  const monthMap: Record<string, string> = {
    jan: "01", januari: "01", january: "01",
    feb: "02", februari: "02", february: "02",
    mar: "03", maret: "03", march: "03",
    apr: "04", april: "04",
    mei: "05", may: "05",
    jun: "06", juni: "06", june: "06",
    jul: "07", juli: "07", july: "07",
    ags: "08", agt: "08", agustus: "08", aug: "08", august: "08",
    sep: "09", september: "09",
    okt: "10", oktober: "10", oct: "10", october: "10",
    nov: "11", november: "11",
    des: "12", desember: "12", dec: "12", december: "12",
  };

  let foundDate = false;
  for (const rawLine of lines) {
    if (foundDate) break;
    const line = rawLine.trim();

    // A. Textual month format: "May 26, 2016", "Jun 26, 15", "2 Agustus 2023", "21 Nov 2026"
    const mdyTextMatch = line.match(/\b([a-zA-Z]{3,9})\s+([0123]?\d)(?:st|nd|rd|th)?,?\s*['"]?(\d{2,4})\b/i);
    if (mdyTextMatch) {
      const mKey = mdyTextMatch[1].toLowerCase().slice(0, 3);
      const mVal = monthMap[mKey];
      const day = mdyTextMatch[2].padStart(2, "0");
      let year = mdyTextMatch[3];
      if (year.length === 2) year = "20" + year;
      if (mVal && Number(year) >= 2000 && Number(year) <= 2099) {
        date = `${year}-${mVal}-${day}`;
        foundDate = true;
        break;
      }
    }

    const dmyTextMatch = line.match(/\b(0?[1-9]|[12]\d|3[01])\s*[-/ ]\s*([a-zA-Z]{3,9})\s*[-/ ]\s*(\d{2,4})\b/i);
    if (dmyTextMatch) {
      const day = dmyTextMatch[1].padStart(2, "0");
      const mKey = dmyTextMatch[2].toLowerCase();
      const mVal = monthMap[mKey] || monthMap[mKey.slice(0, 3)];
      let year = dmyTextMatch[3];
      if (year.length === 2) year = "20" + year;
      if (mVal && Number(year) >= 2000 && Number(year) <= 2099) {
        date = `${year}-${mVal}-${day}`;
        foundDate = true;
        break;
      }
    }

    // B. YYYY-MM-DD or YYYY/MM/DD (e.g. 2023-08-02)
    const ymdMatch = line.match(/\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/);
    if (ymdMatch) {
      const y = ymdMatch[1];
      const m = ymdMatch[2].padStart(2, "0");
      const d = ymdMatch[3].padStart(2, "0");
      date = `${y}-${m}-${d}`;
      foundDate = true;
      break;
    }

    // C. MM/DD/YYYY or MM-DD-YYYY or DD/MM/YYYY with 4-digit year (e.g. 5/26/2016, 05-18-2019, 18.7.2024, 08/15/2017)
    const slash4YearMatch = line.match(/\b(0?[1-9]|[12]\d|3[01])[-/.](\d{1,2})[-/.](20\d{2})\b/);
    if (slash4YearMatch) {
      const p1 = parseInt(slash4YearMatch[1], 10);
      let p2 = parseInt(slash4YearMatch[2], 10);
      const year = slash4YearMatch[3];

      // Case 1: p1 > 12 and p2 <= 12 -> Unmistakably DD-MM-YYYY (e.g. 18.7.2024, 25/12/2023)
      if (p1 > 12 && p2 >= 1 && p2 <= 12) {
        const day = String(p1).padStart(2, "0");
        const month = String(p2).padStart(2, "0");
        date = `${year}-${month}-${day}`;
        foundDate = true;
        break;
      }

      // Case 2: p1 > 12 and p2 > 12 (OCR smudge artifact on month, e.g. 18.17.2024 -> month 17 is 7)
      if (p1 > 12 && p2 > 12 && p2 <= 19) {
        const day = String(p1).padStart(2, "0");
        const month = String(p2 % 10).padStart(2, "0");
        date = `${year}-${month}-${day}`;
        foundDate = true;
        break;
      }

      // Case 3: p1 <= 12 and p2 > 12 -> Unmistakably MM-DD-YYYY (e.g. 5/26/2016, 08/15/2017, 05-18-2019)
      if (p1 >= 1 && p1 <= 12 && p2 > 12 && p2 <= 31) {
        const month = String(p1).padStart(2, "0");
        const day = String(p2).padStart(2, "0");
        date = `${year}-${month}-${day}`;
        foundDate = true;
        break;
      }

      // Case 4: Both <= 12 -> Default Indonesian DD-MM-YYYY
      if (p1 >= 1 && p1 <= 31 && p2 >= 1 && p2 <= 12) {
        const day = String(p1).padStart(2, "0");
        const month = String(p2).padStart(2, "0");
        date = `${year}-${month}-${day}`;
        foundDate = true;
        break;
      }
    }

    // D. 2-digit year: MM/DD/YY or DD/MM/YY (e.g. 05/11/18, 08/09/19)
    const slash2YearMatch = line.match(/\b(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|[12]\d|3[01])[-/.]([12]\d)\b/);
    if (slash2YearMatch) {
      const p1 = parseInt(slash2YearMatch[1], 10);
      const p2 = parseInt(slash2YearMatch[2], 10);
      const year = "20" + slash2YearMatch[3];

      if (p2 > 12 && p1 <= 12) {
        const month = String(p1).padStart(2, "0");
        const day = String(p2).padStart(2, "0");
        date = `${year}-${month}-${day}`;
        foundDate = true;
        break;
      } else if (p2 <= 12) {
        const day = String(p1).padStart(2, "0");
        const month = String(p2).padStart(2, "0");
        date = `${year}-${month}-${day}`;
        foundDate = true;
        break;
      }
    }
  }

  // 4. AMOUNT EXTRACTION (Supports Indonesian dotted amounts, Rp38.000, and decimal currencies)
  function extractAmount(str: string): number {
    if (str.match(/(kembali|diskon|hemat|change|discount|kembalian|subtotal|sub\s*total|subomal|tax|pajak|tip\b|suggested)/i)) return 0;

    const norm = str.replace(/(\d)[Oo]/g, "$10").replace(/[Oo](\d)/g, "0$1");

    // Indonesian thousands dot e.g. "Rp 70.000", "Rp38.000", "35.000", "1.500.000" (Handles with or without space after Rp)
    const dottedMatch = norm.match(/(?:(?:rp\.?|idr)\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d+)?)\b/i);
    if (dottedMatch) {
      const clean = dottedMatch[1].replace(/\./g, "").replace(/,/g, ".");
      const val = parseFloat(clean);
      if (val >= 500) return Math.round(val);
    }

    // Check for decimal currency e.g. "$15.03", "179.94", "143.71", "77.83", "24.47"
    const decimalMatch = norm.match(/(?:[$£€]\s*)?(\d{1,4}\.\d{2})\b/);
    if (decimalMatch && !norm.includes("rp") && !norm.includes("idr")) {
      const val = parseFloat(decimalMatch[1]);
      if (val > 0) return Math.round(val);
    }

    // Plain integer with or without Rp (e.g. "Rp38000", "50000")
    const plainMatch = norm.match(/(?:(?:rp\.?|idr)\s*)?(\d{4,9})\b/i);
    if (plainMatch) {
      const val = parseInt(plainMatch[1], 10);
      if (val >= 500) return val;
    }

    return 0;
  }

  // Priority 1: Lines explicitly stating TOTAL (excluding Subtotal, Tax, Tip)
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i].toLowerCase();
    if (l.includes("total") && !l.includes("subtotal") && !l.includes("sub total") && !l.includes("subomal") && !l.includes("tax") && !l.includes("tip")) {
      let amt = extractAmount(lines[i]);
      if (!amt && i + 1 < lines.length) {
        amt = extractAmount(lines[i + 1]);
      }
      if (amt > 0) {
        totalAmount = amt;
        break;
      }
    }
  }

  // Priority 2: Alternative balance keywords (Balance Due, Total Bayar, Tunai)
  if (!totalAmount) {
    const paymentKws = ["balance due", "total bayar", "tagihan", "tunai", "cash", "amount due"];
    for (let i = lines.length - 1; i >= 0; i--) {
      const l = lines[i].toLowerCase();
      if (paymentKws.some((kw) => l.includes(kw))) {
        let amt = extractAmount(lines[i]);
        if (!amt && i + 1 < lines.length) amt = extractAmount(lines[i + 1]);
        if (amt > 0) {
          totalAmount = amt;
          break;
        }
      }
    }
  }

  // 5. ITEM EXTRACTION
  function isDetailQtyLine(str: string): boolean {
    const s = str.trim();
    if (pureSymbols.test(s)) return false;
    return (
      /^[0-9TtIli]?\s*x\s*[\d.,]+/i.test(s) ||
      /\d+\s*(?:lusin|pcs|pc|btl|bks|bungkus|ml|gr|kg|ltr|liter|box|pack|sachet|roll|lembar|unit|set|buah|potong|porsi|gelas|cup|botol|kaleng|dus|karton)?\s*x\s*[\d.,]/i.test(s) ||
      /^[xX×]\s*[\d.,]+\s+[\d.,]+/i.test(s)
    );
  }

  function isValidItemCandidate(str: string): boolean {
    const s = str.trim();
    if (s.length < 2 || s.length > 55) return false;
    if (pureSymbols.test(s)) return false;
    if (summaryKeywords.test(s)) return false;
    if (headerFooter.test(s)) return false;
    if (addressRegex.test(s)) return false;
    if (cityStateZipRegex.test(s)) return false;
    if (phoneFaxRegex.test(s)) return false;
    if (posMetaRegex.test(s)) return false;
    if (webSocialRegex.test(s)) return false;
    if (tipRegex.test(s)) return false;
    if (/^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}|^\d{2}:\d{2}/.test(s)) return false;
    return true;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!isValidItemCandidate(line)) continue;

    // Pattern 1: Numbered item header ("1. Indomie Goreng")
    const numberedMatch = line.match(/^(\d+)\.\s+(.{3,})$/);
    if (numberedMatch) {
      const name = numberedMatch[2].trim();
      if (isValidItemCandidate(name) && !items.includes(name)) {
        items.push(name);
      }
      if (i + 1 < lines.length && isDetailQtyLine(lines[i + 1])) i++;
      continue;
    }

    // Pattern 2: Multi-line unnumbered item ("Frestea madu" followed by "Tx 8.000 8.000")
    if (i + 1 < lines.length && isDetailQtyLine(lines[i + 1])) {
      const cleaned = line.replace(/[^\w\s&.'-]/g, "").trim();
      if (isValidItemCandidate(cleaned) && !items.includes(cleaned)) {
        items.push(cleaned);
        i++;
        continue;
      }
    }

    // Pattern 3: Line with item name + price (e.g. "1 #1 CHKN PLATE $9.39", "Hamachi Collar £12.00", "2 Lunch 45.90", "ROTI COKLAT 15.000")
    if (!isDetailQtyLine(line)) {
      const priceEndMatch = line.match(/^(?:[\d*#]+\s+)?(.+?)\s+[$£€]?(?:[\d]{1,3}(?:[.,]\d{3})+|\d{1,4}\.\d{2}|\d{3,9})\s*$/i);
      if (priceEndMatch) {
        let name = priceEndMatch[1]
          .replace(/^\d+\s*[xX×@]\s*/, "")
          .replace(/[^\w\s&.'-]/g, "")
          .trim();

        if (isValidItemCandidate(name) && !items.includes(name)) {
          items.push(name);
        }
      }
    }
  }

  return { merchant, totalAmount, date, time, items };
}

async function testAll() {
  console.log("=== TESTING SMART PARSER V2 ON BENCHMARK DATASET ===");
  const resultsFile = "d:/Programming/LifeOS/datasets/benchmark-results.json";
  const rawResults = JSON.parse(fs.readFileSync(resultsFile, "utf-8"));

  const evaluated: any[] = [];
  for (const item of rawResults) {
    const rawText = item.rawLines.join("\n");
    const parsed = parseReceiptTextSmart(rawText);
    evaluated.push({
      file: item.file,
      merchant: parsed.merchant,
      date: parsed.date,
      time: parsed.time || "-",
      total: parsed.totalAmount,
      itemCount: parsed.items.length,
      sampleItems: parsed.items.slice(0, 3).join("; "),
    });
  }

  console.table(evaluated);

  console.log("\n=== TESTING INDONESIAN RECEIPTS ===");
  const karisText = `Karis Jaya Shop\n2023-08-02 karis\n08:46:36 Sheila\n1. Indomie Goreng\n1lusin x 36,000 Rp 36.000\n2. Fruit Tea Apple\n1 500 ml x 7,000 Rp 7.000\n3. Belfood Sosis Bakar\n1 x 27,000 Rp 27.000\nTotal Rp 70.000`;
  const alfamartText = `Alfamart\nAlfamart Jogja\n18.17.2024 08:49\nCinory\nx 2.000 2.000\ninary haze nut\n1x 8.000 3.000\nFrestea madu\nTx 8.000 8.000\nTee crean aice\nx 5.000 5.000\nKanzler\nx 10.000 10.000\nLe Hinerale\n1x 4.000 4.000\nTotal Rp38.000`;

  console.log("Karis Jaya Shop:", parseReceiptTextSmart(karisText));
  console.log("Alfamart:", parseReceiptTextSmart(alfamartText));
}

testAll().catch(console.error);
