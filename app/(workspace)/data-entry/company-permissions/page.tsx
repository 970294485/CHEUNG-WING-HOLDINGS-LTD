export default function CompanyPermissionsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">公司權限設定</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">設置公司全局級別的功能開關與訪問策略。</p>
        </div>
        <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
          保存設置
        </button>
      </header>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="p-6">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">全局安全與訪問策略</h3>
          <p className="mt-1 text-sm text-zinc-500">這些設置將影響公司下所有用戶的訪問行為。</p>
          
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div>
                <div className="font-medium text-zinc-900 dark:text-zinc-100">強制雙因素認證 (2FA)</div>
                <div className="text-sm text-zinc-500">要求所有用戶在登錄時必須使用雙因素認證。</div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" />
                <div className="peer h-6 w-11 rounded-full bg-zinc-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-zinc-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-zinc-900 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-zinc-300 dark:border-zinc-600 dark:bg-zinc-700 dark:peer-checked:bg-zinc-100"></div>
              </label>
            </div>

            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div>
                <div className="font-medium text-zinc-900 dark:text-zinc-100">允許外部文件分享</div>
                <div className="text-sm text-zinc-500">允許員工通過公共鏈接將文件分享給公司外部人員。</div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" defaultChecked className="peer sr-only" />
                <div className="peer h-6 w-11 rounded-full bg-zinc-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-zinc-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-zinc-900 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-zinc-300 dark:border-zinc-600 dark:bg-zinc-700 dark:peer-checked:bg-zinc-100"></div>
              </label>
            </div>

            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div>
                <div className="font-medium text-zinc-900 dark:text-zinc-100">嚴格密碼策略</div>
                <div className="text-sm text-zinc-500">密碼必須包含大小寫字母、數字及特殊字符，且長度不少於 8 位。</div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" defaultChecked className="peer sr-only" />
                <div className="peer h-6 w-11 rounded-full bg-zinc-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-zinc-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-zinc-900 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-zinc-300 dark:border-zinc-600 dark:bg-zinc-700 dark:peer-checked:bg-zinc-100"></div>
              </label>
            </div>

            <div className="flex items-center justify-between pb-2">
              <div>
                <div className="font-medium text-zinc-900 dark:text-zinc-100">登錄會話超時</div>
                <div className="text-sm text-zinc-500">用戶無操作後自動登出的時間（分鐘）。</div>
              </div>
              <input
                type="number"
                defaultValue={60}
                className="w-24 rounded-lg border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
