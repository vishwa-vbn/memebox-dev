import type { FastifyInstance } from "fastify";
import * as controller from "./admin.controller";

export default async function adminRoutes(app: FastifyInstance) {
  app.get("/media", { preHandler: [checkAdmin] }, controller.getAllMedia);

  app.delete(
    "/media/:id",
    { preHandler: [checkAdmin] },
    controller.deleteMedia
  );

  app.patch(
    "/media/:id",
    { preHandler: [checkAdmin] },
    controller.updateMedia
  );
}

/**
 * Admin guard
 */
async function checkAdmin(req: any, reply: any) {
  if (!req.user) {
    return reply.code(401).send({ error: "Unauthorized" });
  }

  if (req.user.role !== "SUPREMEADMIN") {
    return reply.code(403).send({ error: "Forbidden" });
  }
}