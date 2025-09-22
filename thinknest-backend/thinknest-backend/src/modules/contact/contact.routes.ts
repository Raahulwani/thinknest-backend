import { Router } from 'express';
import { createContact } from './contact.controller';
import { verifyRecaptchaIfEnabled, honeypotGuard } from '../../common/middlewares/recaptcha.middleware';

const r = Router();
// POST /api/v1/contact
r.post('/', honeypotGuard, verifyRecaptchaIfEnabled, createContact);

export default r;
