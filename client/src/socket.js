import {io} from "socket.io-client";
const socket = io('localhost:8080'); // khởi tạo kết nối websocket
// triển khai chức năng nhiều người chơi
export default socket;