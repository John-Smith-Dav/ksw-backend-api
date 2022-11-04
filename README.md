# abs-backend

## 发行链上资产memo
{
    "type": "issue",
    "format": "text/plain",
    "data": "{
		'c':'',     // 资产名称
		's':'',     // 资产符号
		't':'',     // 发行总量
		'i':'',     // 发行方名字
		'w':'',     // 项目网站
		'n':'',     // 显示方式
		'd':'',     // 发行说明
	}"
}

## 接口

### 获取地址信息
**请求** 

GET http://xx.xx.xx.xx:xxxx/service/rcp_info

**返回**

```

{
	"error_code": 0,
	"data": {
		rcp_ws: "ws://xxxx:xxxx",                                               // ws地址
		active_address: "rA********************************",                   // 激活地址     gateway_address: "rb********************************",                  // btc网关地址
		withdraw_address: "rc********************************",                 // 提币地址
		miner_profit_address: "rd********************************",             // 挖矿收益地址
		xy_rank_profit_address: "re********************************",           // x和y排名收益地址
		newbie_profit_address: "rf********************************",            // 新手收益地址
		trade_profit_address: "rg********************************",             // 交易收益地址
		hash_profit_address: "rh********************************",              // hash收益地址
		solitaire_profit_address: "ri********************************",         // 接龙收益地址
		conv_address: "rj********************************",                     // 卷积地址
		airdrop_address: "rk********************************",                  // 空投地址
		hash_address: "rl********************************",                     // hash地址
		solitaire_address: "rm********************************",                // 接龙地址
		ad_cn_address: "rn********************************",                    // 公告中文地址
		ad_en_address: "ro********************************",                    // 公告英文地址
		ad_ru_address: "rp********************************",                    // 公告俄文地址
		conv_profit_address: "",                                                // 卷积收益地址
	}
}


```

### 获取价格信息
**请求** 

GET http://xx.xx.xx.xx:xxxx/service/price_info

**返回**

```
{
	"error_code": 0,
	"data": {
		"cny_price": "7.032",
		"usd_price": "1.0",
		"rub_price": "64.30",
		"eur_price": "64.30",
	}
}
```

### 获取app信息
**请求**

GET http://xx.xx.xx.xx:xxxx/service/app_info

**返回**

```
{
	"error_code": 0,
	"data": {
		"app_android_download": "http://xx.xx.xx.xx/android_download",
		"app_android_version": "1.0.1",
		"app_android_update_desc": "更新说明",
		"app_ios_download": "http://xx.xx.xx.xx/ios_download",
		"app_ios_version": "1.0.1",
		"app_ios_update_desc": "更新说明"
	}
}
```

### 获取login信息
**请求**

GET http://xx.xx.xx.xx:xxxx/service/login_info?address=rLRYTN7ovVayaqk7ksRDLyySw2hZP6L5cy

**返回**

```
{
	error_code: 0,
	data: {
		address: "rx08",
		btcAddress: "91cdbfc3b24a4cbfa49190fffbf7eb22",
		inviter: "",
		inviter_code_x: "da447d7de8b08d6e853a1effceb41f7e",
		inviter_code_y: "3b560de14ac37d647ec63303a4ef36d4",
	}
}
```

### 获取chilren信息
**请求**

GET http://xx.xx.xx.xx:xxxx/service/children?address=rLRYTN7ovVayaqk7ksRDLyySw2hZP6L5cy

**返回**

```
{
	error_code: 0,
	data: {
		address: "rx08",
		children: {
			x_children: [
				{
					uid: "rf1vqF52KTic87DhyYkBqALBHthAo4sLmD",  
					x_wk_achnum: 0,                     // x区总业绩
					y_wk_achnum: 0,                     // y去总业绩
					total_wk_achnum: 0,                     // 总业绩
					x_power: 110,                       // 自己的持币算力
					x_power_rank: 0,                        // 持币算力排名
					x_coinage_bonus_power: 10,                      // 持币算力币龄加成
					x_coinage_bonus_power_rate: 0.1,                        // 持币算力币龄加成比例
					y_power_bonus: 0,                       // 持币y算力加成
					y_power_bonus_rate: 0,                      // 持币y算力加成比例
					y_power: 0,                     // 自己的推广算力
					y_power_rank: 0,                        // 推广算力排名
					coin_age: 22,                       // 币龄
					balance: 10                     // 实时的余额
					create_time: "2019-12-11T15:34:58.701Z",    // 创建时间
				},
			],
			y_children: [

			]
		}
	}
}
```

