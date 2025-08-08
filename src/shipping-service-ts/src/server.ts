import express, { Request, Response, NextFunction } from 'express';
import pino from 'pino';

const app = express();
const logger = pino({
  name: 'shipping-service-ts',
  messageKey: 'message',
  formatters: {
    level (logLevelString, logLevelNum) {
      return { severity: logLevelString }
    }
  }
});

const PORT = process.env.PORT || 3006;

interface Address {
    street_address: string;
    city: string;
    state: string;
    country: string;
    zip_code: number;
}

interface CartItem {
    product_id: string;
    quantity: number;
}

interface GetQuoteRequest {
    address: Address;
    items: CartItem[];
}

interface ShipOrderRequest {
    address: Address;
    items: CartItem[];
}

function getQuote(request: GetQuoteRequest) {
    const quote = 8.99;
    const units = Math.floor(quote);
    const nanos = (quote - units) * 1e9;
    return {
        cost_usd: {
            currency_code: "USD",
            units,
            nanos
        }
    }
}

function shipOrder(request: ShipOrderRequest) {
    const salt = `${request.address.street_address}, ${request.address.city}, ${request.address.state}`;
    let trackingId = '';
    for (let i = 0; i < 2; i++) {
        trackingId += String.fromCharCode(65 + Math.floor(Math.random() * 26));
    }
    trackingId += `-${salt.length}`;
    for (let i = 0; i < 3; i++) {
        trackingId += Math.floor(Math.random() * 10);
    }
    trackingId += `-${Math.floor(salt.length / 2)}`;
    for (let i = 0; i < 7; i++) {
        trackingId += Math.floor(Math.random() * 10);
    }
    return { tracking_id: trackingId };
}


app.use(express.json());

app.post('/getQuote', (req: Request, res: Response) => {
    try {
        const response = getQuote(req.body as GetQuoteRequest);
        res.json(response);
    } catch (error) {
        logger.error('Failed to get quote', error);
        res.status(500).json({ error: 'An unexpected error occurred during getting quote.' });
    }
});

app.post('/shipOrder', (req: Request, res: Response) => {
    try {
        const response = shipOrder(req.body as ShipOrderRequest);
        res.json(response);
    } catch (error) {
        logger.error('Failed to ship order', error);
        res.status(500).json({ error: 'An unexpected error occurred during shipping order.' });
    }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
}

export default app;
