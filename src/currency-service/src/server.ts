import express, { Request, Response } from 'express';
import * as path from 'path';

const app = express();
app.use(express.json());

const currencyData = require('./data/currency_conversion.json');

app.get('/currencies', (req: Request, res: Response) => {
  res.json(Object.keys(currencyData));
});

app.post('/convert', (req: Request, res: Response) => {
  const { from, toCode } = req.body;

  if (!from || !toCode || !from.currencyCode || from.units === undefined || from.nanos === undefined) {
    return res.status(400).send('Invalid request');
  }

  if (!currencyData[from.currencyCode] || !currencyData[toCode]) {
    return res.status(400).send('Unsupported currency');
  }

  const euros = {
    units: from.units / currencyData[from.currencyCode],
    nanos: from.nanos / currencyData[from.currencyCode]
  };

  const result = {
    units: euros.units * currencyData[toCode],
    nanos: euros.nanos * currencyData[toCode],
    currencyCode: toCode
  };

  res.json(result);
});

export default app;
