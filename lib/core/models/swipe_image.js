'use strict';

/**
 * 图片轮播管理
 * @type {Mongoose|{}}
 * {
        "type": "discovery",
        "image": [
            {
                "url": "http://www.baidu.com",
                "path": "D:\\02_workspace\\btc\\ksw\\images\\1.png"
            },
            {
                "url": "http://www.sina.com.cn",
                "path": "D:\\02_workspace\\btc\\ksw\\images\\2.png"
            },
            {
                "url": "http://www.qq.com",
                "path": "D:\\02_workspace\\btc\\ksw\\images\\3.png"
            }
        ]
    }
 *
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    type: String,
    image: [],
    remark: String
});

schema.index({ type: 1 });

class SwipeImageClass {
    constructor() {
    }
}

schema.loadClass(SwipeImageClass);
module.exports = mongoose.model('swipe_image', schema);