import type { DecryptedVaultCredential } from "@/features/vault/types";

export type ExportRecord = {
  service: string;
  url: string;
  username: string;
  password: string;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string;
};

function formatRecord(record: DecryptedVaultCredential): ExportRecord {
  return {
    service: record.serviceName,
    url: record.serviceUrl ?? "",
    username: record.username,
    password: record.password,
    notes: record.notes,
    tags: record.tags,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    lastUsedAt: record.lastUsedAt ?? "",
  };
}

export function buildJsonExport(credentials: DecryptedVaultCredential[]) {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      credentials: credentials.map(formatRecord),
    },
    null,
    2,
  );
}

function escapeCsv(value: string) {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function buildCsvExport(credentials: DecryptedVaultCredential[]) {
  const header = [
    "service",
    "url",
    "username",
    "password",
    "notes",
    "tags",
    "createdAt",
    "updatedAt",
    "lastUsedAt",
  ].join(",");

  const rows = credentials.map((record) => {
    const item = formatRecord(record);
    return [
      item.service,
      item.url,
      item.username,
      item.password,
      item.notes,
      item.tags.join("; "),
      item.createdAt,
      item.updatedAt,
      item.lastUsedAt,
    ]
      .map((value) => escapeCsv(value))
      .join(",");
  });

  return [header, ...rows].join("\n");
}

export function downloadExportFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
