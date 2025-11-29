import request from 'supertest';
import app from '../server.js';

describe('Auth Endpoints (Disabled)', () => {
  it('should return 404 for login as auth is disabled', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    // Since we removed the routes, this should be 404
    expect(res.statusCode).toEqual(404);
  });
});
