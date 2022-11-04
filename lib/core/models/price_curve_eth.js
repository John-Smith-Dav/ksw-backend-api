'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    seq: Number,
    price: Number,
    isUse: Boolean
});

schema.index({ isUse: 1 });
schema.index({ seq: 1 });

class PriceCurveEthClass {
    constructor() {
    }
}

schema.loadClass(PriceCurveEthClass);
module.exports = mongoose.model('price_curve_eth', schema);