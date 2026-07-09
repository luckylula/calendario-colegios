import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isFolderIdConfigured, normalizeFolderId } from "@/lib/folder-id";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as {
    googleDriveFolderId?: string;
    onedriveFolderId?: string;
    googleDriveOutputFolderId?: string | null;
  };

  const colegio = await prisma.colegio.findUnique({ where: { id } });
  if (!colegio) {
    return NextResponse.json({ error: "Colegi no trobat" }, { status: 404 });
  }

  const googleDriveFolderId = body.googleDriveFolderId
    ? normalizeFolderId(body.googleDriveFolderId)
    : colegio.googleDriveFolderId;
  const onedriveFolderId = body.onedriveFolderId
    ? normalizeFolderId(body.onedriveFolderId)
    : colegio.onedriveFolderId;
  const googleDriveOutputFolderId =
    body.googleDriveOutputFolderId === null || body.googleDriveOutputFolderId === ""
      ? null
      : body.googleDriveOutputFolderId
        ? normalizeFolderId(body.googleDriveOutputFolderId)
        : colegio.googleDriveOutputFolderId;

  if (!isFolderIdConfigured(googleDriveFolderId) || !isFolderIdConfigured(onedriveFolderId)) {
    return NextResponse.json(
      { error: "Els IDs de Google Drive i OneDrive són obligatoris" },
      { status: 400 }
    );
  }

  const updated = await prisma.colegio.update({
    where: { id },
    data: {
      googleDriveFolderId,
      onedriveFolderId,
      googleDriveOutputFolderId,
    },
  });

  return NextResponse.json(updated);
}
