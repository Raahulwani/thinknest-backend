// src/db/seed/seed-news.ts
import "reflect-metadata";
import { AppDataSource } from "../../config/data-source";
import { NewsItem } from "../../modules/news/entities/news-item.entity";
import { NewsTag } from "../../modules/news/entities/news-tag.entity";

type UpsertPayload = Omit<Partial<NewsItem>, "tags" | "publishedAt"> & {
  // accept either ISO string, Date, or null (draft)
  publishedAt?: string | Date | null;
  // tag names, not entities
  tags?: string[];
};

function toDate(val?: string | Date | null): Date | null {
  if (val == null) return null;
  return typeof val === "string" ? new Date(val) : val;
}

async function upsertBySlug(slug: string, payload: UpsertPayload) {
  const newsRepo = AppDataSource.getRepository(NewsItem);
  const tagRepo = AppDataSource.getRepository(NewsTag);

  let item = await newsRepo.findOne({ where: { slug }, relations: ["tags"] });
  if (!item) {
    // seed minimal required fields so TS is happy
    item = newsRepo.create({
      slug,
      title: "",
      summary: "",
      content: "",
      isFeatured: false,
      category: null,
      coverKind: null,
      coverUrl: null,
      publishedAt: null,
    });
  }

  if (payload.title !== undefined) item.title = payload.title;
  if (payload.summary !== undefined) item.summary = payload.summary;
  if (payload.content !== undefined) item.content = payload.content;
  if (payload.isFeatured !== undefined) item.isFeatured = payload.isFeatured;
  if (payload.category !== undefined) item.category = payload.category ?? null;
  if (payload.coverKind !== undefined) item.coverKind = payload.coverKind ?? null;
  if (payload.coverUrl !== undefined) item.coverUrl = payload.coverUrl ?? null;
  if (payload.publishedAt !== undefined) item.publishedAt = toDate(payload.publishedAt);

  if (payload.tags) {
    const uniqueNames = [...new Set(payload.tags.map((s) => s.trim()).filter(Boolean))];
    const existing = await tagRepo.find({ where: uniqueNames.map((name) => ({ name })) });
    const existingNames = new Set(existing.map((t) => t.name));
    const toCreate = uniqueNames
      .filter((n) => !existingNames.has(n))
      .map((name) => tagRepo.create({ name }));
    const created = toCreate.length ? await tagRepo.save(toCreate) : [];
    item.tags = [...existing, ...created];
  }

  return newsRepo.save(item);
}

async function run() {
  if (!AppDataSource.isInitialized) await AppDataSource.initialize();

  const newsRepo = AppDataSource.getRepository(NewsItem);
  const tagRepo = AppDataSource.getRepository(NewsTag);

  const beforeCount = await newsRepo.count();
  console.log("📌 News items before:", beforeCount);

  const baseCover = "/placeholder.svg";

  await upsertBySlug("innovation-challenge-2024-winners", {
    title: "Innovation Challenge 2024 Winners Announced",
    summary:
      "Discover the groundbreaking solutions that won our annual innovation challenge, featuring AI-powered sustainability tools and community-driven healthcare innovations.",
    content:
      "The Innovation Challenge 2024 has concluded with remarkable submissions from over 500 participants worldwide.\n\nThe winning solutions address critical challenges in sustainability, healthcare, and education through innovative technology applications. Full list of winners and case studies are available on the challenge page.",
    publishedAt: "2024-08-06T10:00:00Z",
    category: "Challenge",
    coverKind: "image",
    coverUrl: baseCover,
    isFeatured: true,
    tags: ["Challenge", "Winners", "AI"],
  });

  await upsertBySlug("partnership-tech-innovators-hub", {
    title: "New Partnership with Tech Innovators Hub",
    summary:
      "We’re excited to announce our strategic partnership with Tech Innovators Hub to accelerate breakthrough technologies and provide mentorship opportunities.",
    content:
      "This partnership will bring new resources, mentorship programs, and funding opportunities to our innovation community. Members will gain access to exclusive workshops and networking events.",
    publishedAt: "2024-08-05T09:00:00Z",
    category: "Partnership",
    coverKind: "image",
    coverUrl: baseCover,
    isFeatured: false,
    tags: ["Partnership", "Collaboration"],
  });

  await upsertBySlug("virtual-innovation-summit-2024", {
    title: "Upcoming Virtual Innovation Summit",
    summary:
      "Join us for a three-day virtual summit featuring keynote speakers, innovation workshops, and networking opportunities with leading industry experts.",
    content:
      "The summit will feature sessions on emerging technologies, startup success stories, and the future of innovation. Registration is now open for all community members.",
    publishedAt: "2024-08-04T08:30:00Z",
    category: "Event",
    coverKind: "image",
    coverUrl: baseCover,
    isFeatured: true,
    tags: ["Event", "Summit", "Networking"],
  });

  await upsertBySlug("community-spotlight-green-energy", {
    title: "Community Spotlight: Green Energy Solutions",
    summary:
      "Highlighting innovative green energy projects from our community that are making a real impact on environmental sustainability.",
    content:
      "This month we’re featuring projects that focus on renewable energy, energy efficiency, and sustainable power solutions developed by our community members.",
    publishedAt: "2024-08-03T11:15:00Z",
    category: "Community",
    coverKind: "image",
    coverUrl: baseCover,
    isFeatured: false,
    tags: ["Community", "Green Energy", "Sustainability"],
  });

  await upsertBySlug("mentorship-program-launch", {
    title: "Innovation Mentorship Program Launch",
    summary:
      "Introducing our new mentorship program connecting experienced innovators with emerging talent to foster knowledge sharing and collaboration.",
    content:
      "The program pairs experienced industry professionals with emerging innovators, providing guidance, support, and opportunities for collaborative projects.",
    publishedAt: "2024-08-02T12:00:00Z",
    category: "Program",
    coverKind: "image",
    coverUrl: baseCover,
    isFeatured: false,
    tags: ["Mentorship", "Program", "Community"],
  });

  await upsertBySlug("ai-in-healthcare-breakthroughs", {
    title: "AI in Healthcare: Latest Breakthroughs",
    summary:
      "Exploring how artificial intelligence is revolutionizing healthcare delivery and patient outcomes through innovative applications.",
    content:
      "Recent developments in AI-powered diagnostics, treatment planning, and patient monitoring are transforming healthcare. Learn about the latest breakthroughs and their implications.",
    publishedAt: "2024-08-01T15:20:00Z",
    category: "Technology",
    coverKind: "image",
    coverUrl: baseCover,
    isFeatured: false,
    tags: ["AI", "Healthcare", "Technology"],
  });

  const afterCount = await newsRepo.count();
  const tagCount = await tagRepo.count();
  console.log("✅ News items after:", afterCount, "| Tags:", tagCount);

  const recent = await newsRepo.find({
    order: { publishedAt: "DESC" },
    take: 3,
    relations: ["tags"],
  });
  console.log(
    "📰 Recent:",
    recent.map((r) => `${r.title} (${r.publishedAt?.toISOString() ?? "draft"})`)
  );

  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
