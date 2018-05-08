//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    userInfo2:'dede',
    image2:'',
    flag:false,
    roomerNum:"房主号",
    isRoomer:"false"
  },
  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function (option) {
    console.log(option.isRoomer, this.data.isRoomer)
    this.setData({
      userInfo: app.globalData.userInfo,
      hasUserInfo: true,
      isRoomer: option.isRoomer
    })
    console.log(option.isRoomer, this.data.isRoomer)
    //和服务器建立连接
    var socketOpen = false
    console.log("给服务器发送开始游戏的消息")

    var that = this

    wx.connectSocket({
      url: 'ws://localhost:12345/webSocket'
    })

    wx.onSocketOpen(function (res) {
      console.log('WebSocket连接已打开！')
      socketOpen = true
      if (that.data.isRoomer =='false'){
        that.setData({
          roomerNum:option.roomid
        })
        var msg = { key: that.data.isRoomer, value: option.roomid, playerName:app.globalData.userInfo.nickName }
        var dataMsg = JSON.stringify(msg)   
        sendSocketMessage(dataMsg)
      }else{//给服务器发送创建房间的消息
        that.setData({
          roomerNum: app.globalData.userInfo.nickName
        })
      console.log("给服务器发送创建房间")
      var msg = { key: that.data.isRoomer, value: app.globalData.userInfo.nickName }
        var dataMsg = JSON.stringify(msg)
        sendSocketMessage(dataMsg)
      }      
    })

    wx.onSocketError(function (res) { 
      console.log('WebSocket连接打开失败，请检查！')
    })

    wx.onSocketMessage(function (res) {
      var objData = JSON.parse(res.data);     
      console.log('收到服务器内容：' + objData.Name) 
      that.setData({
        flag: true,
        userInfo2: objData.Name,
        image2: objData.Image
      })
    })

    function sendSocketMessage(msg) {
      if (socketOpen) {
        wx.sendSocketMessage({
          data: msg
        })
      } else {
        console.log('WebSocket没有被打开不能发送消息')
      }
    }
  },
  getUserInfo: function (e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },

  //进入战斗
  goIntoGame: function (e) {
    console.log("将房主号传到笑一个页面")
    wx.navigateTo({
      url: '../wuziqi/wuziqi?roomerNum=' + this.data.roomerNum,
    })
  }
})
