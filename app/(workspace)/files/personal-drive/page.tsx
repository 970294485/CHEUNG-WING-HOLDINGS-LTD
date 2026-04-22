"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Upload, FolderPlus, Download, Share2, Trash2, FileText, Image as ImageIcon, FileArchive } from "lucide-react";
import type { FileDocumentRow, PersonalDriveCategoryOption } from "@/lib/server/files";
import {
  getPersonalDrivePagePayload,
  uploadPersonalFileDocument,
  createPersonalDriveFolder,
  updatePersonalFileDocumentCategory,
} from "@/lib/server/files";
import { DeleteFileForm } from "./delete-file-form";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function mimeKind(mime: string | null, name: string): string {
  const m = (mime || "").toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.includes("zip") || name.toLowerCase().endsWith(".zip")) return "archive";
  return "file";
}

export default function PersonalDrivePage() {
  const [files, setFiles] = useState<FileDocumentRow[]>([]);
  const [categories, setCategories] = useState<PersonalDriveCategoryOption[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [folderOpen, setFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderSaving, setFolderSaving] = useState(false);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadCategoryId, setUploadCategoryId] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [classifyOpen, setClassifyOpen] = useState(false);
  const [classifyFile, setClassifyFile] = useState<FileDocumentRow | null>(null);
  const [classifyCategoryId, setClassifyCategoryId] = useState("");
  const [classifySaving, setClassifySaving] = useState(false);

  const reload = useCallback(async () => {
    setLoadError(null);
    const res = await getPersonalDrivePagePayload();
    if (!res.ok) {
      const msg =
        res.reason === "not_logged_in"
          ? "請先登入"
          : res.reason === "no_permission"
            ? "無權限查看個人網盤"
            : "無法載入公司資料";
      setLoadError(msg);
      setFiles([]);
      setCategories([]);
      setCanManage(false);
      return;
    }
    setFiles(res.files);
    setCategories(res.categories);
    setCanManage(res.canManage);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getFileIcon = (mime: string | null, name: string) => {
    const t = mimeKind(mime, name);
    switch (t) {
      case "image":
        return <ImageIcon className="h-5 w-5 text-blue-500" />;
      case "archive":
        return <FileArchive className="h-5 w-5 text-yellow-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const openFolderDialog = () => {
    if (!canManage) {
      alert("需要「管理文件」權限（manage:files）才能新建文件夾。");
      return;
    }
    setFolderName("");
    setFolderOpen(true);
  };

  const openUploadDialog = () => {
    if (!canManage) {
      alert("需要「管理文件」權限（manage:files）才能上傳。");
      return;
    }
    setUploadCategoryId("");
    setUploadOpen(true);
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFolderSaving(true);
    try {
      const fd = new FormData();
      fd.set("name", folderName.trim());
      const r = await createPersonalDriveFolder(fd);
      if (!r.ok) {
        alert(r.error ?? "建立失敗");
        return;
      }
      setFolderOpen(false);
      setFolderName("");
      await reload();
    } finally {
      setFolderSaving(false);
    }
  };

  const openClassifyDialog = (file: FileDocumentRow) => {
    if (!canManage) {
      alert("需要「管理文件」權限（manage:files）才能更改分類或分享至公共庫。");
      return;
    }
    const cid = file.categoryId ?? "";
    const categoryStillListed = !cid || categories.some((c) => c.id === cid);
    setClassifyFile(file);
    setClassifyCategoryId(categoryStillListed ? cid : "");
    setClassifyOpen(true);
  };

  const handleClassifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classifyFile) return;
    setClassifySaving(true);
    try {
      const raw = classifyCategoryId.trim();
      const r = await updatePersonalFileDocumentCategory(classifyFile.id, raw ? raw : null);
      if (!r.ok) {
        alert(r.error ?? "更新失敗");
        return;
      }
      setClassifyOpen(false);
      setClassifyFile(null);
      await reload();
    } finally {
      setClassifySaving(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = fileInputRef.current;
    const file = input?.files?.[0];
    if (!file || file.size === 0) {
      alert("請選擇檔案");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (uploadCategoryId.trim()) {
        fd.set("categoryId", uploadCategoryId.trim());
      }
      const r = await uploadPersonalFileDocument(fd);
      if (!r.ok) {
        alert(r.error ?? "上傳失敗");
        return;
      }
      setUploadOpen(false);
      if (input) input.value = "";
      await reload();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">個人網盤</h1>
          <p className="text-muted-foreground">
            顯示您上傳至當前公司的檔案；上傳與新建文件夾需「管理文件」權限。個人文件夾僅用於個人網盤歸檔；若將檔案歸入公司的「公共」分類，檔案會出現在公共文件庫。
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={openFolderDialog}>
            <FolderPlus className="mr-2 h-4 w-4" /> 新建文件夾
          </Button>
          <Button type="button" onClick={openUploadDialog}>
            <Upload className="mr-2 h-4 w-4" /> 上傳文件
          </Button>
        </div>
      </div>

      {loadError ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          {loadError}
        </p>
      ) : null}

      <div className="flex items-center gap-4">
        <Input
          placeholder="搜索文件..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>文件名</TableHead>
              <TableHead>大小</TableHead>
              <TableHead>上傳時間</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFiles.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  {getFileIcon(file.mimeType, file.name)}
                  {file.name}
                </TableCell>
                <TableCell>{formatBytes(file.size)}</TableCell>
                <TableCell>{new Date(file.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  {file.isPublic ? (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
                      已分享
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-200">
                      私有
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" asChild title="下載">
                      <a href={`/api/files/${file.id}`} download={file.name}>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      title={canManage ? "歸類／分享至公共庫" : "需管理文件權限"}
                      disabled={!canManage}
                      onClick={() => openClassifyDialog(file)}
                    >
                      <Share2 className={`h-4 w-4 ${canManage ? "" : "opacity-40"}`} />
                    </Button>
                    {canManage ? (
                      <DeleteFileForm fileId={file.id} onDeleted={reload} />
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        disabled
                        title="無刪除權限（需 manage:files 或管理員）"
                      >
                        <Trash2 className="h-4 w-4 opacity-40" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredFiles.length === 0 && !loadError && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {files.length === 0 ? "尚無個人檔案，請點「上傳文件」新增。" : "沒有找到文件"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={folderOpen} onOpenChange={setFolderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新建文件夾</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateFolder} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">文件夾名稱</Label>
              <Input
                id="folder-name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="例如：工作資料"
                required
                maxLength={100}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFolderOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={folderSaving || !folderName.trim()}>
                {folderSaving ? "建立中…" : "建立"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={classifyOpen}
        onOpenChange={(open) => {
          setClassifyOpen(open);
          if (!open) setClassifyFile(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>歸類與分享</DialogTitle>
          </DialogHeader>
          {classifyFile ? (
            <form onSubmit={handleClassifySubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground break-all">
                檔案：<span className="font-medium text-foreground">{classifyFile.name}</span>
              </p>
              <div className="space-y-2">
                <Label htmlFor="classify-cat">歸入分類</Label>
                <select
                  id="classify-cat"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm dark:bg-zinc-950"
                  value={classifyCategoryId}
                  onChange={(e) => setClassifyCategoryId(e.target.value)}
                >
                  <option value="">未分類（私人，不進公共庫）</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.isPublic ? "（公共庫可見）" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  選擇標記為公共的公司分類後，檔案會出現在公共文件庫；改回未分類或私人分類則從公共庫隱去（仍保留在您的個人網盤列表）。
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setClassifyOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={classifySaving}>
                  {classifySaving ? "儲存中…" : "儲存"}
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>上傳文件</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label>檔案（最大 15 MB）</Label>
              <Input ref={fileInputRef} type="file" className="cursor-pointer" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upload-cat">歸入分類（選填）</Label>
              <select
                id="upload-cat"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm dark:bg-zinc-950"
                value={uploadCategoryId}
                onChange={(e) => setUploadCategoryId(e.target.value)}
              >
                <option value="">未分類（私人）</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.isPublic ? "（公共庫可見）" : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                選擇「公共」分類時，檔案會依規則出現在公共文件庫。
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? "上傳中…" : "上傳"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
