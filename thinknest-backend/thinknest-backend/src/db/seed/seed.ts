import 'reflect-metadata';
import { AppDataSource } from '../../config/data-source';
import { Expertise } from '../../modules/jury/entities/expertise.entity';
import { JuryMember } from '../../modules/jury/entities/jury-member.entity';
import { JuryAssignment, JuryRole } from '../../modules/jury/entities/jury-assignment.entity';

async function run() {
  await AppDataSource.initialize();
  console.log('Seeding data...');

  const expRepo = AppDataSource.getRepository(Expertise);
  const memberRepo = AppDataSource.getRepository(JuryMember);
  const assignRepo = AppDataSource.getRepository(JuryAssignment);

  const expertiseNames = ['Technology', 'Marketing', 'Product'];
  const exps: Expertise[] = [];
  for (const name of expertiseNames) {
    let e = await expRepo.findOne({ where: { name } });
    if (!e) {
      e = expRepo.create({ name });
      await expRepo.save(e);
    }
    exps.push(e);
  }

  // Member 1
  let m1 = await memberRepo.findOne({ where: { fullName: 'Alisha Khan' } });
  if (!m1) {
    m1 = memberRepo.create({
      fullName: 'Alisha Khan',
      profilePhotoUrl: 'https://picsum.photos/seed/alisha/300/300',
      designation: 'VP Product',
      organization: 'Acme Corp',
      department: 'Marketing',
      bio: 'Seasoned product leader.',
      expertise: [exps[0], exps[2]], // Tech, Product
    });
    await memberRepo.save(m1);
  }

  // Member 2
  let m2 = await memberRepo.findOne({ where: { fullName: 'Rohan Patil' } });
  if (!m2) {
    m2 = memberRepo.create({
      fullName: 'Rohan Patil',
      profilePhotoUrl: 'https://picsum.photos/seed/rohan/300/300',
      designation: 'Director Engineering',
      organization: 'Globex',
      department: 'Technology',
      bio: 'Engineering leader.',
      expertise: [exps[0]], // Tech
    });
    await memberRepo.save(m2);
  }

  // Member 3
  let m3 = await memberRepo.findOne({ where: { fullName: 'Meera Iyer' } });
  if (!m3) {
    m3 = memberRepo.create({
      fullName: 'Meera Iyer',
      profilePhotoUrl: 'https://picsum.photos/seed/meera/300/300',
      designation: 'Head of Marketing',
      organization: 'Soylent Inc',
      department: 'Marketing',
      bio: 'Growth marketer.',
      expertise: [exps[1]], // Marketing
    });
    await memberRepo.save(m3);
  }

  // Assignments
  const ensureAssignment = async (member: JuryMember, year: number, role: JuryRole) => {
    const exist = await assignRepo.createQueryBuilder('ja')
      .leftJoin('ja.member', 'm')
      .where('m.id = :id AND ja.year = :year AND ja.role = :role', { id: member.id, year, role })
      .getOne();
    if (!exist) {
      const a = assignRepo.create({ member, year, role });
      await assignRepo.save(a);
    }
  };

  await ensureAssignment(m1, 2023, JuryRole.Member);
  await ensureAssignment(m1, 2024, JuryRole.Member);
  await ensureAssignment(m1, 2025, JuryRole.CoChair);

  await ensureAssignment(m2, 2024, JuryRole.Member);
  await ensureAssignment(m2, 2025, JuryRole.Member);

  await ensureAssignment(m3, 2023, JuryRole.Member);
  await ensureAssignment(m3, 2024, JuryRole.Chair);


  console.log('Seed complete.');
  await AppDataSource.destroy();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
