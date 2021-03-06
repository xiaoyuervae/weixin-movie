var Koa = require('koa') ; 
var config = require('./config') ; 
var wechat = require('./wechat/g') ; 
var reply = require('./wx/reply') ;
var app = new Koa() ;
var Wechat = require('./wechat/wechat') ;
var ejs = require('ejs') ; 

var heredoc = require('heredoc') ; 
var crypto = require('crypto') ;
var tpl = heredoc(function(){/*
<!DOCTYPE html>
<html>
<head>
	<title>搜电影</title>
	<meta name="viewport" content="initial-scale=1, maximum-scale=1 , minimum-scale=1">
</head>
<body>
	<h1>点击标题，开始录音翻译</h1>
	<p id="title"></p>
	<p id="year"></p>
	<p id="director"></p>
	<div id="poster"></div>
	<script type="text/javascript" src="http://zeptojs.com/zepto-docs.min.js"></script>
	<script type="text/javascript" src="http://res.wx.qq.com/open/js/jweixin-1.0.0.js"></script>
	<script>
		wx.config({
	    debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
	    appId: 'wxd65e472c5a999ed6', // 必填，公众号的唯一标识
	    timestamp: '<%= timestamp %>', // 必填，生成签名的时间戳
	    nonceStr: '<%= noncestr %>', // 必填，生成签名的随机串
	    signature: '<%= signature %>',// 必填，签名，见附录1
	    jsApiList: [
				'startRecord',
				'stopRecord',
				'onVoiceRecordEnd',
				'translateVoice' , 
				'onMenuShareAppMessage',
				'previewImage'
	    ] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
		})
		wx.ready(function(){
			wx.checkJsApi({
		    jsApiList: ['onVoiceRecordEnd'], // 需要检测的JS接口列表，所有JS接口列表见附录2,
		    success: function(res) {
		    	console.log(res) ; 
		    }
			})
			var isRecording = false ;
			var shareContent = {
				title: '我搜到了什么东西呢', // 分享标题
		    desc: '这是一个搜索电影的链接', // 分享描述
		    link: 'https://github.com/', // 分享链接
		    imgUrl: 'http://static.mukewang.com/static/img/index/logo.png', // 分享图标
		    success: function () { 
		       window.alert('分享成功');
		    },
		    cancel: function () { 
		      window.alert('分享失败') ;
		    }
			}
			var slides = {} ; 
			$('#poster').on('tap' , function(){
				wx.previewImage(slides) ; 
			}) 
			wx.onMenuShareAppMessage(shareContent) ;
			$('h1').on('tap' , function(){
				if(!isRecording) {
					isRecording = true ;
					wx.startRecord({
						cancel: function(){
							window.alert('那就不能搜影片了哦!!!');
						}
					})
					return ;
				}
				isRecording = false ;

				wx.stopRecord({
			    success: function (res) {
		        var localId = res.localId;
		        wx.translateVoice({
	           localId: localId, // 需要识别的音频的本地Id，由录音相关接口获得
	            isShowProgressTips: 1, // 默认为1，显示进度提示
	            success: function (res) {
	              var result = res.translateResult ; 
	              $.ajax({
									type: 'get' , 
									url: 'https://api.douban.com/v2/movie/search?q=' + result ,
									dataType: 'jsonp' , 
									jsonp: 'callback' , 
									success: function(data) {
										var subject = data.subjects[0] ; 
										$('#title').html(subject.title) ; 
										$('#year').html(subject.year) ; 
										$('#director').html(subject.directors[0].name) ; 
										$('#poster').html('<img src="'+subject.images.large+'" />')
										console.log(subject.images.large) ; 
										shareContent.title = '我搜出来了' + subject.title ; 
										shareContent.link = subject.images.large ;
										shareContent.imgUrl = subject.images.large

										wx.onMenuShareAppMessage(shareContent) ; 
										slides = {
											current: subject.images.large, // 当前显示图片的http链接
											urls: [subject.images.large] // 需要预览的图片http链接列表
										}

										data.subjects.forEach(function(item) {
											slides.urls.push(item.images.large) ; 
										})

										wx.previewImage(slides) ; 
									}
	              })
	            }
		        })
			    }
				})
			})
		})
	</script>
</body>
</html>
*/}) ; 
var createNonce = function() {
	return Math.random().toString(36).substr(2 , 15) ; 
}
var createTimestamp = function() {
	return parseInt(new Date().getTime() / 1000 , 10) + '' ;
}
var _sign = function ticket(noncestr , ticket,timestamp , url) {
	var params = [
		'noncestr=' + noncestr , 
		'jsapi_ticket=' + ticket , 
		'timestamp=' + timestamp , 
		'url=' + url
	]

	var str = params.sort().join('&') ; 
	console.log(str);

	var shasum = crypto.createHash('sha1') ; 
	shasum.update(str) ;
	return shasum.digest('hex') ;
}
function sign(ticket , url) {
	var noncestr = createNonce() ; 
	var timestamp = createTimestamp() ; 
	url = url.replace(':8000' , '') ; 
	var signature = _sign(noncestr , ticket,timestamp , url) ;
	return {
		noncestr: noncestr ,
		timestamp: timestamp , 
		signature: signature
	}
}
app.use(function *(next) {
	if (this.url.indexOf('/movie') > -1) {
		var wechatApi = new Wechat(config) ; 
		var data = yield wechatApi.fetchAccessToken() ; 
		var access_token = data.access_token ; 
		var ticketData = yield wechatApi.fetchApiTicket(access_token) ; 
		var ticket = ticketData.ticket ; 
		var url = this.href ; 
		var params = sign(ticket , url) ;
		console.log(params);
		this.body = ejs.render(tpl , params) ; 
		return next ;
	}
	yield next ;
})
app.use(wechat(config , reply.reply)) ;
app.listen(3000) ; 
console.log('app is listening at 3000') ;
