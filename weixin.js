'use strict'
var config = require('./config') ; 
var Wechat = require('./wechat/wechat') ; 
var wechatApi = new Wechat(config) ; 
exports.reply = function* (next) {
	var message = this.weixin ; 
	console.log(message) ;
	if (message.MsgType == 'event') {
		if (message.Event == 'subscribe') {
			if (message.EventKey) {
				console.log('扫二维码进来: ' + message.EventKey + ' ' + message.ticket);
			}
			this.body = '哈哈，欢迎你来到了关爱智障公众号\r\n' ;
		}
		else if (message.Event = 'unsubscribe') {
			console.log('妈的这个智障取消了关注:'+ message.FromUserName)  ;
			this.body = '' ; 
		}
		else if (message.Event = 'LOCATION') {
			this.body = '你这个智障的位置是：' + message.Latitude + '/' + message.Longitude
			+ '/' + message.Precision ; 
		}
		else if (message.Event = 'SCAN') {
			console.log('关注后扫二维码' + message.EventKey+ '/' + message.Ticket);
			this.body = '看到你扫了一下' ; 
		}
		else if (message.Event = 'VIEW') {
			this.body = '您点中了菜单中得链接：'+ message.EventKey  ;
		}
	}
	else if (message.MsgType == 'text') {
		var content = message.Content ; 
		console.log(content) ;
		var reply = '你这个智障说出来的话简直了我听不懂： ' + content ; 
		if (content == '1') {
			reply = '你是个大智障' ;
		}else if (content == '2') {
			reply = '别看了，你也是智障' ;
		}else if (content == '3') {
			reply = '卧槽，又来了个智障' ;
		}else if (content == '4') {
			reply = [{
				title: '智障的世界你并不懂',
				description: '专门为了智障而设计' ,
				picUrl: 'http://img.pconline.com.cn/images/upload/upc/tx/photoblog/1503/17/c2/3974346_1426551981202_mthumb.jpg' , 
				url: 'https://github.com/'
			},{
				title: '智障的世界你并不懂2',
				description: '专门为了智障而设计2' ,
				picUrl: 'http://attimg.dospy.com/img/day_141110/20141110_13cd5c2f6e4fd64594a8zSsBJubClOFD.jpg' , 
				url: 'https://baidu.com/'
			}] ;
		}else if (content == '5') {
			var data = yield wechatApi.uploadMaterial('image' , __dirname + '/4.jpg')
			reply = {
				type: 'image' , 
				mediaId : data.media_id 
			}
		}else if (content == '6') {
			var data = yield wechatApi.uploadMaterial('video' , __dirname + '/2.mp4')
			reply = {
				type: 'video' ,
				title: '一言不合就开车' ,
				description: '周泽军再开车' ,
				mediaId : data.media_id 
			}
		}
		else if (content == '7') {
			var data = yield wechatApi.uploadMaterial('voice' , __dirname + '/3.mp3')
			reply = {
				type: 'voice' ,
				mediaId : data.media_id 
			}
		}
		else if (content == '8') {
			var data = yield wechatApi.uploadMaterial('image' , __dirname + '/4.jpg')
			reply = {
				type: 'music' , 
				title: '回复音乐内容',
				description: '搞不懂你们在干什么' ,
				musicUrl: 'http://music.163.com/#/m/song?id=27836147' , 
				thumMediaId: data.media_id 
			}
		}
		this.body = reply ; 
	}
	yield next ; 
}