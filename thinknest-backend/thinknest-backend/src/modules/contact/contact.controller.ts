import { Request, Response } from 'express';
import { createContactSchema } from './dto/mutation.schema';
import { ContactService } from './contact.service';

const service = new ContactService();

export async function createContact(req: Request, res: Response) {
  const body = createContactSchema.parse(req.body);

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || undefined;
  const userAgent = req.headers['user-agent'];

  const saved = await service.create({
    name: body.name,
    email: body.email,
    subject: body.subject,
    message: body.message,
    type: body.type,
    ip,
    userAgent,
    recaptchaScore: (req as any).recaptchaScore,
  });

  return res.status(201).json({
    id: saved.id,
    ok: true,
    message: 'Thanks for contacting us! We’ll get back to you soon.',
  });
}
