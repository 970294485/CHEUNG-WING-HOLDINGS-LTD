"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Search, ExternalLink } from "lucide-react";
import Link from "next/link";

interface GlAccount {
  id: string;
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
}

const ACCOUNT_TYPES = {
  ASSET: "資產 (Asset)",
  LIABILITY: "負債 (Liability)",
  EQUITY: "權益 (Equity)",
  REVENUE: "收入 (Revenue)",
  EXPENSE: "支出 (Expense)",
};

export default function LedgerItemsPage() {
  const [accounts, setAccounts] = useState<GlAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<GlAccount | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "ASSET",
    parentId: "none",
    isActive: true,
  });

  // TODO: Get real companyId from auth context
  const companyId = "cm7g83z1e000008l4hj123456"; // Mock companyId for now

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`/api/gl-accounts?companyId=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error("Failed to fetch GL accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOpenDialog = (account?: GlAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        code: account.code,
        name: account.name,
        type: account.type,
        parentId: account.parentId || "none",
        isActive: account.isActive,
      });
    } else {
      setEditingAccount(null);
      setFormData({
        code: "",
        name: "",
        type: "ASSET",
        parentId: "none",
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAccount ? `/api/gl-accounts/${editingAccount.id}` : "/api/gl-accounts";
      const method = editingAccount ? "PUT" : "POST";

      const payload = {
        companyId,
        ...formData,
        parentId: formData.parentId === "none" ? null : formData.parentId,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        fetchAccounts();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save account");
      }
    } catch (error) {
      console.error("Error saving account:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除此會計科目嗎？")) return;

    try {
      const res = await fetch(`/api/gl-accounts/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchAccounts();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  const filteredAccounts = accounts.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to get parent name
  const getParentName = (parentId: string | null) => {
    if (!parentId) return "-";
    const parent = accounts.find(a => a.id === parentId);
    return parent ? `${parent.code} ${parent.name}` : "-";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">會計入賬項目 (總帳科目)</h1>
          <p className="text-muted-foreground">管理公司的會計科目表 (Chart of Accounts)。與 <Link href="/accounting/accounts" className="text-blue-500 hover:underline">會計功能</Link> 模組數據互通。</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/accounting/accounts">
            <Button variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" /> 會計科目管理
            </Button>
          </Link>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> 新增科目
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋科目代碼或名稱..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>科目代碼</TableHead>
              <TableHead>科目名稱</TableHead>
              <TableHead>科目類型</TableHead>
              <TableHead>上級科目</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  載入中...
                </TableCell>
              </TableRow>
            ) : filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  找不到會計科目
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium font-mono">{account.code}</TableCell>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>{ACCOUNT_TYPES[account.type as keyof typeof ACCOUNT_TYPES]}</TableCell>
                  <TableCell className="text-muted-foreground">{getParentName(account.parentId)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${account.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                      {account.isActive ? '啟用' : '停用'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(account)} title="編輯科目">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(account.id)} title="刪除科目">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "編輯會計科目" : "新增會計科目"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4 items-center">
              <Label htmlFor="code" className="text-right">代碼 <span className="text-red-500">*</span></Label>
              <div className="col-span-3">
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  placeholder="例如: 1001"
                  disabled={!!editingAccount}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4 items-center">
              <Label htmlFor="name" className="text-right">名稱 <span className="text-red-500">*</span></Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="例如: 現金"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 items-center">
              <Label htmlFor="type" className="text-right">類型 <span className="text-red-500">*</span></Label>
              <div className="col-span-3">
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇科目類型" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACCOUNT_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 items-center">
              <Label htmlFor="parentId" className="text-right">上級科目</Label>
              <div className="col-span-3">
                <Select 
                  value={formData.parentId} 
                  onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="無上級科目 (頂層)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">無上級科目 (頂層)</SelectItem>
                    {accounts
                      .filter(a => a.id !== editingAccount?.id) // 避免選擇自己作為父級
                      .map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 items-center">
              <Label htmlFor="isActive" className="text-right">狀態</Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive" className="font-normal cursor-pointer">
                  {formData.isActive ? '啟用中' : '已停用'}
                </Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">
                儲存
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
