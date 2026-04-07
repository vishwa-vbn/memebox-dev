import { prisma } from "../config/database.js";

/**
 * Sync tags for a media item.
 * Creates tags if they don't exist and links them to the media.
 * Removes links to tags that are no longer present.
 */

export async function syncMediaTags(
  mediaId: bigint,
  tags: (string | { name: string; slug: string })[],
  client: any = prisma
) {
  const normalized = tags
    .map((t) => {
      if (typeof t === "string") {
        const name = t.trim();
        return {
          name,
          slug: name.toLowerCase().replace(/\s+/g, "_"),
        };
      }
      return {
        name: t.name.trim(),
        slug: t.slug.trim().toLowerCase().replace(/\s+/g, "_"),
      };
    })
    .filter((t) => t.name && t.slug);

  if (!normalized.length) return;

  // 1. Create missing tags (bulk)
  await Promise.all(
    normalized.map((tag) =>
      client.tag.upsert({
        where: { slug: tag.slug },
        update: { name: tag.name }, // Update name if slug matches (case correction etc)
        create: {
          name: tag.name,
          slug: tag.slug,
        },
      })
    )
  );

  // 2. Get all tag IDs
  const tagSlugs = normalized.map((t) => t.slug);
  const foundTags = await client.tag.findMany({
    where: { slug: { in: tagSlugs } },
    select: { id: true },
  });

  const tagIds = foundTags.map((t: any) => t.id);

  // 3. Get existing relations
  const existing = await client.mediaTag.findMany({
    where: { mediaId },
    select: { tagId: true },
  });

  const existingIds = existing.map((e: any) => e.tagId);

  const tagsToAdd = tagIds.filter((id: bigint) => !existingIds.includes(id));
  const tagsToRemove = existingIds.filter((id: bigint) => !tagIds.includes(id));

  // 4. Remove old relations (bulk)
  if (tagsToRemove.length) {
    await client.mediaTag.deleteMany({
      where: {
        mediaId,
        tagId: { in: tagsToRemove },
      },
    });

    await client.tag.updateMany({
      where: { id: { in: tagsToRemove } },
      data: { usageCount: { decrement: 1 } },
    });
  }

  // 5. Add new relations (bulk ✅ FIX)
  if (tagsToAdd.length) {
    await client.mediaTag.createMany({
      data: tagsToAdd.map((tagId: bigint) => ({
        mediaId,
        tagId,
      })),
      skipDuplicates: true,
    });

    await client.tag.updateMany({
      where: { id: { in: tagsToAdd } },
      data: { usageCount: { increment: 1 } },
    });
  }
}

/**
 * Sync emotions for a media item.
 * Creates emotions if they don't exist and links them to the media.
 */
export async function syncMediaEmotions(
  mediaId: bigint,
  emotions: (string | { name: string; slug: string })[],
  client: any = prisma
) {
  const normalized = emotions
    .map((e) => {
      if (typeof e === "string") {
        const name = e.trim();
        return {
          name,
          slug: name.toLowerCase().replace(/\s+/g, "_"),
        };
      }
      return {
        name: e.name.trim(),
        slug: e.slug.trim().toLowerCase().replace(/\s+/g, "_"),
      };
    })
    .filter((e) => e.name && e.slug);

  if (!normalized.length) return;

  // 1. Upsert emotions
  await Promise.all(
    normalized.map((emotion) =>
      client.emotion.upsert({
        where: { slug: emotion.slug },
        update: { name: emotion.name },
        create: {
          name: emotion.name,
          slug: emotion.slug,
        },
      })
    )
  );

  // 2. Get IDs
  const slugs = normalized.map((e) => e.slug);
  const foundEmotions = await client.emotion.findMany({
    where: { slug: { in: slugs } },
    select: { id: true },
  });

  const emotionIds = foundEmotions.map((e: any) => e.id);

  // 3. Existing
  const existing = await client.mediaEmotion.findMany({
    where: { mediaId },
    select: { emotionId: true },
  });

  const existingIds = existing.map((e: any) => e.emotionId);

  const toAdd = emotionIds.filter((id: bigint) => !existingIds.includes(id));
  const toRemove = existingIds.filter((id: bigint) => !emotionIds.includes(id));

  // 4. Remove
  if (toRemove.length) {
    await client.mediaEmotion.deleteMany({
      where: {
        mediaId,
        emotionId: { in: toRemove },
      },
    });
  }

  // 5. Add (bulk ✅)
  if (toAdd.length) {
    await client.mediaEmotion.createMany({
      data: toAdd.map((emotionId: bigint) => ({
        mediaId,
        emotionId,
      })),
      skipDuplicates: true,
    });
  }
}
