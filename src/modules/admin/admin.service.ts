import { prisma } from "../../config/database";

/**
 * Get all media
 */
export async function getAllMedia() {
  return prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      tags: { include: { tag: true } },
      emotions: { include: { emotion: true } }
    }
  });
}

/**
 * Delete media
 */
export async function deleteMedia(id: bigint) {

  await prisma.mediaAnalytic.deleteMany({
    where: { mediaId: id }
  });

  await prisma.mediaTag.deleteMany({
    where: { mediaId: id }
  });

  await prisma.mediaEmotion.deleteMany({
    where: { mediaId: id }
  });

  return prisma.media.delete({
    where: { id }
  });
}


export async function updateMedia(
  id: bigint,
  data: {
    title?: string;
    description?: string;
    isNsfw?: boolean;
    categoryId?: string;
    width?: number;
    height?: number;
    fileSize?: number;
    duration?: number;
  }
) {
  // Convert categoryId string → BigInt if provided
  const updateData: any = { ...data };

  if (data.categoryId !== undefined) {
    updateData.categoryId = data.categoryId ? BigInt(data.categoryId) : null;
  }

  // Optional: prevent updating computed/generated fields if you want
  // delete updateData.imagekitFileId;  // example - don't allow changing storage ID

  return prisma.media.update({
    where: { id },
    data: updateData,
    include: {
      category: true,
      tags: { include: { tag: true } },
      emotions: { include: { emotion: true } }
    } // ← nice to see relations in response
  });
}