// Middleware para padronizar respostas da API
import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '@shared/http-status';
import { Logger } from '@shared/logger';

// Estender o objeto Response com métodos padronizados
declare global {
  namespace Express {
    interface Response {
      success(data?: any, message?: string, statusCode?: number): Response;
      error(message: string, statusCode?: number, details?: any): Response;
      notFound(message?: string): Response;
      badRequest(message: string): Response;
      unauthorized(message?: string): Response;
      serverError(message?: string): Response;
    }
  }
}

export const responseMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Método para respostas de sucesso
  res.success = function(data?: any, message?: string, statusCode: number = HTTP_STATUS.OK) {
    const response: any = {
      success: true,
      timestamp: new Date().toISOString(),
    };

    if (message) response.message = message;
    if (data !== undefined) {
      if (Array.isArray(data)) {
        response.data = data;
        response.count = data.length;
      } else {
        response.data = data;
      }
    }

    Logger.debug('Resposta de sucesso enviada', { 
      statusCode, 
      path: req.path,
      method: req.method,
      dataType: Array.isArray(data) ? 'array' : typeof data
    });

    return this.status(statusCode).json(response);
  };

  // Método para respostas de erro
  res.error = function(message: string, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR, details?: any) {
    const response: any = {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    };

    if (details) response.details = details;

    Logger.error('Resposta de erro enviada', { 
      statusCode, 
      message,
      path: req.path,
      method: req.method,
      details 
    });

    return this.status(statusCode).json(response);
  };

  // Métodos de conveniência para erros comuns
  res.notFound = function(message: string = 'Recurso não encontrado') {
    return this.error(message, HTTP_STATUS.NOT_FOUND);
  };

  res.badRequest = function(message: string) {
    return this.error(message, HTTP_STATUS.BAD_REQUEST);
  };

  res.unauthorized = function(message: string = 'Não autorizado') {
    return this.error(message, HTTP_STATUS.UNAUTHORIZED);
  };

  res.serverError = function(message: string = 'Erro interno do servidor') {
    return this.error(message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  };

  next();
};