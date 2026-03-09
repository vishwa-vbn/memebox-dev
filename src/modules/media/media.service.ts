import { prisma } from '../../config/database.js';

export async function getTrendingMedia() {
  return prisma.media.findMany({
    where: { isNsfw: false }, // Basic filter; remove if no NSFW needed
    orderBy: [{ views: 'desc' }, { downloads: 'desc' }],
    take: 20,
    include: {
      category: true,
      tags: { include: { tag: true } },
      emotions: { include: { emotion: true } }
    }
  });
}

export async function likeMedia(id: bigint) {
  return prisma.media.update({
    where: { id },
    data: { likes: { increment: 1 } }
  });
}

export async function getMediaById(id: bigint) {
  return prisma.media.findUniqueOrThrow({ 
    where: { id },
    include: {
      category: true,
      tags: { include: { tag: true } },
      emotions: { include: { emotion: true } }
    }
  });
}

export async function getMediaByCategory(slug: string) {
  const category = await prisma.category.findFirst({ where: { slug } });
  if (!category) throw new Error('Category not found');
  return prisma.media.findMany({ 
    where: { categoryId: category.id, isNsfw: false }, // Basic filter
    include: {
      category: true,
      tags: { include: { tag: true } },
      emotions: { include: { emotion: true } }
    }
  });
}

export async function recordAnalytic(mediaId: bigint, type: 'VIEW' | 'DOWNLOAD' | 'SHARE') {
  await prisma.mediaAnalytic.create({ data: { mediaId, eventType: type } });
  // Update counts
  if (type === 'VIEW') await prisma.media.update({ where: { id: mediaId }, data: { views: { increment: 1 } } });
  if (type === 'DOWNLOAD') await prisma.media.update({ where: { id: mediaId }, data: { downloads: { increment: 1 } } });
  if (type === 'SHARE') await prisma.media.update({ where: { id: mediaId }, data: { shares: { increment: 1 } } });
}