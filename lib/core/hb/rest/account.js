/*  header-comment
    用户资产
/*  file   : account
/*  author : jerry.huang
/*  date   : 2018-1-3 14:10:40
/*  last   : 2018-1-4 15:19:29
*/
const BaseAPI = require('./base');
const apis = require('../config/apis');

class AccountAPI extends BaseAPI{
    constructor(option){
        super(option);
        this.accountAPIs = apis.rest.account;
    }

    /**
     * 查询当前用户的所有账户(即account-id)
     * 
     * @returns 
     * {
        "status": "ok",
        "data": [
            {
                "id": 100009,
                "type": "spot",     # spot：现货账户
                "state": "working", # working：正常, lock：账户被锁定
            }
            ]
        }
     * @memberof AccountAPI
     */
    async getAccounts(){
        return await this.call_api('GET', this.accountAPIs.accounts.path, {});
    }

    /**
     * 查询指定账户的余额
     * 
     * @param {any} account_id 
     * @returns 
     * {
        "status": "ok",
        "data": {
            "id": 100009,
            "type": "spot",
            "state": "working",
            "list": [
                {
                    "currency": "usdt",
                    "type": "trade",
                    "balance": "500009195917.4362872650"
                },
            ],
            }
        }
     * @memberof AccountAPI
     */
    async getBalance(account_id){
        let path = this.accountAPIs.balance.path.replace(':account_id', `${account_id}`);
        return await this.call_api('GET', path, {account_id:account_id});
    }
}

module.exports = AccountAPI;