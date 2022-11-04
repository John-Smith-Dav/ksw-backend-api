'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    opt_uid: String,
    opt_key: String,
    src_uid: String,
    src_address: String,
    dst_uid: String,
    dst_address: String,
    symbol: String,
    amount: mongoose.Types.Decimal128,
    txid: String,
    price: mongoose.Types.Decimal128,
    msg: String,
    result: String,
    time: Date,
});

schema.index({ opt_uid: 1 });
schema.index({ opt_key: 1 });
schema.index({ src_uid: 1 });
schema.index({ dst_address: 1 });
schema.index({ txid: 1 });
schema.index({ time: 1 });

class OptLogClass {
    constructor() {
    }
}

schema.loadClass(OptLogClass);
module.exports = mongoose.model('OptLog', schema);
