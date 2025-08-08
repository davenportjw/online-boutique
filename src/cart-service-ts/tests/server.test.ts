import request from 'supertest';
import app from '../src/server';

console.log('Test file loaded');

describe('Cart Service API', () => {
  it('should respond with a 404 for an unknown route', async () => {
    console.log('Running test: should respond with a 404 for an unknown route');
    const response = await request(app).get('/unknown-route');
    expect(response.status).toBe(404);
  });
});
