"use strict";

const winston = require('winston');
const path = require('path');
const OptLogModel = require(ROOT + '/lib/core/models/optLog.js');
const AssetLogModel = require(ROOT + '/lib/core/models/assetLog.js');
const moment = require('moment');

tools.mkdir(path.join(settings.logger.program.dirname, settings.logger.program.filename));
global.plog = new (winston.Logger)({
    transports: [
        new (winston.transports.File)(settings.logger.program),
        new winston.transports.Console(),
    ]
});
tools.mkdir(path.join(settings.logger.customer.dirname, settings.logger.customer.filename));
global.clog = new (winston.Logger)({
    transports: [
        new (winston.transports.File)(settings.logger.customer)
    ]
});

global.writeLog = function() {
    plog.info([].slice.call(arguments).join(' '));
}

global.dbLog = async function(doc) {
    doc.time = Date.now();
    await new OptLogModel(doc).save();
}

global.assetLog = async function(from, to, symbol, amount, type, action, comment) {
    let assets = {};
    assets[symbol] = amount;
    await muiltiAssetLog(from, to, assets, type, action, comment)
}

global.muiltiAssetLog = async function(from, to, assets, type, action, comment) {
    let assetLogInfo = {
        from: from,
        to: to,
        assets: assets,
        type: type,
        action: action,
        comment: comment,
        time: Date.now(),
        time_str: moment().format("YYYYMMDD"),
    };
    await new AssetLogModel(assetLogInfo).save();
}
