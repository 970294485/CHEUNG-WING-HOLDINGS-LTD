"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Image as ImageIcon, FileArchive, User } from "lucide-react";
import type { FileDocumentRow } from "@/lib/server/files";

type Row = FileDocumentRow & { ownerName: string | null };

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
}: {
  initialFiles: Row[];
  errorMessage?: string | null;
}) {
  const [searchTerm, setSearchTerm] = useState("");

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
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" asChild title="下載">
                    <a href={`/api/files/${file.id}`} download={file.name}>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredFiles.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  {initialFiles.length === 0 ? "尚無公共檔案。" : "沒有找到文件"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
