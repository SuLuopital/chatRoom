$(function () {
    // 初始化io()之后如果成功连接才会触发connection函数
    var socket = io();

    // inputName 获取用户名称和随机分配一个头像
    $('#nameBtn').click(inputName);


    // 监听server登录成功事件
    socket.on('loginSuc', () => {
        $('.name').hide();
        console.log('a user connected')
    })

    // 监听server登录失败事件
    socket.on('loginError', () => {
        alert('用户名已存在，请重新输入');
        $('#name').val('');
    })

    // 监听服务器给所有用户推送的用户上线信息
    socket.on('system', (userStatus) => {
        if (userStatus.status == 'enter') {
            var data = new Date().toTimeString().substr(0, 8)
            $('#messages').append(`<p class='system'><span>${data}</span><br /><span>${userStatus.name} 加入了聊天室<span></p>`)

            // 设置滚动条在最底部
            $('#messages').scrollTop($('#messages')[0].scrollHeight);

            console.log( userStatus.name +'上线了')
        } else if (userStatus.status == 'leave') {
            var data = new Date().toTimeString().substr(0, 8)
            $('#messages').append(`<p class='system'><span>${data}</span><br /><span>${userStatus.name} 离开了聊天室<span></p>`)

            // 设置滚动条在最底部
            $('#messages').scrollTop($('#messages')[0].scrollHeight);
        }
    })

    // 监听服务器给client推送的用户列表
    socket.on('disUser', (userInfo) => {
        // console.log('当前在线用户（' + userInfo.length + '）')
        // 渲染在线人员列表
        displayUser(userInfo);
    })

    // 发送消息
    $('#sub').click(sendMsg);
    $('#m').keyup((ev) => {
        if (ev.which == 13) {
            sendMsg();
        }
    })

    // 监听服务端收到消息后给客户端广播事件
    socket.on('receiveMsg', (serMsg) => {

        if (serMsg.type == 'img') { //发送了图片
            $('#messages').append(`
                <li class='${serMsg.side}'>
                    <img src="${serMsg.img}">
                    <div>
                    <span>${serMsg.name}</span>
                    <p style="padding: 0;">${serMsg.msg}</p>
                    </div>
                </li>
            `);
            $('.sendImg').on('load', () => {
                $('#messages').scrollTop($('#messages')[0].scrollHeight);
            })
            return;
        } 

        //对收到的字符串中的表情进行渲染
        var msg = serMsg.msg
        var content = ''
        //http://127.0.0.1:3000/image/emoji/emoji%20(1).png
        //1270013000201
        //3000201
        //****[emoji300020143]****
        //你好[emoji3000202]
        var patter = /[emoji300020[1-9]+]/
        if (patter.test(msg)) {
            var start = msg.indexOf('[')
            var end = msg.indexOf(']')
            var content1 = '<span>' + msg.substr(0, start) + '</span>'
            var content2 = '<span>' + msg.substr(end + 1, msg.length - end) + '</span>'
            var imgN = '<img src="image/emoji/emoji%20('+ msg.substr(start+12,end-start-12) +').png">'
            content = content1 + imgN + content2
        } else {
            content = '<span>' + msg + '</span>'
        }

        // while (msg.indexOf('[') > -1) {
        //     var start = msg.indexOf('[')
        //     var end = msg.indexOf(']')

        //     content = '<span>' + msg.substr(0, start) + '</span>'
        //     content = content + '<img src="image/emoji/emoji%20('+msg.substr(start+11, end-start-11)+').png">';
        //     msg = msg.substr(end, msg.length - end);
        // }
        
        
        $('#messages').append(`
            <li class='${serMsg.side}'>
                <img src="${serMsg.img}">
                <div>
                    <span>${serMsg.name}</span>
                    <p>${content}</p>
                </div>
            </li>
        `)

        // 设置滚动条在最底部
        $('#messages').scrollTop($('#messages')[0].scrollHeight);
    })




    function inputName() { // 昵称输入
        // console.log('input')
        let imgN = Math.floor(Math.random() * 4) + 1;
        if ($('#name').val().trim() != '') { // emit数据到服务端检验,触发登录事件
            socket.emit('login', {
                name: $('#name').val(),
                img: 'image/user' + imgN + '.jpg',
                id: ''
            });
        }
    }

    
    function displayUser(userInfo){ // 渲染在线人员列表
        $('#users').text(''); // 每次人员增加刷新重新渲染
        if (!userInfo) {
            $('.contacts p').show();
        } else {
            $('.contacts p').hide();
        }
        $('#num').text(userInfo.length);
        for (var i = 0; i < userInfo.length; i++){
            let $html = 
            `<li>
                <a href="#"><img src="${ userInfo[i].img }"></a>
                <span>${ userInfo[i].name }</span>
            </li>`
            $('#users').append($html);
        }
    }

    var color = '#000000'
    function sendMsg() { //client端发送消息
        if ($('#m').val() == '') {
            alert('不能发送空消息')
            return false;    
        }
        color = $('#color').val();
        socket.emit('sendMsg', {
            msg: $('#m').val(),
            type: 'text'
        });
        $('#m').val('');
        return false;
    }
    

    initEmoji();
    function initEmoji() {  //渲染出表情
        for (var i = 0; i < 141; i++){
            $('.emoji').append('<li id='+i+'><img src="image/emoji/emoji ('+(i+1)+').png"></li>');
        }
    }

    $('#smile').click(() => {  //点击smile图标展示表情
        $('.selectBox').css('display','block')
    }).dblclick((ev) => {  //双击隐藏
        $('.selectBox').css('display','none')
    })
    $('#m').click(() => {   //输入消息的时候也直接隐藏表情
        $('.selectBox').css('display','none')
    })

    $('.emoji li img').click((ev) => { //点击表情发送
        ev = ev || window.event;
        var src = ev.target.src  //http://127.0.0.1:3000/image/emoji/emoji%20(1).png
        var emojiNum = src.replace(/\D*/g, '')    //1270013000201   
            .substr(6, 9)                      //3000201
        var oldText = $('#m').val()
        
        $('#m').val(oldText + '[emoji' + emojiNum + ']');
        $('.selectBox').css('display', 'none');
    })


    $('#file').change(function () {  //监听input file 状态改变触发
        let file = this.files[0]    //获取到文件
        let reader = new FileReader()

        reader.onerror = function () {
            alert('读取文件失败，请重试')
        }

        reader.readAsDataURL(file) //读取为base64

        reader.onload = function () {
            let src = reader.result;
            let img = '<img class="sendImg" src="'+ src +'" >' //base64编码
            socket.emit('sendMsg', { //发送图片
                msg: img,
                type: 'img'
            })
        }
    })

    enlarge()
    closeImg()
    function enlarge() { // 点击图片放大
        $('#messages').on('click', '.sendImg', function () {
            // console.log($('.sendImg').length)

            let ImgObjs = $('.sendImg')
            for (let i = 0; i < ImgObjs.length; i++){  //为了防止一直取到最开始那张图，加上循环

                let src = this.src
                $('.enlarge').css('display', 'block')
                $('.largeImg').attr('src', src)
                    
                
                // 对图片缩放进行处理
                let largeImg = document.getElementsByClassName('largeImg')[0]
                let height = largeImg.height
                let width = largeImg.width
                // console.log(height)

                if (width < height) { //竖屏图片vertical
                    let left = parseInt(width / 2)
                    left = 'margin-left: -' + left + 'px'
                    largeImg.setAttribute('style', left)

                    largeImg.setAttribute('class', 'largeImg vertical')
                    
                    // largeImg.setAttribute('height', '560px')
                    // largeImg.setAttribute('left', '50%')
                    
                } else { //horizontal
                    
                    let top = parseInt(height / 2)
                    top = 'margin-top: -' + top + 'px'
                    largeImg.setAttribute('style', top)
                    
                    largeImg.setAttribute('class', 'largeImg horizontal')
                   
                    // largeImg.setAttribute('width', '700px')
                    
                    // largeImg.setAttribute('top', '50%')
                    
                }


            }           
            
        })
    }
    function closeImg() {
        $('.fa-close').click(() => {
            $('.enlarge').css('display','none')
        })
    }

    // ===============================================

    // useraline()
    // function useraline() {  //渲染在线成员用以发起点对点通信
    //     socket.on('disUser', (usersInfo) => {
    //         $('.communiSelect ul').text('')
    //         for (var i = 0; i <= usersInfo.length; i++){
    //             $('.communiSelect ul').append('<li class=''><a href="#">'+ usersInfo[i].name +'</a></li>')
    //         }
    //     })
    // }


})