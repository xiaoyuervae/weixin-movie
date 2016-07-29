'use strict'

var xml2js = require('xml2js') ; 
var Promise = require('bluebird') ; 

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