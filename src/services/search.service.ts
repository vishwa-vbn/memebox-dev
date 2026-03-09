import { prisma } from '../config/database.js';

export async function searchMedia(query: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const media = await prisma.media.findMany({
    where: {
      OR: [
        {
          title: {
            contains: query
          }
        },
        {
          tags: {
            some: {
              tag: {
                name: {
                  contains: query
                }
              }
            }
          }
        }
      ],
      isNsfw: false
    },
    include: {
      category: true,
      tags: {
        include: {
          tag: true
        }
      },
      emotions: {
        include: {
          emotion: true
        }
      }
    },
    orderBy: {
      views: 'desc'
    },
    skip: skip,
    take: limit
  });

  const total = await prisma.media.count({
    where: {
      OR: [
        {
          title: {
            contains: query
          }
        },
        {
          tags: {
            some: {
              tag: {
                name: {
                  contains: query
                }
              }
            }
          }
        }
      ],
      isNsfw: false
    }
  });

  return {
    media,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}