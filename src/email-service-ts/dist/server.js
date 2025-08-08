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
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const logger = (0, pino_1.default)({
    name: 'email-service-ts',
    messageKey: 'message',
    formatters: {
        level(logLevelString, logLevelNum) {
            return { severity: logLevelString };
        }
    }
});
const PORT = process.env.PORT || 3002;
app.use(express_1.default.json());
app.post('/sendOrderConfirmation', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, order } = req.body;
        if (!email || !order) {
            return res.status(400).json({ error: 'Invalid request payload' });
        }
        const templatePath = path_1.default.join(__dirname, '../templates/confirmation.html');
        const html = yield ejs_1.default.renderFile(templatePath, { order });
        logger.info(`Order confirmation email sent to ${email}:\n${html}`);
        res.status(200).send();
    }
    catch (error) {
        logger.error('Failed to send order confirmation', error);
        res.status(500).json({ error: 'An unexpected error occurred during sending order confirmation.' });
    }
}));
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
