"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, FolderTree, Briefcase } from "lucide-react";
import {
  getDocumentCaseManagementPageData,
  createDocumentCaseCategory,
  updateDocumentCaseCategory,
  deleteDocumentCaseCategory,
  createDocumentCase,
  updateDocumentCase,
  deleteDocumentCase,
} from "@/app/actions/document-cases";

type CaseCategoryRow = {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  createdAt: Date;
  _count?: { children: number; cases: number };
};

type CaseRow = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  status: string;
  openedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string } | null;
};

const CASE_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "OPEN", label: "待處理" },
  { value: "IN_PROGRESS", label: "進行中" },
  { value: "CLOSED", label: "已結案" },
  { value: "ARCHIVED", label: "已歸檔" },
];

function statusLabel(v: string) {
  return CASE_STATUS_OPTIONS.find((o) => o.value === v)?.label ?? v;
}

function flatCategoryLabels(categories: CaseCategoryRow[]): { id: string; label: string }[] {
  const byParent = new Map<string | null, CaseCategoryRow[]>();
  for (const c of categories) {
    const key = c.parentId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(c);
  }
  for (const [, list] of byParent) {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }
  const out: { id: string; label: string }[] = [];
  const walk = (parentId: string | null, prefix: string) => {
    const list = byParent.get(parentId) ?? [];
    for (const c of list) {
      const label = prefix ? `${prefix} / ${c.name}` : c.name;
      out.push({ id: c.id, label });
      walk(c.id, label);
    }
  };
  walk(null, "");
  return out;
}

