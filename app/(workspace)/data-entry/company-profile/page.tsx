import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { updateCompanyProfile } from "@/lib/server/actions";

export default async function CompanyProfilePage() {
  const companyId = await getDefaultCompanyId();
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) return <div>公司資料不存在</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">基本公司資料輸入</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          設定公司的基本資訊，這些資訊將顯示在導出的單據和報表中。
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <form action={updateCompanyProfile} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">公司名稱</label>
              <input
                id="name"
                name="name"
                defaultValue={company.name}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium">公司代碼</label>
              <input
                id="code"
                defaultValue={company.code}
                className="w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-600 dark:bg-zinc-900"
                disabled
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="address" className="text-sm font-medium">公司地址</label>
              <input
                id="address"
                name="address"
                defaultValue={company.address || ""}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">聯絡電話</label>
              <input
                id="phone"
                name="phone"
                defaultValue={company.phone || ""}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">聯絡電郵</label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={company.email || ""}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="taxId" className="text-sm font-medium">稅務編號 (BR/CR)</label>
              <input
                id="taxId"
                name="taxId"
                defaultValue={company.taxId || ""}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              儲存變更
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}