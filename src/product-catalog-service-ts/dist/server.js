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
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const logger = (0, pino_1.default)({
    name: 'product-catalog-service-ts',
    messageKey: 'message',
    formatters: {
        level(logLevelString, logLevelNum) {
            return { severity: logLevelString };
        }
    }
});
const PORT = process.env.PORT || 3005;
const PRODUCT_CATALOG_PATH = path_1.default.join(__dirname, 'products.json');
let products = [];
function loadProductsSync() {
    try {
        const data = require(PRODUCT_CATALOG_PATH);
        products = data.products;
    }
    catch (error) {
        logger.error('Failed to load products', error);
        process.exit(1);
    }
}
function loadProducts() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield promises_1.default.readFile(PRODUCT_CATALOG_PATH, 'utf-8');
            products = JSON.parse(data).products;
        }
        catch (error) {
            logger.error('Failed to load products', error);
            process.exit(1);
        }
    });
}
app.use(express_1.default.json());
app.get('/products', (req, res) => {
    res.json({ products });
});
app.get('/products/search', (req, res) => {
    const { query } = req.query;
    if (typeof query !== 'string') {
        return res.status(400).send('Invalid query');
    }
    const results = products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase()));
    res.json({ results });
});
app.get('/products/:id', (req, res) => {
    const { id } = req.params;
    const product = products.find(p => p.id === id);
    if (product) {
        res.json(product);
    }
    else {
        res.status(404).send('Product not found');
    }
});
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).send('Something broke!');
});
if (process.env.NODE_ENV === 'test') {
    loadProductsSync();
}
else {
    loadProducts().then(() => {
        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    });
}
exports.default = app;
