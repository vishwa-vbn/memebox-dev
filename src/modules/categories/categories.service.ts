import { prisma } from '../../config/database.js';

export async function getAllCategories() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
      createdAt: true,
      _count: { select: { media: true } }
    }
  });
}

export async function createCategory(data: { name: string; slug?: string; description?: string; icon?: string }) {
  const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) throw new Error('Slug already exists');

  return prisma.category.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      icon: data.icon
    }
  });
}

export async function updateCategory(id: bigint, data: { name?: string; slug?: string; description?: string; icon?: string }) {
  return prisma.category.update({
    where: { id },
    data
  });
}

export async function deleteCategory(id: bigint) {
  // Optional: check if has media → decide to prevent or cascade
  const hasMedia = await prisma.media.count({ where: { categoryId: id } });
  if (hasMedia > 0) throw new Error('Cannot delete category with attached media');

  return prisma.category.delete({ where: { id } });
}