// import type { FastifyInstance } from "fastify";
// import * as controller from "./admin.controller.js";

// export default async function adminRoutes(app: FastifyInstance) {
//   app.get("/media", { preHandler: [checkAdmin] }, controller.getAllMedia);

//   app.delete(
//     "/media/:id",
//     { preHandler: [checkAdmin] },
//     controller.deleteMedia
//   );

//   app.patch(
//     "/media/:id",
//     { preHandler: [checkAdmin] },
//     controller.updateMedia
//   );
// }

// /**
//  * Admin guard
//  */
// async function checkAdmin(req: any, reply: any) {
//   if (!req.user) {
//     return reply.code(401).send({ error: "Unauthorized" });
//   }

//   if (req.user.role !== "SUPREMEADMIN") {
//     return reply.code(403).send({ error: "Forbidden" });
//   }
// }


import type { FastifyInstance } from "fastify";
import * as controller from "./admin.controller.js";

export default async function adminRoutes(app: FastifyInstance) {

  // === USER MANAGEMENT (Admin Only) ===
  app.get('/users', { preHandler: [checkAdmin] }, controller.getAllUsers);
  app.get('/users/:id', { preHandler: [checkAdmin] }, controller.getUser);
  app.patch('/users/:id', { preHandler: [checkAdmin] }, controller.updateUser);
  app.delete('/users/:id', { preHandler: [checkAdmin] }, controller.deleteUser);

  app.get(
    "/media",
    { preHandler: [checkAdmin] },
    controller.getAllMedia
  );

  app.get(
    "/media/pending",
    { preHandler: [checkAdmin] },
    controller.getPendingMedia
  );

  app.patch(
    "/media/:id/approve",
    { preHandler: [checkAdmin] },
    controller.approveMedia
  );

  app.patch(
    "/media/:id/reject",
    { preHandler: [checkAdmin] },
    controller.rejectMedia
  );

  app.patch(
    "/media/:id",
    { preHandler: [checkAdmin] },
    controller.updateMedia
  );

  app.delete(
    "/media/:id",
    { preHandler: [checkAdmin] },
    controller.deleteMedia
  );


  // Inside adminRoutes
app.get('/users/:id/profile', { preHandler: [checkAdmin] }, controller.getUserProfile);
app.get('/users/:id/submissions', { preHandler: [checkAdmin] }, controller.getUserSubmissions);
app.get('/users/:id/likes', { preHandler: [checkAdmin] }, controller.getUserLikes);
app.get('/users/:id/credits/transactions', { preHandler: [checkAdmin] }, controller.getUserCreditTransactions);
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