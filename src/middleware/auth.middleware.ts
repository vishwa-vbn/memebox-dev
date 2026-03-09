import type { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

export async function authMiddleware(
  req: FastifyRequest,
  reply: FastifyReply
) {

  const publicRoutes = [
    "/auth/register",
    "/auth/login",
    "/media/trending",
    "/search",
  ];


  // Public GET /categories
if (req.method === "GET" && req.url.startsWith("/categories")) return;
if (req.method === "GET" && req.url.startsWith("/tags")) return;
if (req.method === "GET" && req.url.startsWith("/emotions")) return;


  // allow GET media routes
  if (req.method === "GET" && req.url.startsWith("/media")) {
    return;
  }

  // allow public routes
  if (publicRoutes.some(route => req.url.startsWith(route))) {
    return;
  }

  // ✅ allow public like endpoint
  if (req.method === "POST" && req.url.match(/^\/media\/\d+\/like$/)) {
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return reply.code(401).send({ error: "Unauthorized - no token" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return reply.code(401).send({ error: "Malformed token" });
  }

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as { id: string; role: string };

    (req as any).user = decoded;

  } catch (err) {

    console.log("JWT ERROR:", err);

    return reply.code(401).send({ error: "Invalid token" });
  }
}