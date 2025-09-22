/**
 * src/db/seed/seed.case-studies.ts
 */
import "reflect-metadata";
import { AppDataSource } from "../../config/data-source";
import { CaseStudy } from "../../modules/case-studies/entities/case-study.entity";
import { CaseStudyTag } from "../../modules/case-studies/entities/case-study-tag.entity";
import { CaseStudyMetric } from "../../modules/case-studies/entities/case-study-metric.entity";
import { CaseStudyTimelineStep } from "../../modules/case-studies/entities/case-study-timeline-step.entity";
import { CaseStudyTestimonial } from "../../modules/case-studies/entities/case-study-testimonial.entity";
import { MediaAsset } from "../../modules/featured/entities/media-asset.entity";

/* ----------------------------- helpers: tags ----------------------------- */

async function ensureTags(names: string[]): Promise<CaseStudyTag[]> {
  const repo = AppDataSource.getRepository(CaseStudyTag);
  if (!names.length) return [];
  const existing = await repo
    .createQueryBuilder("t")
    .where("t.name IN (:...names)", { names })
    .getMany();
  const existingNames = new Set(existing.map((t) => t.name));
  const toCreate = names.filter((n) => !existingNames.has(n));
  const created =
    toCreate.length > 0
      ? await repo.save(toCreate.map((name) => repo.create({ name })))
      : [];
  return [...existing, ...created];
}

/* ----------------------- helpers: media assets (kind) -------------------- */

const maRepo = () => AppDataSource.getRepository(MediaAsset);

// Simple detector so "kind" is NEVER null (DB column is NOT NULL)
function detectKindFromUrl(url: string): "image" | "video" | "pdf" {
  const u = url.toLowerCase();
  if (u.endsWith(".pdf")) return "pdf";
  if (/\.(mp4|webm|mov|m4v|avi|mkv)(\?|$)/.test(u)) return "video";
  return "image";
}

async function ensureAsset(url: string): Promise<MediaAsset> {
  const repo = maRepo();
  const existing = await repo.findOne({ where: { url } });
  if (existing) return existing;

  const kind = detectKindFromUrl(url);
  // Create and save with explicit casts so TS knows it's a single entity
  const created = repo.create({ url, kind } as Partial<MediaAsset>) as MediaAsset;
  const saved = (await repo.save(created as any)) as MediaAsset;
  return saved;
}

async function ensureAssets(urls: string[]): Promise<MediaAsset[]> {
  const out: MediaAsset[] = [];
  for (const u of urls) {
    const asset = await ensureAsset(u);
    out.push(asset);
  }
  return out;
}

/* ----------------------- helpers: child cleanup safe --------------------- */
/** Tries both camelCase and snake_case FK names; ignores failures. */
async function safeDeleteByParentId(
  table: "metric" | "step" | "testi",
  parentId: string
): Promise<void> {
  const metricRepo = AppDataSource.getRepository(CaseStudyMetric);
  const stepRepo = AppDataSource.getRepository(CaseStudyTimelineStep);
  const testiRepo = AppDataSource.getRepository(CaseStudyTestimonial);

  const repo = table === "metric" ? metricRepo : table === "step" ? stepRepo : testiRepo;

  try {
    await repo.createQueryBuilder().delete().where("caseStudyId = :id", { id: parentId }).execute();
    return;
  } catch {}
  try {
    await repo.createQueryBuilder().delete().where("case_study_id = :id", { id: parentId }).execute();
  } catch {}
}

/* --------------------------------- types --------------------------------- */
type UpsertPayload = {
  slug: string;
  title: string;
  department?: string | null;
  yearOfImplementation?: number | null;
  impactType?: string | null;
  summary?: string | null;
  problemStatement?: string | null;
  ideaDescription?: string | null;
  implementationJourney?: string | null;
  isFeatured?: boolean;
  tags: string[];
  metrics: { kpi: string; value?: string | null; note?: string | null }[];
  timeline: {
    orderIndex: number;
    title: string;
    description?: string | null;
    teamsInvolved?: string | null;
    toolsUsed?: string | null;
    date?: string | null;
  }[];
  testimonials: { stakeholder: string; organization?: string | null; quote: string }[];
  thumbnailUrl?: string;
  mediaUrls?: string[];
};

/* ------------------------------- upsert core ----------------------------- */

