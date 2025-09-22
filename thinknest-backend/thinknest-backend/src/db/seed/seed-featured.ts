// src/db/seed/seed-featured.ts
import "dotenv/config";
import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { FeaturedIdea } from "../../modules/featured/entities/featured-idea.entity";
import { Idea } from "../../modules/hof/entities/idea.entity";
import { MediaAsset } from "../../modules/featured/entities/media-asset.entity";

type Item = {
  slug: string;
  status?: string;
  category: string | null;
  businessUnit: string | null;
  year: number | null;
  domain: string | null;
  challenge: string | null;
  description?: string | null;
  popularityScore?: number;
  previewUrl?: string | null;
};

function buildSeedDataSource(): DataSource {
  // Reuse your configured options but DISABLE synchronize so init won't try to "ADD slug NOT NULL"
  const base = AppDataSource.options as DataSourceOptions & { url?: string; schema?: string };
  const seedOptions: DataSourceOptions = {
    ...base,
    synchronize: false,
    migrationsRun: false,
    // make sure entities are present (some setups rely on them in options)
    entities: base.entities,
  };
  const ds = new DataSource(seedOptions);
  // Helpful log to prove which DB we’re hitting
  console.log("DS options:", {
    // show both url and discrete fields
    url: (base as any).url,
    host: (base as any).host,
    port: (base as any).port,
    database: (base as any).database,
    username: (base as any).username,
    schema: (base as any).schema || "public",
    synchronize: (base as any).synchronize,
  });
  return ds;
}

