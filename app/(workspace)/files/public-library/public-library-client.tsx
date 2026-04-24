"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Image as ImageIcon, FileArchive, User, CloudDownload } from "lucide-react";
import type { FileDocumentRow, PersonalDriveCategoryOption } from "@/lib/server/files";
import { copyPublicFileToPersonalDrive } from "@/lib/server/files";

type Row = FileDocumentRow & { ownerName: string | null; inPersonalDrive: boolean };

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

export default function PublicLibraryClient({
  initialFiles,
  errorMessage,
  canManage = false,
  personalCategories = [],
}: {
  initialFiles: Row[];
  errorMessage?: string | null;
  canManage?: boolean;
  personalCategories?: PersonalDriveCategoryOption[];
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyTarget, setCopyTarget] = useState<Row | null>(null);
  const [copyCategoryId, setCopyCategoryId] = useState("");
  const [copySaving, setCopySaving] = useState(false);

  const filteredFiles = initialFiles.filter((f) => {
    const q = searchTerm.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      (f.categoryName && f.categoryName.toLowerCase().includes(q))
    );
  });

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">公共文件數據庫</h1>
          <p className="text-muted-foreground">
            僅顯示當前公司已分享到公共庫的檔案（分類標記為「公共」且檔案已歸入該分類）；其他公司的檔案不會出現在此列表。
            「個人網盤」列表示您已將該公共檔保存副本至自己的個人網盤。
            {canManage
              ? " 具「管理文件」權限時，可將公共檔案複製到自己的個人網盤（不會改動公共庫中的原檔）。"
              : null}
          </p>
        </div>
      </div>

      {errorMessage ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex items-center gap-4">
        <Input
          placeholder="搜索文件名或分類..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>文件名</TableHead>
              <TableHead>分類</TableHead>
              <TableHead>大小</TableHead>
              <TableHead>分享者</TableHead>
              <TableHead>分享時間</TableHead>
              <TableHead>個人網盤</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFiles.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="flex items-center gap-2 font-medium">
                  {getFileIcon(file.mimeType, file.name)}
                  {file.name}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{file.categoryName ?? "—"}</TableCell>
                <TableCell>{formatBytes(file.size)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    {file.ownerName || "—"}
                  </div>
                </TableCell>
                <TableCell>{new Date(file.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  {file.inPersonalDrive ? (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-100">
                      已在個人網盤
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" asChild title="下載">
                      <a href={`/api/files/${file.id}`} download={file.name}>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      title={canManage ? "存到個人網盤" : "需管理文件權限（manage:files）"}
                      disabled={!canManage}
                      onClick={() => {
                        if (!canManage) return;
                        setCopyTarget(file);
                        setCopyCategoryId("");
                        setCopyOpen(true);
                      }}
                    >
                      <CloudDownload className={`h-4 w-4 ${canManage ? "" : "opacity-40"}`} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredFiles.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  {initialFiles.length === 0 ? "尚無公共檔案。" : "沒有找到文件"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={copyOpen}
        onOpenChange={(open) => {
          setCopyOpen(open);
          if (!open) setCopyTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>存到個人網盤</DialogTitle>
          </DialogHeader>
          {copyTarget ? (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setCopySaving(true);
                try {
                  const raw = copyCategoryId.trim();
                  const r = await copyPublicFileToPersonalDrive(copyTarget.id, raw ? raw : null);
                  if (!r.ok) {
                    alert(r.error ?? "複製失敗");
                    return;
                  }
                  setCopyOpen(false);
                  setCopyTarget(null);
                  router.refresh();
                  alert("已複製到個人網盤，可在「個人網盤」頁查看。");
                } finally {
                  setCopySaving(false);
                }
              }}
            >
              <p className="text-sm text-muted-foreground break-all">
                將為您建立一份副本，公共庫中的原檔不變。檔案：
                <span className="font-medium text-foreground">{copyTarget.name}</span>
              </p>
              <div className="space-y-2">
                <Label htmlFor="copy-to-pd-cat">歸入分類（選填）</Label>
                <select
                  id="copy-to-pd-cat"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm dark:bg-zinc-950"
                  value={copyCategoryId}
                  onChange={(e) => setCopyCategoryId(e.target.value)}
                >
                  <option value="">未分類（私人）</option>
                  {personalCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.isPublic ? "（公共庫可見）" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  若選「公共」分類，副本也會出現在公共庫；多數情況建議保持未分類或選個人文件夾。
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCopyOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={copySaving}>
                  {copySaving ? "複製中…" : "確認複製"}
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
