import express, { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import { createClient } from 'redis';

const app = express();
const logger = pino({
  name: 'cart-service-ts',
  messageKey: 'message',
  formatters: {
    level (logLevelString, logLevelNum) {
      return { severity: logLevelString }
    }
  }
});

const PORT = process.env.PORT || 3007;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({
    url: REDIS_URL
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));

interface CartItem {
    product_id: string;
    quantity: number;
}

interface AddItemRequest {
    user_id: string;
    item: CartItem;
}

interface Cart {
    user_id: string;
    items: CartItem[];
}

app.use(express.json());

app.post('/cart', async (req: Request, res: Response) => {
    try {
        const { user_id, item } = req.body as AddItemRequest;
        const cartString = await redisClient.get(user_id);
        let cart: Cart;
        if (cartString) {
            cart = JSON.parse(cartString);
            const existingItem = cart.items.find(i => i.product_id === item.product_id);
            if (existingItem) {
                existingItem.quantity += item.quantity;
            } else {
                cart.items.push(item);
            }
        } else {
            cart = { user_id, items: [item] };
        }
        await redisClient.set(user_id, JSON.stringify(cart));
        res.status(200).send();
    } catch (error) {
        logger.error('Failed to add item to cart', error);
        res.status(500).json({ error: 'An unexpected error occurred during adding item to cart.' });
    }
});

app.get('/cart/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const cartString = await redisClient.get(userId);
        if (cartString) {
            const cart = JSON.parse(cartString);
            res.json(cart);
        } else {
            res.json({ user_id: userId, items: [] });
        }
    } catch (error) {
        logger.error('Failed to get cart', error);
        res.status(500).json({ error: 'An unexpected error occurred during getting cart.' });
    }
});

app.delete('/cart/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        await redisClient.del(userId);
        res.status(200).send();
    } catch (error) {
        logger.error('Failed to empty cart', error);
        res.status(500).json({ error: 'An unexpected error occurred during emptying cart.' });
    }
});


app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});

async function startServer() {
    await redisClient.connect();
    app.listen(PORT, () => {
        logger.info(`Server is running on port ${PORT}`);
    });
}

if (process.env.NODE_ENV !== 'test') {
    startServer();
}

export default app;
