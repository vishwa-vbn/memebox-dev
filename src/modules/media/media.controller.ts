import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './media.service.js';

export async function getTrending(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const trending = await service.getTrendingMedia();
  reply.send(trending);
}

export async function getMediaById(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const mediaId = BigInt(req.params.id);

  // Fetch media
  const media = await service.getMediaById(mediaId);

  // Extract user + device info
  const userId = req.user?.id ? BigInt(req.user.id) : null;

  const ipInfo = (req as any).ipInfo || {
    ip: 'unknown',
    fingerprint: 'unknown',
  };

  // ✅ CORRECT: call service (NOT define function here)
  await service.incrementViewIfNew(
    mediaId,
    userId,
    ipInfo.ip,
    ipInfo.fingerprint
  );

  // Analytics (no view increment inside)
  await service.recordAnalytic(media.id, 'VIEW');

  reply.send(media);
}

export async function getByCategory(
  req: FastifyRequest<{ Params: { slug: string } }>,
  reply: FastifyReply
) {
  const media = await service.getMediaByCategory(req.params.slug);
  reply.send(media);
}

export async function likeMedia(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const media = await service.likeMedia(
    BigInt(req.params.id),
    BigInt(req.user.id)
  );

  reply.send(media);
}

export async function trackDownload(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const media = await service.getMediaById(BigInt(req.params.id));

  await service.recordAnalytic(media.id, 'DOWNLOAD');

  reply.redirect(media.fileUrl);
}

export async function getSimilar(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const mediaId = BigInt(req.params.id);

  const similar = await service.getSimilarMedia(mediaId);

  reply.send(similar);
}