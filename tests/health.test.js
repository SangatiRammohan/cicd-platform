const request      = require('supertest');
const createApp    = require('../src/app');
const { setReady } = require('../src/routes/health');

let app;

beforeAll(() => {
  app = createApp();
});

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('ts');
  });
});

describe('GET /ready', () => {
  it('returns 503 when not ready', async () => {
    setReady(false);
    const res = await request(app).get('/ready');
    expect(res.statusCode).toBe(503);
    expect(res.body.status).toBe('not_ready');
  });

  it('returns 200 when ready', async () => {
    setReady(true);
    const res = await request(app).get('/ready');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ready');
  });
});