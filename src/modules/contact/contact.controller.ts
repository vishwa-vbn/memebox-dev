import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './contact.service.js';

// CREATE
export async function createContact(
  req: FastifyRequest<{
    Body: {
      name: string;
      email: string;
      subject: string;
      message: string;
    }
  }>,
  reply: FastifyReply
) {
  const contact = await service.createContact(req.user?.id, req.body);
  reply.code(201).send(contact);
}

// GET ALL
export async function getAllContacts(req: FastifyRequest, reply: FastifyReply) {
  const contacts = await service.getContacts();
  reply.send(contacts);
}

// GET BY ID
export async function getContactById(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const contact = await service.getContactById(req.params.id);
  reply.send(contact);
}

// UPDATE STATUS
export async function updateContactStatus(
  req: FastifyRequest<{
    Params: { id: string };
    Body: { status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' };
  }>,
  reply: FastifyReply
) {
  const updated = await service.updateContactStatus(
    req.params.id,
    req.body.status
  );
  reply.send(updated);
}

// UPDATE NOTE
export async function updateContactNote(
  req: FastifyRequest<{
    Params: { id: string };
    Body: { adminNote: string };
  }>,
  reply: FastifyReply
) {
  const updated = await service.updateContactNote(
    req.params.id,
    req.body.adminNote
  );
  reply.send(updated);
}