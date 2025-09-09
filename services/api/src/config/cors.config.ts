import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const allowedOrigins: (string | RegExp)[] = (() => {
  const raw = process.env.ALLOWED_ORIGINS;
  const frontend = process.env.FRONTEND_URL;
  const defaults = ['http://localhost:3000', 'http://localhost:3001'];
  if (raw && raw.trim().length > 0) {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  if (frontend && frontend.trim().length > 0) {
    return [frontend.trim()];
  }
  return defaults;
})();

export const corsOptions: CorsOptions = {
  origin: allowedOrigins,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Forwarded-For',
  ],
  exposedHeaders: ['Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};
