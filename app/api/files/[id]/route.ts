import { readFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { getSession } from "@/lib/auth/session";
import { canReadFiles } from "@/lib/rbac/files-access";
import { fileDocumentDiskPath } from "@/lib/files/storage";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getSession();
  if (!session?.sub) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!canReadFiles(session.isSuperAdmin === true, session.permissions ?? [])) {
    return new Response("Forbidden", { status: 403 });
  }
  const companyId = await getDefaultCompanyId();
  if (!companyId) {
    return new Response("Forbidden", { status: 403 });
  }

  const doc = await prisma.fileDocument.findFirst({
    where: { id, companyId },
  });
  if (!doc) {
    return new Response("Not found", { status: 404 });
  }
  if (!doc.isPublic && doc.ownerId !== session.sub) {
    return new Response("Forbidden", { status: 403 });
  }

  let body: Buffer;
  try {
    body = await readFile(fileDocumentDiskPath(companyId, id));
  } catch {
    return new Response("File missing", { status: 404 });
  }

  const headers = new Headers();
  headers.set("Content-Type", doc.mimeType || "application/octet-stream");
  headers.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(doc.name)}`);
  return new Response(new Uint8Array(body), { status: 200, headers });
}
