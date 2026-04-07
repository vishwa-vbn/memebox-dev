// import type { FastifyRequest, FastifyReply } from "fastify";
// import * as service from "./upload.service.js";

// export async function uploadMedia(
//   req: FastifyRequest,
//   reply: FastifyReply
// ) {
//   const user = (req as any).user;

//   if (!user || user.role !== "SUPREMEADMIN") {
//     return reply.code(403).send({ error: "Only admin can upload media" });
//   }

//   const file = await req.file();

//   if (!file) {
//     return reply.code(400).send({ error: "No file uploaded" });
//   }

//   const buffer = await file.toBuffer();
//   const fields = file.fields as any;

//   const media = await service.uploadAndCreateMedia(
//     {
//       buffer,
//       originalname: file.filename,
//       size: buffer.length
//     },
//     {
//       title: fields.title?.value,
//       description: fields.description?.value,
//       mediaType: fields.mediaType?.value,
//       tags: fields.tags?.value ? (fields.tags.value as string).split(",").map(t => t.trim()).filter(Boolean) : undefined,
//       emotions: fields.emotions?.value ? (fields.emotions.value as string).split(",").map(e => e.trim()).filter(Boolean) : undefined,
//       categoryId: fields.categoryId?.value
//     }
//   );

//   reply.code(201).send(media);
// }


import type { FastifyRequest, FastifyReply } from "fastify";
import * as service from "./upload.service.js";

export async function uploadMedia(
  req: FastifyRequest,
  reply: FastifyReply
) {

  const user = (req as any).user;

  if (!user) {
    return reply.code(401).send({ error: "Unauthorized" });
  }

  const file = await req.file();

  if (!file) {
    return reply.code(400).send({ error: "No file uploaded" });
  }

  const buffer = await file.toBuffer();
  const fields = file.fields as any;

  const media = await service.uploadAndCreateMedia(
    {
      buffer,
      originalname: file.filename,
      size: buffer.length
    },
    {
      title: fields.title?.value,
      description: fields.description?.value,
      mediaType: fields.mediaType?.value,
      tags: fields.tags?.value
        ? (fields.tags.value as string).split(",").map(t => t.trim()).filter(Boolean)
        : undefined,
      emotions: fields.emotions?.value
        ? (fields.emotions.value as string).split(",").map(e => e.trim()).filter(Boolean)
        : undefined,
      categoryId: fields.categoryId?.value,


    },
    user
  );

  reply.code(201).send(media);
}
