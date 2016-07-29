'use strict'
var Promise = require('bluebird') ; 
//通过raw-body模块可以将this上得request对象，拼装它的数据，最终可以拿到一个
//buffer的XML数据
var getRawBody = require('raw-body') ; 
var sha1 = require('sha1') ; 
var Wechat = require('./wechat') ; 
module.exports = function(config){
	var that = this ; 
	//var wechat = new Wechat(config) ; 
	return function *(next){
			var token = config.wechat.token ; 
			var signature = this.query.signature ; 
			var timestamp = this.query.timestamp ; 
			var nonce = this.query.nonce ; 
			var echostr = this.query.echostr ; 
			var str = [token, timestamp, nonce].sort().join('') ; 
			console.log(str);
			var validatedStr = sha1(str) ; 

			if (this.method == 'GET') {
				if(signature == validatedStr){
					this.body = echostr + '' ; 
				}
				else{
					this.body = 'wrong' ; 
				}
			} else if (this.method == 'POST') {
				this.body = 'wrong' ;
				return false;

				var data = yield getRawBody(this.req , {
					length: this.length ,
					limit: '1mb' ,
					encoding: this.charset 
				}) 

				console.log(data.toString());
			}
		}
}


