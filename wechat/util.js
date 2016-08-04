'use strict'

var xml2js = require('xml2js') ; 
var Promise = require('bluebird') ; 
var tpl = require('./tpl') ;

exports.parseXMLAsync = function(xml) {
	return new Promise(function(resolve , reject) {
		xml2js.parseString(xml , {trim: true} , function(err , content) {
			if (err) reject(err) ;
			else resolve(content) ;
		})
	})
}

function formatMessage(result) {
	var message = {} ; 
	if(typeof result == 'object') {
		var keys = Object.keys(result) ;
		for(var i = 0 ; i < keys.length ; i++ ) {
			var key = keys[i] ; 
			var item = result[key] ; 
			if (!(item instanceof Array || item.length)) { 
				continue ; 
			}
			//如果说是数组的话
			if (item.length == 1) {
				var val = item[0] ; // 取出数组中得第一个对象
				if (typeof val == 'object') {
					// 如果说是一个对象，对它进行进一步的遍历
					message[key] = formatMessage(val) ; 
				} else {
					message[key] = (val || '').trim() ; 
				}
			} else { //说明是一个数组
				message[key] = [] ; 
				for (var j = 0 , k = item.length ; j < k ; j++) {
					message[key].push(formatMessage(item[j])) ; 
				}
			}
		} 
	}

	return message ; 
}

exports.formatMessage = formatMessage ; 

exports.tpl = function(content , message) {
		var info = {} ; 
		var type = 'text' ; //默认是文本消息
		var fromUserName = message.FromUserName ; 
		var toUserName = message.ToUserName ; 

		if(Array.isArray(content)) {
			type = 'news' ; 
		}
		console.log('content 是：') ; 
		console.log(content);
		type = content.type || type ; 
		info.content = content ; 
		info.fromUserName = toUserName ; 
		info.toUserName = fromUserName ;
		info.createTime = new Date().getTime() ; 
		info.msgType = type ; 
		return tpl.compiled(info) ; 
}