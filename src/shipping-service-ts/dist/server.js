"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pino_1 = __importDefault(require("pino"));
const app = (0, express_1.default)();
const logger = (0, pino_1.default)({
    name: 'shipping-service-ts',
    messageKey: 'message',
    formatters: {
        level(logLevelString, logLevelNum) {
            return { severity: logLevelString };
        }
    }
});
const PORT = process.env.PORT || 3006;
function getQuote(request) {
    const quote = 8.99;
    const units = Math.floor(quote);
    const nanos = (quote - units) * 1e9;
    return {
        cost_usd: {
            currency_code: "USD",
            units,
            nanos
        }
    };
}
function shipOrder(request) {
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
app.use(express_1.default.json());
app.post('/getQuote', (req, res) => {
    try {
        const response = getQuote(req.body);
        res.json(response);
    }
    catch (error) {
        logger.error('Failed to get quote', error);
        res.status(500).json({ error: 'An unexpected error occurred during getting quote.' });
    }
});
app.post('/shipOrder', (req, res) => {
    try {
        const response = shipOrder(req.body);
        res.json(response);
    }
    catch (error) {
        logger.error('Failed to ship order', error);
        res.status(500).json({ error: 'An unexpected error occurred during shipping order.' });
    }
});
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).send('Something broke!');
});
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        logger.info(`Server is running on port ${PORT}`);
    });
}
exports.default = app;
