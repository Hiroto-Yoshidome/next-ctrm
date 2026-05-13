import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const wb = new ExcelJS.Workbook();

  // ---- Sheet1: 成約データ ----
  const s1 = wb.addWorksheet("成約");
  s1.addRow([
    "成約Index", "取引形態", "直送/在庫区分", "売買区分", "成約日",
    "取引先コード", "数量(MT)", "通貨", "インコタームズ", "価格タイプ",
    "ベース評価指標", "プレミアム評価指標", "単価", "プレミアム",
    "QP開始日", "QP終了日", "備考",
  ]);

  // 行1: 輸入・直送・買・FIXED
  s1.addRow([
    "CTR-2026-001", "IMPORT", "DIRECT", "BUY", new Date("2026-05-01"),
    "ABC", 500, "USD", "CIF",
    "FIXED", "LME_COPPER", "", 9500, 50,
    "", "", "サンプル輸入買成約",
  ]);

  // 行2: 三国間・直送・売・FIXED
  s1.addRow([
    "CTR-2026-002", "OVERSEAS", "DIRECT", "SELL", new Date("2026-05-08"),
    "XYZ", 300, "USD", "FOB",
    "FIXED", "LME_COPPER", "PREMIUM_JAPAN", 9600, 80,
    "", "", "サンプル三国間売成約",
  ]);

  // 行3: 輸入・在庫・買・UNFIXED（QP期間あり）
  s1.addRow([
    "CTR-2026-003", "IMPORT", "STOCK", "BUY", new Date("2026-05-12"),
    "ABC Trading Co.", 200, "USD", "CIF",
    "UNFIXED", "LME_COPPER", "", 0, 60,
    new Date("2026-06-01"), new Date("2026-06-30"), "サンプルUNFIXED買成約",
  ]);

  // 日付列のフォーマット設定
  [s1.getColumn(5), s1.getColumn(15), s1.getColumn(16)].forEach((col) => {
    col.numFmt = "yyyy/mm/dd";
    col.width = 14;
  });
  s1.getColumn(1).width = 18;
  s1.getColumn(6).width = 20;

  // ヘッダ行スタイル
  const headerRow = s1.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2EFDA" } };

  // ---- Sheet2: 予定諸掛 ----
  const s2 = wb.addWorksheet("予定諸掛");
  s2.addRow(["成約Index", "費目", "数量単位", "単価", "通貨"]);

  s2.addRow(["CTR-2026-001", "海上運賃", "MT", 30, "USD"]);
  s2.addRow(["CTR-2026-001", "保険料", "MT", 5, "USD"]);
  s2.addRow(["CTR-2026-002", "通関費", "MT", 8, "USD"]);
  s2.addRow(["CTR-2026-003", "海上運賃", "MT", 28, "USD"]);

  const h2 = s2.getRow(1);
  h2.font = { bold: true };
  h2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2EFDA" } };
  [1, 2, 3, 4, 5].forEach((i) => { s2.getColumn(i).width = 18; });

  const outPath = path.join(__dirname, "sample_contracts.xlsx");
  await wb.xlsx.writeFile(outPath);
  console.log("生成完了:", outPath);
}

main().catch(console.error);
