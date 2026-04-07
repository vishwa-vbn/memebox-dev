import { prisma } from '../../config/database.js';

export async function getPopularTags(take = 100) {
  return prisma.tag.findMany({
    orderBy: { usageCount: 'desc' },
    take,
    select: { id: true, name: true, slug: true, usageCount: true }
  });
}

export async function getTagSuggestions(query: string, limit: number) {
  return prisma.tag.findMany({
    where: {
      OR: [{ name: { contains: query } }, { slug: { contains: query } }],
    },
    orderBy: { usageCount: "desc" },
    take: limit,
    select: { name: true, slug: true, usageCount: true },
  });
}

export async function createTag(data: { name: string; slug?: string }) {
  const slug =
    data.slug || data.name.toLowerCase().trim().replace(/\s+/g, "_");
  return prisma.tag.create({ data: { name: data.name, slug } });
}

export async function updateTag(id: bigint, data: { name?: string; slug?: string }) {
  return prisma.tag.update({ where: { id }, data });
}

export async function deleteTag(id: bigint) {
  return prisma.tag.delete({ where: { id } });
}