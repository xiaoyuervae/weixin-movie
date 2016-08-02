'use strict'
var Promise = require('bluebird') ; 
var _ = require('lodash') ; 
var fs = require('fs') ;
var request = Promise.promisify(require('request')) ; 
var util = require('./util') ; 
var prefix = 'https://api.weixin.qq.com/cgi-bin/' ; 
var api = {
	accesToken: prefix + 'token?grant_type=client_credential' , 
	temporary: {
		upload: prefix + 'media/upload?' , 
		fetch: prefix + 'media/get?' 
	} , 
	permanent: {
		upload: prefix + 'material/add_material?' , 
		fetch: prefix + 'material/get_material?'  , 
		uploadNews: prefix + 'material/add_news?' , 
		uploadImg: prefix + 'media/uploadimg?' , 
		del: prefix + 'material/del_material?' , 
		update: prefix + 'material/update_news?' , 
		count: prefix + 'material/get_materialcount?' , 
		batch: prefix + 'material/batchget_material?'
	}
}

function Wechat(config){
	var opts = config.wechat ; 
	var that = this ; 
	this.appID = opts.appID ; 
	this.appSecret = opts.appSecret ; 
	this.getAccessToken = opts.getAccessToken ; 
	this.saveAccessToken = opts.saveAccessToken ; 
	this.fetchAccessToken() ; 
}

Wechat.prototype.fetchAccessToken = function() {
	var that = this ; 
	if(this.access_token && this.expires_in) {
		if (this.isValidAccessToken(this)) {
			return Promise.resolve(this) ;
		}
	}
	this.getAccessToken()
		.then(function(data){
			try{
				data = JSON.parse(data)
			}
			catch(e){
				return that.updateAccessToken() ; 
			}
			if(that.isValidAccessToken(data)){
				return Promise.resolve(data) ; 
			}else{
				return that.updateAccessToken() ; 
			}
		})
		.then(function(data){
			that.access_token = data.access_token ; 
			that.expires_in = data.expires_in ; 
			that.saveAccessToken(data) ; 
			return Promise.resolve(data) ; 
		})
}
Wechat.prototype.isValidAccessToken = function(data){
	if(!data || !data.access_token || !data.expires_in) {
		return false ;
	}

	var access_token = data.access_token ; 
	var expires_in = data.expires_in ; 
	var now = new Date().getTime() ;
	if(now < expires_in) {
		return true ;
	}else {
		return false ; 
	}
}

Wechat.prototype.updateAccessToken = function() {
	var appID = this.appID ; 
	var appSecret = this.appSecret ; 
	var url = api.accesToken + '&appid=' + appID + '&secret=' + appSecret ; 

	return new Promise(function(resolve , reject) {
		request({url: url , json: true}).then(function(response) {
			var data = response.body ; 
			var now = new Date().getTime() ; 
			var expires_in = now + (data.expires_in - 20) * 1000 ; 
			data.expires_in = expires_in ; 
			resolve(data) ; 
		})
	})
}

Wechat.prototype.uploadMaterial = function(type , material , permanent) {
	var that = this ; 
	var uploadUrl = api.temporary.upload ; 
	var form = {} ;
	if (permanent) {
		uploadUrl = api.permanent.upload ;
		_.extend(form , permanent) ; 
	}
	if (permanent && type == 'image') {
		uploadUrl = api.permanent.uploadImg ; 
	}
	else if (permanent && type == 'news') {
		uploadUrl = api.permanent.uploadNews ;
		form: material ; 
	}
	else {
		form.media = fs.createReadStream(material); ; 
	}
	var appID = this.appID ; 
	var appSecret = this.appSecret ; 
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = uploadUrl + 'access_token=' + data.access_token ;
				if (!permanent) {
					url += '&type=' + type ;
				} else {
					form.access_token = data.access_token ; 
				}
				var options = {
					method: 'POST' ,
					url: url , 
					json: true
				} 
				if (type == 'news') {
					options.body = form ; 
				}
				else {
					options.formData = form ; 
				}

				console.log('上传时的url是:') ; 
				console.log(url) ; 
				request(options).then(function(response) {
					var _data = response.body ; 
					if (_data) {
						resolve(_data) ; 
					}else {
						throw new Error('Upload material fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}

Wechat.prototype.fetchMaterial = function(mediaId , type , permanent) {
	var that = this ; 
	var fetchUrl = api.temporary.fetch ; 
	if (permanent) {
		fetchUrl = api.permanent.fetch ;
	}
	var appID = this.appID ; 
	var appSecret = this.appSecret ; 
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = fetchUrl + 'access_token=' + data.access_token + '&media_id=' + mediaId ;

				if (!permanent && type == 'video') {
					url.replace('https://' , 'http://') ; 
				} 

				resolve(url) ; 
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}

Wechat.prototype.delPermanentMaterial = function(mediaId) {
	var that = this ; 
	var form = {
		media_id: mediaId
	}
	var delUrl = api.permanent.del ; 
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = delUrl + 'access_token=' + data.access_token & '&media_id=' + mediaId ;
				
				var options = {
					method: 'POST' ,
					url: url , 
					json: true ,
					body: form
				} 
			
				request(options).then(function(response) {
					var _data = response.body ; 
					if (_data) {
						resolve(_data) ; 
					}else {
						throw new Error('del material fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}

Wechat.prototype.updateMaterial = function(mediaId , news) {
	var that = this ; 
	var form = {
		media_id: mediaId
	}
	_.extend(form , news) ; 
	var updateUrl = api.permanent.update ; 
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = updateUrl + 'access_token=' + data.access_token & '&media_id=' + mediaId ;
				
				var options = {
					method: 'POST' ,
					url: url , 
					json: true , 
					body: form
				} 
			
				request(options).then(function(response) {
					var _data = response.body ; 
					if (_data) {
						resolve(_data) ; 
					}else {
						throw new Error('del material fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}


Wechat.prototype.fetchMaterialCount = function() {
	var that = this ; 
	var countUrl = api.permanent.count ; 
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = countUrl + 'access_token=' + data.access_token ; 
				
				var options = {
					method: 'GET' ,
					url: url , 
					json: true , 
				} 
			
				request(options).then(function(response) {
					var _data = response.body ; 
					if (_data) {
						resolve(_data) ; 
					}else {
						throw new Error('Count material fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}


Wechat.prototype.batchMaterial = function(form) {
	var that = this ; 
	form.type = form.type || 'image'  ; 
	form.offset = form.offset || 0 ; 
	form.count = form.count || 1 ; 
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = batchUrl + 'access_token=' + data.access_token ; 
				
				var options = {
					method: 'GET' ,
					url: url , 
					json: true ,
					body: form 
				} 
			
				request(options).then(function(response) {
					var _data = response.body ; 
					if (_data) {
						resolve(_data) ; 
					}else {
						throw new Error('batch material fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}

Wechat.prototype.reply = function() {
	var content = this.body ; 
	var message = this.weixin ; 
	var xml = util.tpl(content , message) ; 
	console.log('回复的xml是：') ;
	console.log(xml) ; 
	this.status = 200 ; 
	this.type = 'application/xml' ; 
	this.body = xml ; 
}
module.exports = Wechat ; 