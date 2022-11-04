const BaseAPI = require('./base');
const apis = require('../config/apis');

class MarketAPI extends BaseAPI{
    constructor(option){
        super(option);
        this.marketAPIs = apis.rest.market;
    }

    /**
     * GET /market/history/kline 获取K线数据
     *
     * @param {any} symbol 交易对  symbol 规则： 基础币种+计价币种。如BTC/USDT，symbol为btcusdt；ETH/BTC， symbol为ethbtc。以此类推
     * @param {any} period K线类型 1min, 5min, 15min, 30min, 60min, 1day, 1mon, 1week, 1year
     * @param {any} size  获取数量 [1,2000]
     * @returns
     * {
        "status": "ok",
        "ch": "market.btcusdt.kline.1day",
        "ts": 1499223904680,        24小时统计时间
        “data”: [
        {
            "id": K线id,
            "amount": 成交量,
            "count": 成交笔数,
            "open": 开盘价,
            "close": 收盘价,当K线为最晚的一根时，是最新成交价
            "low": 最低价,
            "high": 最高价,
            "vol": 成交额, 即 sum(每一笔成交价 * 该笔的成交量)
        },
        // more data here
        ]
        }
     * @memberof MarketAPI
     */
    async getKLines(symbol, period, size=150){
        let path = this.marketAPIs.kline.path;
        return await this.call_api('GET', path, {symbol:symbol, period:period, size:size});
    }

    /**
     * GET /market/detail/merged 获取聚合行情(Ticker)
     *
     * @param {any} symbol 交易对
     * @returns
     * "tick": {
            "id": K线id,
            "amount": 成交量,
            "count": 成交笔数,
            "open": 开盘价,
            "close": 收盘价,当K线为最晚的一根时，是最新成交价
            "low": 最低价,
            "high": 最高价,
            "vol": 成交额, 即 sum(每一笔成交价 * 该笔的成交量)
            "bid": [买1价,买1量],
            "ask": [卖1价,卖1量]
        }
     * @memberof MarketAPI
     */
    async getMerged(symbol){
        let path = this.marketAPIs.merged.path;
        let tmp = await this.call_api('GET', path, {symbol:symbol});
        return tmp;
    }

    /**
     * GET /market/depth 获取 Market Depth 数据
     *
     * @param {any} symbol 交易对
     * @param {any} type Depth类型 step0, step1, step2, step3, step4, step5（合并深度0-5）；step0时，不合并深度
     * @returns
     *  "tick": {
            "id": 消息id,
            "ts": 消息生成时间，单位：毫秒,
            "bids": 买盘,[price(成交价), amount(成交量)], 按price降序,
            "asks": 卖盘,[price(成交价), amount(成交量)], 按price升序
        }
     * @memberof MarketAPI
     */
    async getDepth(symbol, type){
        let path = this.marketAPIs.depth.path;
        return await this.call_api('GET', path, {symbol:symbol, type:type});
    }

    /**
     * GET /market/trade 获取 Trade Detail 数据
     *
     * @param {any} symbol
     * @returns
     * "tick": {
            "id": 消息id,
            "ts": 最新成交时间,
            "data": [
            {
                "id": 成交id,
                "price": 成交价钱,
                "amount": 成交量,
                "direction": 主动成交方向,buy/sell
                "ts": 成交时间
            }
            ]
        }
     * @memberof MarketAPI
     */
    async getTrade(symbol){
        let path = this.marketAPIs.trade.path;
        return await this.call_api('GET', path, {symbol:symbol});
    }

    /**
     * GET /market/history/trade 批量获取最近的交易记录
     *
     * @param {any} symbol      交易对
     * @param {number} [size=1] 获取交易记录的数量[1, 2000]
     * @returns
     * "data": {
            "id": 消息id,
            "ts": 最新成交时间,
            "data": [
            {
                "id": 成交id,
                "price": 成交价,
                "amount": 成交量,
                "direction": 主动成交方向,
                "ts": 成交时间
            }
            ]
        }
     * @memberof MarketAPI
     */
    async getTrades(symbol, size=1){
        let path = this.marketAPIs.historyTrade.path;
        return await this.call_api('GET', path, {symbol:symbol});
    }

    /**
     * GET /market/detail 获取 Market Detail 24小时成交量数据
     *
     * @param {any} symbol 交易对
     * @returns
     * "tick": {
            "id": 消息id,
            "ts": 24小时统计时间,
            "amount": 24小时成交量,
            "open": 前推24小时成交价,
            "close": 当前成交价,
            "high": 近24小时最高价,
            "low": 近24小时最低价,
            "count": 近24小时累积成交数,
            "vol": 近24小时累积成交额, 即 sum(每一笔成交价 * 该笔的成交量)
        }
     * @memberof MarketAPI
     */
    async getDetail(symbol){
        let path = apis.rest.market.detail.path;
        return await this.call_api('GET', path, {symbol:symbol});
    }
}

module.exports = MarketAPI;