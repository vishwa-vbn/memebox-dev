import { prisma } from '../../config/database.js';

export async function getAllEmotions() {
  return prisma.emotion.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      emoji: true
    }
  });
}

export async function getEmotionSuggestions(query: string, limit: number) {
  return prisma.emotion.findMany({
    where: {
      name: {
        contains: query
      }
    },
    orderBy: { name: 'asc' },
    take: limit,
    select: {
      name: true,
      emoji: true
    }
  });
}

export async function createEmotion(data: { name: string; emoji?: string }) {

  const existing = await prisma.emotion.findFirst({
    where: { name: data.name }
  });

  if (existing) {
    throw new Error("Emotion already exists");
  }

  return prisma.emotion.create({
    data: {
      name: data.name,
      emoji: data.emoji
    }
  });
}

export async function updateEmotion(
  id: bigint,
  data: { name?: string; emoji?: string }
) {
  return prisma.emotion.update({
    where: { id },
    data
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