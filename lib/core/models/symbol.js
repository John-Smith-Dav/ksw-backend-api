'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    base_currency: String,
    quote_currency: String,
    price_precision: Number,
    amount_precision: Number,
    symbol: String,
    state: String,
    api_trading: String
});

schema.index({ symbol: 1 });
schema.index({ base_currency: 1 });

class SymbolClass {
    constructor() {
    }
}

schema.loadClass(SymbolClass);
module.exports = mongoose.model('symbol', schema);
