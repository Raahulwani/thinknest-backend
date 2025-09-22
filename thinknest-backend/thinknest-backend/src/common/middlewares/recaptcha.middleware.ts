import type { Request, Response, NextFunction } from 'express';
import { loadEnv } from '../../config/env';

const env = loadEnv();
// If you prefer reCAPTCHA v2 checkbox, verification is the same.
const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

export async function verifyRecaptchaIfEnabled(req: Request, res: Response, next: NextFunction) {
  try {
    // Feature toggle; if not configured, skip verification
    if (!env.RECAPTCHA_SECRET) return next();

    const token = (req.body?.recaptchaToken ?? '') as string;
    if (!token) return res.status(400).json({ error: { status: 400, message: 'Missing reCAPTCHA token' } });

    // Use global fetch (Node 18+). If your runtime is older, add node-fetch and import it.
    const params = new URLSearchParams();
    params.append('secret', env.RECAPTCHA_SECRET);
    params.append('response', token);

    const resp = await fetch(VERIFY_URL, { method: 'POST', body: params as any });
    const data = await resp.json();

    if (!data.success) {
      return res.status(400).json({ error: { status: 400, message: 'reCAPTCHA validation failed' } });
    }

    // Attach score for storage (v3); v2 returns no score
    (req as any).recaptchaScore = typeof data.score === 'number' ? data.score : undefined;
    return next();
  } catch (e) {
    return res.status(500).json({ error: { status: 500, message: 'reCAPTCHA check error' } });
  }
}

/** Simple honeypot check — hidden field must remain empty */
export function honeypotGuard(req: Request, res: Response, next: NextFunction) {
  if (req.body?.hp_field) {
    return res.status(400).json({ error: { status: 400, message: 'Spam detected' } });
  }
  next();
}
