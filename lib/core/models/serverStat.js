'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    symbol: String,
    next_time: Date,
    lastIndex: Number,
    conv_layer: {type: Number, default:1},
    conv_btc: Number,
    conv_rcp: Number,
    total_x_power: Number,
    total_y_power: Number,
    x_profit_preday: Number,
    y_profit_preday: Number,
    xy_best_hold: Number,
    wk_profit_time: Number,
    app_android_download: String,
    app_android_version: String,
    app_android_update_desc: String,
    app_ios_download: String,
    app_ios_version: String,
    app_ios_update_desc: String,
    app_update_force: String,
    server_address: {},
    aan_time_str: {type : String, default : ''},        // ann是AcitveAccountNum，当前执行的日期字符串'20200101'
    aan_index: {type : Number, default : 0},            // AcitveAccountNum，激活账号增加数量的配置索引
    aan_curr_num: {type : Number, default : 0},         // 今天加了几个
    ann_total_num: {type : Number, default : 0},        // 一共加了几个
    next_release_time: {type : Number, default : 0},    // 下次锁仓释放时间
    next_release_rate: {type : Number, default : 21},    // 下次锁仓释放比率
    solitaire_start_time: Number,  // 开始时间
    solitaire_jackpot: {type : Number, default : 0},  // 当前奖池
    solitaire_end_time: Number, // 本轮结束时间
    solitaire_index: {type : Number, default : 1}, // 第几轮
    solitaire_min_xrp: {type : Number, default : 100}, // 最少投入xrp每手
});

schema.index({ symbol: 1 });

class ServerStatClass {
    constructor() {
    }

    static async makeDefaultIfNeed() {
        let result = {
            symbol: settings.projectName,
            app_android_download: "http://xx.xx.xx.xx/android_download",
            app_android_version: "1.0.1",
            app_android_update_desc: "更新说明",
            app_ios_download: "http://xx.xx.xx.xx/ios_download",
            app_ios_version: "1.0.1",
            app_ios_update_desc: "更新说明",
            app_update_force: "0"
        };
        await this.findOneAndUpdate({symbol: settings.projectName}, {'$setOnInsert': result}, {'upsert': true});    
    }
}

schema.loadClass(ServerStatClass);
module.exports = mongoose.model('ServerStat', schema);
