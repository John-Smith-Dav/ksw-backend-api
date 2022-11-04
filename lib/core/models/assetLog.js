'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    from: String,
    to: String,
    assets: {},
    type: String,
    action: String,
    comment: String,
    time: Date,
    time_str: String,
});

schema.index({ from: 1 });
schema.index({ to: 1 });
schema.index({ type: 1 });
schema.index({ action: 1 });
schema.index({ comment: 1 });
schema.index({ time: 1 });

class AssetLogClass {
    constructor() {
    }
}

schema.loadClass(AssetLogClass);
module.exports = mongoose.model('asset_log', schema);
