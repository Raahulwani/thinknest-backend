import { DataSource } from 'typeorm';
import { loadEnv } from './env';

import { JuryMember } from '../modules/jury/entities/jury-member.entity';
import { Expertise } from '../modules/jury/entities/expertise.entity';
import { JuryAssignment } from '../modules/jury/entities/jury-assignment.entity';

import { Innovator } from '../modules/hof/entities/innovator.entity';
import { Badge } from '../modules/hof/entities/badge.entity';
import { Team } from '../modules/hof/entities/team.entity';
import { Idea } from '../modules/hof/entities/idea.entity';
import { Award } from '../modules/hof/entities/award.entity';
import { Tag } from '../modules/hof/entities/tag.entity';

import { FeaturedIdea } from '../modules/featured/entities/featured-idea.entity';
import { MediaAsset } from '../modules/featured/entities/media-asset.entity';
import { Testimonial } from '../modules/featured/entities/testimonial.entity';
import { ImpactRecord } from '../modules/featured/entities/impact-record.entity';

import { Challenge } from '../modules/challenges/entities/challenge.entity';
import { ChallengePrize } from '../modules/challenges/entities/challenge-prize.entity';
import { ChallengeFaq } from '../modules/challenges/entities/challenge-faq.entity';

import { NewsItem } from '../modules/news/entities/news-item.entity';
import { NewsTag } from '../modules/news/entities/news-tag.entity';

import { ContactMessage } from '../modules/contact/entities/contact-message.entity';

import { CaseStudy } from '../modules/case-studies/entities/case-study.entity';
import { CaseStudyTag } from '../modules/case-studies/entities/case-study-tag.entity';
import { CaseStudyMetric } from '../modules/case-studies/entities/case-study-metric.entity';
import { CaseStudyTimelineStep } from '../modules/case-studies/entities/case-study-timeline-step.entity';
import { CaseStudyTestimonial } from '../modules/case-studies/entities/case-study-testimonial.entity';
import { MediaItem } from '../modules/media/entities/media-item.entity';
import { Story } from '../modules/media/entities/story.entity';



const env = loadEnv();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.DATABASE_URL,      // if provided, this will be used
  host: env.DB_HOST,          // kept for local setups without DATABASE_URL
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
  schema: env.DB_SCHEMA || 'public',

  entities: [
    JuryMember, Expertise, JuryAssignment,
    Innovator, Badge, Team, Idea, Award, Tag,
    FeaturedIdea, MediaAsset, Testimonial, ImpactRecord,
    Challenge, ChallengePrize, ChallengeFaq,
    NewsItem, NewsTag,
    ContactMessage,
    CaseStudy, CaseStudyTag, CaseStudyMetric, CaseStudyTimelineStep, CaseStudyTestimonial,
    MediaItem, Story,
  ],

  // IMPORTANT: keep server boot stable; schema is already fixed via seed/SQL
  synchronize: false,
  migrationsRun: false,
  logging: false,
});
