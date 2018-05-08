package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"golang.org/x/net/websocket"
)

//小程序发送过来的消息LocalX是纵轴的坐标，LocalY是横轴的坐标
type PlayerMsg struct {
	Key        string `json:"key"`
	Value      string `json:"value"`
	PlayerName string `json:"playerName"`
	RoomerNum  string `json:"roomerNum"`
	LocalX     string `json:"localX"`
	LocalY     string `json:"localY"`
}

//玩家信息
type Player struct {
	name  string
	image string
	conn  *websocket.Conn
}

//房间信息
type room struct {
	roomerPlayer *Player
	player       *Player
}

//服务器发送到客户端的消息
type Msg struct {
	MsgType string
	Name    string
	Image   string
	LocalX  int
	LocalY  int
}

//房间管理器
var roomMgr = make(map[string]*room)

//连接管理器，key：昵称，value：websocket.conn
var playersConn = make(map[*websocket.Conn]string)

//玩家管理
var playerMgr = make(map[string]*Player)

func main() {
	//设置页面路由处理
	http.HandleFunc("/login", handle_login)
	http.HandleFunc("/roomlist", handle_getRoomlist)

	//websocket处理
	http.Handle("/webSocket", websocket.Handler(handleWebSocket))
	fmt.Println("开始监听服务器")
	//通知下线任务
	go handle_client_close()

	http.ListenAndServe(":12345", nil)
	print("结束时间:")
	println(time.Now().String())
}

//创建房间
func handle_login(responseWriter http.ResponseWriter, req *http.Request) {

	if roomMgr[req.FormValue("username")] != nil {
		fmt.Println("在服务器该玩家有房间,则不进行创建房间")
		return
	}

	player := &Player{
		name:  req.FormValue("username"),
		image: req.FormValue("image"),
	}
	fmt.Println("登录的玩家的信息", req.FormValue("username"), req.FormValue("image"))
	playerMgr[player.name] = player

	responseWriter.Write([]byte("1"))
}

//获取房间列表
func handle_getRoomlist(responseWriter http.ResponseWriter, req *http.Request) {
	fmt.Println("收到roomlist请求", req.FormValue("getRoomList"))
	roomNameString := "001,"
	for k, _ := range roomMgr {
		roomNameString = roomNameString + k + ","
	}
	responseWriter.Write([]byte(roomNameString))
}

//小程序有两个页面需要使用到该函数，第一个就是匹配页面，第二个就是五子棋页面
func handleWebSocket(ws *websocket.Conn) {
	//判断是否重复连接
	if _, ok := playersConn[ws]; ok {
		fmt.Println("重复连接")
	}

	var data []byte
	for {
		fmt.Println("开始解析数据...")
		err := websocket.Message.Receive(ws, &data)
		//移除出错的链接
		if err != nil {
			delete(playersConn, ws)
			fmt.Println("接收出错...")
			break
		}

		handleMsg(ws, data)
	}
}

//消息操作（战斗同步时应该做怎么样的处理，也没有想好的）
func handleMsg(ws *websocket.Conn, data []byte) {
	var msg PlayerMsg
	err := json.Unmarshal(data, &msg)
	if err != nil {
		fmt.Println("解析数据异常...", err)
		return
	}
	fmt.Println("解析出来的数据为：", msg)

	if msg.Key == "false" { //不是房主，玩家加入房间
		playersConn[ws] = msg.PlayerName
		dogoinRoom(ws, msg.Value, msg.PlayerName)
	} else if msg.Key == "true" { //是房主，玩家创建房间
		playersConn[ws] = msg.Value
		player1 := playerMgr[msg.Value]
		player1.conn = ws
		room := &room{
			roomerPlayer: player1,
		}
		roomMgr[msg.Value] = room
	} else if msg.Key == "下棋" {
		doLuozi(ws, msg.LocalX, msg.LocalY, msg.RoomerNum)
	} else if msg.Key == "下棋1" {
		doLuoziRoomer(ws, msg.LocalX, msg.LocalY, msg.RoomerNum)
	} else {
		fmt.Println("收到其他类型的数据")
		websocket.Message.Send(ws, "服务器给客户端回送消息")
	}
}

