export const workspaceSettingKeys = ["settings.items.locale"] as const;

export const securitySettingKeys = [
  "settings.items.autoLock",
  "settings.items.exportGuard",
  "settings.items.hideSecrets",
  "settings.items.auditRetention",
] as const;

export const preferenceSettingKeys = ["settings.items.theme"] as const;
