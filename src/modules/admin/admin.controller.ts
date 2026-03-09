import type { FastifyRequest, FastifyReply } from "fastify";
import * as service from "./admin.service";

/**
 * Get all media uploaded
 */
export async function getAllMedia(req: FastifyRequest, reply: FastifyReply) {
  const media = await service.getAllMedia();
  reply.send(media);
}

/**
 * Delete media
 */
export async function deleteMedia(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  await service.deleteMedia(BigInt(req.params.id));
  reply.send({ success: true });
}

/**
 * Update media metadata
 */
export async function updateMedia(
  req: FastifyRequest<{
    Params: { id: string };
    Body: {
      title?: string;
      description?: string;
      isNsfw?: boolean;
      categoryId?: string;          // we'll convert to BigInt
      // Optional: if you want admins to override these (normally set on upload)
      width?: number;
      height?: number;
      fileSize?: number;
      duration?: number;
    };
  }>,
  reply: FastifyReply
) {
  const media = await service.updateMedia(
    BigInt(req.params.id),
    req.body
  );
  reply.send(media);
}