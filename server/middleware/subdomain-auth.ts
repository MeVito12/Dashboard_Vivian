import { Request, Response, NextFunction } from 'express';
import { SubdomainRequest } from './subdomain';

export const subdomainAuthMiddleware = (req: SubdomainRequest, res: Response, next: NextFunction) => {
  // Middleware para autenticação específica por subdomínio
  // Por enquanto, apenas passa adiante
  next();
};