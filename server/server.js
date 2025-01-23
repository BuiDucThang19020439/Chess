const express = require("express");
const { Server } = require("socket.io");
const { v4: uuidV4 } = require("uuid");
const http = require("http");

const app = express();
const server = http.createServer(app);

// dat cong cho gia tri nhan tu bien moi truong
const port = process.env.PORT || 8080;

// update http server to websocket server
const io = new Server(server, {
  cors: "*", // cho phép kết nối từ mọi nguồn
});

// javascript Map là cấu trúc dữ liệu để lưu trữ dữ liệu người dùng, 
// nó sẽ bao gồm roomId, và danh sách người chơi trong phòng.
const rooms = new Map();

// io.connection
// sau khi thiết lập máy chủ HTTP và WebSocket, ta cần lắng nghe, kết nối WebSocket đến server WebSocket
io.on("connection", (socket) => {
  // socket đề cập đến client socket mới dc kết nối
  // mỗi socket dc đăng ký 1 id
  console.log(socket.id, "connected");

  // thêm websocket event listener để lắng nghe sự kiện username và truy xuất tên người dùng. 
  // Dữ liệu này dc gắn vào client's socket instance  
  socket.on("username", (username) => {
    console.log("username: ", username);
    socket.data.username = username;
  });

  // createRoom
  socket.on('createRoom', async (callback) => { // callback tham chiếu đến hàm tương tự bên client
    const roomId = uuidV4(); // tạo uuid mới
    await socket.join(roomId); // người chơi tạo phòng tham gia phòng

    // đặt roomId làm key và roomData bao gồm người chơi như là value trong map
    rooms.set(roomId, {
        roomId,
        players: [{id: socket.id, username: socket.data?.username}]
    });

    //hàm callback dc truyền dưới dạng client data (như dc trình bày trc đó trong hàm onclick của nút continue của dialog)
    // dc nhận trong hàm nghe của server. Callback này dc gọi ở cuối với roomId mới tạo truyền dưới dạng tham số
    // Khi callback dc gọi, client sẽ nhận dc roomId dưới dạng phản hồi từ máy chủ
    callback(roomId);
  });

  //lắng nghe sự kiện joinRoom, cần kiểm tra phòng có tồn tại, có người đang chờ, và chưa đầy.
  // nếu 1 trong 3 điều kiện sai, trả lỗi về client
  socket.on('joinRoom', async (args, callback) => {
    // check phòng tồn tại và có người đang chờ
    const room = rooms.get(args.roomId);
    let error, messeage;

    if(!room) { // nếu phòng ko tồn tại
      error = true;
      messeage = "Phòng không tồn tại!";
    } else if(room.length <= 0) { // phòng trống
      error = true;
      messeage = "Phòng trống";
    } else if(room.length >= 2){ // phòng đầy
      error = true;
      messeage = "Phòng đã đầy"
    };
    if (error) { // nếu có lỗi check xem client có gửi callback không
      if(callback) { // nếu user gửi 1 callback, gọi nó với 1 error payload
        callback({error, messeage});
      }
      return; // thoát 
    }
    await socket.join(args.roomId); // giúp client join room

    // thêm dữ liệu của người chơi vào danh sách người chơi trong phòng
    const roomUpdate = {
      ...room,
      players: [
        ...room.players,
        {id: socket.id, username: socket.data?.username}
      ],
    };

    room.set(args.roomId, roomUpdate);
    callback(roomUpdate); //respond đến client với mô tả của phòng

    //emit sự kiện opponentJoined đến room để thông báo với ngời chơi khác: đối đã đến
    socket.to(args.roomId).emit("opponentJoined", roomUpdate);
  });

  socket.on("move", (data) => {
    // emit đến mọi socket trong room trừ socket tạo ra sự kiện
    socket.to(data.room).emit("move", data.move);
  });

  socket.on("disconnect", () => {
    const gameRooms = Array.from(rooms.values());
    gameRooms.forEach((room) => {
      const userInRoom = room.players.find((player) => {player.id === socket.id});
      if (userInRoom) {
        if (room.players.length < 2) {
          // neu chi con 1 nguoi choi, thoat
          rooms.delete(room.roomId);
          return;
        }

        socket.to(room.roomId).emit("playerDisconnected", userInRoom); // <- 4
      }
    })
  });

  socket.on("closeRoom", async (data) => {
    socket.to(data.room).emit("closeRoom", data);
    const clientSockets = await io.in(data.roomId).fetchSockets();
    clientSockets.forEach((s) => {
      s.leave(data.roomId);
      rooms.delete(roomId);
    })
  })
});

// server lắng nghe ở cổng port
server.listen(port, () => {
  console.log(`listening on *:${port}`);
});
