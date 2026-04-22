import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import {
  loadContractPrepayData,
  resolveOpenPrepayForMatching,
} from "@/lib/finance/contract-prepay-data";
import { ContractPrepayClient } from "./contract-prepay-client";
import { TreasuryReceivableHubNav } from "@/components/finance/TreasuryReceivableHubNav";

export default async function ContractInvoicePrepayPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const companyId = await getDefaultCompanyId();
  const sp = await searchParams;
  const raw = sp.customerId?.trim() || null;

  let filterCustomerId: string | null = null;
  let filterCustomerName: string | null = null;
  if (raw) {
    const cust = await prisma.customer.findFirst({
      where: { id: raw, companyId },
      select: { id: true, name: true },
    });
    if (cust) {
      filterCustomerId = cust.id;
      filterCustomerName = cust.name;
    }
  }

  const { rows, prepayments } = await loadContractPrepayData(companyId);
  const { openPrepay, openCustomerLabel } = resolveOpenPrepayForMatching(
    prepayments,
    filterCustomerId
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <TreasuryReceivableHubNav active="match" customerId={filterCustomerId} />

      <div>
        <h2 className="text-2xl font-semibold tracking-tight">預收款對接 (Matching Logic)</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          將預收款掛到<strong>指定銷售合同</strong>（多合同客戶請在此選擇合同，勿僅依名稱猜測）。與「預收款項管理」「應收帳款管理」共用客戶主檔。
        </p>
      </div>

      <ContractPrepayClient
        rows={rows}
        openPrepay={openPrepay}
        openCustomerLabel={openCustomerLabel}
        filterCustomerId={filterCustomerId}
        filterCustomerName={filterCustomerName}
      />
    </div>
  );
}
