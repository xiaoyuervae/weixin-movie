'use strict'
var Promise = require('bluebird') ; 
var _ = require('lodash') ; 
var fs = require('fs') ;
var request = Promise.promisify(require('request')) ; 
var util = require('./util') ; 
var prefix = 'https://api.weixin.qq.com/cgi-bin/' ; 
var mpPrefix = 'https://mp.weixin.qq.com/cgi-bin/' ; 
var api = {
	semantic: 'https://api.weixin.qq.com/semantic/semproxy/search?' , 
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
	} ,
	tag: {
		create: prefix + 'tags/create?' ,
		get: prefix + 'tags/get?' ,
		update: prefix + 'tags/update?' ,
		delete: prefix + 'tags/delete?' ,
		batchTagging: prefix + 'tags/members/batchtagging?' ,
		getdlist: prefix + 'tags/getidlist?'
	} ,
	user: {
		remark: prefix + 'user/info/updateremark?' , 
		fetch: prefix + 'user/info?' , 
		batchFetch: prefix + 'user/info/batchget?' , 
		list: prefix + 'user/get?' 
	} , 
	mass: { 
		sendByTag: prefix + 'message/mass/sendall?' ,
		//根据openId向用户发送消息，订阅号不可用，服务号才可用
		sendByOpenId: prefix + 'message/mass/send?' , 
		del: prefix + 'message/mass/delete?' , 
		preview: prefix + 'message/mass/preview?' ,
		check: prefix + 'message/mass/get?'
	} ,
	menu: {
		create: prefix + 'menu/create?' , 
		query: prefix + 'menu/get?' , 
		delete: prefix + 'menu/delete?' , 
		current: prefix + 'get_current_selfmenu_info?'
	} ,
	qrcode: {
		create: prefix + 'qrcode/create?' , 
		show: mpPrefix + 'showqrcode?'
	} , 
	shortUrl:{
		create: prefix + 'shorturl?'
	} ,
	ticket: {
		get: prefix + 'ticket/getticket?'
	}
}

function Wechat(config){
	var opts = config.wechat ; 
	var that = this ; 
	this.appID = opts.appID ; 
	this.appSecret = opts.appSecret ; 
	this.getAccessToken = opts.getAccessToken ; 
	this.saveAccessToken = opts.saveAccessToken ; 
	this.getTicket = opts.getTicket ; 
	this.saveTicket = opts.saveTicket ; 
	this.fetchAccessToken() ; 
}

