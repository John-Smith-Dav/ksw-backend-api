'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    symbol: String,
    address: String,
    private_key: String,
    createTime: Date,
    uid: String,
});

schema.index({ uid: 1 });
schema.index({ address: 1 });
schema.index({ uid: 1, address: 1 });

class AddressClass {
    constructor() {
    }
}

schema.loadClass(AddressClass);
module.exports = mongoose.model('Address', schema);
