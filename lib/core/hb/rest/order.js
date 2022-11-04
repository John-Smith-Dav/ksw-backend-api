const BaseAPI = require('./base');
const apis = require('../config/apis');
const _ = require('lodash');

class OrderAPI extends BaseAPI{
    constructor(option){
        super(option);

        this.orderAPIs = apis.rest.order;
    }

    /**
     * POST /v1/order/orders/place 下单
     * 
     * @param {any} account_id 账户 ID，使用accounts方法获得。币币交易使用‘spot’账户的accountid；借贷资产交易，请使用‘margin’账户的accountid
     * @param {any} amount 限价单表示下单数量，市价买单时表示买多少钱，市价卖单时表示卖多少币
     * @param {any} price 下单价格，市价单不传该参数
     * @param {any} source 订单来源:api，如果使用借贷资产交易，请填写‘margin-api’
     * @param {any} symbol 交易对
     * @param {any} type 订单类型 buy-market：市价买, sell-market：市价卖, buy-limit：限价买, sell-limit：限价卖
     * @returns 
     * {
        "status": "ok",
        "data": "59378" 订单ID
        }
     * @memberof OrderAPI
     */
    async place(account_id, amount, price, symbol, type, source='api'){
        let path = this.orderAPIs.place.path;

        return await this.call_api('POST', path, {'account-id':account_id, 
            amount, 
            price, 
            source, 
            symbol, 
            type});
    }

    /**
     * POST /v1/order/orders/{order-id}/submitcancel 申请撤销一个订单请求
     * 
     * @param {any} order_id 订单ID，填在path中
     * @returns 
     * {
        "status": "ok",//注意，返回OK表示撤单请求成功。订单是否撤销成功请调用订单查询接口查询该订单状态
        "data": "59378"//订单ID
        }
     * @memberof OrderAPI
     */
    async cancel(order_id){
        let path = this.orderAPIs.cancel.path.replace(':order_id', order_id);
        return await this.call_api('POST', path, {'order-id': order_id});
    }

    /**
     * POST /v1/order/orders/batchcancel 批量撤销订单
     * 
     * @param {any} order_ids  撤销订单ID列表,单次不超过50个订单id
     * @returns 
     * {
        "status": "ok",
        "data": {
            "success": [
                "1",
                "3"
            ],
            "failed": [
                {
                    "err-msg": "记录无效",
                    "order-id": "2",
                    "err-code": "base-record-invalid"
                }
            ]
        }
        }
     * @memberof OrderAPI
     */
    async cancels(order_ids){
        if(!_.isArray(order_ids)){
            throw new Error('order_ids must be array!');
        }

        let path = this.orderAPIs.cancels.path;
        return await this.call_api('POST', path, {'order-ids': order_ids});
    }

    /**
     * GET /v1/order/orders/{order-id} 查询某个订单详情
     * 
     * @param {any} order_id 订单ID
     * @returns 
     * 
        "status": "ok",
        "data": {
            "id": 59378,                            //订单ID
            "symbol": "ethusdt",
            "account-id": 100009,
            "amount": "10.1000000000",              //订单数量
            "price": "100.1000000000",              //订单价格
            "created-at": 1494901162595,
            "type": "buy-limit",        
            "field-amount": "10.1000000000",        //已成交数量
            "field-cash-amount": "1011.0100000000", //已成交总金额
            "field-fees": "0.0202000000",           //已成交手续费（买入为币，卖出为钱）
            "finished-at": 1494901400468,           //最后成交时间
            "source": "api",                        //订单来源
            "state": "filled",                      //订单状态:pre-submitted 准备提交, submitting , submitted 已提交, partial-filled 部分成交, partial-canceled 部分成交撤销, filled 完全成交, canceled 已撤销
            "canceled-at": 0,                       //订单撤销时间
            "exchange": "huobi",
            "batch": ""
        }
     * @memberof OrderAPI
     */
    async getOrder(order_id){
        let path = this.orderAPIs.detail.path.replace(':order_id',order_id);
        return await this.call_api('GET', path, {'order-id': order_id});
    }

