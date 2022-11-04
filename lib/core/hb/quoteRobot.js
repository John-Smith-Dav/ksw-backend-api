"use strict";

const Huobi = require('huobi.js');
const decimal = require('decimal.js');
const rp = require('request-promise');
const activeAddress = settings.activeAddress;
const usdtGateway = settings.usdtGateway;    // USDT 网关

const robotSell = {};
robotSell.account= "k1NHxzohwti3mLaYxfKmwXpKZyFM2T2T8";
robotSell.seed = "sEdVoxSgb8pxVQyznYovkvTFhzaSkiH";
robotSell.direct = "sell";

const robotBuy = {};
robotBuy.account= "kBwHxJncQAQ9H3pticq4tZZvUemhbcRYdJ";
robotBuy.seed = "sEdTE2gF3TxPzyh8x9ChgaEXZbDYbz1";
robotBuy.direct = "buy";

/**
 * 周期间隔
 * @return {number}
 */
function curvePeriod() {
    // 曲线周期间隔3000 + 随机数 毫秒
    return 3000 + Math.ceil(Math.random()*10000);
}

function doQuote() {

}

module.exports.cancelOrder = async function () {

}

module.exports.workBTC_USDT = async function () {

}

module.exports.workETH_USDT = async function () {

}

module.exports.workUNI_USDT = async function () {

}