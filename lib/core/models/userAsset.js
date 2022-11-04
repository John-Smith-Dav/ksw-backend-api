'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    uid: String,
    phone: String,
    mail:String,
    address:String,
    inviter: {type : String, default : ""},
    name: String,
    token_auth: String,
    transfer_enable: Boolean,
    black: {type : Boolean, default : false},
    x_children:[],
    y_children:[],
    x_js_achnum: {type : Number, default : 0},
    y_js_achnum: {type : Number, default : 0},
    x_wk_achnum: {type : Number, default : 0},
    y_wk_achnum: {type : Number, default : 0},
    total_wk_achnum: {type : Number, default : 0},
    x_wk_power: {type : Number, default : 0},
    y_wk_power: {type : Number, default : 0},
    x_power: {type : Number, default : 0},  // 自己的持币算力
    x_power_rank: {type : Number, default : 0}, // 持币算力排名
    x_coinage_bonus_power: {type : Number, default : 0}, // 持币算力币龄加成
    x_coinage_bonus_power_rate: {type : Number, default : 0}, // 持币算力币龄加成比例
    y_power_bonus: {type : Number, default : 0}, // 持币y算力加成
    y_power_bonus_rate: {type : Number, default : 0}, // 持币y算力加成比例
    y_power: {type : Number, default : 0},  // 自己的推广算力
    y_power_rank: {type : Number, default : 0}, // 推广算力排名
    coin_age: {type : Number, default : 0}, // 币龄
    _7day_total_profit: [], // 7天总收益
    last_balance: {type : Number, default : 0}, // 上一次结算的余额
    balance: {type : Number, default : 0}, // 实时的余额
    inviter_code_x: {type : String, default : ""},
    inviter_code_y: {type : String, default : ""},
    asset: {},
    freeze_asset: {},
    lock_asset: {},
    lock_type: { type: Number, default: 0 },
    create_time: Date,
    token_despire: Date,
    withdraw_time: { type: Date, default: 0 },
    withdraw_count: { type: Number, default: 0 },
    bawang: Boolean,
    secret: {type : String, default : ""},
    lock_abs: { type: Number, default: 0 },
    lock_bld: { type: Number, default: 0 },
    debt_abs: {type : Number, default : 0},
    conv_unlimited: { type: Boolean, default: false},
});

schema.index({ uid: 1 });
schema.index({ name: 1 });
schema.index({ phone: 1 });
schema.index({ token_auth: 1 });
schema.index({ uid: 1, token_auth: 1 });
schema.index({ address: 1});
schema.index({ inviter_code_x: 1});
schema.index({ inviter_code_y: 1});

class UserAssetClass {
    constructor() {
    }

    static getCollection()
    {
        return this.collection.initializeOrderedBulkOp();
    } 

    static async checkBalance(symbol, uid, amount) {
        let condition = { uid: uid };
        condition['asset.' + symbol] = { $gte: mongoose.Types.Decimal128.fromString(amount) };
        let userAsset = await this.findOne(condition);
        return userAsset;
    }
  
    /*
    findOneAndUpdate({
            'uid': 1001,
            'freeze_asset.btc.reason': { $eq: 0 }
        }, {
            $unset: { 'freeze_asset.btc.reason' }
        })
    */
    static async unsetZeroField(uid, field) {
        let condition = { uid: uid };
        condition[field] = { $eq: mongoose.Types.Decimal128.fromString("0") };

        let update = { $unset: {} };
        update['$unset'][field] = '';
        await this.update(condition, update);
    }

    static async unsetField(uid, field) {
        let condition = { uid: uid };

        let update = { $unset: {} };
        update['$unset'][field] = '';
        await this.update(condition, update);
    }
    
    /*
     findOneAndUpdate({
            'uid': 1001,
        }, {
            $inc: { 'asset.btc': amount }
        })
    */
    static async addAsset(symbol, uid, amount, logKey, logMsg = "") {
        if (amount <= 0 || !symbol || !uid || !logKey) {
            return;
        }

        let update = { $inc: {} };
        update['$inc']['asset.' + symbol] = mongoose.Types.Decimal128.fromString(amount);

        let result = await this.findOneAndUpdate({ uid: uid }, update);
        if (result) {
            writeLog('add_asset', symbol, uid, amount, logKey, logMsg);
            assetLog(0, uid, symbol, amount, "add_asset", logKey, logMsg);
        } else {
            writeLog('add_asset failed', symbol, uid, amount, logKey, logMsg);
        }

        return result;
    }

