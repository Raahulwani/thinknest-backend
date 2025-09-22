import { AppDataSource } from '../../config/data-source';
import { JuryMember } from './entities/jury-member.entity';
import { JuryAssignment } from './entities/jury-assignment.entity';
import { Expertise } from './entities/expertise.entity';
import { applySort } from '../../common/utils/sort';

type ListArgs = {
  year?: number;
  years?: number[];
  search?: string;
  department?: string;
  expertise?: string;
  role?: string;
  page: number;
  limit: number;
  sort?: string;
  groupBy?: 'year';
};

export class JuryService {
  private memberRepo = AppDataSource.getRepository(JuryMember);
  private assignRepo = AppDataSource.getRepository(JuryAssignment);
  private expRepo = AppDataSource.getRepository(Expertise);

  private buildBaseQB(args: ListArgs) {
    const { year, years, search, department, expertise, role } = args;

    const qb = this.memberRepo
      .createQueryBuilder('jm')
      .leftJoin('jm.expertise', 'ex')
      .leftJoin('jm.assignments', 'ja')
      .select([
        'jm.id as jm_id',
        'jm.full_name as jm_full_name',
        'jm.profile_photo_url as jm_profile_photo_url',
        'jm.designation as jm_designation',
        'jm.organization as jm_organization',
        'jm.department as jm_department',
        'ja.year as ja_year',
        'ja.role as ja_role',
        'ex.name as ex_name',
      ]);

    if (year) qb.andWhere('ja.year = :year', { year });
    if (years && years.length) qb.andWhere('ja.year = ANY(:years)', { years });
    if (role) qb.andWhere('ja.role = :role', { role });

    if (department) qb.andWhere('jm.department ILIKE :dept', { dept: `%${department}%` });
    if (expertise) qb.andWhere('ex.name = :exp', { exp: expertise });
    if (search) qb.andWhere('(jm.full_name ILIKE :s OR jm.department ILIKE :s)', { s: `%${search}%` });

    return qb;
  }

  async list(args: ListArgs) {
    const { page, limit, sort } = args;

    // Count distinct members matching filters
    const countQb = this.buildBaseQB(args)
      .select('COUNT(DISTINCT jm.id)', 'cnt')
      .orderBy(); // remove orders
    const totalRow = await countQb.getRawOne<{ cnt: string }>();
    const total = Number(totalRow?.cnt ?? 0);

    // Fetch rows
    const qb = this.buildBaseQB(args);
    applySort(qb as any, sort);
    qb.offset((page - 1) * limit).limit(limit);

    const rows = await qb.getRawMany();

    // Map rows to cards
    const map = new Map<string, any>();
    for (const r of rows) {
      const key = `${r.jm_id}-${r.ja_year ?? 'na'}`;
      if (!map.has(key)) {
        map.set(key, {
          id: r.jm_id,
          name: r.jm_full_name,
          profilePhotoUrl: r.jm_profile_photo_url,
          designation: r.jm_designation,
          organization: r.jm_organization,
          department: r.jm_department,
          expertise: [] as string[],
          role: r.ja_role ?? null,
          year: r.ja_year ?? null,
        });
      }
      if (r.ex_name && !map.get(key).expertise.includes(r.ex_name)) {
        map.get(key).expertise.push(r.ex_name);
      }
    }

    return { total, data: Array.from(map.values()) };
  }

  async detail(id: string) {
    const member = await this.memberRepo.findOne({
      where: { id },
      relations: { expertise: true, assignments: true },
      order: { assignments: { year: 'DESC' } as any },
    });
    if (!member) return null;
    return {
      id: member.id,
      name: member.fullName,
      profilePhotoUrl: member.profilePhotoUrl,
      designation: member.designation,
      organization: member.organization,
      department: member.department,
      expertise: member.expertise?.map(e => e.name) ?? [],
      assignments: (member.assignments ?? []).map(a => ({ year: a.year, role: a.role })),
      bio: member.bio ?? null,
    };
  }

  async listYears() {
    const rows = await this.assignRepo
      .createQueryBuilder('ja')
      .select('ja.year', 'year')
      .addSelect('COUNT(DISTINCT ja.member)', 'count')
      .groupBy('ja.year')
      .orderBy('ja.year', 'DESC')
      .getRawMany<{ year: string; count: string }>();

    return rows.map(r => ({ year: Number(r.year), count: Number(r.count) }));
  }

  async listExpertises() {
    const rows = await this.expRepo.find({ order: { name: 'ASC' } });
    return rows.map(r => r.name);
  }
}
