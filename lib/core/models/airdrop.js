'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    symbol: String,
    uid: String,
    amount: Number,
    btcamount: Number,
    block: Number,
    txid: String,
    btctxid: String,
    time: Date,
    status: String,
    tx_code: String,
});

schema.index({ symbol: 1 });
schema.index({ uid: 1 });
schema.index({ amount: 1 });
schema.index({ btcamount: 1 });
schema.index({ block: 1 });
schema.index({ txid: 1 });
schema.index({ btctxid: 1 });
schema.index({ time: 1 });
schema.index({ status: 1 });
schema.index({ tx_code: 1 });

class AirDropClass {
    constructor() {
    }

    static async withdrawReconfirm(tx) {
    }
}

schema.loadClass(AirDropClass);
let es = mongoose.model('airdrop', schema);
es.completed = "completed"; // 转账完成
es.waiting = "waiting"; // 已经发出转账，等待确认中
es.empty = "";  // 还没有转账
es.failed = "failed";   // 完全失败
module.exports = es;