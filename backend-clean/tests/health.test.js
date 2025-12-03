import request from 'supertest';
import app from '../server.js';

describe('Health Check API', () => {
  it('GET /api/health - should return success', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.message).toBe('Backend running');
  });
});
