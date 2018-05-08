//home.js
//获取应用实例
const app = getApp()

Page({
  data: {
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    isBtnClicked:false,
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },
  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function () {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }

    


  },
  getUserInfo: function (e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })

    /*wx.sendSocketMessage({
      data: "login"
    })*/
  },

//开始游戏功能
  startGame:function(e){
    wx.request({
      url: 'http://127.0.0.1:12345/login',
      data: {
        username: app.globalData.userInfo.nickName,
        image: app.globalData.userInfo.avatarUrl
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data == "1") {
          console.log("发送昵称成功")
        } else {
          console.log("发送昵称失败")
        }
      }
    })
    wx.navigateTo({
      url: '../match/match?isRoomer=true',
    })
  },

  goIntoGame:function(e){
    wx.request({
      url: 'http://127.0.0.1:12345/login',
      data: {
        username: app.globalData.userInfo.nickName,
        image: app.globalData.userInfo.avatarUrl
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data == "1") {
          console.log("发送昵称成功")
        } else {
          console.log("发送昵称失败")
        }
      }
    })
    console.log("跳转到显示房间列表页面", app.globalData.userInfo)
    wx.navigateTo({
      url: '../roomlist/roomlist',
    })
  },

  goIntoBattle:function(e){
    console.log("跳转到人机大战页面")
    wx.navigateTo({
      url: '../battle/battle',
    })
  }
})
