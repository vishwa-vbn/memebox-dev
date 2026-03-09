import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './media.service.js';

export async function getTrending(req: FastifyRequest, reply: FastifyReply) {
  const trending = await service.getTrendingMedia();
  reply.send(trending);
}

export async function getMediaById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const media = await service.getMediaById(BigInt(req.params.id));
  await service.recordAnalytic(media.id, 'VIEW'); // Analytics
  reply.send(media);
}

export async function getByCategory(req: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) {
  const media = await service.getMediaByCategory(req.params.slug);
  reply.send(media);
}

export async function likeMedia(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const media = await service.likeMedia(BigInt(req.params.id));
  reply.send(media);
}


export async function trackDownload(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const media = await service.getMediaById(BigInt(req.params.id));
  await service.recordAnalytic(media.id, 'DOWNLOAD');
  
  // Option A: simple redirect (most common)
  reply.redirect(media.fileUrl);
  
  // Option B: if you want to proxy/stream → use reply.sendFile or stream later
}