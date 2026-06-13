import { apiSuccess, createAdminRouteHandler, readJsonBody } from "@/lib/api-route"
import { getOrCreateSiteSettings, updateSiteSettingsBySection } from "@/lib/admin-site-settings-service"
import { revalidateAdminMutationPaths } from "@/lib/admin-action-types"
import { resolveAdminPermissionState } from "@/lib/admin-permission-overrides"

export const GET = createAdminRouteHandler(async () => {
  const settings = await getOrCreateSiteSettings()
  return apiSuccess(settings)
}, {
  errorMessage: "读取站点设置失败",
  logPrefix: "[api/admin/site-settings:GET] unexpected error",
  unauthorizedMessage: "无权访问",
})

export const POST = createAdminRouteHandler(async ({ request, adminUser }) => {
  const body = await readJsonBody(request)
  const permissionState = await resolveAdminPermissionState(adminUser)
  const result = await updateSiteSettingsBySection(body, {
    adminTier: permissionState.tier,
    effectivePermissions: new Set(permissionState.effectivePermissions),
  })

  if (result.revalidatePaths?.length) {
    revalidateAdminMutationPaths(result.revalidatePaths)
  }

  return apiSuccess(result.settings, result.message)
}, {
  errorMessage: "保存站点设置失败",
  logPrefix: "[api/admin/site-settings:POST] unexpected error",
  unauthorizedMessage: "无权操作",
  permission: "admin.operations.manage",
})
