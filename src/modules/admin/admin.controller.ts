// import type { FastifyRequest, FastifyReply } from "fastify";
// import * as service from "./admin.service.js";

// /**
//  * Get all media uploaded
//  */
// export async function getAllMedia(req: FastifyRequest, reply: FastifyReply) {
//   const media = await service.getAllMedia();
//   reply.send(media);
// }

// /**
//  * Delete media
//  */
// export async function deleteMedia(
//   req: FastifyRequest<{ Params: { id: string } }>,
//   reply: FastifyReply
// ) {
//   await service.deleteMedia(BigInt(req.params.id));
//   reply.send({ success: true });
// }

// /**
//  * Update media metadata
//  */
// export async function updateMedia(
//   req: FastifyRequest<{
//     Params: { id: string };
//     Body: {
//       title?: string;
//       description?: string;
//       isNsfw?: boolean;
//       categoryId?: string;
//       width?: number;
//       height?: number;
//       fileSize?: number;
//       duration?: number;
//       tags?: string;
//       emotions?: string;
//     };
//   }>,
//   reply: FastifyReply
// ) {
//   const { tags, emotions, ...rest } = req.body;

//   const media = await service.updateMedia(BigInt(req.params.id), {
//     ...rest,
//     tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
//     emotions: emotions ? emotions.split(",").map(e => e.trim()).filter(Boolean) : undefined,
//   });
//   reply.send(media);
// }



import type { FastifyRequest, FastifyReply } from "fastify";
import * as service from "./admin.service.js";

/**
 * Get all media
 */
export async function getAllMedia(req: FastifyRequest, reply: FastifyReply) {
  const { page = 1, limit = 20 } = req.query as any;
  const take = Number(limit);
  const skip = (Number(page) - 1) * take;

  const media = await service.getAllMedia({ take, skip });
  reply.send(media);
}

/**
 * Get pending submissions
 */
export async function getPendingMedia(req: FastifyRequest, reply: FastifyReply) {
  const { page = 1, limit = 20 } = req.query as any;
  const take = Number(limit);
  const skip = (Number(page) - 1) * take;

  const media = await service.getPendingMedia({ take, skip });
  reply.send(media);
}

/**
 * Approve media
 */
export async function approveMedia(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const media = await service.approveMedia(BigInt(req.params.id));
  reply.send(media);
}

/**
 * Reject media
 */
export async function rejectMedia(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const media = await service.rejectMedia(BigInt(req.params.id));
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
      categoryId?: string;
      width?: number;
      height?: number;
      fileSize?: number;
      duration?: number;



      tags?: string;
      emotions?: string;
    };
  }>,
  reply: FastifyReply
) {
  const { tags, emotions, ...rest } = req.body;

  const media = await service.updateMedia(BigInt(req.params.id), {
    ...rest,
    tags: tags
      ? tags.split(",").map(t => t.trim()).filter(Boolean)
      : undefined,
    emotions: emotions
      ? emotions.split(",").map(e => e.trim()).filter(Boolean)
      : undefined,
  });

  reply.send(media);
}

export async function getAllUsers(req: FastifyRequest, reply: FastifyReply) {
  const { page = 1, limit = 20 } = req.query as any;
  const take = Number(limit);
  const skip = (Number(page) - 1) * take;

  const users = await service.getAllUsers({ take, skip });
  reply.send(users);
}

/**
 * Get single user
 */
export async function getUser(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const user = await service.getUserById(BigInt(req.params.id));
  reply.send(user);
}

/**
 * Update any user (admin only)
 */
export async function updateUser(
  req: FastifyRequest<{
    Params: { id: string };
    Body: { email?: string; password?: string; role?: 'USER' | 'SUPREMEADMIN' };
  }>,
  reply: FastifyReply
) {
  const user = await service.updateUser(BigInt(req.params.id), req.body);
  reply.send(user);
}

/**
 * Delete user
 */
export async function deleteUser(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  await service.deleteUser(BigInt(req.params.id));
  reply.send({ success: true });
}


// Get full user profile for admin (rich data)
export async function getUserProfile(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const user = await service.getUserProfileForAdmin(BigInt(req.params.id));
  reply.send(user);
}

// Get user submissions (paginated)
export async function getUserSubmissions(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const submissions = await service.getUserSubmissions(BigInt(req.params.id));
  reply.send(submissions);
}

// Get user likes
export async function getUserLikes(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const likes = await service.getUserLikes(BigInt(req.params.id));
  reply.send(likes);
}

// Get user credit transactions
export async function getUserCreditTransactions(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const transactions = await service.getUserCreditTransactions(BigInt(req.params.id));
  reply.send(transactions);
}