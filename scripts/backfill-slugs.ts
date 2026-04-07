import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Backfill Slugs ---');

  // 1. Backfill Emotions
  const emotions = await prisma.emotion.findMany();
  console.log(`Found ${emotions.length} emotions.`);

  for (const emotion of emotions) {
    const slug = emotion.name.toLowerCase().trim().replace(/\s+/g, '_');
    console.log(`Emotion: "${emotion.name}" -> slug: "${slug}"`);
    await prisma.emotion.update({
      where: { id: emotion.id },
      data: { slug }
    });
  }

  // 2. Backfill Tags
  const tags = await prisma.tag.findMany();
  console.log(`Found ${tags.length} tags.`);

  for (const tag of tags) {
    const slug = tag.name.toLowerCase().trim().replace(/\s+/g, '_');
    console.log(`Tag: "${tag.name}" -> slug: "${slug}"`);
    await prisma.tag.update({
      where: { id: tag.id },
      data: { slug }
    });
  }

  console.log('--- Backfill Completed ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
