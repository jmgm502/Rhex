import type { JsonObject } from "@/lib/api-route"

import { createSiteSettingsRecordWithFullData, findSiteSettingsRecordForUpdate } from "@/db/site-settings-write-queries"
import {
  canAccessAdminSettingsSection,
  type AdminSettingsSectionKey,
} from "@/lib/admin-navigation"
import { updateBoardApplicationSiteSettingsSection } from "@/lib/admin-site-settings-board-applications"
import { defaultSiteSettingsCreateInput } from "@/lib/site-settings-defaults"
import { updateInteractionSiteSettingsSection } from "@/lib/admin-site-settings-interaction"
import { updateMessageSiteSettingsSection } from "@/lib/admin-site-settings-messages"
import { updateProfileSiteSettingsSection } from "@/lib/admin-site-settings-profile"
import { updateRegistrationSiteSettingsSection } from "@/lib/admin-site-settings-registration"
import { updateUploadSiteSettingsSection } from "@/lib/admin-site-settings-upload"
import { updateVipSiteSettingsSection } from "@/lib/admin-site-settings-vip"
import { apiError, readOptionalStringField } from "@/lib/api-route"
import type { AdminManagementTier, AdminPermissionKey } from "@/lib/admin-permission-policy"

export async function getOrCreateSiteSettings() {
  const existing = await findSiteSettingsRecordForUpdate()
  if (existing) {
    return existing
  }

  return createSiteSettingsRecordWithFullData(defaultSiteSettingsCreateInput)
}

const siteSettingsSectionMap: Record<string, AdminSettingsSectionKey> = {
  "site-profile": "profile",
  "site-apps": "apps",
  "site-markdown-emoji": "markdown-emoji",
  "site-footer-links": "footer-links",
  "site-editor-toolbar": "editor-toolbar",
  "site-registration": "registration",
  "board-applications": "board-applications",
  interaction: "interaction",
  messages: "messages",
  vip: "vip",
  upload: "upload",
}

function resolveAdminSettingsSectionForMutation(section: string) {
  return siteSettingsSectionMap[section] ?? null
}

export async function updateSiteSettingsBySection(
  body: JsonObject,
  options?: {
    adminTier?: AdminManagementTier
    effectivePermissions?: ReadonlySet<AdminPermissionKey>
  },
) {
  const section = readOptionalStringField(body, "section") || "site-profile"
  const adminSettingsSection = resolveAdminSettingsSectionForMutation(section)
  if (options?.adminTier && (!adminSettingsSection || !canAccessAdminSettingsSection(options.adminTier, adminSettingsSection, options.effectivePermissions))) {
    apiError(403, "无权修改该设置分组")
  }

  const existing = await getOrCreateSiteSettings()

  const handlers = [
    updateProfileSiteSettingsSection,
    updateRegistrationSiteSettingsSection,
    updateBoardApplicationSiteSettingsSection,
    updateInteractionSiteSettingsSection,
    updateMessageSiteSettingsSection,
    updateVipSiteSettingsSection,
    updateUploadSiteSettingsSection,
  ]

  for (const handler of handlers) {
    const result = await handler(existing, body, section)
    if (result) {
      return result
    }
  }

  apiError(400, "不支持的设置分组")
}
