"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteFileDocument } from "@/lib/server/files";

export function DeleteFileForm({
  fileId,
  onDeleted,
}: {
  fileId: string;
  onDeleted?: () => void | Promise<void>;
}) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!confirm("確定刪除此檔案？")) return;
    const fd = new FormData(e.currentTarget);
    try {
      await deleteFileDocument(fd);
      await onDeleted?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "刪除失敗";
      alert(msg);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={fileId} />
      <Button variant="ghost" size="icon" type="submit" className="text-red-500" title="刪除">
        <Trash2 className="h-4 w-4" />
      </Button>
    </form>
  );
}
