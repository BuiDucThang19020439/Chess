import "./App.css";
import { useEffect, useState, useCallback } from "react";
import Container from "@mui/material/Container";
import Game from "./Game";
import InitGame from "./InitGame";
import CustomDialog from "./components/CustomDialog";
import socket from "./socket";
import { TextField } from "@mui/material";
/**
 * mỗi user dc kết nối cần có username dc liên kết. Ta sẽ lấy username mà user mong muốn bất cứ khi nào app dc 
 * khởi chạy bằng cách sử dụng dialog chứa textfield nhập tên người dùng
 */

/**
 * Khi username đã dc chọn, nó sẽ dc lưu trữ trong state của App.js. Sau đó, một WebSocket event tên username 
 * mang theo username dc nhập làm event data, sẽ dc gửi đến server thông qua kết nối WebSocket.
 * Khi nhận dc sự kiện username trên backend server, username (event data) sẽ dc đính kèm với client's socket data
 */
export default function App() {
  const [username, setUsername] = useState("");

  // state cho biết username dc gửi hay chưa
  const [usernameSubmitted, setUsernameSubmitted] = useState(false);

  const [room, setRoom] = useState(""); // id phòng hiện tại
  const [orientation, setOrientation] = useState(""); // trắng hoặc đen
  const [players, setPlayers] = useState([]); // lưu các người chơi 1 phòng

  // reset các state chịu trách nhiệm khởi tạo trò chơi
  const cleanup = useCallback(() => {
    setRoom("");
    setOrientation("");
    setPlayers("");
  }, []);

  useEffect(() => {
    socket.on("opponentJoined", (roomData) => {
      console.log("roomData", roomData)
      setPlayers(roomData.players);
    })
  }, [])

  return (
    <Container>
      <CustomDialog
        open={!usernameSubmitted} // mở dialog nếu username chưa dc chọn
        title="Pick a username"
        contentText="Please select a username"
        handleClose={() => setUsernameSubmitted(true)}
        handleContinue={() => { // dc kích hoạt nếu nút continue dc click
          if(!username) return; // nếu username chưa dc enter, ko làm gì cả
          socket.emit("username", username); // phát 1 sự kiện websocket tên username
          setUsernameSubmitted(true); // cho biết tên người dùng đã được gửi
        }}
      >
        <TextField // nơi nhập username
          autoFocus // tự động focus vào ô input
          margin="dense"
          id="username"
          label="Username"
          name="username"
          value={username}
          required
          onChange={(e) => setUsername(e.target.value)}
          type="text"
          fullWidth
          variant="standard"
        />
      </CustomDialog>
      {room ? (
        <Game 
          room={room}
          orientation={orientation}
          username={username}
          players={players}
          cleanup={cleanup} // cleanup dc sử dụng bởi game để reset state khi game over
        />
      ) : (
        <InitGame
          setRoom={setRoom}
          setOrientation={setOrientation}
          setPlayers={setPlayers}
        />
      )}
      <Game />
    </Container>
  );
}