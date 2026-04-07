import { prisma } from '../../config/database.js';

export async function getAllEmotions() {
  return prisma.emotion.findMany({
    orderBy: { name: "asc" },
    take: 100, // 🛡️ SAFETY LIMIT
    select: {
      id: true,
      name: true,
      slug: true,
      emoji: true,
    },
  });
}

export async function getEmotionSuggestions(query: string, limit: number) {
  return prisma.emotion.findMany({
    where: {
      OR: [{ name: { contains: query } }, { slug: { contains: query } }],
    },
    orderBy: { name: "asc" },
    take: limit,
    select: {
      name: true,
      slug: true,
      emoji: true,
    },
  });
}

export async function createEmotion(data: {
  name: string;
  slug?: string;
  emoji?: string;
}) {
  const slug =
    data.slug || data.name.toLowerCase().trim().replace(/\s+/g, "_");

  const existing = await prisma.emotion.findFirst({
    where: { OR: [{ name: data.name }, { slug }] },
  });

  if (existing) {
    throw new Error("Emotion with same name or slug already exists");
  }

  return prisma.emotion.create({
    data: {
      name: data.name,
      slug,
      emoji: data.emoji,
    },
  });
}

export async function updateEmotion(
  id: bigint,
  data: { name?: string; slug?: string; emoji?: string }
) {
  return prisma.emotion.update({
    where: { id },
    data,
  });
}

export async function deleteEmotion(id: bigint) {

  const used = await prisma.mediaEmotion.count({
    where: { emotionId: id }
  });

  if (used > 0) {
    throw new Error("Cannot delete emotion attached to media");
  }

  return prisma.emotion.delete({
    where: { id }
  });
}