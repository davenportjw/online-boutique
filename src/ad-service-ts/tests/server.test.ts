import request from 'supertest';
// The app object will be created in the next step, but we import it here for the tests.
// This file will not compile until the server is implemented.
import app from '../src/server';

describe('Ad Service API', () => {
  describe('POST /ads', () => {
    it('should return a list of ads', async () => {
      const requestBody = {
        context_keys: ['test-key-1', 'test-key-2'],
      };

      const response = await request(app)
        .post('/ads')
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ads');
      expect(Array.isArray(response.body.ads)).toBe(true);
    });

    it('should return a 400 Bad Request for a missing "context_keys" field', async () => {
        const requestBody = {};

          const response = await request(app)
            .post('/ads')
            .send(requestBody);

          expect(response.status).toBe(400);
    });
  });
});
