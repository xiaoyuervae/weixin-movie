var Koa = require('koa') ; 
var config = require('./config') ; 
var wechat = require('./wechat/g') ; 
var reply = require('./wx/reply') ;
var app = new Koa() ; 
app.use(wechat(config , reply.reply)) ;
app.listen(3000) ; 
console.log('app is listening at 3000') ;
