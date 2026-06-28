import express from 'express';
import cors from 'cors';
import { config } from './config';
import analyzeRouter from './routers/analyze';
import streamRouter from './routers/stream';
import reportsRouter from './routers/reports';
import accountRouter from './routers/account';
import systemRouter from './routers/system';
import marketRouter from './routers/market';

const app = express();
const port = config.PORT;

app.use(cors({
  origin: config.FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

const v1Prefix = config.API_V1_PREFIX; // /api/v1

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Register routers
app.use(`${v1Prefix}`, systemRouter);
app.use(`${v1Prefix}`, reportsRouter);
app.use(`${v1Prefix}`, accountRouter);
app.use(`${v1Prefix}`, marketRouter);
app.use(`${v1Prefix}/analyze`, analyzeRouter);
app.use(`${v1Prefix}/analyze`, streamRouter);

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`   Environment: ${config.NODE_ENV}`);
  console.log(`   Frontend Origin: ${config.FRONTEND_ORIGIN}`);
});
export default app;
