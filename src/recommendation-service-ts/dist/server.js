"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pino_1 = __importDefault(require("pino"));
const app = (0, express_1.default)();
const logger = (0, pino_1.default)({
    name: 'recommendation-service-ts',
    messageKey: 'message',
    formatters: {
        level(logLevelString, logLevelNum) {
            return { severity: logLevelString };
        }
    }
});
const PORT = process.env.PORT || 3003;
// Mock product catalog
const allProductIds = [
    "OLJCESPC7Z",
    "66VCHSJNUP",
    "1YMWWN1N4O",
    "L9ECAV7KIM",
    "2ZYFJ3GM2N",
    "0PUK6V6EV0",
    "LS4PSXUNUM",
    "9SIQT8TOJO",
    "6E92ZMYYFZ"
];
app.use(express_1.default.json());
app.post('/recommendations', (req, res) => {
    try {
        const { user_id, product_ids } = req.body;
        if (!user_id || !product_ids) {
            return res.status(400).json({ error: 'Invalid request payload' });
        }
        const maxResponses = 5;
        const filteredProducts = allProductIds.filter(id => !product_ids.includes(id));
        const numProducts = filteredProducts.length;
        const numReturn = Math.min(maxResponses, numProducts);
        const indices = [...Array(numProducts).keys()];
        const sampledIndices = [];
        for (let i = 0; i < numReturn; i++) {
            const randomIndex = Math.floor(Math.random() * indices.length);
            sampledIndices.push(indices.splice(randomIndex, 1)[0]);
        }
        const recommended_product_ids = sampledIndices.map(i => filteredProducts[i]);
        logger.info(`Recommendation request for user ${user_id} with products ${product_ids.join(', ')} resulted in ${recommended_product_ids.join(', ')}`);
        res.json({ product_ids: recommended_product_ids });
    }
    catch (error) {
        logger.error('Failed to get recommendations', error);
        res.status(500).json({ error: 'An unexpected error occurred during getting recommendations.' });
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
