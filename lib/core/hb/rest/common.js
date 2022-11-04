
const BaseAPI = require('./base');
const apis = require('../config/apis');

class CommonAPI extends BaseAPI{
    constructor(option){
        super(option);

        this.commonAPIs = apis.rest.common;
    }

    /**
     * GET /v1/common/symbols 查询系统支持的所有交易对及精度
     * 
     * @returns 
     * {
        "status": "ok",
        "data": [
            {
                "base-currency": "eth",
                "quote-currency": "usdt",
                "symbol": "ethusdt"
            }
            {
                "base-currency": "etc",
                "quote-currency": "usdt",
                "symbol": "etcusdt"
            }
        ]
        }
     * @memberof CommonAPI
     */
    async getSymbols(){
        let path = this.commonAPIs.symbols.path;
        return await this.call_api('GET', path, {});
    }

    /**
     * GET /v1/common/currencys 查询系统支持的所有币种
     * 
     * @returns 
     * {
        "status": "ok",
        "data": [
            "usdt",
            "eth",
            "etc"
        ]
        }
     * @memberof CommonAPI
     */
    async getCurrencys(){
        let path = this.commonAPIs.currencys.path;
        return await this.call_api('GET', path, {});
    }

    /**
     * GET /v1/common/timestamp 查询系统当前时间
     * 
     * @returns 
     * {
        "status": "ok",
        "data": 1494900087029
        }
     * @memberof CommonAPI
     */
    async getTimestamp(){
        let path = this.commonAPIs.timestamp.path;
        return await this.call_api('GET', path, {});
    }
}

module.exports = CommonAPI;