async function upsertCaseStudy(payload: UpsertPayload): Promise<CaseStudy> {
  const csRepo = AppDataSource.getRepository(CaseStudy);
  const metricRepo = AppDataSource.getRepository(CaseStudyMetric);
  const stepRepo = AppDataSource.getRepository(CaseStudyTimelineStep);
  const testiRepo = AppDataSource.getRepository(CaseStudyTestimonial);

  // find or create parent
  const found = await csRepo.findOne({ where: { slug: payload.slug } });
  let csEntity: CaseStudy =
    found ?? (csRepo.create({ slug: payload.slug, title: payload.title }) as CaseStudy);

  // assign base fields
  csEntity.title = payload.title;
  csEntity.department = payload.department ?? null;
  csEntity.yearOfImplementation = payload.yearOfImplementation ?? null;
  csEntity.impactType = payload.impactType ?? null;
  csEntity.summary = payload.summary ?? null;
  csEntity.problemStatement = payload.problemStatement ?? null;
  csEntity.ideaDescription = payload.ideaDescription ?? null;
  csEntity.implementationJourney = payload.implementationJourney ?? null;
  csEntity.isFeatured = !!payload.isFeatured;

  // tags
  csEntity.tags = await ensureTags(payload.tags);

  // thumbnail & media (non-null "kind")
  if (payload.thumbnailUrl) {
    csEntity.thumbnail = await ensureAsset(payload.thumbnailUrl);
  }
  if (payload.mediaUrls?.length) {
    csEntity.media = await ensureAssets(payload.mediaUrls);
  }

  // save parent first to get id
  csEntity = (await csRepo.save(csEntity as any)) as CaseStudy;

  // idempotent children: delete then recreate
  await safeDeleteByParentId("metric", csEntity.id);
  await safeDeleteByParentId("step", csEntity.id);
  await safeDeleteByParentId("testi", csEntity.id);

  const metrics = payload.metrics.map((m) => {
    const entity = metricRepo.create({ kpi: m.kpi, value: m.value ?? null, note: m.note ?? null });
    (entity as any).caseStudy = csEntity;
    return entity;
  });

  const steps = payload.timeline.map((s) => {
    const entity = stepRepo.create({
      orderIndex: s.orderIndex,
      title: s.title,
      description: s.description ?? null,
      teamsInvolved: s.teamsInvolved ?? null,
      toolsUsed: s.toolsUsed ?? null,
      date: s.date ?? null,
    });
    (entity as any).caseStudy = csEntity;
    return entity;
  });

  const testimonials = payload.testimonials.map((t) => {
    const entity = testiRepo.create({
      stakeholder: t.stakeholder,
      organization: t.organization ?? null,
      quote: t.quote,
    });
    (entity as any).caseStudy = csEntity;
    return entity;
  });

  await metricRepo.save(metrics as any);
  await stepRepo.save(steps as any);
  await testiRepo.save(testimonials as any);

  return csEntity;
}

/* ---------------------------------- run ---------------------------------- */

