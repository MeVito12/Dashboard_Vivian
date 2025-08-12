import { Router } from 'express';
import { SupabaseStorage } from '../storage';

const router = Router();
const storage = new SupabaseStorage();

// GET /api/companies
router.get('/', async (req, res) => {
  try {
    const companies = await storage.getCompanies();
    res.json(companies);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/companies
router.post('/', async (req, res) => {
  try {
    const company = await storage.createCompany(req.body);
    res.json(company);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as companiesRouter };