import { prisma } from '../../config/database.js';
import { handleViewMilestones } from '../../services/credit-engine.service.js';
import { handleLikeMilestones } from '../../services/credit-engine.service.js';

export async function getTrendingMedia() {
  return prisma.media.findMany({
    where: { isNsfw: false, status: "APPROVED" },
    orderBy: [{ views: 'desc' }, { downloads: 'desc' }],
    take: 20,
    include: {
      category: true,
      tags: { include: { tag: true } },
      emotions: { include: { emotion: true } }
    }
  });
}

// export async function likeMedia(mediaId: bigint, userId: bigint) {
//   const existing = await prisma.mediaLike.findUnique({
//     where: {
//       mediaId_userId: { mediaId, userId }
//     }
//   });

//   if (existing) {
//     await prisma.mediaLike.delete({
//       where: { id: existing.id }
//     });

//     return prisma.media.update({
//       where: { id: mediaId },
//       data: { likes: { decrement: 1 } }
//     });
//   }

//   await prisma.mediaLike.create({
//     data: { mediaId, userId }
//   });

//   return prisma.media.update({
//     where: { id: mediaId },
//     data: { likes: { increment: 1 } }
//   });

//   await handleLikeMilestones(mediaId);
  
// }


export async function likeMedia(mediaId: bigint, userId: bigint) {
  const existing = await prisma.mediaLike.findUnique({
    where: {
      mediaId_userId: { mediaId, userId }
    }
  });

  // ❌ UNLIKE (no credits logic here)
  if (existing) {
    await prisma.mediaLike.delete({
      where: { id: existing.id }
    });

    return prisma.media.update({
      where: { id: mediaId },
      data: { likes: { decrement: 1 } }
    });
  }

  // ✅ LIKE
  await prisma.mediaLike.create({
    data: { mediaId, userId }
  });

  const updatedMedia = await prisma.media.update({
    where: { id: mediaId },
    data: { likes: { increment: 1 } }
  });

  // 🎯 Trigger milestone AFTER increment
  await handleLikeMilestones(mediaId);

  return updatedMedia;
}


export async function getMediaById(id: bigint) {
  return prisma.media.findFirstOrThrow({
    where: { id, status: "APPROVED" },
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
    where: {
      categoryId: category.id,
      isNsfw: false,
      status: "APPROVED"
    },
    take: 100, // 🛡️ SAFETY LIMIT
    include: {
      category: true,
      tags: { include: { tag: true } },
      emotions: { include: { emotion: true } }
    }
  });
}

// ✅ Analytics (NO view increment here)
export async function recordAnalytic(
  mediaId: bigint,
  type: 'VIEW' | 'DOWNLOAD' | 'SHARE'
) {
  await prisma.mediaAnalytic.create({
    data: { mediaId, eventType: type }
  });

  if (type === 'DOWNLOAD') {
    await prisma.media.update({
      where: { id: mediaId },
      data: { downloads: { increment: 1 } }
    });
  }

  if (type === 'SHARE') {
    await prisma.media.update({
      where: { id: mediaId },
      data: { shares: { increment: 1 } }
    });
  }
}

// ✅ FINAL VIEW LOGIC (correct, atomic)
export async function incrementViewIfNew(
  mediaId: bigint,
  userId: bigint | null,
  ip: string,
  fingerprint: string
) {
  try {
    await prisma.mediaView.create({
      data: {
        mediaId,
        userId: userId ?? null,
        ipAddress: ip,
        fingerprint,
      },
    });

    await prisma.media.update({
      where: { id: mediaId },
      data: { views: { increment: 1 } },
      
    });

    await handleViewMilestones(mediaId);

    return { incremented: true };

  } catch (err: any) {
    if (err.code === 'P2002') {
      return {
        incremented: false,
        reason: 'already viewed',
      };
    }

    console.error('View increment failed:', err);

    return {
      incremented: false,
      error: err.message,
    };
  }
}


export async function getSimilarMedia(mediaId: bigint) {
  // 1. Get current media
  const current = await prisma.media.findUnique({
    where: { id: mediaId },
    include: {
      tags: true,
      emotions: true
    }
  });

  if (!current) {
    throw new Error('Media not found');
  }

  const tagIds = current.tags.map(t => t.tagId);
  const emotionIds = current.emotions.map(e => e.emotionId);

  // 2. Fetch candidate media
  const candidates = await prisma.media.findMany({
    where: {
      id: { not: mediaId },
      status: "APPROVED",
      isNsfw: false,
      OR: [
        { categoryId: current.categoryId },
        { tags: { some: { tagId: { in: tagIds } } } },
        { emotions: { some: { emotionId: { in: emotionIds } } } }
      ]
    },
    take: 100, // pool size
    include: {
      category: true,
      tags: { include: { tag: true } },
      emotions: { include: { emotion: true } }
    }
  });

  // 3. Ranking logic
  const ranked = candidates
    .map(m => {
      let score = 0;

      // Category match (strong)
      if (m.categoryId === current.categoryId) score += 5;

      // Tag matches (very strong)
      const tagMatches = m.tags.filter(t => tagIds.includes(t.tagId)).length;
      score += tagMatches * 3;

      // Emotion matches (medium)
      const emotionMatches = m.emotions.filter(e =>
        emotionIds.includes(e.emotionId)
      ).length;
      score += emotionMatches * 2;

      return { ...m, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 20); // final result

  return ranked;
}