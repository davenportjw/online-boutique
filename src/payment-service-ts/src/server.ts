import express, { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import * as cardValidator from 'card-validator';

const app = express();
const logger = pino({
  name: 'payment-service-ts',
  messageKey: 'message',
  formatters: {
    level (logLevelString, logLevelNum) {
      return { severity: logLevelString }
    }
  }
});

const PORT = process.env.PORT || 3001;

interface Money {
  currency_code: string;
  units: number;
  nanos: number;
}

interface CreditCardInfo {
  credit_card_number: string;
  credit_card_cvv: number;
  credit_card_expiration_year: number;
  credit_card_expiration_month: number;
}

interface ChargeRequest {
  amount: Money;
  credit_card: CreditCardInfo;
}

class CreditCardError extends Error {
    public code: number;
    constructor (message: string) {
      super(message);
      this.code = 400; // Invalid argument error
    }
}

class InvalidCreditCard extends CreditCardError {
    constructor () {
      super(`Credit card info is invalid`);
    }
}

class UnacceptedCreditCard extends CreditCardError {
    constructor (cardType: string) {
      super(`Sorry, we cannot process ${cardType} credit cards. Only VISA or MasterCard is accepted.`);
    }
}

class ExpiredCreditCard extends CreditCardError {
    constructor (number: string, month: number, year: number) {
      super(`Your credit card (ending ${number.substr(-4)}) expired on ${month}/${year}`);
    }
}

function charge(request: ChargeRequest) {
    const { amount, credit_card: creditCard } = request;
    const cardNumber = creditCard.credit_card_number;
    const numberValidation = cardValidator.number(cardNumber);

    if (!numberValidation.isValid) { throw new InvalidCreditCard(); }

    const cardType = numberValidation.card ? numberValidation.card.type : 'unknown';

    // Only VISA and mastercard is accepted, other card types (AMEX, dinersclub) will
    // throw UnacceptedCreditCard error.
    if (!(cardType === 'visa' || cardType === 'mastercard')) { throw new UnacceptedCreditCard(cardType); }

    // Also validate expiration is > today.
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const { credit_card_expiration_year: year, credit_card_expiration_month: month } = creditCard;
    if ((currentYear * 12 + currentMonth) > (year * 12 + month)) { throw new ExpiredCreditCard(cardNumber.replace('-', ''), month, year); }

    logger.info(`Transaction processed: ${cardType} ending ${cardNumber.substr(-4)} \
      Amount: ${amount.currency_code}${amount.units}.${amount.nanos}`);

    return { transaction_id: uuidv4() };
}

app.use(express.json());

app.post('/charge', (req: Request, res: Response) => {
  try {
    const { amount, credit_card } = req.body as ChargeRequest;

    if (!amount || !credit_card) {
      return res.status(400).json({ error: 'Invalid request payload' });
    }

    const response = charge({ amount, credit_card });
    res.json(response);
  } catch (error) {
    if (error instanceof CreditCardError) {
        return res.status(error.code).json({ error: error.message });
    }
    logger.error('Charge failed', error);
    res.status(500).json({ error: 'An unexpected error occurred during charging.' });
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
