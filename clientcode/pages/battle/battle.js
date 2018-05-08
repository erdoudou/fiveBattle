// pages/wuziqi/wuziqi.js
Page({
  data: {
    fz: 0,//一个方格大小
    flag: 1,//判断黑白棋
    wins: [],
    whiteWins: [],//电脑下的为白棋
    chessBoard: [],
    count: 0,
    myWin: [],
    computerWin: [],
    over: false,
    me:true,
    ctx: wx.createCanvasContext("canvas"),
    roomerNum: "房主号",
    grid: 15//格子数

  },
  click1: function (event) {
    if (this.data.over||!this.data.me) {
      return;
    }

    var unit = this.data.fz;
    var pageX = event.detail.x;
    var pageY = event.detail.y;
    var a = Math.round(pageX / unit);
    var b = Math.round(pageY / unit) - 1;
    var i = a;
    var j = b;
    
    console.log("棋子的位置", i, j)  

    if (this.data.chessBoard[i][j] == 0) {
      this.drawChess(i, j);
      this.data.chessBoard[i][j] = 1;//已经占位
      for (var k = 0; k < this.data.count; k++) {
        if (this.data.wins[i][j][k]) {
          // console.log(typeof myWin[k],myWin[k])
          this.data.myWin[k]++;//每一种赢法超过五个，就赢
          if (this.data.myWin[k] == 5) {
            this.data.over = true;
            wx.showToast({
              title: "黑方胜"
            })
          }
        }
      }
    }


    if (!this.data.over) {
      this.data.me = !this.data.me;
      console.log("打印出me:"+this.data.me)
      this.computerAI();
    }

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    //绘制棋盘
    this.drawChessBoard();
    //对棋盘进行初始化
    var chressBord = this.data.chessBoard;  
    for (var i = 0; i < 15; i++) {
      chressBord[i] = [];
      for (var n = 0; n < 15; n++) {
        chressBord[i][n] = 0;
      }
    }
    //赢法数组
    var wins = this.data.wins;
    var count = this.data.count;
    var grid = this.data.grid;
    for (var i = 0; i < grid; i++) {
      wins[i] = []
      for (var j = 0; j < grid; j++) {
        wins[i][j] = [];
      }
    }

    //竖线赢法
    for (var i = 1; i < grid; i++) {
      for (var j = 0; j < grid - 4; j++) {
        for (var k = 0; k < 5; k++) {
          wins[i][j + k][count] = true;
        }
        count++;
      }
    }
    //横线赢法
    for (var i = 1; i < grid; i++) {
      for (var j = 0; j < grid - 4; j++) {
        for (var k = 0; k < 5; k++) {
          wins[j + k][i][count] = true;
        }
        count++;
      }
    }

    //正斜线
    for (var i = 1; i < grid - 4; i++) {
      for (var j = 0; j < grid - 4; j++) {
        for (var k = 0; k < 5; k++) {
          wins[i + k][j + k][count] = true;
        }
        count++;
      }
    }
    //反斜线
    for (var i = 1; i < grid - 4; i++) {
      for (var j = grid - 1; j > 4; j--) {
        for (var k = 0; k < 5; k++) {
          wins[i + k][j - k][count] = true;
        }
        count++;
      }
    }

    // 重置 myWin 和 computerWin
    for (var i = 0; i < count; i++) {
      this.data.myWin[i] = 0;
    }
    for (var i = 0; i < count; i++) {
      this.data.computerWin[i] = 0;
    }

    console.log("初始化后count的值",count);
    this.data.wins = wins;
    this.data.count=count;
  },

  drawChessBoard:function (){
    var ctx = wx.createCanvasContext("canvas");
    var grid = this.data.grid;
    var fz = wx.getSystemInfoSync().windowWidth / grid;
    this.data.fz = fz;
    for (var i = 0; i < grid; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * fz);
      ctx.lineTo(grid * fz, i * fz);
      ctx.closePath();
      ctx.stroke();
      
    }    
    for (var j = 0; j < grid; j++) {
      ctx.beginPath();
      ctx.moveTo(j * fz, 0);
      ctx.lineTo(j * fz, grid * fz);
      ctx.closePath();
      ctx.stroke();    
    }
    ctx.draw();
  },

  computerAI:function () {
    var myScore= [];
    var computerScore= [];
    var max= 0;
    var u= 0, v=0;
    var that = this

    //初始化权重
    for(var i= 0;i<15;i++){
      myScore[i] = [];
      computerScore[i] = [];
      for (var j = 0; j < 15; j++) {
        myScore[i][j] = 0;
        computerScore[i][j] = 0;
      }
    }

    for (var i = 0; i < 15; i++) {
      for (var j = 0; j < 15; j++) {
        if (that.data.chessBoard[i][j] == 0) {
          console.log("打印出count的值", this.data.count);
          for (var k = 0; k < this.data.count; k++) {
            if (that.data.wins[i][j][k]) {//该赢法存在
              //console.log("打印出循环里的数",i,j,myWin[k])
              if (that.data.myWin[k] == 1) {
                myScore[i][j] += 200;
              } else if (that.data.myWin[k] == 2) {
                myScore[i][j] += 400;
              } else if (that.data.myWin[k] == 3) {
                myScore[i][j] += 2000;
              } else if (that.data.myWin[k] == 4) {
                myScore[i][j] += 10000;
              }

              if (that.data.computerWin[k] == 1) {
                computerScore[i][j] += 220;
              } else if (that.data.computerWin[k] == 2) {
              computerScore[i][j] += 420;
              } else if (that.data.computerWin[k] == 3) {
                computerScore[i][j] += 2100;
              } else if (that.data.computerWin[k] == 4) {
                computerScore[i][j] += 20000;
              }
            }
          }
          if (myScore[i][j] > max) {//对人有利的位置
            max = myScore[i][j];
            u = i;
            v = j;
          } else if (myScore[i][j] == max) {
            if (computerScore[i][j] > computerScore[u][v]) {
            //
              u = i;
              v = j;
            }
          }
          if (computerScore[i][j] > max) {
            max = computerScore[i][j];
            u = i;
            v = j;
          } else if (computerScore[i][j] == max) {
            if (myScore[i][j] > myScore[u][v]) {
              u = i;
              v = j;
            }
          }
          //console.log("打印出最大值:",max)
        }else{
          console.log("下棋位置的横纵坐标",i,j)
        }

      }
    }

    console.log("电脑下棋的位置：",u, v)
    that.drawChess(u, v);
    that.data.chessBoard[u][v] = 2;//计算机占据位置
    for (var k = 0; k < that.data.count; k++) {
      if (that.data.wins[u][v][k]) {
        that.data.computerWin[k]++;
        if (that.data.computerWin[k] == 5) {
          
          that.data.over = true;
          wx.showToast({
            title: "白方胜"
          })
        }
      }
    }
    if (!that.data.over) {
      that.data.me = !that.data.me;
    }
  },

  drawChess: function (x, y) {
    var ctx = wx.createCanvasContext("canvas");
    var unit = this.data.fz;
    ctx.beginPath();
    
    ctx.arc(x * unit, y * unit, unit / 2, 0, Math.PI * 2, true)//画图函数
    ctx.closePath();
    var that = this
    if (that.data.me) {
      ctx.setFillStyle("black");
      
    } else {
      ctx.setFillStyle("white");
     
    }
    ctx.fill()
    ctx.draw(true);//true 是否接着上一次绘制
  }

})