### 获取公告信息
**请求**

GET http://xx.xx.xx.xx:xxxx/service/ad?lan=zh
lan表示语言，zh表示中文，en表示英文，ru表示俄语，不传lan，默认中文

**返回**
返回的data数据，里面的公告是按照时间排序，从新到旧
```
{
	error_code: 0,
	data: [
		{
			_id: "5dee4d6b7b261c828f063602",
			lan: "cn",
			title: "公链全球首款DAPP上线公告",
			info: "<p>测试公告</p>",
			author: "运营团队",
			time: "2019-12-09T13:34:35.354Z",
			__v: 0
		}
	]
}
```

### 判断邀请码是否合法
**请求**

GET http://xx.xx.xx.xx:xxxx/service/invite_code_valid?invite_code=xxxxxxxxx

**返回**

```
{
	error_code: 0,
	data: "ok"
}
```

### 请求卷积数据
**请求**

GET http://xx.xx.xx.xx:xxxx/service/conv

**返回**

```
{
	error_code: 0,
	data: {
		conv_btc: 0,            // 累计卷积BTC数量
		conv_rcp: 0,            // 累计卷积数量
		next_layer_rate: 9950,  // 下一层卷积比例
		last_layer_rate: 0,     // 上一层卷积比例
		curr_layer_rate: 10000, // 当前层卷积比例
		layer_left_rcp: 10,     // 当前层剩余
		layer_left_btc: 0.001,  // 当前层剩余BTC
		layer_total_btc: 0.001, // 当前层总BTC
		last_layer_total_btc: 0.001, // 上一前层总BTC
		next_layer_total_btc: 0.001, // 下一前层总BTC
		layer_open: true        // 本层是否开启 
	}
}
```

### 请求卷积收益列表
**请求**

GET http://xx.xx.xx.xx:xxxx/service/get_conv_profits?address=xxxx

**返回**

```
{
	error_code: 0,
	data: [
		{
			uid: "xxxx",    // 谁
			symbol: "xrp",  // 拿得收益是什么币种
			buy_count: 6345,    // 卷积的时候，买了几个symbol
			income: 317.25,     // 卷积收益
			rate: 0.05,         // 收益占buy_count的比例
			income_type: "js_y_zhitui", // 卷积y区的直推奖励，js_x_zhitui表示卷积x区的直推奖励, js_xy_duipeng表示卷积xy对碰
			related: [
				"rf8t6666mPfPJjvmotVcQUire2Rkgf2Uok"    // 这个收益跟那个用户有关
			],
			related_txid: "CF84F5855E901DAC89FF719F32E04864372A03CE56C0013178CC108C610DD4CE",   // 发送卷积的时候的txid
			time: "2019-12-12T18:14:28.189Z", // 生成这个收益的时间
			child_depth: 1,     // 第几层的用户，1表示直推
			time_str: "20191213",   // 生成这个收益的日期
			status: "zt_waiting",   // 状态zt_waiting表示等待发收益中，zt_comleted表示已经到账
			block: 186521,  // 到哪个块才会发收益，这个东西表示7天后，用当前块 + 3600 * 24 * 7 / 4算出来的
			txid: ""    // 发收益时候的txid
		},
	]
}
```

### 请求卷积业绩
**请求**

GET http://xx.xx.xx.xx:xxxx/service/conv_achnum?address=xxxxxx

**返回**

```
{
	error_code: 0,
	data: {
		conv_x_achnum: 7910.1,
		conv_y_achnum: 6500.1
	}
}
```
