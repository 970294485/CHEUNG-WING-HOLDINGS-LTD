import path from "path";

export function uploadsRootDir() {
  return path.join(process.cwd(), "storage", "uploads");
}

export function fileDocumentDiskPath(companyId: string, fileId: string) {
  return path.join(uploadsRootDir(), companyId, fileId);
}
