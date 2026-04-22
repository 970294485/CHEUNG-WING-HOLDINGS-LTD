import PublicLibraryClient from "./public-library-client";
import { listPublicFileDocuments } from "@/lib/server/files";

export default async function PublicLibraryPage() {
  try {
    const initialFiles = await listPublicFileDocuments();
    return <PublicLibraryClient initialFiles={initialFiles} />;
  } catch {
    return (
      <PublicLibraryClient
        initialFiles={[]}
        errorMessage="無法載入公共檔案（請確認已登入且具有查看文件權限）。"
      />
    );
  }
}
