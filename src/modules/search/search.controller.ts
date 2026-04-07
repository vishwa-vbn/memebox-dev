import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from '../../services/search.service.js';

interface SearchQuerystring {
  q?: string;
  emotion?: string;
  category?: string;
  tag?: string;        // comma-separated: "funny,cat,painter"
  mediaType?: string;  // "GIF" | "STICKER" | "MEME"
  page?: string;
  limit?: string;
  nsfw?: string;       // "true" | "false"
}

// Normalize: trim + convert empty string to undefined
function normalize(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v === '' ? undefined : v;
}

export async function search(
  req: FastifyRequest<{ Querystring: SearchQuerystring }>,
  reply: FastifyReply
) {
  try {
    const {
      q,
      emotion,
      category,
      tag,
      mediaType,
      page: pageStr,
      limit: limitStr,
      nsfw: nsfwStr
    } = req.query;

    // --- Normalize all string filters (empty string → undefined) ---
    const normQ        = normalize(q);
    const normEmotion  = normalize(emotion);
    const normCategory = normalize(category);
    const normType     = normalize(mediaType)?.toUpperCase();

    // --- Parse comma-separated tags, drop empty entries ---
    const tags = tag
      ? tag.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    // --- Parse pagination ---
    const page  = Math.max(1,   parseInt(pageStr  ?? '1',  10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitStr ?? '20', 10) || 20));

    // --- Parse nsfw flag ---
    const nsfw = nsfwStr === 'true';

    // --- Validate mediaType if provided ---
    if (normType && !['GIF', 'STICKER', 'MEME'].includes(normType)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: `Invalid mediaType "${normType}". Allowed values: GIF, STICKER, MEME`
      });
    }

    const user = (req as any).user;

    // No filter = browse-all mode (returns all non-NSFW media ordered by views)
    const results = await service.searchMedia({
      q:         normQ,
      emotion:   normEmotion,
      category:  normCategory,
      tags,
      mediaType: normType,
      nsfw,
      page,
      limit
    }, user);

    return reply.status(200).send(results);
  } catch (err: any) {
    req.log.error({ err }, 'Search controller error');
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing your search.'
    });
  }
}