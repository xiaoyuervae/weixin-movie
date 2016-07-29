var Koa = require('koa') ; 
var path = require('path') ; 
var wechat = require('./wechat/g') ; 
var util = require('./libs/util') ; 
var wechat_file = path.join(__dirname , './config/wechat.txt') ; 
var app = new Koa() ; 
var config = {
	wechat: {
		appID: 'wx1600f39566b2785a' , 
		appSecret: '1a3bdeacbc473ea4828ac01e21eb31ea' ,
		token: 'xyexiaoyuervaelearnnodejs' ,
		getAccessToken: function() {
			return util.readFileAsync(wechat_file , 'utf-8') ; 
		} , 
		saveAccessToken : function(data) {
			data = JSON.stringify(data) ; 
			return util.writeFileAsync(wechat_file , data) ; 
		}
	}
} 
app.use(wechat(config)) 
app.listen(3000) ; 
console.log('app is listening at 3000') ;
