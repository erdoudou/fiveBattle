package main

import (
	"encoding/json"
	"fmt"
	//"net/url"
	"os"
	//"strings"
	//"log"
	"io/ioutil"
	"net/http"
	"strconv"

	"golang.org/x/net/websocket"
)

//首先有一个棋盘
var (
	qiziNum     = 0                                //棋子数量
	blackColor  = 100                              //黑棋
	whiteColor  = 1                                //白棋
	chessBoard  = [15][15]int{}                    //棋盘
	myWin       = [1000]int{}                      //对方赢
	computerWin = [1000]int{}                      //电脑赢
	wins        = [15][15][1000]bool{}             //赢法数组
	count       = 0                                //赢法总数
	loginURl    = "http://127.0.0.1:12345/login"   //登录地址
	url1        = "ws://localhost:12345/webSocket" //ws地址
)

//将棋盘进行赋值
func initQipan() {
	for i := 0; i <= 14; i++ {
		for j := 0; j <= 14; j++ {
			chessBoard[i][j] = 0
		}
	}
}

func initMywin() {
	for i := 0; i <= 14; i++ {

		myWin[i] = 0

	}
}

func initComputerWin() {
	for i := 0; i <= 14; i++ {

		computerWin[i] = 0

	}
}

func initWins() {
	for i := 0; i <= 14; i++ {
		for j := 0; j <= 14; j++ {
			for k := 0; k <= 14; k++ {
				wins[i][j][k] = false
			}
		}
	}
}

func initCount() {
	//横线赢法
	for i := 0; i < 15; i++ {
		for j := 0; j < 11; j++ {
			for k := 0; k < 5; k++ {
				wins[i][j+k][count] = true
			}
			count++
		}
	}

	//竖线赢法
	for i := 0; i < 15; i++ {
		for j := 0; j < 11; j++ {
			for k := 0; k < 5; k++ {
				wins[j+k][i][count] = true
			}
			count++
		}
	}

	// 正斜线赢法
	for i := 0; i < 11; i++ {
		for j := 0; j < 11; j++ {
			for k := 0; k < 5; k++ {
				wins[i+k][j+k][count] = true
			}
			count++
		}
	}

	// 反斜线赢法
	for i := 0; i < 11; i++ {
		for j := 14; j > 3; j-- {
			for k := 0; k < 5; k++ {
				wins[i+k][j-k][count] = true
			}
			count++
		}
	}
}

//错误处理函数
func checkErr(err error, extra string) bool {
	if err != nil {
		formatStr := " Err : %s\n"
		if extra != "" {
			formatStr = extra + formatStr
		}

		fmt.Fprintf(os.Stderr, formatStr, err.Error())
		return true
	}

	return false
}

type Msg struct {
	MsgType string `json:"MsgType"`
	Name    string `json:"name"`
	Image   string `json:"image"`
	LocalX  int    `json:"LocalX"`
	LocalY  int    `json:"LocalY"`
}

type PlayerMsg struct {
	Key        string
	Value      string
	PlayerName string
	RoomerNum  string
	LocalX     string
	LocalY     string
}

type loginMsg struct {
	username string
	image    string
}

