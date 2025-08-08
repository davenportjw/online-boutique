import request from 'supertest';
// The app object will be created in the next step, but we import it here for the tests.
// This file will not compile until the server is implemented.
import app from '../src/server';

describe('Payment Service API', () => {
  describe('POST /charge', () => {
    it('should charge a credit card and return a transaction id', async () => {
      const chargeRequest = {
        amount: {
          currency_code: 'USD',
          units: 100,
          nanos: 0,
        },
        credit_card: {
          credit_card_number: '4242424242424242', // Visa
          credit_card_cvv: 123,
          credit_card_expiration_year: 2028,
          credit_card_expiration_month: 12,
        },
      };

      const response = await request(app)
        .post('/charge')
        .send(chargeRequest);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('transaction_id');
      expect(typeof response.body.transaction_id).toBe('string');
    });

    it('should return a 400 Bad Request for a missing "amount" field', async () => {
      const chargeRequest = {
        credit_card: {
          credit_card_number: '4555555555555555',
          credit_card_cvv: 123,
          credit_card_expiration_year: 2028,
          credit_card_expiration_month: 12,
        },
      };

      const response = await request(app)
        .post('/charge')
        .send(chargeRequest);

      expect(response.status).toBe(400);
    });

    it('should return a 400 Bad Request for a missing "credit_card" field', async () => {
      const chargeRequest = {
        amount: {
          currency_code: 'USD',
          units: 100,
          nanos: 0,
        },
      };

      const response = await request(app)
        .post('/charge')
        .send(chargeRequest);

      expect(response.status).toBe(400);
    });

    it('should return a 400 Bad Request for an invalid credit card number', async () => {
        const chargeRequest = {
          amount: {
            currency_code: 'USD',
            units: 100,
            nanos: 0,
          },
          credit_card: {
            credit_card_number: '1234',
            credit_card_cvv: 123,
            credit_card_expiration_year: 2028,
            credit_card_expiration_month: 12,
          },
        };

        const response = await request(app)
          .post('/charge')
          .send(chargeRequest);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Credit card info is invalid');
      });
  });
});
