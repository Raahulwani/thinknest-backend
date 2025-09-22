import "reflect-metadata";
import { AppDataSource } from "../../config/data-source";
import { Challenge } from "../../modules/challenges/entities/challenge.entity";
import { ChallengePrize } from "../../modules/challenges/entities/challenge-prize.entity";
import { ChallengeFaq } from "../../modules/challenges/entities/challenge-faq.entity";

async function run() {
  if (!AppDataSource.isInitialized) await AppDataSource.initialize();

  const repo = AppDataSource.getRepository(Challenge);

  const count = await repo.count();
  console.log("📌 Challenges before:", count);

  const c1 = repo.create({
    slug: "smart-city-solutions-2025",
    title: "Smart City Solutions 2025",
    overview: "Make cities sustainable, efficient, and livable.",
    theme: "Urban Development",
    goal: "Prototype solutions improving city services.",
    rules: "Original work; team size up to 5.",
    eligibility: "Open to students and professionals.",
    category: "Urban",
    participationType: "Team",
    startDate: "2025-08-01",
    endDate: "2025-11-15",
    submissionDeadline: "2025-09-30",
    judgingStart: "2025-10-05",
    judgingEnd: "2025-10-20",
    resultsDate: "2025-11-10",
    thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200",
    applyUrl: "https://example.com/submit/smart-city-2025",
    prizes: [
      { title: "Grand Prize", amount: 500000, currency: "INR", rank: 1 } as ChallengePrize,
      { title: "Runner Up", amount: 200000, currency: "INR", rank: 2 } as ChallengePrize,
    ],
    faqs: [
      { question: "Can we use open-source libraries?", answer: "Yes, with proper licenses." } as ChallengeFaq,
      { question: "What is team size limit?", answer: "Up to 5 members." } as ChallengeFaq,
    ],
  });

  const c2 = repo.create({
    slug: "ai-waste-sorting-2025",
    title: "AI Waste Sorting",
    overview: "Vision-based waste classification for recycling.",
    theme: "Environment",
    participationType: "Both",
    category: "Sustainability",
    startDate: "2025-07-01",
    endDate: "2025-10-31",
    submissionDeadline: "2025-09-15",
    thumbnailUrl: "https://images.unsplash.com/photo-1508873699372-7aeab60b44ab?w=1200",
    applyUrl: "https://example.com/submit/ai-waste-2025",
  });

  await repo.save([c1, c2]);

  console.log("✅ Challenges after:", await repo.count());
  await AppDataSource.destroy();
}

run().catch(async (e) => {
  console.error(e);
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
  process.exit(1);
});
