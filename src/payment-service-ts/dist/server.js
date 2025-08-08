"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pino_1 = __importDefault(require("pino"));
const uuid_1 = require("uuid");
const cardValidator = __importStar(require("card-validator"));
const app = (0, express_1.default)();
const logger = (0, pino_1.default)({
    name: 'payment-service-ts',
    messageKey: 'message',
    formatters: {
        level(logLevelString, logLevelNum) {
            return { severity: logLevelString };
        }
    }
});
const PORT = process.env.PORT || 3001;
class CreditCardError extends Error {
    constructor(message) {
        super(message);
        this.code = 400; // Invalid argument error
    }
}
class InvalidCreditCard extends CreditCardError {
    constructor() {
        super(`Credit card info is invalid`);
    }
}
class UnacceptedCreditCard extends CreditCardError {
    constructor(cardType) {
        super(`Sorry, we cannot process ${cardType} credit cards. Only VISA or MasterCard is accepted.`);
    }
}
class ExpiredCreditCard extends CreditCardError {
    constructor(number, month, year) {
        super(`Your credit card (ending ${number.substr(-4)}) expired on ${month}/${year}`);
    }
}
function charge(request) {
    const { amount, credit_card: creditCard } = request;
    const cardNumber = creditCard.credit_card_number;
    const numberValidation = cardValidator.number(cardNumber);
    if (!numberValidation.isValid) {
        throw new InvalidCreditCard();
    }
    const cardType = numberValidation.card ? numberValidation.card.type : 'unknown';
    // Only VISA and mastercard is accepted, other card types (AMEX, dinersclub) will
    // throw UnacceptedCreditCard error.
    if (!(cardType === 'visa' || cardType === 'mastercard')) {
        throw new UnacceptedCreditCard(cardType);
    }
    // Also validate expiration is > today.
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const { credit_card_expiration_year: year, credit_card_expiration_month: month } = creditCard;
    if ((currentYear * 12 + currentMonth) > (year * 12 + month)) {
        throw new ExpiredCreditCard(cardNumber.replace('-', ''), month, year);
    }
    logger.info(`Transaction processed: ${cardType} ending ${cardNumber.substr(-4)} \
      Amount: ${amount.currency_code}${amount.units}.${amount.nanos}`);
    return { transaction_id: (0, uuid_1.v4)() };
}
app.use(express_1.default.json());
app.post('/charge', (req, res) => {
    try {
        const { amount, credit_card } = req.body;
        if (!amount || !credit_card) {
            return res.status(400).json({ error: 'Invalid request payload' });
        }
        const response = charge({ amount, credit_card });
        res.json(response);
    }
    catch (error) {
        if (error instanceof CreditCardError) {
            return res.status(error.code).json({ error: error.message });
        }
        logger.error('Charge failed', error);
        res.status(500).json({ error: 'An unexpected error occurred during charging.' });
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
