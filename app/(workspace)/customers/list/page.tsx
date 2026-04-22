import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerDeleteButton } from "@/components/customers/CustomerDeleteButton";
import { getSession } from "@/lib/auth/session";
import { getDefaultCompanyId } from "@/lib/company";
import { findCustomersForList } from "@/lib/server/customers";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ search?: string }>;
};

export default async function CustomerListPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session?.sub) redirect("/");

  const sp = await searchParams;
  const search = typeof sp.search === "string" ? sp.search.trim() : "";
  const companyId = await getDefaultCompanyId();
  const customers = await findCustomersForList(companyId, search);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">客戶檔案管理</h1>
        <Link
          href="/customers/list/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          新增客戶
        </Link>
      </div>

      <form method="get" className="mb-6 flex max-w-2xl flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor="customer-search" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            搜尋
          </label>
          <input
            id="customer-search"
            name="search"
            type="text"
            defaultValue={search}
            placeholder="客戶名稱、編號、聯絡人、電話或發票備註關鍵字…"
            className="w-full rounded-md border border-zinc-300 px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
        >
          搜尋
        </button>
        {search ? (
          <Link
            href="/customers/list"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            清除
          </Link>
        ) : null}
      </form>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  客戶名稱
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  編號
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  聯絡人
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  電話
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  狀態
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-zinc-500">
                    沒有找到客戶資料
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-zinc-900 dark:text-white">
                      {customer.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                      {customer.code || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                      {customer.contactPerson || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                      {customer.phone || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          customer.status === "ACTIVE"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {customer.status === "ACTIVE" ? "活躍" : customer.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <span className="inline-flex items-center gap-3">
                        <Link
                          href={`/customers/list/${customer.id}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          編輯 / 詳情
                        </Link>
                        <CustomerDeleteButton id={customer.id} name={customer.name} />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
