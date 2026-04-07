// import { prisma } from '../../config/database.js';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';

// export async function registerUser({
//   email,
//   password
// }: {
//   email: string;
//   password: string;
// }) {

//   const existing = await prisma.user.findUnique({
//     where: { email }
//   });

//   if (existing) {
//     throw new Error("User already exists");
//   }

//   const hash = await bcrypt.hash(password, 10);

//   const user = await prisma.user.create({
//     data: {
//       email,
//       passwordHash: hash,
//       role: "SUPREMEADMIN"
//     }
//   });

//   return {
//     id: user.id.toString(),
//     email: user.email
//   };
// }

// export async function loginUser({
//   email,
//   password
// }: {
//   email: string;
//   password: string;
// }) {

//   const user = await prisma.user.findUnique({
//     where: { email }
//   });

//   if (!user) {
//     throw new Error("Invalid credentials");
//   }

//   const valid = await bcrypt.compare(password, user.passwordHash);

//   if (!valid) {
//     throw new Error("Invalid credentials");
//   }

//   const token = jwt.sign(
//     {
//       id: user.id.toString(),
//       role: user.role
//     },
//     process.env.JWT_SECRET!,
//     { expiresIn: "1d" }
//   );

//   return {
//     user: {
//       id: user.id.toString(),
//       email: user.email,
//       role: user.role
//     },
//     token
//   };
// }

import { prisma } from '../../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendTransactionalEmail } from '../../services/email.service.js';

function validatePassword(password: string) {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  if (!/[0-9]/.test(password)) {
    throw new Error('Password must contain at least one number');
  }
  if (!/[a-zA-Z]/.test(password)) {
    throw new Error('Password must contain at least one letter');
  }
}

export async function registerUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (existing) {
    throw new Error("User already exists");
  }

  validatePassword(password);
  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash: hash,
      role: "USER"
    }
  });

  return {
    id: user.id.toString(),
    email: user.email,
    role: user.role
  };
}

export async function loginUser({
  email,
  password
}: {
  email: string;
  password: string;
}) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    {
      id: user.id.toString(),
      role: user.role
    },
    process.env.JWT_SECRET!,
    { expiresIn: "1d" }
  );

  return {
    user: {
      id: user.id.toString(),
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified
    },
    token
  };
}

export async function getCurrentUser(userId: bigint) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      isEmailVerified: true,
      updatedAt: true,
    },
  });
  if (!user) throw new Error('User not found');
  return { ...user, id: user.id.toString() };
}

export async function updateOwnProfile(
  userId: bigint,
  data: { email?: string; password?: string }
) {
  const updateData: any = {};

  if (data.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing && existing.id !== userId) {
      throw new Error('Email already taken');
    }
    updateData.email = data.email;
    // 🛡️ SECURITY: Reset verification status on email change
    updateData.isEmailVerified = false;
    updateData.emailVerifiedAt = null;
  }

  if (data.password) {
    validatePassword(data.password);
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, email: true, role: true, updatedAt: true, isEmailVerified: true },
  });

  return { ...user, id: user.id.toString() };
}

// Add these at the bottom

export async function getUserLikes(userId: bigint) {
  return prisma.media.findMany({
    where: {
      likesList: {
        some: { userId },
      },
    },
    select: {
      id: true,
      title: true,
      thumbnailUrl: true,
      fileUrl: true,
      mediaType: true,
      createdAt: true,
      likes: true,
      views: true,
      status: true,           // mostly APPROVED, but include anyway
    },
    orderBy: { createdAt: 'desc' },
    take: 50,                 // pagination later if needed
  });
}

export async function getUserSubmissions(userId: bigint) {
  return prisma.media.findMany({
    where: {
      submittedById: userId,
    },
    select: {
      id: true,
      title: true,
      thumbnailUrl: true,
      fileUrl: true,
      mediaType: true,
      status: true,           // PENDING / APPROVED / REJECTED ← important
      createdAt: true,
      updatedAt: true,
      likes: true,
      views: true,
      isNsfw: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}


const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 15;

export async function sendVerificationOtp(userId: bigint) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerificationOtpExpiresAt: true },
  });

  if (!user) throw new Error("User not found");

  // 🛡️ ANTI-SPAM: 60s cooldown
  if (user.emailVerificationOtpExpiresAt) {
    const lastRequest = new Date(user.emailVerificationOtpExpiresAt.getTime() - OTP_EXPIRY_MINUTES * 60 * 1000);
    const diff = Date.now() - lastRequest.getTime();
    if (diff < 60000) {
      throw new Error(`Please wait ${Math.ceil((60000 - diff) / 1000)} seconds before requesting a new code.`);
    }
  }

  const email = user.email;

  // Generate OTP
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
    to: {
      email,
      name: email?.split('@')[0] ?? "User", // ✅ SAFE
    },
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


export async function requestPasswordReset(email: string) {
  // ✅ Normalize email (important)
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    // still don't reveal anything
    return { message: "If the email exists, a reset link has been sent." };
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // ✅ Always return same response (security)
  if (!user) {
    return { message: "If the email exists, a reset link has been sent." };
  }

  // 🛡️ ANTI-SPAM: 60s cooldown
  if (user.passwordResetTokenExpiresAt) {
    const lastRequest = new Date(user.passwordResetTokenExpiresAt.getTime() - 60 * 60 * 1000);
    if (Date.now() - lastRequest.getTime() < 60000) {
      return { message: "If the email exists, a reset link has been sent." };
    }
  }

  // ✅ Generate token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: token,
      passwordResetTokenExpiresAt: expiresAt,
    },
  });

  // ✅ Safe frontend URL fallback
  const baseUrl =
    process.env.FRONTENDDOMAIN?.replace(/\/$/, "") || "http://localhost:5173";

  const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

  const html = `
    <h2>Reset your MemeBox password</h2>
    <p>Click the link below to reset your password:</p>
    <a href="${resetUrl}" style="padding:12px 24px; background:#4f46e5; color:white; text-decoration:none; border-radius:6px;">
      Reset Password
    </a>
    <p>This link expires in 1 hour.</p>
    <p>If you didn't request this, ignore this email.</p>
  `;

  await sendTransactionalEmail({
    to: {
      email: normalizedEmail,
      name: normalizedEmail.split("@")[0] || "User", // ✅ SAFE
    },
    subject: "Reset your MemeBox password",
    htmlContent: html,
  });

  return { message: "If the email exists, a reset link has been sent." };
}

// ────────────────────────────────────────────────
// Password Reset – Step 2: Actually reset
// ────────────────────────────────────────────────

export async function resetPasswordWithToken({
  token,
  email,
  newPassword,
}: {
  token: string;
  email: string;
  newPassword: string;
}) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid or expired reset link");

  if (
    !user.passwordResetToken ||
    user.passwordResetToken !== token ||
    !user.passwordResetTokenExpiresAt ||
    new Date() > user.passwordResetTokenExpiresAt
  ) {
    throw new Error("Invalid or expired reset token");
  }

  validatePassword(newPassword);
  const hash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hash,
      passwordResetToken: null,
      passwordResetTokenExpiresAt: null,
    },
  });

  return { message: "Password reset successfully" };
}