Wechat.prototype.fetchAccessToken = function() {
	var that = this ; 
	if(this.access_token && this.expires_in) {
		if (this.isValidAccessToken(this)) {
			return Promise.resolve(this) ;
		}
	}
	return this.getAccessToken()
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
Wechat.prototype.fetchApiTicket = function(access_token) {
	var that = this ; 
	return this.getTicket()
		.then(function(data){
			try{
				data = JSON.parse(data)
			}
			catch(e){
				return that.updateTicket(access_token) ; 
			}
			if(that.isValidTicket(data)){
				return Promise.resolve(data) ; 
			}else{
				return that.updateTicket(access_token) ; 
			}
		})
		.then(function(data){
			that.saveTicket(data) ; 
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

Wechat.prototype.isValidTicket = function(data){
	if(!data || !data.ticket || !data.expires_in) {
		return false ;
	}

	var ticket = data.ticket ; 
	var expires_in = data.expires_in ; 
	var now = new Date().getTime() ;
	if(ticket && now < expires_in) {
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

Wechat.prototype.updateTicket = function(access_token) {
	var appID = this.appID ; 
	var appSecret = this.appSecret ; 
	var url = api.ticket.get + '&access_token=' + access_token + '&type=jsapi' ; 

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
	var batchUrl = api.permanent.batch ; 
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

/*
用户标签管理
 */

Wechat.prototype.createTag = function(name) {
	var that = this ; 
	var form = {
		tag: {
			name: name
		}
	}
	var createUrl = api.tag.create ; 
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = createUrl + 'access_token=' + data.access_token ; 
				
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
						throw new Error('create TAG fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}

Wechat.prototype.getTags = function() {
	var that = this ; 
	var getUrl = api.tag.get ; 
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = getUrl + 'access_token=' + data.access_token ; 
				
				var options = {
					method: 'POST' ,
					url: url , 
					json: true 
				} 
				request(options).then(function(response) {
					var _data = response.body ; 
					if (_data) {
						resolve(_data) ; 
					}else {
						throw new Error('get TAG fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}

Wechat.prototype.updateTag = function(tag) {
	var that = this ; 
	var updateUrl = api.tag.update ; 
	var form = {
		tag: tag
	}
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = updateUrl + 'access_token=' + data.access_token ; 
				
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
						throw new Error('update TAG fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}

Wechat.prototype.deleteTag = function(tag) {
	var that = this ; 
	var deleteUrl = api.tag.delete ; 
	var form = {
		tag: tag
	}
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = deleteUrl + 'access_token=' + data.access_token ; 
				
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
						throw new Error('delete TAG fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}


Wechat.prototype.batchTagging = function(tagid , next_openid) {
	var that = this ; 
	var batchTaggingUrl = api.tag.batchtagging ; 
	var form = {
		tagid: tagid , 
		next_openid: next_openid 
	}
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = batchTaggingUrl + 'access_token=' + data.access_token ; 
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
						throw new Error('batchTagging TAG fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}

Wechat.prototype.moveTag = function(openid_list , tagid) {
	var that = this ; 
	var moveUrl = api.tag.batchtagging ; 
	var form = {
		openid_list: openid_list , 
		tagid: tagid
	}
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = moveUrl + 'access_token=' + data.access_token ; 
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
						throw new Error('move TAG fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}

Wechat.prototype.getTagByUserId = function(openid) {
	var that = this ; 
	var getdlistUrl = api.tag.getdlist ; 
	var form = {
		openid: openid
	}
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = getdlistUrl + 'access_token=' + data.access_token ; 
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
						throw new Error('getdlist TAG fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}

Wechat.prototype.remarkUser = function(openId , remark) {
	var that = this ; 
	var remarkUrl = api.user.remark ; 
	var form = {
		openid: openId , 
		remark: remark
	}
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = remarkUrl + 'access_token=' + data.access_token ; 
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
						throw new Error('getdlist TAG fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}

Wechat.prototype.fetchUsersInfo = function(openIds , lang) {
	var that = this ; 
	var fetchUrl = api.user.batchFetch ;
	lang = lang || 'zh_CN' ; 
	
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var options = {
					json: true 
				} 
				if(_.isArray(openIds)) {
					options.url = fetchUrl + 'access_token=' + data.access_token ; 
					options.body = {
						user_list: openIds
					}
					options.method = 'POST' ; 
				} else {
					options.url = api.user.fetch + 'access_token=' + data.access_token + '&openid=' + openIds + '&lang=' + lang ; 
				}
				request(options).then(function(response) {
					var _data = response.body ; 
					if (_data) {
						resolve(_data) ; 
					}else {
						throw new Error('fetch USERS fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}

Wechat.prototype.listUsers = function(openId) {
	var that = this ; 
	var listUrl = api.user.list ; 
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = listUrl + 'access_token=' + data.access_token ; 
				if (openId) {
					url += '&next_openid=' + openId ;
				}
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
						throw new Error('list Users fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}

Wechat.prototype.sendByTag = function(type , message , tagId) {
	var that = this ; 
	var tagUrl = api.mass.sendByTag ; 
	var form = {
		filter: {} , 
		msgType: type
	}
	form[type] = message ; 
	if (!groupId) {
		form.filter.is_to_all = true ; 
	}
	else {
		form.filter = {
			is_to_all: false ,
			tag_id: tagId
		}
	}
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = tagUrl + '&access_token=' + data.access_token ; 
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
						throw new Error('sendByTag to Users fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}

Wechat.prototype.sendByOpenId = function(type , message , openIds) {
	var that = this ; 
	var openIdUrl = api.mass.sendByOpenId ; 
	var form = {
		touser: openIds , 
		msgType: type
	}
	form[type] = message ; 
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = openIdUrl + '&access_token=' + data.access_token ; 
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
						throw new Error('sendByOpenID to Users fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}


Wechat.prototype.delMass = function(msgId) {
	var that = this ; 
	var delUrl = api.mass.del ; 
	var form = {
		msg_id: msgId
	}
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = delUrl + '&access_token=' + data.access_token ; 
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
						throw new Error('delete mass fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}

Wechat.prototype.previewMass = function(type , message , openId) {
	var that = this ; 
	var previewUrl = api.mass.preview ; 
	var form = {
		touser: openId , 
		msgType: type
	}
	form[type] = message ; 
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = previewUrl + '&access_token=' + data.access_token ; 
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
						throw new Error('preview mass fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}

Wechat.prototype.checkMass = function(msgId) {
	var that = this ; 
	var checkUrl = api.mass.check ; 
	var form = {
		msg_id: msgId
	}
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = checkUrl + '&access_token=' + data.access_token ; 
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
						throw new Error('check mass fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}

Wechat.prototype.createMenu = function(menu) {
	var that = this ; 
	var createUrl = api.menu.create ; 
	var form = menu ; 
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = createUrl + '&access_token=' + data.access_token ; 
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
						throw new Error('Create menu fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}

Wechat.prototype.queryMenu = function() {
	var that = this ; 
	var queryUrl = api.menu.query ; 
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = queryUrl + '&access_token=' + data.access_token ; 
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
						throw new Error('query menu fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}

Wechat.prototype.deleteMenu = function() {
	var that = this ; 
	var deleteUrl = api.menu.delete ; 
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = deleteUrl + '&access_token=' + data.access_token ; 
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
						throw new Error('delete menu fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}

Wechat.prototype.currentMenu = function() {
	var that = this ; 
	var currentUrl = api.menu.current ; 
	var form = menu ; 
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = currentUrl + '&access_token=' + data.access_token ; 
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
						throw new Error('current menu fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}

Wechat.prototype.createQrcode = function(qr) {
	var that = this ; 
	var createUrl = api.qrcode.create ; 
	var form = qr ; 
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = createUrl + '&access_token=' + data.access_token ; 
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
						throw new Error('Create menu fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}

Wechat.prototype.showQrcode = function(ticket) {
	return api.qrcode.show + '&ticket' + encodeURI(ticket) ; 
}

Wechat.prototype.createShortUrl = function(action , longUrl) {
	var that = this ; 
	action = action || 'long2short' ; 
	var createUrl = api.shortUrl.create ; 
	var form = {
		action: action , 
		long_url: longUrl
	} ; 
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var url = createUrl + '&access_token=' + data.access_token ; 
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
						throw new Error('Create menu fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}

Wechat.prototype.semantic = function(form) {
	var that = this ; 
	var semanticUrl = api.semantic ; 
	var form = form
	return new Promise(function(resolve , reject) {
		that
			.fetchAccessToken()
			.then(function(data) {
				var appid = data.appID ; 
				form.appid = appid ; 
				var url = semanticUrl + '&access_token=' + data.access_token ; 
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
						throw new Error('semantic fails') ; 
					}
				})
			})
			.catch(function(err) {
				reject(err) ; 
			})
	})
}



Wechat.prototype.reply = function () {
	console.log('dsfasjkfkls')  ;
	var content = this.body ; 
	var message = this.weixin ; 
	var xml = util.tpl(content , message) ; 
	this.status = 200 ; 
	this.type = 'application/xml' ; 
	console.log('wolaile') ; 
	this.body = xml ; 
}
module.exports = Wechat ; 