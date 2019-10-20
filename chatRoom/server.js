const express = require('express')
const app = express()

const http = require('http').Server(app)
const io = require('socket.io')(http)

app.use('/',express.static(__dirname + '/public'))

// 部署测试
// app.get('/', (req, res) => {
//     res.send('ok')
// })

var users = [];  //储存登录用户姓名 
var usersInfo = [];  // 用来存储登录用户姓名和头像

io.on('connection', (socket) => { //用户连接时触发
    // console.log('a user connected')

    // 监听登录事件
    socket.on('login', (user) => {
        if(users.indexOf(user.name) > -1) {
            socket.emit('loginError')
        } else {
            user.id = socket.id           //这样socket.id 就可以跟昵称关联
            users.push(user.name)
            usersInfo.push(user)

            socket.emit('loginSuc')
            socket.nickname = user.name   //为了用户退出的时候能够顺利将用户从数组中移除

            //向其他用户通知上线
            io.emit('system', {
                name: user.name,
                status: 'enter'
            })

            //向其他用户提供可渲染的在线用户列表
            io.emit('disUser', usersInfo)

            console.log(users.length + 'users connecting...')
            

        }
    })

    // 监听客户端发送消息
    socket.on('sendMsg', (cliMsg) => {

        // 渲染用户的头像
        let img = ''
        for (var i = 0; i < usersInfo.length; i++){
            if (usersInfo[i].name == socket.nickname) {
                img = usersInfo[i].img
            }
        }

        
        socket.broadcast.emit('receiveMsg', { //广播给除了当前用户以外的其他用户
            name: socket.nickname,
            img: img,
            msg: cliMsg.msg,
            type: cliMsg.type,
            side: 'left'
        });

        socket.emit('receiveMsg', { //只触发当前用户的事件
            name: socket.nickname,
            img: img,
            msg: cliMsg.msg,
            type: cliMsg.type,
            side: 'right'
        });

    })

    // 用户退出，断开连接
    socket.on('disconnect', () => {
        var index = users.indexOf(socket.nickname);
        if (index > -1) {
            users.splice(index, 1);
            usersInfo.splice(index, 1);

            io.emit('system', {
                name: socket.nickname,
                status: 'leave'
            })

            io.emit('disUser', usersInfo)
            console.log('1 user leave')
        }
    })

})



http.listen(3000, () => {
    console.log('listen 3000 port')
})