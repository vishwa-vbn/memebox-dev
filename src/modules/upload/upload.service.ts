// import { prisma } from "../../config/database.js";
// import { uploadToImageKit } from "../../services/imagekit.service.js";
// import sharp from "sharp";
// import { Prisma } from "@prisma/client";
// import { syncMediaTags, syncMediaEmotions } from "../../utils/media-relations.js";

// export async function uploadAndCreateMedia(
//   file: any,
//   data: {
//     title?: string;
//     description?: string;
//     mediaType: string;
//     tags?: string[];
//     emotions?: string[];
//     categoryId?: string;
//   }
// ) {
//   let width: number | null = null;
//   let height: number | null = null;

//   // Extract metadata using sharp
//   try {
//     const metadata = await sharp(file.buffer).metadata();
//     width = metadata.width ?? null;
//     height = metadata.height ?? null;
//   } catch {
//     console.warn("Sharp metadata extraction failed");
//   }

//   // Upload file to ImageKit
//   const { fileId, url, thumbnailUrl } = await uploadToImageKit(
//     file,
//     file.originalname
//   );

//   // 1. Define the base object
//   const createData: Prisma.MediaUncheckedCreateInput = {
//     imagekitFileId: fileId,
//     title: data.title ?? null,
//     description: data.description ?? null,
//     mediaType: data.mediaType as any,
//     fileUrl: url,
//     thumbnailUrl: thumbnailUrl ?? null,
//     previewUrl: url,
//     width: width,
//     height: height,
//     fileSize: file.size,
//     categoryId: data.categoryId ? BigInt(data.categoryId) : null,
//   };

//   const media = await prisma.media.create({
//     data: createData
//   });

//   // Handle relations using utility
//   if (data.tags) await syncMediaTags(media.id, data.tags);
//   if (data.emotions) await syncMediaEmotions(media.id, data.emotions);

//   // Clean API response
//   return {
//     id: media.id.toString(),
//     title: media.title,
//     type: media.mediaType,
//     url: media.fileUrl,
//     thumbnail: media.thumbnailUrl,
//     views: media.views,
//     createdAt: media.createdAt
//   };
// }

import { prisma } from "../../config/database.js";
import { uploadToImageKit, deleteFromImageKit } from "../../services/imagekit.service.js";
import sharp from "sharp";
import { Prisma } from "@prisma/client";
import { syncMediaTags, syncMediaEmotions } from "../../utils/media-relations.js";

export async function uploadAndCreateMedia(
  file: any,
  data: {
    title?: string;
    description?: string;
    mediaType: string;
    tags?: string[];
    emotions?: string[];
    categoryId?: string;


  },
  user: { id: string; role: string }
) {
  // 🛡️ SECURITY: Enforce email verification for non-admins
  if (user.role !== "SUPREMEADMIN") {
    const dbUser = await prisma.user.findUnique({
      where: { id: BigInt(user.id) },
      select: { isEmailVerified: true },
    });
    if (!dbUser?.isEmailVerified) {
      throw new Error("Please verify your email before uploading media.");
    }
  }

  let width: number | null = null;
  let height: number | null = null;

  // Extract metadata
  try {
    const metadata = await sharp(file.buffer).metadata();
    width = metadata.width ?? null;
    height = metadata.height ?? null;
  } catch {
    console.warn("Sharp metadata extraction failed");
  }

  const { fileId, url, thumbnailUrl } = await uploadToImageKit(
    file,
    file.originalname
  );

  try {
    // Determine media status
    const status = user.role === "SUPREMEADMIN"
      ? "APPROVED"
      : "PENDING";

    const createData: Prisma.MediaUncheckedCreateInput = {
      imagekitFileId: fileId,
      title: data.title ?? null,
      description: data.description ?? null,
      mediaType: data.mediaType as any,
      fileUrl: url,
      thumbnailUrl: thumbnailUrl ?? null,
      previewUrl: url,
      width: width,
      height: height,
      fileSize: file.size,
      categoryId: data.categoryId ? BigInt(data.categoryId) : null,

      submittedById: BigInt(user.id),
      status: status as any,


    };

    const media = await prisma.$transaction(async (tx) => {
      const media = await tx.media.create({
        data: createData,
      });

      // Sync relations within transaction
      if (data.tags) await syncMediaTags(media.id, data.tags, tx);
      if (data.emotions) await syncMediaEmotions(media.id, data.emotions, tx);

      return media;
    },
  {
    timeout: 20000,
  });

    return {
      id: media.id.toString(),
      title: media.title,
      type: media.mediaType,
      url: media.fileUrl,
      thumbnail: media.thumbnailUrl,
      status: media.status,
      views: media.views,
      createdAt: media.createdAt
    };
  } catch (error) {
    // 🛡️ CRITICAL: Cleanup ImageKit if DB fails to prevent orphaned files
    console.error("Database error during upload, cleaning up ImageKit file:", fileId);
    await deleteFromImageKit(fileId);
    throw error;
  }
}
