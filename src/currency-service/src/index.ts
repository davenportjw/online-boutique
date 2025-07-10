import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.get('/currencies', (req, res) => {
  res.json({
    "EUR": {
      "units": 0,
      "nanos": 890000000
    },
    "USD": {
      "units": 1,
      "nanos": 80000000
    },
    "JPY": {
      "units": 130,
      "nanos": 270000000
    },
    "GBP": {
      "units": 0,
      "nanos": 780000000
    },
    "CAD": {
      "units": 1,
      "nanos": 310000000
    },
    "CHF": {
      "units": 0,
      "nanos": 960000000
    }
  });
});

app.listen(port, () => {
  console.log(`Currency service listening at http://localhost:${port}`);
});
