'use strict'
var Promise = require('bluebird') ; 
//通过raw-body模块可以将this上得request对象，拼装它的数据，最终可以拿到一个
//buffer的XML数据
var getRawBody = require('raw-body') ; 
var sha1 = require('sha1') ; 
var Wechat = require('./wechat') ; 
var util = require('./util') ; 
module.exports = function(config , handler){
	var wechat = new Wechat(config) ; 
	return function *(next){
			var that = this ; 
			var token = config.wechat.token ; 
			var signature = this.query.signature ; 
			var timestamp = this.query.timestamp ; 
			var nonce = this.query.nonce ; 
			var echostr = this.query.echostr ; 
			var str = [token, timestamp, nonce].sort().join('') ;
			var validatedStr = sha1(str) ; 
			if (this.method == 'GET') {
				if(signature == validatedStr){
					this.body = echostr + '' ; 
				}
				else{
					this.body = 'wrong' ; 
				}
			} else if (this.method == 'POST') {

				if(signature != validatedStr){
					this.body = 'wrong' ;
					return false;
				}
				var data = yield(getRawBody(this.req , {
					length: this.length ,
					limit: '1mb' ,
					encoding: this.charset 
				}))
				//将XML转换成一个嵌套的对象
				var content = yield util.parseXMLAsync(data) ; 
				var message = util.formatMessage(content.xml) ;
				this.weixin = message ; 
				// 把控制权交出去，交给业务层，让它决定接下来需要做什么
				// 暂停这里，走向外层逻辑
				yield handler.call(this , next) ; 

				// 调用reply方法
				wechat.reply.call(this) ; 
			}
		}
}