func doLogin(name, pwd string) (role *Player, isSuc bool) {
	return role, isSuc
}

/*
 **进入房间
 **两个事情，一将房主的昵称，头像发送给玩家.二，将玩家的头像,昵称发送给房主
 */
func dogoinRoom(ws *websocket.Conn, roomNum, playername string) {
	fmt.Println("房间号为：", roomNum)
	sendMsg := &Msg{
		MsgType: "goinroom",
		Name:    roomNum,
		Image:   "https://wx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTLibWZaJnsQQpAffkLCibWiaicJwKbDRCZW8wnCzllgcrFkw6nLlXYUYeBU7FoKibRW5h9t71OmMYPc7Pg/0",
	}
	jsondata, err := json.Marshal(sendMsg)
	if err != nil {
		fmt.Println("生成json字符串出错")
	}
	websocket.Message.Send(ws, string(jsondata))
	//玩家2加入房间
	fmt.Println("收到的非房主的玩家的名称", playername)
	player2 := playerMgr[playername]
	player2.conn = ws
	roomMgr[roomNum].player = player2

	//根据这个房间号找到该房主的连接，该部分还未想好如何进行处理
	roomerMsg := &Msg{
		MsgType: "goinroom",
		Name:    roomMgr[roomNum].player.name,
		Image:   roomMgr[roomNum].player.image,
	}

	jsondata, err = json.Marshal(roomerMsg)
	if err != nil {
		fmt.Println("生成json字符串出错")
	}

	for k, v := range playersConn {
		if v == roomMgr[roomNum].roomerPlayer.name {
			websocket.Message.Send(k, string(jsondata))
		}
	}
}

//下棋处理
func doLuozi(ws *websocket.Conn, localX, localY, roomerNum string) {
	x, _ := strconv.Atoi(localX)
	y, _ := strconv.Atoi(localY)
	sendMsg := &Msg{
		MsgType: "local",
		LocalX:  x,
		LocalY:  y,
	}
	jsondata, err := json.Marshal(sendMsg)
	if err != nil {
		fmt.Println("生成json字符串出错")
	}
	//返回消息应该做两种处理，第一种是自己下的话只用返回成功与否，然后别人的话就要发送一个同步信息
	websocket.Message.Send(roomMgr[roomerNum].roomerPlayer.conn, string(jsondata))
	websocket.Message.Send(roomMgr[roomerNum].player.conn, string(jsondata))
}

//只同步给房主
func doLuoziRoomer(ws *websocket.Conn, localX, localY, roomerNum string) {
	x, _ := strconv.Atoi(localX)
	y, _ := strconv.Atoi(localY)
	sendMsg := &Msg{
		MsgType: "local",
		LocalX:  x,
		LocalY:  y,
	}
	jsondata, err := json.Marshal(sendMsg)
	if err != nil {
		fmt.Println("生成json字符串出错")
	}

	websocket.Message.Send(roomMgr[roomerNum].roomerPlayer.conn, string(jsondata))
}

//下线处理
func handle_client_close() {
	for {
		//重新加载在线用户,该部分还未想好
		/*var userOnlneData Datas
		//清除连接人昵称信息
		userOnlneData.UserDatas = make([]UserData, 0)
		userOnlneData.UserMsgs = make([]UserMsg, 0)
		//重新加载当前在线连接人
		for _, item := range users {
			userData := UserData{Username: item}
			userOnlneData.UserDatas = append(userOnlneData.UserDatas, userData)
		}
		//通知当前在线的用户，那些人在线
		b, errMarshl := json.Marshal(userOnlneData)
		if errMarshl != nil {
			fmt.Println("序列化在线人数消息异常")
			continue
		}
		if !noteAllUser(string(b)) {
			continue
		}
		time.Sleep(2 * 1e9)*/
	}
}

func noteAllUser(message string) bool {
	allSuccess := true
	for key := range playersConn {
		errMarshl := websocket.Message.Send(key, message)
		if errMarshl != nil {
			//移除出错的链接
			delete(playersConn, key)
			allSuccess = false
			continue
		}
	}
	return allSuccess
}