export default function CaseManagementClient() {
  const [tab, setTab] = useState("categories");
  const [categories, setCategories] = useState<CaseCategoryRow[]>([]);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loadingCat, setLoadingCat] = useState(true);
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchCat, setSearchCat] = useState("");
  const [searchCase, setSearchCase] = useState("");

  const [catDialog, setCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<CaseCategoryRow | null>(null);
  const [catForm, setCatForm] = useState({
    name: "",
    description: "",
    parentId: "" as string,
    sortOrder: "0",
  });

  const [caseDialog, setCaseDialog] = useState(false);
  const [editingCase, setEditingCase] = useState<CaseRow | null>(null);
  const [caseForm, setCaseForm] = useState({
    code: "",
    title: "",
    description: "",
    categoryId: "" as string,
    status: "OPEN",
    openedAt: "",
    closedAt: "",
  });

  const refreshAll = useCallback(async () => {
    setLoadingCat(true);
    setLoadingCases(true);
    setLoadError(null);
    try {
      const res = await getDocumentCaseManagementPageData();
      if (res.success && res.data) {
        setCategories(res.data.categories as CaseCategoryRow[]);
        setCases(res.data.cases as CaseRow[]);
      } else {
        setLoadError(res.message ?? "無法載入資料");
        setCategories([]);
        setCases([]);
      }
    } finally {
      setLoadingCat(false);
      setLoadingCases(false);
    }
  }, []);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const categorySelectOptions = useMemo(() => flatCategoryLabels(categories), [categories]);

  const openCatDialog = (row?: CaseCategoryRow) => {
    if (row) {
      setEditingCat(row);
      setCatForm({
        name: row.name,
        description: row.description || "",
        parentId: row.parentId || "",
        sortOrder: String(row.sortOrder),
      });
    } else {
      setEditingCat(null);
      setCatForm({ name: "", description: "", parentId: "", sortOrder: "0" });
    }
    setCatDialog(true);
  };

  const submitCat = async (e: React.FormEvent) => {
    e.preventDefault();
    const sortOrder = parseInt(catForm.sortOrder, 10);
    const parentId = catForm.parentId || null;
    const payload = {
      name: catForm.name.trim(),
      description: catForm.description.trim() || undefined,
      parentId,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    };
    if (editingCat) {
      const res = await updateDocumentCaseCategory(editingCat.id, payload);
      if (!res.success) {
        alert(res.message || "更新失敗");
        return;
      }
    } else {
      const res = await createDocumentCaseCategory(payload);
      if (!res.success) {
        alert(res.message || "新增失敗");
        return;
      }
    }
    setCatDialog(false);
    void refreshAll();
  };

  const removeCat = async (id: string) => {
    if (!confirm("確定要刪除此案件分類？")) return;
    const res = await deleteDocumentCaseCategory(id);
    if (!res.success) {
      alert(res.message || "刪除失敗");
      return;
    }
    void refreshAll();
  };

  const openCaseDialog = (row?: CaseRow) => {
    if (row) {
      setEditingCase(row);
      setCaseForm({
        code: row.code,
        title: row.title,
        description: row.description || "",
        categoryId: row.categoryId || "",
        status: row.status,
        openedAt: row.openedAt ? row.openedAt.toString().slice(0, 10) : "",
        closedAt: row.closedAt ? row.closedAt.toString().slice(0, 10) : "",
      });
    } else {
      setEditingCase(null);
      setCaseForm({
        code: "",
        title: "",
        description: "",
        categoryId: "",
        status: "OPEN",
        openedAt: "",
        closedAt: "",
      });
    }
    setCaseDialog(true);
  };

  const parseDate = (s: string) => {
    if (!s.trim()) return null;
    const d = new Date(s + "T12:00:00");
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const submitCase = async (e: React.FormEvent) => {
    e.preventDefault();
    const categoryId = caseForm.categoryId || null;
    const openedAt = parseDate(caseForm.openedAt);
    const closedAt = parseDate(caseForm.closedAt);
    if (editingCase) {
      const res = await updateDocumentCase(editingCase.id, {
        code: caseForm.code.trim(),
        title: caseForm.title.trim(),
        description: caseForm.description.trim() || null,
        categoryId,
        status: caseForm.status as "OPEN" | "IN_PROGRESS" | "CLOSED" | "ARCHIVED",
        openedAt,
        closedAt,
      });
      if (!res.success) {
        alert(res.message || "更新失敗");
        return;
      }
    } else {
      const res = await createDocumentCase({
        code: caseForm.code.trim(),
        title: caseForm.title.trim(),
        description: caseForm.description.trim() || undefined,
        categoryId,
        status: caseForm.status as "OPEN" | "IN_PROGRESS" | "CLOSED" | "ARCHIVED",
        openedAt,
        closedAt,
      });
      if (!res.success) {
        alert(res.message || "新增失敗");
        return;
      }
    }
    setCaseDialog(false);
    void refreshAll();
  };

  const removeCase = async (id: string) => {
    if (!confirm("確定要刪除此案件？")) return;
    const res = await deleteDocumentCase(id);
    if (!res.success) {
      alert(res.message || "刪除失敗");
      return;
    }
    void refreshAll();
  };

  const filteredCats = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchCat.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchCat.toLowerCase()))
  );

  const filteredCases = cases.filter(
    (c) =>
      c.code.toLowerCase().includes(searchCase.toLowerCase()) ||
      c.title.toLowerCase().includes(searchCase.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchCase.toLowerCase()))
  );

  const parentName = (parentId: string | null) => {
    if (!parentId) return "—";
    const p = categories.find((x) => x.id === parentId);
    return p?.name ?? "—";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">案件分類與管理</h1>
        <p className="text-muted-foreground">
          建立案件類型層級，並維護案件主檔（編號、狀態與歸屬分類），便於文件與導出模組對專案／案件歸檔。
        </p>
      </div>

      {loadError ? (
        <div
          className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <p className="font-medium">載入失敗</p>
          <p className="mt-1 text-destructive/90">{loadError}</p>
          <p className="mt-2 text-muted-foreground">
            若資料庫尚未初始化，請在專案目錄執行{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-foreground">npx prisma db seed</code> 或{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-foreground">npm run db:seed:document-cases</code>
            ，並確認 <code className="rounded bg-muted px-1 py-0.5 text-foreground">.env</code> 的{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-foreground">DATABASE_URL</code> 與應用連線相同。
          </p>
        </div>
      ) : null}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="categories" className="gap-1.5">
            <FolderTree className="h-4 w-4" />
            案件分類
          </TabsTrigger>
          <TabsTrigger value="cases" className="gap-1.5">
            <Briefcase className="h-4 w-4" />
            案件列表
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4 mt-4">
          <div className="flex flex-wrap justify-between gap-2 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋分類名稱或描述…"
                className="pl-8"
                value={searchCat}
                onChange={(e) => setSearchCat(e.target.value)}
              />
            </div>
            <Button type="button" onClick={() => openCatDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              新增分類
            </Button>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>分類名稱</TableHead>
                  <TableHead>上層</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>排序</TableHead>
                  <TableHead>子分類 / 案件數</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingCat ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      載入中…
                    </TableCell>
                  </TableRow>
                ) : filteredCats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      尚無案件分類
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCats.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{parentName(c.parentId)}</TableCell>
                      <TableCell className="text-muted-foreground">{c.description || "—"}</TableCell>
                      <TableCell>{c.sortOrder}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {c._count?.children ?? 0} / {c._count?.cases ?? 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openCatDialog(c)} title="編輯">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => removeCat(c.id)} title="刪除">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="cases" className="space-y-4 mt-4">
          <div className="flex flex-wrap justify-between gap-2 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋編號、標題或備註…"
                className="pl-8"
                value={searchCase}
                onChange={(e) => setSearchCase(e.target.value)}
              />
            </div>
            <Button type="button" onClick={() => openCaseDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              新增案件
            </Button>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>案件編號</TableHead>
                  <TableHead>標題</TableHead>
                  <TableHead>分類</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>更新時間</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingCases ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      載入中…
                    </TableCell>
                  </TableRow>
                ) : filteredCases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      尚無案件
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCases.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-sm">{c.code}</TableCell>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell className="text-muted-foreground">{c.category?.name ?? "—"}</TableCell>
                      <TableCell>{statusLabel(c.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(c.updatedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openCaseDialog(c)} title="編輯">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => removeCase(c.id)} title="刪除">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{editingCat ? "編輯案件分類" : "新增案件分類"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitCat} className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="cat-name">
                名稱 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cat-name"
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                required
                placeholder="例如：訴訟、合約審閱、專案交付"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cat-parent">上層分類</Label>
              <Select
                value={catForm.parentId || "__none__"}
                onValueChange={(v) => setCatForm({ ...catForm, parentId: v === "__none__" ? "" : v })}
              >
                <SelectTrigger id="cat-parent">
                  <SelectValue placeholder="（頂層）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">（頂層）</SelectItem>
                  {categorySelectOptions
                    .filter((o) => !editingCat || o.id !== editingCat.id)
                    .map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cat-sort">排序（數字越小越靠前）</Label>
              <Input
                id="cat-sort"
                type="number"
                value={catForm.sortOrder}
                onChange={(e) => setCatForm({ ...catForm, sortOrder: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cat-desc">描述</Label>
              <Textarea
                id="cat-desc"
                rows={3}
                value={catForm.description}
                onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCatDialog(false)}>
                取消
              </Button>
              <Button type="submit">儲存</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={caseDialog} onOpenChange={setCaseDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingCase ? "編輯案件" : "新增案件"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitCase} className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="case-code">
                案件編號 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="case-code"
                value={caseForm.code}
                onChange={(e) => setCaseForm({ ...caseForm, code: e.target.value })}
                required
                placeholder="例如：CASE-2026-001"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="case-title">
                標題 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="case-title"
                value={caseForm.title}
                onChange={(e) => setCaseForm({ ...caseForm, title: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>所屬分類</Label>
              <Select
                value={caseForm.categoryId || "__none__"}
                onValueChange={(v) => setCaseForm({ ...caseForm, categoryId: v === "__none__" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="未分類" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">未分類</SelectItem>
                  {categorySelectOptions.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>狀態</Label>
              <Select value={caseForm.status} onValueChange={(v) => setCaseForm({ ...caseForm, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CASE_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="case-opened">立案／開始日期</Label>
                <Input
                  id="case-opened"
                  type="date"
                  value={caseForm.openedAt}
                  onChange={(e) => setCaseForm({ ...caseForm, openedAt: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="case-closed">結案日期</Label>
                <Input
                  id="case-closed"
                  type="date"
                  value={caseForm.closedAt}
                  onChange={(e) => setCaseForm({ ...caseForm, closedAt: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="case-desc">備註</Label>
              <Textarea
                id="case-desc"
                rows={3}
                value={caseForm.description}
                onChange={(e) => setCaseForm({ ...caseForm, description: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCaseDialog(false)}>
                取消
              </Button>
              <Button type="submit">儲存</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