    /*
     findOneAndUpdate({
            'uid': 1001,
        }, {
            $inc: { 'asset.btc': -amount }
        })
    */
    static async decAsset(symbol, uid, amount, source, logKey, logMsg = "") {
        if (amount <= 0 || !symbol || !uid || !source || !logKey) {
            return;
        }

        let incAmount = mongoose.Types.Decimal128.fromString(amount);
        let decAmount = mongoose.Types.Decimal128.fromString('-' + amount);
        
        let assetField;
        if (source) {
            assetField = 'freeze_asset.' + symbol + '.' + source;
        } else {
            assetField = 'asset.' + symbol;
        }

        let condition = {};
        condition['uid'] = uid;
        condition[assetField] = { $gte: incAmount };

        let update = { $inc: {} };
        update['$inc'][assetField] = decAmount;

        let result = await this.findOneAndUpdate(condition, update);
        if (result) {
            writeLog('dec_asset', symbol, uid, amount, source, logKey, logMsg);
            assetLog(uid, 0, symbol, amount, "dec_asset", logKey, logMsg + source);
        } else {
            writeLog('dec_asset failed', symbol, uid, amount, source, logKey, logMsg);
        }

        return result;
    }

    /*
        冻结可用资产：减可用资产，增加冻结资产
        findOneAndUpdate({
            'uid': 1001,
            'asset.btc': { $gte: amount }
        }, {
            $inc: {
                'freeze_asset.btc.reason': amount
                'asset.btc': -amount
            }
        })
        冻结冻结资产
        findOneAndUpdate({
            'uid': 1001,
            'freeze_asset.btc.source': { $gte: amount }
        }, {
            $inc: {
                'freeze_asset.btc.reason': amount,
                'freeze_asset.btc.source': -amount
            }
        })
    */
    static async freezeAsset(symbol, uid, reason, amount, source, logKey, logMsg = "") {
        if (amount <= 0 || !reason || !symbol || !uid || !logKey) {
            return false;
        }
        
        let incAmount = mongoose.Types.Decimal128.fromString(amount.toString());
        let decAmount = mongoose.Types.Decimal128.fromString('-' + amount);
        let freezeAssetField = 'freeze_asset.' + symbol + '.' + reason;
        let sourceAssetField;
        let condition = {};
        let update = { $inc: {} };
        if (source) {
            sourceAssetField = 'freeze_asset.' + symbol + '.' + source;
        } else {
            sourceAssetField = 'asset.' + symbol;
        }

        condition['uid'] = uid;
        condition[sourceAssetField] = { $gte: incAmount };

        update['$inc'][freezeAssetField] = incAmount;
        update['$inc'][sourceAssetField] = decAmount;
        let result = await this.findOneAndUpdate(condition, update);

        if (result) {
            writeLog('freeze_asset', symbol, uid, reason, amount, source, logKey, logMsg);
            assetLog(uid, uid, symbol, amount, "freeze_asset", logKey, logMsg + source + '->' + reason);
        } else {
            writeLog('freeze_asset failed', symbol, uid, reason, amount, source, logKey, logMsg);
        }

        return result;
    }

    /*
        解冻资产，减冻结资产，增加可用资产
        findOneAndUpdate({
            'uid': 1001,
            'freeze_asset.btc.reason': { $gte: amount }
        }, {
            $inc: {
                'asset.btc': amount,
                'freeze_asset.btc.reason': -amount
            }
        })
    */
    static async defreezeAsset(symbol, uid, reason, amount, logKey, logMsg) {
        if (parseFloat(amount) < 0) {
            return false;
        }
        
        let incAmount = mongoose.Types.Decimal128.fromString(amount);
        let decAmount = mongoose.Types.Decimal128.fromString('-' + amount);

        let assetField = 'asset.' + symbol;
        let freezeAssetField = 'freeze_asset.' + symbol + '.' + reason;
        let condition = {};
        let update = { $inc: {} };

        condition['uid'] = uid;
        condition[freezeAssetField] = { $gte: incAmount};

        update['$inc'][freezeAssetField] = decAmount;
        update['$inc'][assetField] = incAmount;
        let result = await this.findOneAndUpdate(condition, update);

        if (result) {
            await this.unsetZeroField(uid, freezeAssetField);
            writeLog('defreeze_asset', symbol, uid, reason, amount, logKey, logMsg);
            assetLog(uid, uid, symbol, amount, "defreeze_asset", logKey, logMsg + reason);
        } else {
            writeLog('defreeze_asset failed', symbol, uid, reason, amount, logKey, logMsg);
        }

        return result;
    }

