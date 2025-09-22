// src/db/seed/seed-media-stories.ts
import "reflect-metadata";
import { AppDataSource } from "../../config/data-source";

async function run() {
  await AppDataSource.initialize();
  const qr = AppDataSource.createQueryRunner();
  await qr.connect();

  const schemaRaw = process.env.DB_SCHEMA || "public";
  const schema = schemaRaw.replace(/"/g, "");

  // ensure schema
  await qr.query(`CREATE SCHEMA IF NOT EXISTS "${schema}";`);

  // choose UUID default expression with fallbacks
  let uuidDefault = "md5(random()::text || clock_timestamp()::text)::uuid";
  try {
    await qr.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    uuidDefault = "gen_random_uuid()";
  } catch {
    try {
      await qr.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
      uuidDefault = "uuid_generate_v4()";
    } catch {}
  }

  const T = (name: string) => `"${schema}".${name}`;

  // tables (quoted camelCase)
  await qr.query(`
    CREATE TABLE IF NOT EXISTS ${T("media_items")} (
      id uuid PRIMARY KEY DEFAULT ${uuidDefault},
      kind varchar(24) NOT NULL,
      slug varchar(160) UNIQUE NOT NULL,
      title varchar(200) NOT NULL,
      description text,
      url text,
      provider varchar(80),
      "providerId" varchar(120),
      width int,
      height int,
      format varchar(16),
      duration varchar(16),
      event varchar(80),
      tags varchar(160),
      "isFeatured" boolean DEFAULT false,
      "publishedAt" timestamp,
      blurhash varchar(64),
      meta jsonb
    );
    CREATE INDEX IF NOT EXISTS idx_media_items_kind ON ${T("media_items")}(kind);
    CREATE INDEX IF NOT EXISTS idx_media_items_featured ON ${T("media_items")}("isFeatured");
    CREATE INDEX IF NOT EXISTS idx_media_items_published ON ${T("media_items")}("publishedAt");

    CREATE TABLE IF NOT EXISTS ${T("stories")} (
      id uuid PRIMARY KEY DEFAULT ${uuidDefault},
      slug varchar(160) UNIQUE NOT NULL,
      title varchar(200) NOT NULL,
      summary text,
      body text,
      "isFeatured" boolean DEFAULT false,
      "publishedAt" timestamp,
      tags varchar(160),
      "thumbnailId" uuid,
      CONSTRAINT fk_story_thumbnail FOREIGN KEY ("thumbnailId")
        REFERENCES ${T("media_items")}(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_stories_featured ON ${T("stories")}("isFeatured");
    CREATE INDEX IF NOT EXISTS idx_stories_published ON ${T("stories")}("publishedAt");

    CREATE TABLE IF NOT EXISTS ${T("story_media_items")} (
      "storiesId" uuid NOT NULL,
      "mediaItemId" uuid NOT NULL,
      PRIMARY KEY ("storiesId","mediaItemId"),
      CONSTRAINT fk_story_media_story FOREIGN KEY ("storiesId")
        REFERENCES ${T("stories")}(id) ON DELETE CASCADE,
      CONSTRAINT fk_story_media_media FOREIGN KEY ("mediaItemId")
        REFERENCES ${T("media_items")}(id) ON DELETE CASCADE
    );
  `);

  // one-time fix: rename lowercased providerid -> "providerId" if needed
  await qr.query(`
    DO $$
    DECLARE has_lower boolean; has_camel boolean;
    BEGIN
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='${schema}' AND table_name='media_items' AND column_name='providerid'
      ) INTO has_lower;
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='${schema}' AND table_name='media_items' AND column_name='providerId'
      ) INTO has_camel;
      IF has_lower AND NOT has_camel THEN
        EXECUTE 'ALTER TABLE "${schema}".media_items RENAME COLUMN providerid TO "providerId"';
      END IF;
    END $$;
  `);

  // ---------- SEED 6 IMAGES ----------
await qr.query(`
  INSERT INTO ${T("media_items")} (kind, slug, title, description, url, tags, "isFeatured", "publishedAt")
  VALUES
    ('image','gallery-1','Innovation Summit 2024','Annual innovation summit',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80', 'events', true, NOW()),
    ('image','gallery-2','AI Workshop Demo','Hands-on AI tools',
      'https://images.unsplash.com/photo-1542831371-d531d36971e6?auto=format&fit=crop&w=1600&q=80', 'workshops', false, NOW()),
    ('image','gallery-3','Prototype Showcase','Sustainability prototype',
      'https://images.unsplash.com/photo-1504386106331-3e4e71712b38?auto=format&fit=crop&w=1600&q=80', 'projects', false, NOW()),
    ('image','gallery-4','Innovation Lab Tour','Behind the scenes',
      'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=1600&q=80', 'events', false, NOW()),
    ('image','gallery-5','Team Collaboration','Cross-functional sprint',
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80', 'workshops', false, NOW()),
    ('image','gallery-6','Award Ceremony','Celebrating achievements',
      'https://images.unsplash.com/photo-1515169067865-5387ec356754?auto=format&fit=crop&w=1600&q=80', 'events', false, NOW())
  ON CONFLICT (slug) DO UPDATE
    SET title=EXCLUDED.title, description=EXCLUDED.description, url=EXCLUDED.url,
        tags=EXCLUDED.tags, "isFeatured"=EXCLUDED."isFeatured", "publishedAt"=EXCLUDED."publishedAt";
`);

// ---------- SEED 6 YOUTUBE VIDEOS ----------
await qr.query(`
  INSERT INTO ${T("media_items")} (kind, slug, title, description, provider, "providerId", url, tags, "isFeatured", "publishedAt")
  VALUES
    ('youtube','yt-1','Keynote Highlights','Conference keynote','youtube','dQw4w9WgXcQ', NULL,'events', true, NOW()),
    ('youtube','yt-2','AI Demo Walkthrough','End-to-end demo','youtube','M7lc1UVf-VE', NULL,'demos', false, NOW()),
    ('youtube','yt-3','Team Interview','Discussion with innovators','youtube','LXb3EKWsInQ', NULL,'projects', false, NOW()),
    ('youtube','yt-4','Prototype Demo','Live prototype session','youtube','e-ORhEE9VVg', NULL,'demos', false, NOW()),
    ('youtube','yt-5','Workshop Recap','Highlights and takeaways','youtube','9bZkp7q19f0', NULL,'workshops', false, NOW()),
    ('youtube','yt-6','Customer Story','Impact in the field','youtube','3JZ_D3ELwOQ', NULL,'success', false, NOW())
  ON CONFLICT (slug) DO UPDATE
    SET title=EXCLUDED.title, description=EXCLUDED.description, provider=EXCLUDED.provider,
        "providerId"=EXCLUDED."providerId", url=EXCLUDED.url, tags=EXCLUDED.tags,
        "isFeatured"=EXCLUDED."isFeatured", "publishedAt"=EXCLUDED."publishedAt";
`);

// ---------- SEED 6 STORIES ----------
await qr.query(`
  INSERT INTO ${T("stories")} (slug, title, summary, body, "isFeatured", "publishedAt", tags, "thumbnailId")
  VALUES
    ('story-1','From Idea to Impact','Smart city journey',
      '<p>How an observation about traffic became an adaptive system.</p><p>Collaboration + AI + existing infra.</p>',
      true, NOW(), 'success', (SELECT id FROM ${T("media_items")} WHERE slug='gallery-1')),
    ('story-2','Building Bridges','Cross-department collaboration',
      '<p>Engineers and designers working together from day one.</p>',
      true, NOW(), 'collaboration', (SELECT id FROM ${T("media_items")} WHERE slug='gallery-2')),
    ('story-3','Failure as a Feature','Lessons from Project Atlas',
      '<p>Ambitious AI project pivoted to focused tools.</p>',
      false, NOW(), 'lessons', (SELECT id FROM ${T("media_items")} WHERE slug='gallery-3')),
    ('story-4','Side Projects Win','Innovation in the margins',
      '<p>20% time policy led to breakthrough platform.</p>',
      false, NOW(), 'culture', (SELECT id FROM ${T("media_items")} WHERE slug='gallery-4')),
    ('story-5','Customer-Centric Design','Listening before building',
      '<p>Research-first approach improved NPS by 60%.</p>',
      false, NOW(), 'success', (SELECT id FROM ${T("media_items")} WHERE slug='gallery-5')),
    ('story-6','Operational Excellence','Small tools, big impact',
      '<p>Automation saved 10+ hours/week per team.</p>',
      false, NOW(), 'collaboration', (SELECT id FROM ${T("media_items")} WHERE slug='gallery-6'))
  ON CONFLICT (slug) DO UPDATE
    SET title=EXCLUDED.title, summary=EXCLUDED.summary, body=EXCLUDED.body,
        "isFeatured"=EXCLUDED."isFeatured", "publishedAt"=EXCLUDED."publishedAt",
        tags=EXCLUDED.tags, "thumbnailId"=EXCLUDED."thumbnailId";
`);

  // link some media to each story (gallery + videos)
  await qr.query(`
    INSERT INTO ${T("story_media_items")} ("storiesId","mediaItemId")
    SELECT s.id, m.id FROM ${T("stories")} s JOIN ${T("media_items")} m ON m.slug IN ('gallery-1','yt-1') WHERE s.slug='story-1'
    ON CONFLICT DO NOTHING;

    INSERT INTO ${T("story_media_items")} ("storiesId","mediaItemId")
    SELECT s.id, m.id FROM ${T("stories")} s JOIN ${T("media_items")} m ON m.slug IN ('gallery-2','yt-2') WHERE s.slug='story-2'
    ON CONFLICT DO NOTHING;

    INSERT INTO ${T("story_media_items")} ("storiesId","mediaItemId")
    SELECT s.id, m.id FROM ${T("stories")} s JOIN ${T("media_items")} m ON m.slug IN ('gallery-3','yt-3') WHERE s.slug='story-3'
    ON CONFLICT DO NOTHING;

    INSERT INTO ${T("story_media_items")} ("storiesId","mediaItemId")
    SELECT s.id, m.id FROM ${T("stories")} s JOIN ${T("media_items")} m ON m.slug IN ('gallery-4','yt-4') WHERE s.slug='story-4'
    ON CONFLICT DO NOTHING;

    INSERT INTO ${T("story_media_items")} ("storiesId","mediaItemId")
    SELECT s.id, m.id FROM ${T("stories")} s JOIN ${T("media_items")} m ON m.slug IN ('gallery-5','yt-5') WHERE s.slug='story-5'
    ON CONFLICT DO NOTHING;

    INSERT INTO ${T("story_media_items")} ("storiesId","mediaItemId")
    SELECT s.id, m.id FROM ${T("stories")} s JOIN ${T("media_items")} m ON m.slug IN ('gallery-6','yt-6') WHERE s.slug='story-6'
    ON CONFLICT DO NOTHING;
  `);

  await qr.release();
  await AppDataSource.destroy();
  console.log('Media & Stories seed complete (6 images, 6 videos, 6 stories).');
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
