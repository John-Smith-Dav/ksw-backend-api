'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    address: String,
    secret: String,
    trustgateway: Boolean,
    active: Boolean,
    bind: Boolean,
    deposit: Boolean,
    conv: Boolean,
});

schema.index({ address: 1 });

class TestInfoClass {
    constructor() {
    }
}

schema.loadClass(TestInfoClass);
module.exports = mongoose.model('testinfo', schema);
