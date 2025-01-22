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
  socket.on('createRoom', async (callback) => {
    const roomId = uuidV4();
    await socket.join(roomId);

    rooms.set(roomId, {
        roomId,
        players: [{id: socket.id, username: socket.data?.username}]
    });
    callback(roomId);
  })
});

// server lắng nghe ở cổng port
server.listen(port, () => {
  console.log(`listening on *:${port}`);
});