async function run(): Promise<void> {
  if (!AppDataSource.isInitialized) await AppDataSource.initialize();
  console.log("📦 Seeding Case Studies…");

  // 1) AI chatbot (featured)
  await upsertCaseStudy({
    slug: "ai-powered-customer-service-revolution",
    title: "AI-Powered Customer Service Revolution",
    department: "Technology",
    yearOfImplementation: 2024,
    impactType: "User Satisfaction",
    summary:
      "Implemented an AI chatbot that cut response times by 70% and lifted CSAT from 3.2 to 4.8/5.",
    problemStatement:
      "Long wait times and inconsistent support quality caused poor satisfaction and churn.",
    ideaDescription:
      "Deploy an AI chatbot integrated with CRM to handle common queries; escalate complex cases to agents.",
    implementationJourney:
      "NLP model selection, CRM integration, pilot rollout, training.",
    isFeatured: true,
    tags: ["AI", "Chatbot", "Customer Experience", "Automation"],
    metrics: [
      { kpi: "Response Time Reduction", value: "70%" },
      { kpi: "CSAT Increase", value: "3.2 → 4.8/5" },
      { kpi: "Annual Cost Savings", value: "$2.1M" },
    ],
    timeline: [
      {
        orderIndex: 1,
        title: "Research & Planning",
        description: "Tech evaluation & planning",
        teamsInvolved: "IT, CS, DS, UX",
        toolsUsed: "NLP, Cloud",
        date: "2024-01-15",
      },
      {
        orderIndex: 2,
        title: "Development",
        description: "Model training & integration",
        teamsInvolved: "IT, DS",
        toolsUsed: "CRM API, CI/CD",
        date: "2024-03-15",
      },
      {
        orderIndex: 3,
        title: "Pilot Launch",
        description: "Limited rollout",
        teamsInvolved: "CS, Product",
        toolsUsed: "Feature Flags",
        date: "2024-05-01",
      },
      {
        orderIndex: 4,
        title: "Full Deployment",
        description: "Company-wide enablement",
        teamsInvolved: "IT, Enablement",
        toolsUsed: "Analytics",
        date: "2024-06-01",
      },
    ],
    thumbnailUrl:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&q=80&auto=format&fit=crop",
    mediaUrls: [
      "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=1200&q=80&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?w=1200&q=80&auto=format&fit=crop",
    ],
    testimonials: [
      {
        stakeholder: "Sarah Johnson",
        organization: "Customer Service",
        quote: "AI handles routine queries flawlessly.",
      },
    ],
  });

  // 2) Solar campus (featured)
  await upsertCaseStudy({
    slug: "green-energy-initiative-solar-campus",
    title: "Green Energy Initiative: Solar Campus",
    department: "Sustainability",
    yearOfImplementation: 2023,
    impactType: "Cost Savings",
    summary:
      "80% renewable energy mix, 60% carbon reduction, $1.5M annual savings.",
    problemStatement:
      "Rising energy costs and environmental goals demanded a sustainable approach.",
    ideaDescription:
      "Install solar PV across buildings with battery storage and smart energy management.",
    implementationJourney: "Feasibility, design, installation, optimization.",
    isFeatured: true,
    tags: ["Sustainability", "Solar", "Energy Management"],
    metrics: [
      { kpi: "Renewable Energy Mix", value: "80%" },
      { kpi: "Carbon Footprint Reduction", value: "60%" },
      { kpi: "Annual Savings", value: "$1.5M" },
    ],
    timeline: [
      {
        orderIndex: 1,
        title: "Feasibility Study",
        description: "Assessment & approvals",
        teamsInvolved: "Facilities, Eng, Procurement",
        toolsUsed: "Modeling",
        date: "2023-01-10",
      },
      {
        orderIndex: 2,
        title: "Design & Planning",
        description: "System design & planning",
        teamsInvolved: "Engineering, Procurement",
        toolsUsed: "CAD",
        date: "2023-03-20",
      },
      {
        orderIndex: 3,
        title: "Installation",
        description: "Panels & grid integration",
        teamsInvolved: "Engineering, Operations",
        toolsUsed: "PV, Battery",
        date: "2023-05-30",
      },
      {
        orderIndex: 4,
        title: "Optimization",
        description: "Performance tuning",
        teamsInvolved: "Operations, Data",
        toolsUsed: "EMS",
        date: "2023-08-01",
      },
    ],
    thumbnailUrl:
      "https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=1200&q=80&auto=format&fit=crop",
    mediaUrls: [
      "https://images.unsplash.com/photo-1505739899-5f65221c12aa?w=1200&q=80&auto=format&fit=crop",
    ],
    testimonials: [
      {
        stakeholder: "Michael Chen",
        organization: "Sustainability Office",
        quote: "Saving money while leading on responsibility.",
      },
    ],
  });

  // 3) Remote work platform
  await upsertCaseStudy({
    slug: "remote-work-productivity-platform",
    title: "Remote Work Productivity Platform",
    department: "Human Resources",
    yearOfImplementation: 2023,
    impactType: "Operational Efficiency",
    summary:
      "Integrated platform boosted productivity by 45% and improved work–life balance.",
    problemStatement:
      "Gaps in communication, tracking, and engagement.",
    ideaDescription:
      "Unified project management, comms, and wellness with AI insights.",
    implementationJourney: "Requirements, build & integrations, beta, rollout.",
    isFeatured: false,
    tags: ["Remote Work", "Productivity", "Collaboration"],
    metrics: [
      { kpi: "Productivity Increase", value: "45%" },
      { kpi: "Employee Satisfaction", value: "+35%" },
      { kpi: "Meeting Time Reduction", value: "30%" },
    ],
    timeline: [
      {
        orderIndex: 1,
        title: "Requirements",
        description: "Surveys & needs",
        teamsInvolved: "HR Tech, Change",
        toolsUsed: "Surveys",
        date: "2023-02-01",
      },
      {
        orderIndex: 2,
        title: "Platform Development",
        description: "Build & integrate",
        teamsInvolved: "Software, Integration",
        toolsUsed: "Cloud, AI",
        date: "2023-03-15",
      },
      {
        orderIndex: 3,
        title: "Beta Testing",
        description: "Pilot",
        teamsInvolved: "Pilot Teams, QA",
        toolsUsed: "Feedback, Analytics",
        date: "2023-06-01",
      },
      {
        orderIndex: 4,
        title: "Rollout",
        description: "Company-wide",
        teamsInvolved: "Enablement, HR Tech",
        toolsUsed: "Training, SSO",
        date: "2023-08-01",
      },
    ],
    thumbnailUrl:
      "https://images.unsplash.com/photo-1557800636-894a64c1696f?w=1200&q=80&auto=format&fit=crop",
    mediaUrls: [
      "https://images.unsplash.com/photo-1552581234-26160f608093?w=1200&q=80&auto=format&fit=crop",
    ],
    testimonials: [
      {
        stakeholder: "Lisa Rodriguez",
        organization: "HR",
        quote: "Collaboration is smoother and measurable.",
      },
    ],
  });

  console.log("✅ Case Studies seeded.");
  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
