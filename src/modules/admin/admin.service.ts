
import { prisma } from "../../config/database.js";
import bcrypt from 'bcryptjs'
import { syncMediaTags, syncMediaEmotions } from "../../utils/media-relations.js";
import {deleteFromImageKit} from '../../services/imagekit.service.js'
import {rewardForApproval } from '../../services/credit-engine.service.js'
import crypto from 'crypto';
import { sendTransactionalEmail } from '../../services/email.service.js';


/**
 * Get all media (with pagination)
 */
export async function getAllMedia(options: { take?: number; skip?: number } = {}) {
  const { take = 20, skip = 0 } = options;

  const [data, total] = await prisma.$transaction([
    prisma.media.findMany({
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        submittedBy: {
          select: { id: true, email: true },
        },
        tags: { include: { tag: true } },
        emotions: { include: { emotion: true } },
      },
    }),
    prisma.media.count(),
  ]);

  return { data, total };
}

/**
 * Get pending submissions (with pagination)
 */
export async function getPendingMedia(options: { take?: number; skip?: number } = {}) {
  const { take = 20, skip = 0 } = options;

  const [data, total] = await prisma.$transaction([
    prisma.media.findMany({
      take,
      skip,
      where: {
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        submittedBy: {
          select: { id: true, email: true },
        },
        category: true,
        tags: { include: { tag: true } },
        emotions: { include: { emotion: true } },
      },
    }),
    prisma.media.count({ where: { status: 'PENDING' } }),
  ]);

  return { data, total };
}

/**
 * Approve media
 */
// export async function approveMedia(id: bigint) {
//   return prisma.media.update({
//     where: { id },
//     data: {
//       status: "APPROVED"
//     }
//   });

//    await rewardForApproval(id);
// }

export async function approveMedia(id: bigint) {
  const media = await prisma.media.update({
    where: { id },
    data: { status: "APPROVED" }
  });

  // 🎯 Give credits
  await rewardForApproval(id);

  return media;
}

/**
 * Reject media
 */
export async function rejectMedia(id: bigint) {
  return prisma.media.update({
    where: { id },
    data: {
      status: "REJECTED"
    }
  });
}

export async function deleteMedia(id: bigint) {
  // Use transaction to ensure all cleanup happens or none
  return prisma.$transaction(async (tx) => {
    // 1️⃣ Fetch media first (within transaction to ensure it still exists)
    const media = await tx.media.findUnique({
      where: { id },
      select: { imagekitFileId: true },
    });

    if (!media) {
      throw new Error("Media not found");
    }

    // 2️⃣ Delete relational data
    await tx.mediaAnalytic.deleteMany({ where: { mediaId: id } });
    await tx.mediaLike.deleteMany({ where: { mediaId: id } });
    await tx.mediaTag.deleteMany({ where: { mediaId: id } });
    await tx.mediaEmotion.deleteMany({ where: { mediaId: id } });
    await tx.creditTransaction.deleteMany({ where: { mediaId: id } });

    // 3️⃣ Delete media record
    await tx.media.delete({ where: { id } });

    // 4️⃣ Delete file from ImageKit (external, so we do it last)
    if (media.imagekitFileId) {
      try {
        await deleteFromImageKit(media.imagekitFileId);
      } catch (err) {
        console.error("ImageKit deletion failed:", err);
      }
    }

    return { success: true };
  });
}

/**
 * Update media metadata
 */
export async function updateMedia(
  id: bigint,
  data: {
    title?: string;
    description?: string;
    isNsfw?: boolean;
    categoryId?: string;
    width?: number;
    height?: number;
    fileSize?: number;
    duration?: number;



    tags?: string[];
    emotions?: string[];
  }
) {
  return prisma.$transaction(async (tx) => {
    const updateData: any = { ...data };

    delete updateData.tags;
    delete updateData.emotions;

    if (data.categoryId !== undefined) {
      updateData.categoryId = data.categoryId
        ? BigInt(data.categoryId)
        : null;
    }

    await tx.media.update({
      where: { id },
      data: updateData,
    });

    if (data.tags) await syncMediaTags(id, data.tags, tx);
    if (data.emotions) await syncMediaEmotions(id, data.emotions, tx);

    return tx.media.findUniqueOrThrow({
      where: { id },
      include: {
        category: true,
        submittedBy: {
          select: { id: true, email: true },
        },
        tags: { include: { tag: true } },
        emotions: { include: { emotion: true } },
      },
    });
  });
}


