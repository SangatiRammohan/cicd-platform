const request   = require('supertest');
const createApp = require('../src/app');

let app;

beforeAll(() => {
  app = createApp();
});

describe('GET /api/status', () => {
  it('returns 200 with app name and env', async () => {
    const res = await request(app).get('/api/status');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('app');
    expect(res.body).toHaveProperty('env');
  });
});

describe('404 handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Not found');
  });
});