import { Request, Response, NextFunction } from "express";
import authService from "../services/auth.service";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export const authenticateJWT = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access token is missing or invalid" });
  }

  const token = authHeader.split(" ")[1];
  const decoded = authService.verifyToken(token);

  if (!decoded) {
    return res.status(403).json({ message: "Access token has expired or is invalid" });
  }

  req.user = {
    id: decoded.id,
    email: decoded.email,
    name: decoded.name
  };

  next();
};
