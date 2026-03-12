import { prisma } from '../config/database.js';
import { Prisma, MediaType } from '@prisma/client';

export interface SearchParams {
  q?: string;          // free-text (undefined = not applied)
  emotion?: string;    // exact emotion name (undefined = not applied)
  category?: string;   // exact category name (undefined = not applied)
  tags?: string[];     // each tag must match (AND logic)
  mediaType?: string;  // "GIF" | "STICKER" | "MEME"
  nsfw?: boolean;      // include NSFW content (default: false)
  page: number;
  limit: number;
}

/**
 * Build strict WHERE clause.
 *
 * Rules:
 *  - q        → OR across title / description / tag-name  (contains, partial match)
 *  - emotion  → emotion.name equals (exact, case-insensitive via MySQL collation)
 *  - category → category.name equals (exact)
 *  - tags     → every tag in the array must appear on the media (AND)
 *  - mediaType→ exact enum match
 *  - nsfw     → always exclude NSFW unless caller explicitly opts in
 *
 *  Only non-undefined, non-empty values contribute to the WHERE clause.
 *  An undefined filter is simply not added → never silently matches everything.
 */
function buildWhere(params: SearchParams): Prisma.MediaWhereInput {
  const { q, emotion, category, tags, mediaType, nsfw } = params;

  const AND: Prisma.MediaWhereInput[] = [];

  // ── 1. Free-text query ────────────────────────────────────────────────────
  // Only applied when q is a non-empty string (controller already normalizes).
  // Uses `contains` (SQL LIKE '%…%') across title, description, and tag names.
  if (q) {
    AND.push({
      OR: [
        { title:       { contains: q } },
        { description: { contains: q } },
        {
          tags: {
            some: {
              tag: { name: { contains: q } }
            }
          }
        }
      ]
    });
  }

  // ── 2. Emotion filter ─────────────────────────────────────────────────────
  // Strict: the media must have an emotion whose name EQUALS the requested value.
  // `equals` prevents "lol" matching "lolipop".
  // MySQL utf8mb4_general_ci makes this case-insensitive automatically.
  if (emotion) {
    AND.push({
      emotions: {
        some: {
          emotion: {
            name: { equals: emotion }
          }
        }
      }
    });
  }

  // ── 3. Category filter ────────────────────────────────────────────────────
  // Strict exact match on category name.
  if (category) {
    AND.push({
      category: {
        name: { equals: category }
      }
    });
  }

  // ── 4. Tags filter (AND: media must have ALL listed tags) ─────────────────
  // Each tag adds its own AND condition → result must satisfy all tags.
  // Strict `equals` prevents "cat" matching "catfish".
  if (tags && tags.length > 0) {
    for (const tagName of tags) {
      AND.push({
        tags: {
          some: {
            tag: {
              name: { equals: tagName }
            }
          }
        }
      });
    }
  }

  // ── 5. MediaType filter ───────────────────────────────────────────────────
  if (mediaType && ['GIF', 'STICKER', 'MEME'].includes(mediaType)) {
    AND.push({ mediaType: mediaType as MediaType });
  }

  // ── 6. NSFW guard ─────────────────────────────────────────────────────────
  // Always applied. Only skipped when caller explicitly passes nsfw=true.
  if (!nsfw) {
    AND.push({ isNsfw: false });
  }

  return { AND };
}

// Clean, frontend-friendly response shape
function formatMedia(media: any) {
  return {
    id:           media.id.toString(),
    title:        media.title        ?? null,
    description:  media.description  ?? null,
    mediaType:    media.mediaType,
    fileUrl:      media.fileUrl,
    thumbnailUrl: media.thumbnailUrl ?? null,
    previewUrl:   media.previewUrl   ?? null,
    width:        media.width        ?? null,
    height:       media.height       ?? null,
    duration:     media.duration     ?? null,
    fileSize:     media.fileSize     ?? null,
    views:        media.views,
    downloads:    media.downloads,
    shares:       media.shares,
    likes:        media.likes,
    isNsfw:       media.isNsfw,
    category: media.category
      ? {
          id:   media.category.id.toString(),
          name: media.category.name,
          slug: media.category.slug ?? null,
          icon: media.category.icon ?? null
        }
      : null,
    tags: (media.tags ?? []).map((mt: any) => ({
      id:   mt.tag.id.toString(),
      name: mt.tag.name,
      slug: mt.tag.slug ?? null
    })),
    emotions: (media.emotions ?? []).map((me: any) => ({
      id:    me.emotion.id.toString(),
      name:  me.emotion.name,
      emoji: me.emotion.emoji ?? null
    })),
    createdAt: media.createdAt
  };
}

export async function searchMedia(params: SearchParams) {
  const { page, limit } = params;
  const skip = (page - 1) * limit;

  const where = buildWhere(params);

  const include: Prisma.MediaInclude = {
    category: true,
    tags:     { include: { tag: true } },
    emotions: { include: { emotion: true } }
  };

  // Parallel: fetch data and count simultaneously
  const [total, raw] = await Promise.all([
    prisma.media.count({ where }),
    prisma.media.findMany({
      where,
      include,
      orderBy: [
        { views: 'desc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: limit
    })
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: raw.map(formatMedia),
    pagination: {
      page,
      limit,
      total,
      pages:       totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    },
    meta: {
      query: params.q ?? null,
      filters: {
        emotion:   params.emotion   ?? null,
        category:  params.category  ?? null,
        tags:      params.tags      ?? [],
        mediaType: params.mediaType ?? null
      }
    }
  };
}