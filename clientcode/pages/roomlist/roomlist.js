//roomlist.js
//获取应用实例
const app = getApp()

Page({
  data:{
    button:[],
    btnText:[
      { btnText: "房间号1" },
      { btnText: "房间号2" },
      { btnText: "房间号3" }
    ],  
  },
  onLoad: function () {
    console.log('给服务器发送消息，获取房间列表')
    var that = this
    var nameArry = new Array 
    wx.request({
      url: 'http://127.0.0.1:12345/roomlist', //仅为示例，并非真实的接口地址
      data: {
        getRoomList: app.globalData.userInfo.nickName
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: function (res) {
        console.log("收到房间列表"+res.data)       
        nameArry=res.data.split(",")
        that.setData({
          button: nameArry
        });        
      }
    })   
  },
  goIntoGame: function (e) {
    console.log("跳转到显示房间列表页面")
    var id = e.currentTarget.dataset.name

    wx.navigateTo({
      //url: '../match/match?roomid=' + id + '&&name=' + app.globalData.userInfo.nickName,
      url: '../match/match?isRoomer=false&&roomid=' + id,
    })    
  }
})
