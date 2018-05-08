// pages/wuziqi/wuziqi.js

const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    fz: 0,//一个方格大小
    flag:1,//判断黑白棋
    wins:[],
    whiteWins:[],
    chressBord:[],
    count:0,
    blackWin:[],
    whiteWin:[],
    gameover:false,
    roomerNum:"房主号",
    grid:15//格子数
  
  },
  click1:function(event){
    if(this.data.gameover){
      return;
    }
    // return;
    
    var ctx=wx.createCanvasContext("canvas");
    console.log(event.detail)//实际宽度
    console.log(this.data.fz)
    var unit=this.data.fz;
    var pageX=event.detail.x;
    var pageY=event.detail.y;
    // (pageX/unit)
    var a= Math.round(pageX / unit);
    var b=Math.round(pageY/unit)-1;
    console.log("棋子的位置",a,b)
    // ctx.save();
    ctx.beginPath();

    function sendSocketMessage(msg) {
      wx.sendSocketMessage({
        data: msg
      })
    }

    var localx = 10000, localy = 10000

    var that=this

    if(a==this.data.grid || a==0 || b==0 || b==this.data.grid){
      return;
    } else { //先给服务器发送申请，然后根据服务器的回复开始画图    
      var msg = { key: "下棋", playerName: app.globalData.userInfo.nickName, roomerNum: this.data.roomerNum, localX: a.toString(), localY:                            b.toString()}
      var dataMsg = JSON.stringify(msg)
      sendSocketMessage(dataMsg)   
      wx.onSocketMessage(function (res) {
        var objData = JSON.parse(res.data);
        console.log('收到服务器内容：' + objData.LocalX, objData.LocalY)
        localx = objData.LocalX
        localy = objData.LocalY 
        if (localx == 10000 && localy == 10000) {
          return
        }
        that.huatu(localx, localy)       
      })  
    }
    
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      roomerNum: options.roomerNum
    })
    console.log("收到的房主号是：", options.roomerNum)
    wx.onSocketMessage(function (res) {
      var objData = JSON.parse(res.data);
      console.log('收到服务器内容：' + objData.LocalX, objData.LocalY)
      huatu(objData.LocalX, objData.LocalY)
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
    var ctx=wx.createCanvasContext("canvas");
    var grid=this.data.grid;
    var fz=wx.getSystemInfoSync().windowWidth/grid;
    this.data.fz=fz;
    console.log(fz);
    for(var i=0;i<grid;i++){
      ctx.beginPath();
      ctx.moveTo(0,i*fz);
      ctx.lineTo(grid*fz,i*fz);
      ctx.closePath();
      ctx.stroke();
    }
    for (var j = 0; j < grid; j++) {
      ctx.beginPath();
      ctx.moveTo(j * fz,0);
      ctx.lineTo(j * fz,grid * fz);
      ctx.closePath();
      ctx.stroke();
    }
    
    ctx.draw();


  //赢法数组

  var wins=this.data.wins;
  for(var i=0;i<grid;i++){
    wins[i]=[]
    for(var j=0;j<grid;j++){
      wins[i][j]=[];
    }
  }
  var count=0;//赢法总数

  //竖线赢法
  for(var i=1;i<grid;i++){
    for(var j=0;j<grid-4;j++){
      for(var k=0;k<5;k++){
        wins[i][j+k][count]=true;
      }
      count++;
    }
  }
//横线赢法
  for (var i = 1; i < grid; i++) {
    for (var j = 0; j < grid-4; j++) {
      for (var k = 0; k < 5; k++) {
        wins[j+k][i][count] = true;
      }
      count++;
    }
  }

  //正斜线
  for (var i = 1; i < grid-4; i++) {
    for (var j = 0; j < grid-4; j++) {
      for (var k = 0; k < 5; k++) {
        wins[i + k][j+k][count] = true;
      }
      count++;
    }
  }
  //反斜线
  for (var i = 1; i < grid-4; i++) {
    for (var j = grid-1; j >4; j--) {
      for (var k = 0; k < 5; k++) {
        wins[i + k][j - k][count] = true;
      }
      count++;
    }
  }
  console.log(count);
  this.data.wins=wins;
  this.data.whiteWins=wins;
  
  
   var arr=new Array(grid);
   for(var i=0;i<arr.length;i++){
     arr[i] = new Array(grid)
   }
   for (var i = 0; i < grid;i++){
     for (var j = 0; j < grid;j++){
        arr[i][j]=0;
      }
    }
    this.data.chressBord = arr;
    this.data.count=count;
    var win=new Array(count);
    for(i=0;i<count;i++){
      win[i]=0;
    }
    var win1 = new Array(count);
    for (i = 0; i < count; i++) {
      win1[i] = 0;
    }
    this.data.blackWin=win;
    this.data.whiteWin=win1;
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  },
  
  huatu: function (x, y){
    var ctx = wx.createCanvasContext("canvas");
    var unit = this.data.fz;
    ctx.beginPath();

    var that = this
    ctx.arc(x * unit, y * unit, unit / 2, 0, Math.PI * 2, true)//画图函数
    var wins = that.data.wins;
    var bord = that.data.chressBord;
    if (bord[x][y] == 0) {
      if (that.data.flag == 1) {
        ctx.setFillStyle("black");
        ctx.fill();
        ctx.draw(true);//true 是否接着上一次绘制
        for (var k = 0; k < that.data.count; k++) {
          if (wins[x][y][k]) {
            that.data.blackWin[k]++;
            // console.log(this.data.blackWin[k],k)
            if (that.data.blackWin[k] == 5) {
              wx.showToast({
                title: "黑方胜"
              })
              that.data.gameover = true;
            }
          }
        }
        that.data.flag = 0;
      } else {
        ctx.setFillStyle("white");
        ctx.fill();
        ctx.draw(true);//true 是否接着上一次绘制
        for (var k = 0; k < that.data.count; k++) {
          if (that.data.whiteWins[x][y][k]) {
            that.data.whiteWin[k]++;
            if (that.data.whiteWin[k] == 5) {
              wx.showToast({
                title: "白方胜",
                icon: "success"
              });
              that.data.gameover = true;
            }
          }
        }
        that.data.flag = 1;
      }
      that.data.chressBord[x][y] = 1;//有棋子
    }  
  }
})