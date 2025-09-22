import { Request, Response } from 'express';
import { listQuerySchema } from './dto/query.schema';
import { JuryService } from './jury.service';

const service = new JuryService();

export async function listJury(req: Request, res: Response) {
  const q = listQuerySchema.parse(req.query);
  const years = q.years ? q.years.split(',').map(Number).filter(Boolean) : undefined;

  const { total, data } = await service.list({
    year: q.year,
    years,
    search: q.search,
    department: q.department,
    expertise: q.expertise,
    role: q.role,
    sort: q.sort,
    page: q.page,
    limit: q.limit,
    groupBy: q.groupBy,
  });

  if (q.groupBy === 'year' && years?.length) {
    const grouped = years.map((yr) => ({
      year: yr,
      count: data.filter(d => d.year === yr).length,
      members: data.filter(d => d.year === yr),
    }));
    return res.json({ data: grouped });
  }

  res.json({ meta: { page: q.page, limit: q.limit, total }, data });
}

export async function getJuryMember(req: Request, res: Response) {
  const id = req.params.id;
  const detail = await service.detail(id);
  if (!detail) return res.status(404).json({ error: { message: 'Member not found', status: 404 } });
  return res.json(detail);
}

export async function getYears(_req: Request, res: Response) {
  const data = await service.listYears();
  return res.json(data);
}

export async function getExpertises(_req: Request, res: Response) {
  const data = await service.listExpertises();
  return res.json(data);
}
