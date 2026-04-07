import { prisma } from '../../config/database.js';

export async function getUserCredits(userId: bigint) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      credits: true,
      totalCreditsEarned: true
    }
  });

  if (!user) throw new Error("User not found");

  return user;
}

export async function getUserTransactions(userId: bigint) {
  return prisma.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      media: {
        select: {
          id: true,
          title: true,
          thumbnailUrl: true
        }
      }
    }
  });
}