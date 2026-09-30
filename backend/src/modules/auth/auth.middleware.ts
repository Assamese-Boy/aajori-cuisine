import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { db } from '../../data/mock-db';
import { User, UserRole } from '../../common/types';
import { UnauthorizedError, ForbiddenError } from '../../common/errors';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or invalid Authorization header'));
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string; role: UserRole };
    const user = db.users.get(payload.sub);
    if (!user || user.status !== 'ACTIVE') {
      return next(new UnauthorizedError('User account not found or suspended'));
    }

    req.user = user;
    next();
  } catch (err) {
    return next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function optionalAuthenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string; role: UserRole };
    const user = db.users.get(payload.sub);
    if (user && user.status === 'ACTIVE') {
      req.user = user;
    }
  } catch {
    // Ignore invalid token in optional auth
  }
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(`User role '${req.user.role}' is not authorized to access this resource`)
      );
    }

    next();
  };
}
