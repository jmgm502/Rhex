import { UserRole } from "@/db/types"

export interface AdminRoleChangePolicyInput {
  actorId: number
  targetId: number
  targetRole: UserRole
  nextRole: UserRole
  actorIsFounder: boolean
}

export function getBlockedAdminRoleChangeMessage(input: AdminRoleChangePolicyInput) {
  if (input.actorId === input.targetId && input.nextRole !== UserRole.ADMIN) {
    return "不能把当前登录管理员移出管理员组"
  }

  if (
    input.targetRole === UserRole.ADMIN
    && input.nextRole !== UserRole.ADMIN
    && !input.actorIsFounder
  ) {
    return "不能降级管理员账号"
  }

  if (input.nextRole === UserRole.ADMIN && !input.actorIsFounder) {
    return "不能提升管理员账号"
  }

  return null
}
