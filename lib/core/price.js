"use strict";
const PriceModel = require(ROOT + '/lib/core/models/price_info.js');
const rp = require('request-promise');

let priceTable = {
    'usd': 0,
    'eur': 0,
    'rub': 0,
    'usdt': 0
}
let priceSet = {
    // 美元人民币价格
    'usd': 'https://query1.finance.yahoo.com/v8/finance/chart/CNY=X?region=US&lang=en-US&includePrePost=false&interval=3mo&range=1d&corsDomain=finance.yahoo.com&.tsrc=finance',
    // 欧元美元价格
    'eur': 'https://query1.finance.yahoo.com/v8/finance/chart/EURUSD=X?region=US&lang=en-US&includePrePost=false&interval=3mo&range=1d&corsDomain=finance.yahoo.com&.tsrc=finance',
    // 卢布美元价格
    'rub': 'https://query1.finance.yahoo.com/v8/finance/chart/RUBUSD=X?region=US&lang=en-US&includePrePost=false&interval=3mo&range=1d&corsDomain=finance.yahoo.com&.tsrc=finance',
    // usdt美元价格
    'usdt': 'https://query1.finance.yahoo.com/v8/finance/chart/USDT-USD?region=US&lang=en-US&includePrePost=false&interval=3mo&range=1d&corsDomain=finance.yahoo.com&.tsrc=finance'
}
// 各个币种价格
let klinePriceTable = {
    'ksw': 0,
    'btc': 0,
    'eth': 0
}
// 根据ksw对usdt的价格k线，取得ksw对应各个币种的价格
let klineSet = {
    'ksw': {
        url:'http://192.168.95.200:9003/service/quote?name=ksw', //Kline服务
        father: 'ksw',
        left: 'KSW',
        right: 'USDT',
    },
    'btc': {
        url:'http://192.168.95.200:9003/service/quote?name=ksw', //Kline服务
        father: 'btc',
        left: 'BTC',
        right: 'USDT',
    },
    'eth': {
        url:'http://192.168.95.200:9003/service/quote?name=ksw', //Kline服务
        father: 'eth',
        left: 'ETH',
        right: 'USDT',
    }
}

module.exports.work = async function () {
    this.workExtPrice();    // 美元，欧元等价格生成
    this.workKLine();       // ksw价格生成
}

module.exports.workExtPrice = async function () {
    while(true){
        try{
            plog.info("workExtPrice 美元，欧元等价格生成")
            await this.makePrice();
        }catch(e){
            plog.info("UPDATE PRICE ERR:" + e);
        }finally{
            await tools.sleep(1000*5*60);
        }
    }
}

module.exports.workKLine = async function () {
    while(true){
        try{
            plog.info("workKLine ksw价格生成")
            await this.makeKLinePrice();
        }catch(e){
            plog.info("UPDATE workKLine ERR:" + e);
        }finally{
            await tools.sleep(1000*4);
        }
    }
}

module.exports.makePrice = async function () {
    plog.info("start makePrice")
    for (let key in priceSet) {
        try {
            const element = priceSet[key];
            // 这个rq总是雅虎接口取出超时，所以加入了异常处理，如果异常了，那么从数据库取单价
            plog.info("开始访问雅虎： " + encodeURI(element))
            let usdtRes = await rp({
                uri: encodeURI(element),
                method: 'GET',
                json: true,
                timeout: 5000
            });
            plog.info("访问雅虎结束： " + usdtRes)
            let price = 0;
            price = usdtRes['chart']['result'][0]['meta'].regularMarketPrice;
            plog.info("makePrice: [" + key + "]:" + price);
            priceTable[key] = price;
            await PriceModel.updateOne({symbol: key}, {$set: {symbol: key, price: price}}, {'upsert': true});
        }catch (e) {
            console.log(e);
            PriceModel.findOne({symbol: key}).then(data => {
                priceTable[key] = data.price;
            });
        }

    }

}

// 根据ksw的quote XRP对USDT行情，生成KSW实时价格
module.exports.makeKLinePrice = async function () {
    plog.info("start makeKLinePrice")
    for (let key in klineSet) {
        const element = klineSet[key];
        let usdtRes = await rp({
            uri: encodeURI(element.url),
            method: 'GET',
            json: true,
            timeout: 5000
        });
        let price = 0;
        let found = false;
        let quote = usdtRes['data'];
        for (const plateName in quote) {
            const plates = quote[plateName];
            if (plates[element.father]) {
                for (let index = 0; index < plates[element.father].length; index++) {
                    const market = plates[element.father][index];
                    if (market.left.currency == element.left && market.right.currency == element.right) {
                        price = parseFloat(market.price);
                        found = true;
                        break;
                    }
                }
            }
            if (found) {
                break;
            }
        }
        plog.info("["+key+"]:"+ price);
        klinePriceTable[key] = price;
        await PriceModel.updateOne({symbol: key}, {$set:{symbol: key, price: price}}, {'upsert': true});
    }
}

/**
 *
 * @param digitalCurrencyName 数字货币名字
 * @param symbol 法币代码
 * @return {Promise<*>}
 */
module.exports.getPrice = async function(digitalCurrencyName, symbol) {
    // 取得各个数字货币对应usdt的价格
    let usdtPrice = klinePriceTable[digitalCurrencyName];
    return this.rawGetPrice(usdtPrice, symbol);
}

// 已取得的ksw的usdt价格，变成美元价格
// 1美元 = 0.9996 usdt
module.exports.rawGetPrice = function(usdtPrice, symbol) {
    // usdt价格转成美元
    usdtPrice = usdtPrice / priceTable['usdt'];
    if (symbol == 'cny') {
        return priceTable['usd'] * usdtPrice;
    } else if (symbol == 'usd') {
        return usdtPrice;
    } else {
        return usdtPrice / priceTable[symbol];
    }
}

module.exports.rawGetUsdtPrice = function(symbol) {
    if (symbol == 'cny') {
        return priceTable['usd'] * (1/priceTable['usdt']);
    } else if (symbol == 'usd') {
        return (1/priceTable['usdt']);
    } else {
        return (1/priceTable['usdt']) / priceTable[symbol];
    }
}