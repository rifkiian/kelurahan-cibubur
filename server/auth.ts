import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type AuthUser = {
  userId: string;
  role: "ADMIN" | "USER";
};

export type AuthenticatedRequest = Request & { auth?: AuthUser };

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = header.slice("bearer ".length);
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ message: "Server misconfigured" });

  try {
    const decoded = jwt.verify(token, secret) as AuthUser;
    req.auth = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
