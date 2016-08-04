'use strict'
 
var config = require('../config')
var Wechat = require('../wechat/wechat')
var menu = require('./menu')
var wechatApi = new Wechat(config)
var path = require('path')
 
wechatApi.deleteMenu().then(function(){
    return wechatApi.createMenu(menu)
})
.then(function(msg){
    console.log(msg)
})
exports.reply = function* (next){
    var message = this.weixin
 
    if (message.MsgType === 'event') {
        if (message.Event === 'subscribe') {
            if (message.EventKey) {
                console.log('扫描二维码进来的：' + message.EventKey + '' + message.ticket)
            }
            this.body = '哈哈，你订阅了微信号'
        }
        else if (message.Event === 'unsubscribe') {
            console.log('无情取关')
            this.body = ''
        }
        else if (message.Event === 'LOCATION') {
            this.body = '您上报的位置是：' + message.Latitude + '/' + message.Longitude + '-' + message.Precision
        }
        else if (message.Event === 'CLICK') {
            this.body = '您点击了菜单：' + message.EventKey
        }
        else if (message.Event === 'SCAN') {
            console.log('关注后扫二维码' + message.EventKey + ' ' + message.ticket)
            this.body = '看到你扫了一下哦'
        }
        else if (message.Event === 'VIEW') {
            this.body = '您点击了菜单中的链接：' + message.EventKey
        }
        else if (message.Event === 'scancode_push') {
            console.log(message.ScanCodeInfo.ScanType)
            console.log(message.ScanCodeInfo.ScanResult)
            this.body = '您点击了菜单中的链接：' + message.EventKey
        }
        else if (message.Event === 'scancode_waitmsg') {
            console.log(message.ScanCodeInfo.ScanType)
            console.log(message.ScanCodeInfo.ScanResult)
            this.body = '您点击了菜单中的链接：' + message.EventKey
        }
        else if (message.Event === 'pic_sysphoto') {
            console.log(message.SendPicsInfo.PicList)
            console.log(message.SendPicsInfo.Count)
            this.body = '您点击了菜单中的链接：' + message.EventKey
        }
        else if (message.Event === 'pic_photo_or_album') {
            console.log(message.SendPicsInfo.PicList)
            console.log(message.SendPicsInfo.Count)
            this.body = '您点击了菜单中的链接：' + message.EventKey
        }
        else if (message.Event === 'pic_weixin') {
            console.log(message.SendPicsInfo.PicList)
            console.log(message.SendPicsInfo.Count)
            this.body = '您点击了菜单中的链接：' + message.EventKey
        }
        else if (message.Event === 'location_select') {
            console.log(message.SendLocationInfo.Location_X)
            console.log(message.SendLocationInfo.Location_Y)
            console.log(message.SendLocationInfo.Scale)
            console.log(message.SendLocationInfo.Label)
            console.log(message.SendLocationInfo.Poiname)
            console.log(message.SendPicsInfo.Count)
            this.body = '您点击了菜单中的链接：' + message.EventKey
        }
    }
    else if (message.MsgType === 'text') {
        var content = message.Content
        var reply = '额，你说的“' + message.Content + '”太复杂了，我不懂。'
 
        if (content === '1') {
            reply = '天下第一吃大米'
            console.log(message)
        }
        else if (content === '2') {
            reply = '天下第一吃豆腐'
        }
        else if (content === '3') {
            reply = '天下第一吃仙丹'
        }
        else if (content === '张杨海是谁') {
            reply = '张'
        }
        else if (content === '4') {
            reply = [{
                title: '技术改变世界',
                description: '只是个描述而已',
                picUrl: 'http://tu.dytt.com/20160426054059859.jpg',
                url:'http://virjay.com'
            }]
        }
        else if (content === '5') {
            var data = yield wechatApi.uploadMaterial('image', path.join(__dirname, '../2.jpg'))
 
            reply = {
                type: 'image',
                mediaId: data.media_id
            }
        }
        else if (content === '6') {
            var data = yield wechatApi.uploadMaterial('video', path.join(__dirname, '../6.mp4'))
            reply = {
                type: 'video',
                title: '蝙蝠侠：黑暗骑士',
                description: '蝙蝠侠与小丑的故事...',
                mediaId: data.media_id
            }
        }
        else if (content === '7') {
            var data = yield wechatApi.uploadMaterial('image', path.join(__dirname, '../2.jpg'))
            reply = {
                type: 'music',
                title: '音悦台',
                description: '放松一下...',
                musicUrl: 'http://virjay.com/7.mp3',
                thumbMediaId: data.media_id
            }
        }
        else if (content === '8') {
            var data = yield wechatApi.uploadMaterial('image', path.join(__dirname, '../2.jpg'),{type: 'image'})
 
            reply = {
                type: 'image',
                mediaId: data.media_id
            }
        }
        else if (content === '9') {
            var data = yield wechatApi.uploadMaterial('image', path.join(__dirname, '../6.mp4'),{type: 'video', description: '{"title":"batman", "introduction": "batman..."}'})
 
            reply = {
                type: 'video',
                title: '蝙蝠侠：黑暗骑士',
                description: '蝙蝠侠与小丑的故事...',
                mediaId: data.media_id
            }
        }
        else if (content === '10') {
            var picData = yield wechatApi.uploadMaterial('image', path.join(__dirname, '../2.jpg'),{})
 
            var media = {
                articles: [{
                    title: 'tututu',
                    thumb_media_id: picData.media_id,
                    author: 'virjay',
                    digest: '没有摘要',
                    show_cover_pic: 1,
                    content: '没有内容',
                    content_source_url: 'http://www.virjay.com'
                },{
                    title: 'tututu2',
                    thumb_media_id: picData.media_id,
                    author: 'virjay',
                    digest: '没有摘要',
                    show_cover_pic: 1,
                    content: '没有内容',
                    content_source_url: 'http://www.virjay.com'
                }]
            }
 
            data = yield wechatApi.uploadMaterial('news', media, {})
            data = yield wechatApi.fetchMaterial(data.media_id, 'news', {})
 
            console.log(data)
 
            var items = data.news_item
            var news = []
 
            items.forEach(function(items){
                news.push({
                    title: items.title,
                    description: items.digest,
                    picUrl: picData.url,
                    url: items.url
                })
            })
 
            reply = news
        }
        else if (content === '11') {
            var counts = yield wechatApi.countMaterial()
 
            console.log(JSON.stringify(counts))
 
            var results = yield [
                wechatApi.batchMaterial({
                    type: 'image',
                    offset: 0,
                    count: 10
                }),
                wechatApi.batchMaterial({
                    type: 'video',
                    offset: 0,
                    count: 10
                }),
                wechatApi.batchMaterial({
                    type: 'voice',
                    offset: 0,
                    count: 10
                }),
                wechatApi.batchMaterial({
                    type: 'news',
                    offset: 0,
                    count: 10
                })
            ]
             
            console.log(JSON.stringify(results))
 
            reply = '1'
        }
        else if (content === '12') {
            // var group = yield wechatApi.createGroup('wechat')
            // console.log('新分组 wechat：')
            // console.log(group)
 
            // var groups = yield wechatApi.fetchGroups()
            // console.log('加了 wechat 后的分组列表：')
            // console.log(groups)
 
            var group2 = yield wechatApi.checkGroup(message.FromUserName)
            console.log('查看自己的分组')
            console.log(group2)
 
            // var result = yield wechatApi.moveGroup(message.FromUserName,100)
            // console.log('移动到分组100')
            // console.log(result)
 
            // var result2 = yield wechatApi.moveGroup([message.FromUserName],101)
            // console.log('批量移动到分组101')
            // console.log(result2)
 
 
            var result3 = yield wechatApi.updateGroup(101, 'Custom')
            console.log('重命名结果：')
            console.log(result3)
 
            var groups3 = yield wechatApi.fetchGroups()
            console.log('更新后的分组列表：')
            console.log(groups3)
 
            // var result4 = yield wechatApi.deleteGroup(100)
            // console.log('删除100分组:')
            // console.log(result4)
 
            // var groups4 = yield wechatApi.fetchGroups()
            // console.log('更新后的分组列表：')
            // console.log(groups4)
 
            reply = 'Group done!'
        }
        else if (content === '13') {
            var user = yield wechatApi.fetchUsers(message.FromUserName, 'zh_CN')
 
            console.log(user)
 
            var openIds = [
                {
                    openid: message.FromUserName,
                    lang: 'zh_CN'
                }
            ]
 
            var users = yield wechatApi.fetchUsers(openIds)
            console.log(users)
 
            reply = JSON.stringify(user)
        }
        else if (content === '14') {
            var userlist = yield wechatApi.listUsers()
            console.log(userlist)
 
            reply = userlist.total
        }
        else if (content === '15') {
            var mpnews = {
                media_id: 'eSjpAvdDK68FjK2nRbbq5zXB_hzzICx8TJ8wn3-Io7s'
            }
            var test = {
                'content' : 'test'
            }
            var msgData = yield wechatApi.sendByGroup('image', mpnews, 101)
 
            console.log(msgData)
 
            reply = 'Yeah!'
        }
        else if (content === '16') {
            var mpnews = {
                media_id: 'eSjpAvdDK68FjK2nRbbq5zXB_hzzICx8TJ8wn3-Io7s'
            }
            // var test = {
            //     'content' : 'test'
            // }
            var msgData = yield wechatApi.previewMass('image', mpnews, 'oO2E0wZFvj4hcDAcwTc5NE79Ib04')
 
            console.log(msgData)
 
            reply = 'Yeah!'
        }
        else if (content === '17') {
            var msgData = yield wechatApi.checkMass('6297401665371273792')
 
            console.log(msgData)
 
            reply = 'Yeah!'
        }
        this.body = reply
    }
    yield next
}