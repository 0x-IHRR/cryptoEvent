import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici';
import { activityAggregator } from './src/services/aggregator.js';

setGlobalDispatcher(new EnvHttpProxyAgent());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// API: Get normalized activities with summary stats
app.get('/api/activities', (_req: Request, res: Response) => {
  try {
    const data = activityAggregator.getActivitiesResponse();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch activities', message: err?.message });
  }
});

// API: Get health status of 8 exchange data sources
app.get('/api/sources', (_req: Request, res: Response) => {
  try {
    const data = activityAggregator.getSourcesResponse();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch source health', message: err?.message });
  }
});

// API: Live Ping Diagnostics for Official Exchange REST APIs
app.get('/api/ping-sources', async (_req: Request, res: Response) => {
  try {
    const { pingAllExchangeApis } = await import('./src/services/exchangeApis.js');
    const results = await pingAllExchangeApis();
    res.json({
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to ping exchange APIs', message: err?.message });
  }
});

// API: AI-powered Activity Arbitrage & Rule Strategy Analysis
app.post('/api/ai-strategy', async (req: Request, res: Response) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const { activity, userNotes } = req.body;
    if (!activity) {
      res.status(400).json({ error: 'Missing activity object' });
      return;
    }
    const { generateActivityArbitragePlan } = await import('./src/services/aiStrategy.js');
    const timeoutMs = 20_000;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('AI 请求超过 20 秒')), timeoutMs);
    });
    const plan = await Promise.race([
      generateActivityArbitragePlan(activity, userNotes),
      timeout,
    ]);
    res.json(plan);
  } catch (err: any) {
    res.status(err?.message?.includes('超过 20 秒') ? 504 : 500).json({
      error: 'Failed to generate AI strategy',
      message: err?.message,
    });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
});

// API: Single Activity Link Cross-Validation Probe
app.get('/api/validate-url', async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string;
    const exchange = req.query.exchange as any;
    if (!url || !exchange) {
      res.status(400).json({ error: 'Missing url or exchange query param' });
      return;
    }
    const { validateActivityUrl } = await import('./src/services/linkValidator.js');
    const result = await validateActivityUrl(url, exchange);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Validation failed', message: err?.message });
  }
});

// API: Batch Link Cross-Validation for all activities
app.get('/api/validate-all-links', async (_req: Request, res: Response) => {
  try {
    const { batchValidateUrls } = await import('./src/services/linkValidator.js');
    const activities = activityAggregator.getActivitiesResponse().activities;
    const items = activities.map((a) => ({ url: a.officialUrl, exchange: a.exchange, id: a.id }));
    const results = await batchValidateUrls(items);
    res.json({
      timestamp: new Date().toISOString(),
      total: items.length,
      results,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Batch validation failed', message: err?.message });
  }
});

// API: Trigger refresh of scrapers and manual fallback aggregation
app.all('/api/refresh', async (req: Request, res: Response) => {
  try {
    if (req.method !== 'POST' && req.method !== 'GET') {
      res.setHeader('Allow', 'GET, POST');
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers['authorization'];
    if (req.method === 'GET' && (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
      res.status(401).json({ error: 'Unauthorized cron refresh' });
      return;
    }

    const data = await activityAggregator.refreshAll(new Date());
    res.json({
      success: true,
      refreshedAt: new Date().toISOString(),
      activitiesCount: data.total,
      sources: activityAggregator.getSourcesResponse().sources,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Refresh failed', message: err?.message });
  }
});

async function startServer() {
  await activityAggregator.refreshAll();
  const sourceRefreshTimer = setInterval(() => {
    void activityAggregator.refreshAll();
  }, 30 * 60 * 1000);
  sourceRefreshTimer.unref();
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from Vite build output
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[Exchange Activity Board] Server running on port ${port} (isProd: ${isProd})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
