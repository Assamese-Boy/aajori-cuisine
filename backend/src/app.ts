import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { apiRouter } from './routes/api.router';
import { AppError } from './common/errors';

export const app = express();

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Healthcheck & Platform info
app.get('/', (req: Request, res: Response) => {
  res.json({
    platform: 'Aajori Cuisine API',
    district: 'Kamrup Metropolitan, Assam, India',
    version: '1.0.0',
    status: 'OPERATIONAL',
    documentation: '/docs',
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount platform API under /api/v1
app.use('/api/v1', apiRouter);

// Centralized error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  console.error('Unhandled Server Error:', err);
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred on the platform',
    },
  });
});
