import { prisma } from "../../config/database";
import { uploadToImageKit } from "../../services/imagekit.service";
import sharp from "sharp";
import { Prisma } from "@prisma/client";

export async function uploadAndCreateMedia(
  file: any,
  data: {
    title?: string;
    description?: string;
    mediaType: string;
    tags?: string[];
    emotions?: string[];
    categoryId?: string;
  }
) {
  let width: number | null = null;
  let height: number | null = null;

  // Extract metadata using sharp
  try {
    const metadata = await sharp(file.buffer).metadata();
    width = metadata.width ?? null;
    height = metadata.height ?? null;
  } catch {
    console.warn("Sharp metadata extraction failed");
  }

  // Upload file to ImageKit
  const { fileId, url, thumbnailUrl } = await uploadToImageKit(
    file,
    file.originalname
  );

  // Create base data object
  const createData: Prisma.MediaUncheckedCreateInput = {
    imagekitFileId: fileId,
    title: data.title ?? null,
    description: data.description ?? null,
    mediaType: data.mediaType as any,
    fileUrl: url,
    thumbnailUrl: thumbnailUrl ?? null,
    previewUrl: url,
    width,
    height,
    fileSize: file.size
  };

  // Only attach categoryId if provided
  if (data.categoryId) {
    (createData as any).categoryId = BigInt(data.categoryId);
  }

  // Create media
  const media = await prisma.media.create({
    data: createData
  });

  // Handle relations
  await handleTags(media.id, data.tags);
  await handleEmotions(media.id, data.emotions);

  // Clean API response
  return {
    id: media.id.toString(),
    title: media.title,
    type: media.mediaType,
    url: media.fileUrl,
    thumbnail: media.thumbnailUrl,
    views: media.views,
    createdAt: media.createdAt
  };
}

async function handleTags(mediaId: bigint, tags?: string[]) {
  if (!tags || tags.length === 0) return;

  for (const rawName of tags) {
    const name = rawName.trim().toLowerCase();

    let tag = await prisma.tag.findUnique({
      where: { name }
    });

    if (!tag) {
      tag = await prisma.tag.create({
        data: {
          name,
          slug: name
        }
      });
    }

    await prisma.mediaTag.create({
      data: {
        mediaId,
        tagId: tag.id
      }
    });

    await prisma.tag.update({
      where: { id: tag.id },
      data: {
        usageCount: {
          increment: 1
        }
      }
    });
  }
}

async function handleEmotions(mediaId: bigint, emotions?: string[]) {
  if (!emotions || emotions.length === 0) return;

  for (const rawName of emotions) {
    const name = rawName.trim().toLowerCase();

    let emotion = await prisma.emotion.findFirst({
      where: { name }
    });

    if (!emotion) {
      emotion = await prisma.emotion.create({
        data: { name }
      });
    }

    await prisma.mediaEmotion.create({
      data: {
        mediaId,
        emotionId: emotion.id
      }
    });
  }
}