    static async transferFrozenAsset(symbol, from, to, amount, source, logKey, logMsg = "") {
        let assets = {};
        assets[symbol] = amount;
        return await this.transferMultiAsset(from, to, assets, source, logKey, logMsg);
    }

    static async transferAsset(symbol, from, to, amount, logKey, logMsg = "") {
        let assets = {};
        assets[symbol] = amount;
       return await this.transferMultiAsset(from, to, assets, null, logKey, logMsg);
    }

    /*
        转移资产：先减资产，再加目标资产
        assets: [{pyc:10}, {xxx:100}]
        findOneAndUpdate({
            'uid': 1001,
            'asset.btc': { $gte: amount },
            'asset.xxx': { $gte: amount }
        }, {
            $inc: { 'asset.btc': -amount }
            $inc: { 'asset.xxx': -amount }
        })
        findOneAndUpdate({
            'uid': 1001,
        }, {
            $inc: { 'asset.btc': amount }
            $inc: { 'asset.xxx': amount }
        })
        方法2：加资产时，1、给目标帐号设置temp字段。2、根据temp字段，加余额，清空temp字段。就算1，2两步调用多次，也不会被刷钱
    */
    static async transferMultiAsset(from, to, assets, source, logKey, logMsg) {
        let users = await this.find({ $or: [ {uid: from}, {uid: to} ] });
        if (users.length != 2) {
            writeLog('transfer_asset uid error', from, to, JSON.stringify(assets), source, logKey, logMsg);
            return false;
        }

        let fromCondition = { uid: from };
        let fromUpdate = { $inc: {} };
        let toUpdate = { $inc: {} };
        let sourceAssetFieldList = [];

        for (let symbol in assets) {
            let amount = assets[symbol].toString();
            let incAmount = mongoose.Types.Decimal128.fromString(amount.toString());
            let noamount = -1.0*parseFloat(amount);
            let decAmount = mongoose.Types.Decimal128.fromString(noamount.toString());
            let assetField = 'asset.' + symbol;
            let sourceAssetField;
            if (source) {
                sourceAssetField = 'freeze_asset.' + symbol + '.' + source;
            } else {
                sourceAssetField = 'asset.' + symbol;
            }
            sourceAssetFieldList.push(sourceAssetField);
            fromCondition[sourceAssetField] = { $gte: incAmount };
            fromUpdate['$inc'][sourceAssetField] = decAmount;
            toUpdate['$inc'][assetField] = incAmount;
        }

        if (!await this.findOneAndUpdate(fromCondition, fromUpdate)) {
            writeLog('transfer_asset from failed', from, to, JSON.stringify(assets), source, logKey, logMsg);
            return false;
        }

        try {
            if (!await this.findOneAndUpdate( { uid: to }, toUpdate)) {
                writeLog('transfer_asset to failed', from, to, JSON.stringify(assets), source, logKey, logMsg);
                return false;
            }
        } catch (ex) {
            writeLog('transfer_asset to exception', from, to, JSON.stringify(assets), source, logKey, logMsg);
            return false;
        }

        for (let i in sourceAssetFieldList) {
            this.unsetZeroField(from, sourceAssetFieldList[i]);
        }
        let tmp = await this.findOne({uid:from});
        global.userlist[from].asset = tmp.asset;
        global.userlist[from].freeze_asset = tmp.freeze_asset;
        tmp = await this.findOne({uid:to});
        // plog.info("###########################################");
        // plog.info(parseInt(global.userlist[to].asset.del2));
        // plog.info("###########################################");
        global.userlist[to].asset = tmp.asset;
        global.userlist[to].freeze_asset = tmp.freeze_asset;
        // plog.info(parseInt(global.userlist[to].asset.del2));

        if(logKey == "freeze")
            for (let symbol in assets) {
                assets[symbol] = parseFloat(assets[symbol]);
            }
        writeLog('transfer_asset', from, to, JSON.stringify(assets), source, logKey, logMsg);
        muiltiAssetLog(from, to, assets, "transfer_asset", logKey, logMsg + source);

        return true;
    }

