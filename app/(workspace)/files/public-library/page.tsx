"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Image as ImageIcon, FileArchive, User } from "lucide-react";

// 模擬數據
const initialFiles = [
  { id: "1", name: "公司員工手冊_2026版.pdf", type: "pdf", size: "5.2 MB", date: "2026-01-10", uploader: "HR 部門" },
  { id: "2", name: "產品設計圖紙.zip", type: "archive", size: "15.8 MB", date: "2026-03-18", uploader: "張三 (設計部)" },
  { id: "3", name: "標準報價單模板.xlsx", type: "excel", size: "1.1 MB", date: "2026-02-05", uploader: "李四 (銷售部)" },
  { id: "4", name: "公司Logo_高清.png", type: "image", size: "3.5 MB", date: "2026-03-10", uploader: "王五 (市場部)" },
];

export default function PublicLibraryPage() {
  const [files, setFiles] = useState(initialFiles);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image": return <ImageIcon className="h-5 w-5 text-blue-500" />;
      case "archive": return <FileArchive className="h-5 w-5 text-yellow-500" />;
      default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">公共數據庫</h1>
          <p className="text-muted-foreground">查看和下載公司內部共享的文件與資料。</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Input 
          placeholder="搜索公共文件..." 
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
              <TableHead>分享者</TableHead>
              <TableHead>分享時間</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFiles.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  {getFileIcon(file.type)}
                  {file.name}
                </TableCell>
                <TableCell>{file.size}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    {file.uploader}
                  </div>
                </TableCell>
                <TableCell>{file.date}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" title="下載">
                    <Download className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredFiles.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  沒有找到文件
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
