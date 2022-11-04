const restAPI = require('./rest');
const types = require('./types');

class Huobi {
    constructor(option){
        this.marketAPI = new restAPI.MarketAPI(option);
        this.accountAPI = new restAPI.AccountAPI(option);
        this.commonAPI = new restAPI.CommonAPI(option);
        this.orderAPI = new restAPI.OrderAPI(option);
    }
}

Huobi.types = types;

module.exports = Huobi;