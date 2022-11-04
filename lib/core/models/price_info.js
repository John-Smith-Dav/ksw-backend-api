'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    symbol: String,
    price: Number,
});

schema.index({ address: 1 });

class PriceClass {
    constructor() {
    }
}

schema.loadClass(PriceClass);
module.exports = mongoose.model('price', schema);