func main() {
	initQipan()
	initComputerWin()
	initMywin()
	initWins()

	initCount()

	login()
	doWebSocket()
	for {
	}

}
func login() {
	name := "110"
	image := "https://wx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTLibWZaJnsQQpAffkLCibWiaicJwKbDRCZW8wnCzllgcrFkw6nLlXYUYeBU7FoKibRW5h9t71OmMYPc7Pg/0"
	url := loginURl + "?username=" + name + "&image=" + image + "#stuff"
	resp, err := http.Get(url)
	if err != nil {
		fmt.Println("resp err=", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("body err=", err)
	}
	fmt.Println(string(body))
}

func doWebSocket() {
	conn, err := websocket.Dial(url1, "", loginURl)
	if checkErr(err, "Dial") {
		return
	}

	player := &PlayerMsg{
		Key:        "false",
		Value:      "容与",
		PlayerName: "110",
	}
	jsondata, err := json.Marshal(player)
	if err != nil {
		fmt.Println("生成json字符串出错")
	}
	fmt.Println("第一次发送数据")
	_, err = conn.Write([]byte(string(jsondata)))

	var request []byte
	for {
		err := websocket.Message.Receive(conn, &request)
		if checkErr(err, "Read") {
			break
		}
		//输出接收到的信息
		handleMsg(conn, request)

	}

	fmt.Println("Client finish.")
}

func handleMsg(ws *websocket.Conn, data []byte) {
	var msg *Msg
	err := json.Unmarshal(data, &msg)
	if err != nil {
		fmt.Println("解析数据异常...", err)
		return
	}
	fmt.Println("解析得到的数据为：", msg)

	switch msg.MsgType {
	case "goinroom":
		fmt.Println("收到进入房间的消息")
	case "local":
		fmt.Println("收到别人的下棋信息")
		painting(100, msg.LocalX, msg.LocalY)
		dolocal(msg, ws)
	default:
		fmt.Println("收到其他类型的消息")
	}
}

//确定下棋的位置,将对方最近一次的落子传入
func getLocal(localX, localY int) (x, y int) {
	if qiziNum == 1 {
		//在棋盘上任意不是该棋子位置的地方下
		return localX, localY + 1
	}

	return localX, localY + 1
}

//发送我自己的下棋信息
func dolocal(msg *Msg, conn *websocket.Conn) {
	//确定我下棋的位置
	x, y := computerAI()
	//painting(1, x, y)
	chessBoard[x][y] = 2

	fmt.Println("我下棋的位置", msg.LocalX, msg.LocalY, x, y)

	playerMsg := &PlayerMsg{
		Key:       "下棋1",
		RoomerNum: "容与",
		LocalX:    strconv.Itoa(y),
		LocalY:    strconv.Itoa(x),
	}

	jsondata, err := json.Marshal(playerMsg)
	if err != nil {
		fmt.Println("生成json字符串出错")
	}
	_, err = conn.Write([]byte(string(jsondata)))
}

//有一个画图函数,将棋子的颜色和坐标传入，黑子是100，白子是1
func painting(color, localx, localy int) {
	chessBoard[localy][localx] = 1 //表示已经占位
	for k := 0; k < count; k++ {
		if wins[localy][localx][k] {
			myWin[k]++ //每一种赢法超过五个，就赢
		}
	}
	qiziNum++
}

//机器人下棋算法
func computerAI() (int, int) {
	myScore := [15][15]int{}       //人下的棋子
	computerScore := [15][15]int{} //电脑下的棋子
	x := 0                         //横坐标位置
	y := 0                         //纵坐标位置
	max := 0
	//将两个数组进行初始化
	for i := 0; i <= 14; i++ {
		for j := 0; j <= 14; j++ {
			myScore[i][j] = 0
			computerScore[i][j] = 0
		}
	}

	for i := 0; i < 15; i++ {
		for j := 0; j < 15; j++ {
			if chessBoard[i][j] == 0 {
				for k := 0; k < count; k++ {
					if wins[i][j][k] { //该赢法存在
						// console.log(i,j,myWin[k])
						if myWin[k] == 1 {
							myScore[i][j] += 200
						} else if myWin[k] == 2 {
							myScore[i][j] += 400
						} else if myWin[k] == 3 {
							myScore[i][j] += 2000
						} else if myWin[k] == 4 {
							myScore[i][j] += 10000
						}

						if computerWin[k] == 1 {
							computerScore[i][j] += 220
						} else if computerWin[k] == 2 {
							computerScore[i][j] += 420
						} else if computerWin[k] == 3 {
							computerScore[i][j] += 2100
						} else if computerWin[k] == 4 {
							computerScore[i][j] += 20000
						}
					}
				}
				if myScore[i][j] > max { //对人有利的位置
					max = myScore[i][j]
					x = i
					y = j
				} else if myScore[i][j] == max {
					if computerScore[i][j] > computerScore[x][y] {
						//
						x = i
						y = j
					}
				}
				if computerScore[i][j] > max {
					max = computerScore[i][j]
					x = i
					y = j
				} else if computerScore[i][j] == max {
					if myScore[i][j] > myScore[x][y] {
						x = i
						y = j
					}
				}
				fmt.Println("打印出max的值：", max)
			}

		}
	}

	for k := 0; k < count; k++ {
		if wins[x][y][k] {
			computerWin[k]++
		}
	}

	return x, y
}
