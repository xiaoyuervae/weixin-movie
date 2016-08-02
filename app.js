var Koa = require('koa') ; 
var config = require('./config') ; 
var wechat = require('./wechat/g') ; 
var weixin = require('./weixin') ;
var app = new Koa() ; 
app.use(wechat(config , weixin.reply)) ;
app.listen(3000) ; 
console.log('app is listening at 3000') ;
