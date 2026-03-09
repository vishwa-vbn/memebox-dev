import { prisma } from '../../config/database';

export async function getPopularTags(take = 50) {
  return prisma.tag.findMany({
    orderBy: { usageCount: 'desc' },
    take,
    select: { id: true, name: true, slug: true, usageCount: true }
  });
}

export async function getTagSuggestions(query: string, limit: number) {
  return prisma.tag.findMany({
    where: {
      name: { contains: query } // case-insensitive depends on DB collation
    },
    orderBy: { usageCount: 'desc' },
    take: limit,
    select: { name: true, usageCount: true }
  });
}


export async function createTag(data: { name: string; slug?: string }) {
  const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-');
  return prisma.tag.create({ data: { name: data.name, slug } });
}

export async function updateTag(id: bigint, data: { name?: string; slug?: string }) {
  return prisma.tag.update({ where: { id }, data });
}

export async function deleteTag(id: bigint) {
  return prisma.tag.delete({ where: { id } });
}