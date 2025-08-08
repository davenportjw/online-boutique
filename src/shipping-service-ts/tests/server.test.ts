import request from 'supertest';
// The app object will be created in the next step, but we import it here for the tests.
// This file will not compile until the server is implemented.
import app from '../src/server';

describe('Shipping Service API', () => {
  describe('POST /getQuote', () => {
    it('should return a shipping quote', async () => {
      const requestBody = {
        address: {
          street_address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          country: 'USA',
          zip_code: 12345,
        },
        items: [
          {
            product_id: 'product1',
            quantity: 1,
          },
        ],
      };

      const response = await request(app)
        .post('/getQuote')
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('cost_usd');
      expect(response.body.cost_usd).toHaveProperty('currency_code', 'USD');
    });
  });

  describe('POST /shipOrder', () => {
    it('should ship an order and return a tracking id', async () => {
        const requestBody = {
            address: {
              street_address: '123 Main St',
              city: 'Anytown',
              state: 'CA',
              country: 'USA',
              zip_code: 12345,
            },
            items: [
              {
                product_id: 'product1',
                quantity: 1,
              },
            ],
          };

          const response = await request(app)
            .post('/shipOrder')
            .send(requestBody);

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('tracking_id');
          expect(typeof response.body.tracking_id).toBe('string');
    });
  });
});
