import request from 'supertest';
// The app object will be created in the next step, but we import it here for the tests.
// This file will not compile until the server is implemented.
import app from '../src/server';

describe('Recommendation Service API', () => {
  describe('POST /recommendations', () => {
    it('should return a list of recommended product ids', async () => {
      const requestBody = {
        user_id: 'test-user',
        product_ids: ['product1', 'product2'],
      };

      const response = await request(app)
        .post('/recommendations')
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('product_ids');
      expect(Array.isArray(response.body.product_ids)).toBe(true);
    });

    it('should return a 400 Bad Request for a missing "user_id" field', async () => {
        const requestBody = {
            product_ids: ['product1', 'product2'],
          };

          const response = await request(app)
            .post('/recommendations')
            .send(requestBody);

          expect(response.status).toBe(400);
    });

    it('should return a 400 Bad Request for a missing "product_ids" field', async () => {
        const requestBody = {
            user_id: 'test-user',
          };

          const response = await request(app)
            .post('/recommendations')
            .send(requestBody);

          expect(response.status).toBe(400);
    });
  });
});
