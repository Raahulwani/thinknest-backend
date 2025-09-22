import { Router } from 'express';
import juryRoutes from '../modules/jury/jury.routes';
import hofRoutes from '../modules/hof/hof.routes';
import featuredRoutes from '../modules/featured/featured.routes'; 
import challengesRoutes from '../modules/challenges/challenges.routes';
import newsRoutes from '../modules/news/news.routes';
import contactRoutes from '../modules/contact/contact.routes';
import caseStudyRoutes from '../modules/case-studies/case-studies.routes';
import mediaRoutes from '../modules/media/media.routes';





const v1 = Router();
v1.use('/jury', juryRoutes);

v1.use('/hof', hofRoutes);

v1.use('/featured-ideas', featuredRoutes);

v1.use('/challenges', challengesRoutes);

v1.use('/news', newsRoutes);

v1.use('/contact', contactRoutes);

v1.use('/case-studies', caseStudyRoutes);

v1.use('/media', mediaRoutes);



export default v1;
