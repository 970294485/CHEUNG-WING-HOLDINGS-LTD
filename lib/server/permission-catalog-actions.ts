"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertOrganizationDirectoryAdmin } from "@/lib/rbac/organization-admin";

/** 新增或依 action+resource 更新說明（不影響已勾選到角色的關聯）。 */
export async function upsertPermissionCatalogAction(formData: FormData): Promise<void> {
  await assertOrganizationDirectoryAdmin();
  const action = String(formData.get("action") ?? "").trim();
  const resource = String(formData.get("resource") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!action || !resource) return;

  await prisma.permission.upsert({
    where: { action_resource: { action, resource } },
    create: { action, resource, description },
    update: { description },
  });
  revalidatePath("/data-entry/permissions");
  revalidatePath("/data-entry/role-permissions");
}

export async function updatePermissionDescriptionAction(formData: FormData): Promise<void> {
  await assertOrganizationDirectoryAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!id) return;

  await prisma.permission.update({
    where: { id },
    data: { description },
  });
  revalidatePath("/data-entry/permissions");
  revalidatePath("/data-entry/role-permissions");
}
