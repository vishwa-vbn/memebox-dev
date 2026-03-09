import { prisma } from '../../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function registerUser({
  email,
  password
}: {
  email: string;
  password: string;
}) {

  const existing = await prisma.user.findUnique({
    where: { email }
  });

  if (existing) {
    throw new Error("User already exists");
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hash,
      role: "SUPREMEADMIN"
    }
  });

  return {
    id: user.id.toString(),
    email: user.email
  };
}

export async function loginUser({
  email,
  password
}: {
  email: string;
  password: string;
}) {

  const user = await prisma.user.findUnique({
    where: { email }
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
      role: user.role
    },
    token
  };
}