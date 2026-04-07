import { prisma } from '../config/database.js';

const VIEW_MILESTONES = [
  { count: 100, credits: 2 },
  { count: 500, credits: 5 },
  { count: 1000, credits: 10 },
  { count: 10000, credits: 25 },
];

const LIKE_MILESTONES = [
  { count: 10, credits: 2 },
  { count: 50, credits: 5 },
  { count: 100, credits: 10 },
  { count: 500, credits: 25 },
];

// ✅ Generic credit giver (safe)
async function giveCredits({
  userId,
  amount,
  source,
  mediaId,
  description,
}: {
  userId: bigint;
  amount: number;
  source: any;
  mediaId?: bigint;
  description: string;
}) {
  await prisma.$transaction(async (tx) => {
    // 1. Check for existing transaction WITHIN the database transaction (prevents race condition)
    const existing = await tx.creditTransaction.findFirst({
      where: {
        userId,
        source,
        mediaId,
        description,
      },
    });

    if (existing) return;

    // 2. Create transaction record
    await tx.creditTransaction.create({
      data: {
        userId,
        amount,
        source,
        mediaId,
        description,
      },
    });

    // 3. Update user balance
    await tx.user.update({
      where: { id: userId },
      data: {
        credits: { increment: amount },
        totalCreditsEarned: { increment: amount },
      },
    });
  });
}

// 🎯 Approval reward
export async function rewardForApproval(mediaId: bigint) {
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: { submittedById: true },
  });

  if (!media?.submittedById) return;

  await giveCredits({
    userId: media.submittedById,
    amount: 10,
    source: 'SUBMISSION_APPROVED',
    mediaId,
    description: 'Media approved',
  });
}

// 👀 View milestone reward
export async function handleViewMilestones(mediaId: bigint) {
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: { views: true, submittedById: true },
  });

  if (!media?.submittedById) return;

  for (const milestone of VIEW_MILESTONES) {
    if (media.views >= milestone.count) {
      await giveCredits({
        userId: media.submittedById,
        amount: milestone.credits,
        source: 'MEDIA_VIEW_MILESTONE',
        mediaId,
        description: `Reached ${milestone.count} views`,
      });
    }
  }
}

// ❤️ Like milestone reward
export async function handleLikeMilestones(mediaId: bigint) {
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: { likes: true, submittedById: true },
  });

  if (!media?.submittedById) return;

  for (const milestone of LIKE_MILESTONES) {
    if (media.likes >= milestone.count) {
      await giveCredits({
        userId: media.submittedById,
        amount: milestone.credits,
        source: 'MEDIA_LIKE_MILESTONE',
        mediaId,
        description: `Reached ${milestone.count} likes`,
      });
    }
  }
}