import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    company_id?: string;
    branch_id?: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const userEmail = req.headers['x-user-email'] as string;
  const userRole = req.headers['x-user-role'] as string;
  const companyId = req.headers['x-company-id'] as string;
  const branchId = req.headers['x-branch-id'] as string;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  req.user = {
    id: userId,
    email: userEmail || '',
    role: userRole || 'user',
    company_id: companyId,
    branch_id: branchId
  };

  next();
};

export const optionalAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const userEmail = req.headers['x-user-email'] as string;
  const userRole = req.headers['x-user-role'] as string;
  const companyId = req.headers['x-company-id'] as string;
  const branchId = req.headers['x-branch-id'] as string;

  if (userId) {
    req.user = {
      id: userId,
      email: userEmail || '',
      role: userRole || 'user',
      company_id: companyId,
      branch_id: branchId
    };
  }

  next();
};

export const requireAuth = authMiddleware;