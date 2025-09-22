import express from 'express';
import v1 from './routes/v1';
import { errorMiddleware } from './common/middlewares/error.middleware';
import path from 'path';


const app = express();
app.use(express.json());
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));


app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/v1', v1);

app.use(errorMiddleware);

export default app;
