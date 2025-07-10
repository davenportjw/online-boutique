"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
const currencyData = require('./data/currency_conversion.json');
app.get('/currencies', (req, res) => {
    res.json(Object.keys(currencyData));
});
app.post('/convert', (req, res) => {
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
exports.default = app;