    static async lockAsset(symbol, uid, amount, logKey, logMsg) {
        let incAmount = mongoose.Types.Decimal128.fromString(amount);
        let decAmount = mongoose.Types.Decimal128.fromString('-' + amount);
        let assetField = 'asset.' + symbol;
        let lockAssetField = 'lock_asset.' + symbol;
        let condition = { uid: uid };
        let update = { $inc: {} };
        condition[assetField] = { $gte: decAmount };
        update['$inc'][assetField] = decAmount;
        update['$inc'][lockAssetField] = incAmount;

        if (!await this.findOneAndUpdate(condition, update)) {
            writeLog('lock_asset failed', uid, symbol, amount, logKey, logMsg);
            return false;
        } else {
            writeLog('lock_asset', symbol, uid, amount, logKey, logMsg);
            assetLog(uid, uid, symbol, amount, "lock_asset", logKey, logMsg);
            return true;
        }
    }

    static async unlockAsset(symbol, uid, amount, logKey, logMsg) {
        let incAmount = mongoose.Types.Decimal128.fromString(amount);
        let decAmount = mongoose.Types.Decimal128.fromString('-' + amount);
        let assetField = 'asset.' + symbol;
        let lockAssetField = 'lock_asset.' + symbol;
        let condition = { uid: uid };
        let update = { $inc: {} };
        condition[lockAssetField] = { $gte: incAmount };
        update['$inc'][assetField] = incAmount;
        update['$inc'][lockAssetField] = decAmount;

        if (!await this.findOneAndUpdate(condition, update)) {
            writeLog('unlock_asset failed', uid, symbol, amount, logKey, logMsg);
            return false;
        } else {
            writeLog('unlock_asset', symbol, uid, amount, logKey, logMsg);
            assetLog(uid, uid, symbol, amount, "unlock_asset", logKey, logMsg);
            return true;
        }
    }

    static async setLevel(uid, level) {
        if (!await this.findOneAndUpdate({uid: uid}, {$set:{level: level}})) {
            writeLog('setLevel failed', uid, level);
            return false;
        } else {
            return true;
        }
    }

    static async transferFieldValue(from, to, fromfield, tofiled, amount, logKey, logMsg) {
        let users = await this.find({ $or: [ {uid: from}, {uid: to} ] });
        if (users.length != 2) {
            plog.error('transferFieldValue uid error', from, to, fromfield, tofiled, logKey, logMsg);
            return false;
        }

        let fromCondition = { uid: from };
        let fromUpdate = { $inc: {} };
        let toUpdate = { $inc: {} };

        let incAmount = amount;
        let noamount = -1.0*parseFloat(amount);
        let decAmount = noamount;
        fromCondition[fromfield] = { $gte: incAmount };
        fromUpdate['$inc'][fromfield] = decAmount;
        toUpdate['$inc'][tofiled] = incAmount;

        if (!await this.findOneAndUpdate(fromCondition, fromUpdate)) {
            plog.error('transferFieldValue from failed', from, to, fromfield, tofiled, logKey, logMsg);
            return false;
        }

        try {
            if (!await this.findOneAndUpdate( { uid: to }, toUpdate)) {
                plog.error('transferFieldValue to failed', from, to, fromfield, tofiled, logKey, logMsg);
                return false;
            }
        } catch (ex) {
            plog.error('transferFieldValue to exception', from, to, fromfield, tofiled, logKey, logMsg);
            return false;
        }

        writeLog('transferFieldValue', from, to, fromfield, tofiled, logKey, logMsg);
        let assets = {};
        assets = tools.makeMap(assets, fromfield, decAmount);
        assets = tools.makeMap(assets, tofiled, incAmount);
        await muiltiAssetLog(from, to, assets, "transfer_asset", logKey, logMsg);

        return true;
    }
}

schema.loadClass(UserAssetClass);
module.exports = mongoose.model('user_asset', schema);
