import "reflect-metadata";
import { AppDataSource } from "../../config/data-source";
import { Innovator } from "../../modules/hof/entities/innovator.entity";
import { Badge } from "../../modules/hof/entities/badge.entity";
import { Team } from "../../modules/hof/entities/team.entity";
import { Idea } from "../../modules/hof/entities/idea.entity";
import { Award, AwardLevel } from "../../modules/hof/entities/award.entity";
import { Tag } from "../../modules/hof/entities/tag.entity";

async function run() {
  await AppDataSource.initialize();
  console.log("Seeding Hall of Fame data...");

  const invRepo = AppDataSource.getRepository(Innovator);
  const badgeRepo = AppDataSource.getRepository(Badge);
  const teamRepo = AppDataSource.getRepository(Team);
  const ideaRepo = AppDataSource.getRepository(Idea);
  const awardRepo = AppDataSource.getRepository(Award);
  const tagRepo = AppDataSource.getRepository(Tag);

  // tags
  const tagSlugs = ["hof", "hof:2025", "winning-team", "top-contributor"];
  const tags: Tag[] = [];
  for (const slug of tagSlugs) {
    let t = await tagRepo.findOne({ where: { slug } });
    if (!t) { t = tagRepo.create({ slug }); await tagRepo.save(t); }
    tags.push(t);
  }
  const t_hof = tags.find(t => t.slug === "hof")!;
  const t_hof2025 = tags.find(t => t.slug === "hof:2025")!;
  const t_winning = tags.find(t => t.slug === "winning-team")!;
  const t_top = tags.find(t => t.slug === "top-contributor")!;

  // badges
  const bn = ["Top Contributor", "Winner", "Grand Winner 2025"];
  const badges: Badge[] = [];
  for (const name of bn) {
    let b = await badgeRepo.findOne({ where: { name } });
    if (!b) { b = badgeRepo.create({ name }); await badgeRepo.save(b); }
    badges.push(b);
  }
  const b_top = badges.find(b => b.name === "Top Contributor")!;
  const b_winner = badges.find(b => b.name === "Winner")!;
  const b_grand = badges.find(b => b.name === "Grand Winner 2025")!;

  // innovators
  let rohan = await invRepo.findOne({ where: { fullName: "Rohan Patil" } });
  if (!rohan) {
    rohan = invRepo.create({
      fullName: "Rohan Patil",
      department: "Technology",
      photoUrl: "https://picsum.photos/seed/rohanhof/300/300",
      bio: "Tech innovator and mentor.",
      badges: [b_top, b_winner],
      tags: [t_hof, t_hof2025, t_top],
    });
    await invRepo.save(rohan);
  }

  let meera = await invRepo.findOne({ where: { fullName: "Meera Iyer" } });
  if (!meera) {
    meera = invRepo.create({
      fullName: "Meera Iyer",
      department: "Marketing",
      photoUrl: "https://picsum.photos/seed/meerahof/300/300",
      bio: "Marketing strategist and growth leader.",
      badges: [b_top],
      tags: [t_hof],
    });
    await invRepo.save(meera);
  }

  // team
  let ninjas = await teamRepo.findOne({ where: { name: "Quantum Ninjas" } });
  if (!ninjas) {
    ninjas = teamRepo.create({
      name: "Quantum Ninjas",
      description: "Cross-functional product acceleration squad.",
      members: [rohan],
      badges: [b_grand],
      tags: [t_hof2025, t_winning],
    });
    await teamRepo.save(ninjas);
  }

  // ideas
  const idea1 = ideaRepo.create({
    title: "Smart Predictive Maintenance",
    summary: "Sensors + ML to reduce downtime.",
    outcomes: "Reduced downtime by 27% across plants.",
    submissionDate: "2024-11-10",
    contributors: [rohan],
    team: ninjas,
    tags: [t_hof2025]
  });
  await ideaRepo.save(idea1);

  const idea2 = ideaRepo.create({
    title: "Customer 360",
    summary: "Unified view to boost CSAT.",
    outcomes: "NPS +12 YoY.",
    submissionDate: "2025-03-18",
    contributors: [meera],
    tags: [t_hof]
  });
  await ideaRepo.save(idea2);

  // awards
  const aw1 = awardRepo.create({
    name: "Innovation Award",
    category: "Engineering",
    year: 2024,
    level: AwardLevel.Winner,
    idea: idea1,
    innovatorRecipients: [rohan],
    teamRecipients: [],
  });
  await awardRepo.save(aw1);

  const aw2 = awardRepo.create({
    name: "Grand Challenge",
    category: "Product",
    year: 2025,
    level: AwardLevel.Winner,
    idea: idea1,
    teamRecipients: [ninjas],
  });
  await awardRepo.save(aw2);

  console.log("HoF seed complete.");
  await AppDataSource.destroy();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