export async function getAllUsers(options: { take?: number; skip?: number } = {}) {
  const { take = 20, skip = 0 } = options;

  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            submissions: true,
            likes: true,
          },
        },
      },
    }),
    prisma.user.count(),
  ]);

  return { data, total };
}

export async function getUserById(id: bigint) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      submissions: { select: { id: true, title: true } },
      likes: { select: { mediaId: true } },
    },
  });
  if (!user) throw new Error('User not found');
  return { ...user, id: user.id.toString() };
}

export async function updateUser(
  id: bigint,
  data: { email?: string; password?: string; role?: 'USER' | 'SUPREMEADMIN' }
) {
  const updateData: any = {};

  if (data.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing && existing.id !== id) throw new Error('Email already taken');
    updateData.email = data.email;
  }

  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }

  if (data.role === 'USER') {
    const userToUpdate = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (userToUpdate?.role === 'SUPREMEADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'SUPREMEADMIN' } });
      if (adminCount <= 1) {
        throw new Error('Cannot demote the last administrator.');
      }
    }
    updateData.role = data.role;
  } else if (data.role) {
    updateData.role = data.role;
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, email: true, role: true, updatedAt: true },
  });

  return { ...user, id: user.id.toString() };
}

export async function deleteUser(id: bigint) {
  // 🛡️ SECURITY: Prevent deleting the last admin
  const userToDelete = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (userToDelete?.role === 'SUPREMEADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'SUPREMEADMIN' } });
    if (adminCount <= 1) {
      throw new Error('Cannot delete the last administrator.');
    }
  }

  return prisma.$transaction(async (tx) => {
    // 1. Clean relations
    await tx.mediaLike.deleteMany({ where: { userId: id } });
    await tx.creditTransaction.deleteMany({ where: { userId: id } });
    await tx.contact.deleteMany({ where: { userId: id } });

    // 2. Orphan media submissions (don't delete user-uploaded media)
    await tx.media.updateMany({
      where: { submittedById: id },
      data: { submittedById: null },
    });

    // 3. Delete user
    await tx.user.delete({ where: { id } });

    return { success: true };
  });
}


const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 15;

export async function sendVerificationOtp(userId: bigint, email: string) {
  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();

  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationOtp: otp,
      emailVerificationOtpExpiresAt: expiresAt,
    },
  });

  const html = `
    <h2>Welcome to MemeBox!</h2>
    <p>Use this code to verify your email:</p>
    <h1 style="letter-spacing: 8px; font-size: 36px;">${otp}</h1>
    <p>This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;

  await sendTransactionalEmail({
    to: { email, name: email.split('@')[0] },
    subject: "Verify your MemeBox account",
    htmlContent: html,
  });

  return { message: "OTP sent", expiresIn: OTP_EXPIRY_MINUTES * 60 };
}

export async function verifyOtp(userId: bigint, otp: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      emailVerificationOtp: true,
      emailVerificationOtpExpiresAt: true,
    },
  });

  if (!user) throw new Error("User not found");

  if (!user.emailVerificationOtp || !user.emailVerificationOtpExpiresAt) {
    throw new Error("No OTP request found. Please request a new one.");
  }

  if (new Date() > user.emailVerificationOtpExpiresAt) {
    throw new Error("OTP has expired. Please request a new one.");
  }

  if (user.emailVerificationOtp !== otp) {
    throw new Error("Invalid OTP");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationOtp: null,
      emailVerificationOtpExpiresAt: null,
    },
  });

  return { message: "Email verified successfully" };
}


export async function getUserProfileForAdmin(id: bigint) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      role: true,
      credits: true,
      totalCreditsEarned: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          submissions: true,
          likes: true,
          views: true,
        },
      },
    },
  });

  if (!user) throw new Error('User not found');

  return {
    ...user,
    id: user.id.toString(),
  };
}

export async function getUserSubmissions(userId: bigint) {
  return prisma.media.findMany({
    where: { submittedById: userId },
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
      tags: { include: { tag: true } },
      emotions: { include: { emotion: true } },
    },
  });
}

export async function getUserLikes(userId: bigint) {
  return prisma.mediaLike.findMany({
    where: { userId },
    include: {
      media: {
        include: {
          category: true,
          submittedBy: { select: { id: true, email: true } },
        },
      },
    },
    orderBy: { id: 'desc' },
  });
}

export async function getUserCreditTransactions(userId: bigint) {
  return prisma.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      media: { select: { id: true, title: true } },
    },
  });
}