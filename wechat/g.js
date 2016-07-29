'use strict'
var Promise = require('bluebird') ; 
//通过raw-body模块可以将this上得request对象，拼装它的数据，最终可以拿到一个
//buffer的XML数据
var getRawBody = require('raw-body') ; 
var sha1 = require('sha1') ; 
var Wechat = require('./wechat') ; 
var util = require('./util') ; 
module.exports = function(config){
	//var wechat = new Wechat(config) ; 
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
				console.log(message);

				if(message.MsgType == 'event') {
					if(message.Event == 'subscribe') {
						var now = new Date().getTime() ; 
						that.status = 200 ; 
						that.type = 'application/xml' ; 
						that.body = '<xml>'+
								 '<ToUserName><![CDATA['+ message.FromUserName + ' ]]></ToUserName>' + 
								 '<FromUserName><![CDATA['+ message.ToUserName + ']]>' + '</FromUserName>' + 
								 '<CreateTime>'+ now +'</CreateTime>' + 
								 '<MsgType><![CDATA[text]]></MsgType>' + 
								 '<Content><![CDATA[HI welcom , xiaoyuervae]]></Content>' + 
							 '</xml>' ; 
						console.log(that.body);
						return ;
					}
				}
			}
		}
}


