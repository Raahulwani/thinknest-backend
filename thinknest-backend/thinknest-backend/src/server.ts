import 'reflect-metadata';
import { AppDataSource } from './config/data-source';
import app from './app';
import { loadEnv } from './config/env';

const env = loadEnv();
const port = env.PORT ?? 4000;

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log('📦 Database connected');
    app.listen(port, () => console.log(`🚀 Server running on http://localhost:${port}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
