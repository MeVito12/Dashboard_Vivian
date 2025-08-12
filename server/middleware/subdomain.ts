import { Request, Response, NextFunction } from 'express';

export interface SubdomainRequest extends Request {
  subdomain?: string;
  company?: {
    id: string;
    name: string;
    subdomain: string;
  };
}

export function subdomainMiddleware(req: SubdomainRequest, res: Response, next: NextFunction) {
  const host = req.get('host') || '';
  const subdomain = host.split('.')[0];
  
  // Skip para localhost e IPs
  if (host.includes('localhost') || host.match(/^\d+\.\d+\.\d+\.\d+/)) {
    req.subdomain = 'localhost';
    return next();
  }
  
  req.subdomain = subdomain;
  console.log('🌐 Subdomain detected:', subdomain);
  
  next();
}

export async function companyMiddleware(req: SubdomainRequest, res: Response, next: NextFunction) {
  if (!req.subdomain || req.subdomain === 'localhost') {
    return next();
  }
  
  try {
    // Buscar empresa pelo subdomínio
    const { SupabaseStorage } = await import('../storage.js');
    const storage = new SupabaseStorage();
    
    const company = await storage.getCompanyBySubdomain(req.subdomain);
    
    if (company) {
      req.company = company;
      console.log('🏢 Company found:', company.name);
    } else if (req.subdomain !== 'master' && req.subdomain !== 'admin') {
      // Criar empresa automaticamente para novos subdomínios
      const newCompany = await storage.createCompanyFromSubdomain(req.subdomain);
      req.company = newCompany;
      console.log('🆕 New company created:', newCompany.name);
    }
    
    next();
  } catch (error) {
    console.error('❌ Error in company middleware:', error);
    next();
  }
}