async function seedFeatured() {
  console.log("🚀 Running Featured Seeder...");

  const ds = buildSeedDataSource();
  await ds.initialize();

  // Confirm the actual DB we connected to
  try {
    const who = await ds.query(
      `select current_database() as db, current_schema() as schema, inet_server_addr() as host, inet_server_port() as port`
    );
    console.log("Connected to:", who?.[0] || who);
  } catch {}

  const schema = ((ds.options as any).schema as string) || "public";
  const qi = (table: string) => `"${schema}"."${table}"`;

  const ideaRepo = ds.getRepository(Idea);
  const fiRepo = ds.getRepository(FeaturedIdea);
  const mediaRepo = ds.getRepository(MediaAsset);

  // Ensure at least one Idea exists
  const sampleIdea = await ideaRepo.findOne({ where: {} });
  if (!sampleIdea) {
    console.log("⚠️ No HOF Idea found. Seed at least one Idea first.");
    await ds.destroy();
    process.exit(0);
  }

  // ---------- Defensive DB fixes (idempotent) ----------
  // 1) Ensure idea_id column exists and backfill any NULLs
  await ds.query(`
    ALTER TABLE ${qi("featured_ideas")}
    ADD COLUMN IF NOT EXISTS "idea_id" uuid NULL
  `);
  await ds.query(
    `
    UPDATE ${qi("featured_ideas")} fi
    SET "idea_id" = $1
    WHERE fi."idea_id" IS NULL
  `,
    [sampleIdea.id]
  );

  // 2) Ensure slug column exists (nullable), backfill NULLs, de-dup, then set NOT NULL
  await ds.query(`
    ALTER TABLE ${qi("featured_ideas")}
    ADD COLUMN IF NOT EXISTS "slug" varchar(160) NULL
  `);

  await ds.query(`
    UPDATE ${qi("featured_ideas")} fi
    SET "slug" = CONCAT('legacy-', LEFT(fi.id::text, 12))
    WHERE fi."slug" IS NULL
  `);

  await ds.query(`
    WITH d AS (
      SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id) AS rn
      FROM ${qi("featured_ideas")}
    )
    UPDATE ${qi("featured_ideas")} f
    SET slug = CONCAT(f.slug, '-', d.rn - 1)
    FROM d
    WHERE f.id = d.id
      AND d.rn > 1
  `);

  // If you already have a unique index/constraint on slug (you do), no need to add another.
  // Just enforce NOT NULL now that all rows have a slug.
  await ds.query(`
    ALTER TABLE ${qi("featured_ideas")}
    ALTER COLUMN "slug" SET NOT NULL
  `);

  // 3) Ensure FK from idea_id -> ideas(id)
  await ds.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_featured_ideas_idea_id_ideas_id'
      ) THEN
        ALTER TABLE ${qi("featured_ideas")}
        ADD CONSTRAINT "fk_featured_ideas_idea_id_ideas_id"
        FOREIGN KEY ("idea_id") REFERENCES ${qi("ideas")}("id")
        ON DELETE RESTRICT;
      END IF;
    END
    $$ LANGUAGE plpgsql;
  `);

  // ---------- Normal seeding ----------
  const before = await fiRepo.count();
  console.log(`📌 FeaturedIdeas before: ${before}`);

  const items: Item[] = [
    {
      slug: "smart-city-solutions-2024",
      status: "Published",
      category: "Urban Development",
      businessUnit: "Public Sector",
      year: 2024,
      domain: "City",
      challenge: "Sustainability",
      description: "Detailed description for the featured idea.",
      popularityScore: 10,
      previewUrl:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=630&fit=crop",
    },
    {
      slug: "ai-waste-sorting-2024",
      status: "Published",
      category: "Environment",
      businessUnit: "Manufacturing",
      year: 2024,
      domain: "Technology",
      challenge: "Sustainability",
      description: "ML-powered vision system to sort waste streams.",
      popularityScore: 9,
      previewUrl:
        "https://images.unsplash.com/photo-1508873699372-7aeab60b44ab?w=1200&h=630&fit=crop",
    },
    {
      slug: "renewable-grid-optimizer-2023",
      status: "Published",
      category: "Energy",
      businessUnit: "Utilities",
      year: 2023,
      domain: "Technology",
      challenge: "Climate Change",
      description: "Optimizer to stabilize renewable-heavy grids.",
      popularityScore: 8,
      previewUrl:
        "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1200&h=630&fit=crop",
    },
    {
      slug: "digital-learning-platform-2025",
      status: "Published",
      category: "Education",
      businessUnit: "EdTech",
      year: 2025,
      domain: "Education",
      challenge: "Access to Education",
      description: "VR/AR modules to gamify core STEM concepts.",
      popularityScore: 7,
      previewUrl:
        "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=630&fit=crop",
    },
    {
      slug: "smart-healthcare-monitoring-2024",
      status: "Published",
      category: "Healthcare",
      businessUnit: "Medical Devices",
      year: 2024,
      domain: "Medical",
      challenge: "Patient Care",
      description: "Continuous vitals monitoring with predictive alerts.",
      popularityScore: 9,
      previewUrl:
        "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&h=630&fit=crop",
    },
    {
      slug: "blockchain-supply-tracker-2024",
      status: "Published",
      category: "Business",
      businessUnit: "Operations",
      year: 2024,
      domain: "Blockchain",
      challenge: "Supply Chain Transparency",
      description: "Traceability and anti-counterfeit provenance.",
      popularityScore: 8,
      previewUrl:
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=630&fit=crop",
    },
    {
      slug: "autonomous-delivery-drones-2025",
      status: "Published",
      category: "Logistics",
      businessUnit: "Supply Chain",
      year: 2025,
      domain: "AI & Robotics",
      challenge: "Faster Deliveries",
      description:
        "AI-powered autonomous drones for last-mile delivery optimization.",
      popularityScore: 10,
      previewUrl:
        "https://images.unsplash.com/photo-1581092580499-fc2a6c1f9d9b?w=1200&h=630&fit=crop",
    },
    {
      slug: "personalized-nutrition-planner-2025",
      status: "Published",
      category: "Healthcare",
      businessUnit: "Food & Wellness",
      year: 2025,
      domain: "AI & Data Science",
      challenge: "Health Management",
      description:
        "AI-driven personalized nutrition planner based on health metrics.",
      popularityScore: 8,
      previewUrl:
        "https://images.unsplash.com/photo-1576675784410-ffcd6ee3f279?w=1200&h=630&fit=crop",
    },
  ];

  const ensurePreview = async (fi: FeaturedIdea, url?: string | null) => {
    if (!url) return;
    const u = String(url);

    if (fi.mediaPreview?.id) {
      const mp = await mediaRepo.findOne({ where: { id: fi.mediaPreview.id } });
      if (mp) {
        if (mp.url !== u) {
          mp.url = u;
          mp.width = 1200;
          mp.height = 630;
          mp.format = "jpg";
          await mediaRepo.save(mp);
        }
        return;
      }
    }

    const preview = mediaRepo.create({
      featured: fi,
      kind: "image",
      url: u,
      width: 1200,
      height: 630,
      blurhash: null,
      format: "jpg",
    });
    await mediaRepo.save(preview);
    fi.mediaPreview = preview;
    await fiRepo.save(fi);
  };

  for (const it of items) {
    let fi = await fiRepo.findOne({
      where: { slug: it.slug },
      relations: ["mediaPreview", "idea"],
    });

    if (!fi) {
      fi = fiRepo.create({
        slug: it.slug,
        idea: sampleIdea,
        status: it.status ?? "Published",
        category: it.category,
        businessUnit: it.businessUnit,
        year: it.year,
        domain: it.domain,
        challenge: it.challenge,
        isVisible: true,
        description: it.description ?? null,
        popularityScore: it.popularityScore ?? 0,
      });
      await fiRepo.save(fi);
      console.log(`✅ Inserted: ${it.slug}`);
    } else {
      if (!fi.idea) fi.idea = sampleIdea;

      const beforeJson = JSON.stringify({
        status: fi.status,
        category: fi.category,
        businessUnit: fi.businessUnit,
        year: fi.year,
        domain: fi.domain,
        challenge: fi.challenge,
        description: fi.description,
        popularityScore: fi.popularityScore,
        isVisible: fi.isVisible,
      });

      fi.status = it.status ?? fi.status;
      fi.category = it.category;
      fi.businessUnit = it.businessUnit;
      fi.year = it.year;
      fi.domain = it.domain;
      fi.challenge = it.challenge;
      fi.description = it.description ?? fi.description;
      fi.popularityScore = it.popularityScore ?? fi.popularityScore ?? 0;
      fi.isVisible = true;

      const afterJson = JSON.stringify({
        status: fi.status,
        category: fi.category,
        businessUnit: fi.businessUnit,
        year: fi.year,
        domain: fi.domain,
        challenge: fi.challenge,
        description: fi.description,
        popularityScore: fi.popularityScore,
        isVisible: fi.isVisible,
      });

      if (beforeJson !== afterJson || !fi.idea) {
        await fiRepo.save(fi);
        console.log(`🛠️ Updated: ${it.slug}`);
      } else {
        console.log(`ℹ️ Exists (no changes): ${it.slug}`);
      }
    }

    await ensurePreview(fi, it.previewUrl);
  }

  const after = await fiRepo.count();
  console.log(`✅ FeaturedIdeas after: ${after}`);

  await ds.destroy();
  process.exit(0);
}

seedFeatured().catch(async (e) => {
  console.error("❌ Featured seeding failed:", e);
  try {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  } catch {}
  process.exit(1);
});