    /**
     * GET /v1/order/orders 查询当前委托、历史委托
     * 
     * @param {any} symbol 交易对 - 必填
     * @param {any} states 查询的订单状态组合，使用','分割 - 必填 ： pre-submitted 准备提交, submitted 已提交, partial-filled 部分成交, partial-canceled 部分成交撤销, filled 完全成交, canceled 已撤销
     * @param {any} types  查询的订单类型组合，使用','分割：buy-market：市价买, sell-market：市价卖, buy-limit：限价买, sell-limit：限价卖
     * @param {any} start_date  查询开始日期, 日期格式yyyy-mm-dd
     * @param {any} end_date  查询结束日期, 日期格式yyyy-mm-dd
     * @param {any} from  查询起始 ID
     * @param {any} direct 查询方向		prev 向前，next 向后
     * @param {any} size 查询记录大小
     * @returns 
     * {
        "status": "ok",
        "data": [
            {
                "id": 59378,
                "symbol": "ethusdt",
                "account-id": 100009,
                "amount": "10.1000000000",              订单数量	
                "price": "100.1000000000",
                "created-at": 1494901162595,            订单创建时间
                "type": "buy-limit",
                "field-amount": "10.1000000000",        已成交数量
                "field-cash-amount": "1011.0100000000", 已成交总金额
                "field-fees": "0.0202000000",           已成交手续费（买入为币，卖出为钱）
                "finished-at": 1494901400468,           最后成交时间
                "user-id": 1000,
                "source": "api",
                "state": "filled",                      订单状态
                "canceled-at": 0,
                "exchange": "huobi",
                "batch": ""
            }
        ]
        }
     * @memberof OrderAPI
     */
    async getOrders(symbol, states, types, start_date, end_date, from, direct, size){
        if(!symbol || !states){
            throw new Error("symbol and states must not be null!");
        }
        let path = this.orderAPIs.list.path;
        let param = {symbol, states};
        types && (param.types = types);
        start_date && (param['start-date'] = start_date);
        end_date && (param['end-date'] = end_date);
        from && (param.types = from);
        direct && (param.types = direct);
        size && (param.types = size);

        return await this.call_api('GET', path, param);
    }


    /**
     * GET /v1/order/orders/{order-id}/matchresults 查询某个订单的成交明细
     * 
     * @param {any} order_id 
     * @returns 
     * {
        "status": "ok",
        "data": [
            {
            "id": 29553,            //订单成交记录ID
            "order-id": 59378,
            "match-id": 59335,      //撮合ID
            "symbol": "ethusdt",
            "type": "buy-limit",
            "source": "api",
            "price": "100.1000000000",
            "filled-amount": "9.1155000000",    //成交数量
            "filled-fees": "0.0182310000",      //成交手续费
            "created-at": 1494901400435         //成交时间
            }
        ]
        }
     * @memberof OrderAPI
     */
    async getMatch(order_id){
        let path = this.orderAPIs.match.path.replace(':order_id', order_id);
        return await this.call_api('GET', path, {'order-id': order_id});
    }

    /**
     * GET /v1/order/matchresults 查询当前成交、历史成交
     * 
     * @param {any} symbol 交易对 - 必填
     * @param {any} types  查询的订单类型组合，使用','分割：buy-market：市价买, sell-market：市价卖, buy-limit：限价买, sell-limit：限价卖
     * @param {any} start_date  查询开始日期, 日期格式yyyy-mm-dd
     * @param {any} end_date  查询结束日期, 日期格式yyyy-mm-dd
     * @param {any} from  查询起始 ID
     * @param {any} direct 查询方向		prev 向前，next 向后
     * @param {any} size 查询记录大小
     * @returns 
     * {
        "status": "ok",
        "data": [
            {
                "id": 29555,
                "order-id": 59378,
                "match-id": 59335,
                "symbol": "ethusdt",
                "type": "buy-limit",
                "source": "api",
                "price": "100.1000000000",
                "filled-amount": "0.9845000000",
                "filled-fees": "0.0019690000",
                "created-at": 1494901400487
            }
        ]
        }
     * @memberof OrderAPI
     */
    async getMatchs(symbol, types, start_date, end_date, from, direct, size){
        if(!symbol){
            throw new Error("symbol must not be null!");
        }
        let path = this.orderAPIs.matchs.path;
        let param = {symbol};
        types && (param.types = types);
        start_date && (param['start-date'] = start_date);
        end_date && (param['end-date'] = end_date);
        from && (param.types = from);
        direct && (param.types = direct);
        size && (param.types = size);
        return await this.call_api('GET', path, param);
    }
}

module.exports = OrderAPI;