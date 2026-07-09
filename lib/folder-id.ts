/**
 * Extrae el ID de carpeta de una URL de Google Drive o OneDrive,
 * o devuelve el valor tal cual si ya es un ID.
 */
export function normalizeFolderId(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  // Google Drive: .../folders/ID o ...?id=ID
  const driveFolders = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (driveFolders) return driveFolders[1];

  const driveId = trimmed.match(/[?&]id=([a-zA-Z0-9!_-]+)/);
  if (driveId && trimmed.includes("drive.google")) return driveId[1];

  // OneDrive / SharePoint: ...?id=... o resid=...
  const oneDriveId = trimmed.match(/[?&]id=([^&]+)/);
  if (oneDriveId && (trimmed.includes("onedrive") || trimmed.includes("sharepoint"))) {
    return decodeURIComponent(oneDriveId[1]);
  }

  const resid = trimmed.match(/resid=([^&]+)/);
  if (resid) return decodeURIComponent(resid[1]);

  return trimmed;
}

export function isFolderIdConfigured(value: string): boolean {
  const id = normalizeFolderId(value);
  return id.length > 0 && !id.startsWith("PENDIENTE");
}
