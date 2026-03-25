"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Search, Folder, Globe, Lock } from "lucide-react";
import { getFileCategories, createFileCategory, updateFileCategory, deleteFileCategory } from "@/app/actions/file-categories";

interface FileCategory {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  isPublic: boolean;
  createdAt: Date;
  _count?: {
    files: number;
    children: number;
  };
}

export default function FileCategoriesClient() {
  const [categories, setCategories] = useState<FileCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FileCategory | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: false,
  });

  // TODO: Get real companyId from auth context
  const companyId = "cm7g83z1e000008l4hj123456"; // Mock companyId for now

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await getFileCategories(companyId);
      if (res.success && res.data) {
        setCategories(res.data as any);
      }
    } catch (error) {
      console.error("Failed to fetch file categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenDialog = (category?: FileCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || "",
        isPublic: category.isPublic,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        description: "",
        isPublic: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        const res = await updateFileCategory(editingCategory.id, formData);
        if (res.success) {
          setIsDialogOpen(false);
          fetchCategories();
        } else {
          alert(res.message || "Failed to update category");
        }
      } else {
        const res = await createFileCategory({
          companyId,
          ...formData,
        });
        if (res.success) {
          setIsDialogOpen(false);
          fetchCategories();
        } else {
          alert(res.message || "Failed to create category");
        }
      }
    } catch (error) {
      console.error("Error saving category:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除此分類嗎？")) return;

    try {
      const res = await deleteFileCategory(id);
      if (res.success) {
        fetchCategories();
      } else {
        alert(res.message || "Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">文件分類</h1>
          <p className="text-muted-foreground">管理系統中的文件與資料夾分類，支援公共與私人權限設定。</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> 新增分類
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋分類名稱或描述..."
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
              <TableHead>分類名稱</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>權限</TableHead>
              <TableHead>子項目</TableHead>
              <TableHead>建立時間</TableHead>
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
            ) : filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  找不到文件分類
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Folder className="mr-2 h-4 w-4 text-blue-500" />
                      {category.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{category.description || "-"}</TableCell>
                  <TableCell>
                    {category.isPublic ? (
                      <span className="flex items-center text-green-600 text-sm">
                        <Globe className="mr-1 h-3 w-3" /> 公共
                      </span>
                    ) : (
                      <span className="flex items-center text-amber-600 text-sm">
                        <Lock className="mr-1 h-3 w-3" /> 私人
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {category._count?.children || 0} 個子分類, {category._count?.files || 0} 個文件
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(category.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(category)} title="編輯分類">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)} title="刪除分類">
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
            <DialogTitle>{editingCategory ? "編輯文件分類" : "新增文件分類"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4 items-center">
              <Label htmlFor="name" className="text-right">名稱 <span className="text-red-500">*</span></Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="例如: 財務報表"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 items-start">
              <Label htmlFor="description" className="text-right mt-2">描述</Label>
              <div className="col-span-3">
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="分類的詳細說明..."
                  rows={3}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 items-center">
              <Label className="text-right">權限</Label>
              <div className="col-span-3 flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isPublic"
                    checked={!formData.isPublic}
                    onChange={() => setFormData({ ...formData, isPublic: false })}
                    className="form-radio"
                  />
                  <span className="flex items-center text-sm"><Lock className="mr-1 h-3 w-3" /> 私人 (僅限自己與授權者)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={() => setFormData({ ...formData, isPublic: true })}
                    className="form-radio"
                  />
                  <span className="flex items-center text-sm"><Globe className="mr-1 h-3 w-3" /> 公共 (全公司可見)</span>
                </label>
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
