"use strict";
const ServerStatModel = require(ROOT + '/lib/core/models/serverStat.js');
const Price = require(ROOT + '/lib/core/price.js');

module.exports.work = async function () {
    //await ServerStatModel.makeDefaultIfNeed();  // 初始化app更新说明
    await Price.makePrice();                    // 根据雅虎汇率作各个币种汇率价格
    await Price.makeKLinePrice();               // 根据汇率和xrp行情做k线
    Price.work();                               // 每个60分钟更新汇率，每个4秒更新k线价格
}
