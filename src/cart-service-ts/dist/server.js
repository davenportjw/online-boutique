"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pino_1 = __importDefault(require("pino"));
const redis_1 = require("redis");
const app = (0, express_1.default)();
const logger = (0, pino_1.default)({
    name: 'cart-service-ts',
    messageKey: 'message',
    formatters: {
        level(logLevelString, logLevelNum) {
            return { severity: logLevelString };
        }
    }
});
const PORT = process.env.PORT || 3007;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = (0, redis_1.createClient)({
    url: REDIS_URL
});
redisClient.on('error', (err) => logger.error('Redis Client Error', err));
app.use(express_1.default.json());
app.post('/cart', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user_id, item } = req.body;
        const cartString = yield redisClient.get(user_id);
        let cart;
        if (cartString) {
            cart = JSON.parse(cartString);
            const existingItem = cart.items.find(i => i.product_id === item.product_id);
            if (existingItem) {
                existingItem.quantity += item.quantity;
            }
            else {
                cart.items.push(item);
            }
        }
        else {
            cart = { user_id, items: [item] };
        }
        yield redisClient.set(user_id, JSON.stringify(cart));
        res.status(200).send();
    }
    catch (error) {
        logger.error('Failed to add item to cart', error);
        res.status(500).json({ error: 'An unexpected error occurred during adding item to cart.' });
    }
}));
app.get('/cart/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const cartString = yield redisClient.get(userId);
        if (cartString) {
            const cart = JSON.parse(cartString);
            res.json(cart);
        }
        else {
            res.json({ user_id: userId, items: [] });
        }
    }
    catch (error) {
        logger.error('Failed to get cart', error);
        res.status(500).json({ error: 'An unexpected error occurred during getting cart.' });
    }
}));
app.delete('/cart/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        yield redisClient.del(userId);
        res.status(200).send();
    }
    catch (error) {
        logger.error('Failed to empty cart', error);
        res.status(500).json({ error: 'An unexpected error occurred during emptying cart.' });
    }
}));
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).send('Something broke!');
});
redisClient.connect().then(() => {
    if (process.env.NODE_ENV !== 'test') {
        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    }
});
exports.default = app;
