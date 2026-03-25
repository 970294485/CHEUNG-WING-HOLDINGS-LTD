import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { createDocumentNumberRule } from "@/lib/server/actions";

export default async function DocumentNumbersPage() {
  const companyId = await getDefaultCompanyId();
  const rules = await prisma.documentNumberRule.findMany({
    where: { companyId },
    orderBy: { documentType: "asc" },
  });

  const docTypes = [
    { value: "INVOICE", label: "發票 (Invoice)" },
    { value: "QUOTATION", label: "報價單 (Quotation)" },
    { value: "CONTRACT", label: "合同 (Contract)" },
    { value: "PO", label: "採購單 (Purchase Order)" },
    { value: "JE", label: "會計憑證 (Journal Entry)" },
    { value: "PR", label: "請款單 (Payment Request)" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">公司基本文件單號輸入</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          設定各類業務單據的自動編號規則（如：INV-YYYYMM-001）。
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold">新增 / 更新規則</h3>
        <form action={createDocumentNumberRule} className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-5">
          <div className="space-y-1">
            <label className="text-xs text-zinc-500">單據類型</label>
            <select
              name="documentType"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              required
            >
              {docTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-500">前綴 (Prefix)</label>
            <input
              name="prefix"
              placeholder="例如: INV-"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-500">日期格式 (可選)</label>
            <select
              name="dateFormat"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            >
              <option value="">無</option>
              <option value="YYYYMM">YYYYMM (年月)</option>
              <option value="YYYYMMDD">YYYYMMDD (年月日)</option>
              <option value="YYMM">YYMM (短年月)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-500">流水號長度</label>
            <input
              name="sequenceLen"
              type="number"
              min="1"
              max="6"
              defaultValue="3"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              儲存
            </button>
          </div>
        </form>
      </section>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">單據類型</th>
              <th className="px-4 py-3">前綴</th>
              <th className="px-4 py-3">日期格式</th>
              <th className="px-4 py-3">流水號長度</th>
              <th className="px-4 py-3">當前流水號</th>
              <th className="px-4 py-3">預覽範例</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => {
              const typeLabel = docTypes.find(t => t.value === r.documentType)?.label || r.documentType;
              const d = new Date();
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, "0");
              const dd = String(d.getDate()).padStart(2, "0");
              const yy = String(yyyy).slice(-2);
              
              let dateStr = "";
              if (r.dateFormat === "YYYYMM") dateStr = `${yyyy}${mm}`;
              if (r.dateFormat === "YYYYMMDD") dateStr = `${yyyy}${mm}${dd}`;
              if (r.dateFormat === "YYMM") dateStr = `${yy}${mm}`;
              
              const seqStr = String(r.currentSeq + 1).padStart(r.sequenceLen, "0");
              const preview = `${r.prefix}${dateStr ? dateStr + "-" : ""}${seqStr}`;

              return (
                <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="px-4 py-3 font-medium">{typeLabel}</td>
                  <td className="px-4 py-3 font-mono">{r.prefix}</td>
                  <td className="px-4 py-3">{r.dateFormat || "—"}</td>
                  <td className="px-4 py-3">{r.sequenceLen}</td>
                  <td className="px-4 py-3">{r.currentSeq}</td>
                  <td className="px-4 py-3 font-mono text-zinc-500">{preview}</td>
                </tr>
              );
            })}
            {rules.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  暫無自定義規則，系統將使用預設規則。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}