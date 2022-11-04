'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    lan: String,
    title: String,
    info: String,
    author: String,
    time: Date,
});

schema.index({ lan: 1 });
schema.index({ time: 1 });

class AdClass {
    constructor() {
    }
}

schema.loadClass(AdClass);
module.exports = mongoose.model('ad', schema);