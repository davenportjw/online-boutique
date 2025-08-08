"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pino_1 = __importDefault(require("pino"));
const app = (0, express_1.default)();
const logger = (0, pino_1.default)({
    name: 'ad-service-ts',
    messageKey: 'message',
    formatters: {
        level(logLevelString, logLevelNum) {
            return { severity: logLevelString };
        }
    }
});
const PORT = process.env.PORT || 3004;
const adsMap = {
    "clothing": [{
            redirect_url: "/product/66VCHSJNUP",
            text: "Tank top for sale. 20% off."
        }],
    "accessories": [{
            redirect_url: "/product/1YMWWN1N4O",
            text: "Watch for sale. Buy one, get second kit for free"
        }],
    "footwear": [{
            redirect_url: "/product/L9ECAV7KIM",
            text: "Loafers for sale. Buy one, get second one for free"
        }],
    "hair": [{
            redirect_url: "/product/2ZYFJ3GM2N",
            text: "Hairdryer for sale. 50% off."
        }],
    "decor": [{
            redirect_url: "/product/0PUK6V6EV0",
            text: "Candle holder for sale. 30% off."
        }],
    "kitchen": [{
            redirect_url: "/product/9SIQT8TOJO",
            text: "Bamboo glass jar for sale. 10% off."
        }, {
            redirect_url: "/product/6E92ZMYYFZ",
            text: "Mug for sale. Buy two, get third one for free"
        }]
};
app.use(express_1.default.json());
app.post('/ads', (req, res) => {
    try {
        const { context_keys } = req.body;
        if (!context_keys) {
            return res.status(400).json({ error: 'Invalid request payload' });
        }
        let ads = [];
        if (context_keys.length > 0) {
            for (const key of context_keys) {
                if (adsMap[key]) {
                    ads.push(...adsMap[key]);
                }
            }
        }
        if (ads.length === 0) {
            const allAds = Object.values(adsMap).flat();
            const maxAdsToServe = 2;
            for (let i = 0; i < maxAdsToServe; i++) {
                ads.push(allAds[Math.floor(Math.random() * allAds.length)]);
            }
        }
        res.json({ ads });
    }
    catch (error) {
        logger.error('Failed to get ads', error);
        res.status(500).json({ error: 'An unexpected error occurred during getting ads.' });
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
