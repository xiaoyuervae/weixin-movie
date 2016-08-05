'use strict'
var path = require('path') ; 
var wechat = require('./wechat/g') ; 
var util = require('./libs/util') ; 
var wechat_file = path.join(__dirname , './config/wechat.txt') ; 
var wechat_ticket_file = path.join(__dirname , './config/wechat_ticket.txt') ; 
var config = {
	wechat: {
		appID: 'wxd65e472c5a999ed6' , 
		appSecret: 'd4624c36b6795d1d99dcf0547af5443d' ,
		token: 'xyexiaoyuervaelearnnodejs' ,
		getAccessToken: function() {
			return util.readFileAsync(wechat_file , 'utf-8') ; 
		} , 
		saveAccessToken : function(data) {
			data = JSON.stringify(data) ; 
			return util.writeFileAsync(wechat_file , data) ; 
		} ,
		getTicket: function() {
			return util.readFileAsync(wechat_ticket_file , 'utf-8') ; 
		} , 
		saveTicket : function(data) {
			data = JSON.stringify(data) ; 
			return util.writeFileAsync(wechat_ticket_file , data) ; 
		} 
	} 
} 

module.exports = config ; 