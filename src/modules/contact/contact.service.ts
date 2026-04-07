import { prisma } from '../../config/database.js';

// CREATE
export async function createContact(
  userId: string | undefined,
  data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }
) {
  return prisma.contact.create({
    data: {
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      userId: userId ? BigInt(userId) : null,
    },
  });
}

// GET ALL
export async function getContacts() {
  return prisma.contact.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

// GET BY ID
export async function getContactById(id: string) {
  return prisma.contact.findUnique({
    where: { id: BigInt(id) },
  });
}

// UPDATE STATUS
export async function updateContactStatus(
  id: string,
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
) {
  return prisma.contact.update({
    where: { id: BigInt(id) },
    data: { status },
  });
}

// UPDATE NOTE
export async function updateContactNote(id: string, adminNote: string) {
  return prisma.contact.update({
    where: { id: BigInt(id) },
    data: { adminNote },
  });
}