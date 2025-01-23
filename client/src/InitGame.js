import { Button, Stack, TextField } from "@mui/material";
import { useState } from "react";
import CustomDialog from "./components/CustomDialog";
import socket from "./socket";

/**
 * Khởi tạo một trò chơi. InitGame có 3 state
 * roomDialogopen: boolean, xác định có hiển thị CustomDialog hay ko. Dialog chứa textfield cho phép nhập id phòng
 * roomInput: cho phép component kiểm soát việc nhập văn bản, chứa id phòng mà người dùng cung cấp
 * roomError: theo dõi bất kỳ lỗi nào khi cố gắng tham gia 1 phòng
 */

/**
 * các prop setRoom, setOrientation, setPlayers là các hàm để update state của app
 */
export default function InitGame({ setRoom, setOrientation, setPlayers }) {
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [roomInput, setRoomInput] = useState(""); // input state
  const [roomError, setRoomError] = useState("");

  return (
    <Stack
      justifyContent="center"
      alignItems="center"
      sx={{ py: 1, height: "100vh" }}
    >
      {/**tạo dialog cho phép nhập id phòng */}
      <CustomDialog
        open={roomDialogOpen}
        handleClose={() => setRoomDialogOpen(false)}
        title="Select Room to Join"
        contentText="Enter a valid room ID to join the room"
        // tham gia vào 1 phòng chơi
        // client cần emit 1 sự kiện joinRoom mà sẽ dc xử lý bên server, 
        // data gồm id của phòng mà người chơi định tham gia
        handleContinue={() => {
            if(!roomInput) return; //nếu thông tin phòng dc nhập k hợp lệ, return
            socket.emit("joinRoom", {roomId: roomInput}, (response) => { // response từ server
                if(response.error) return setRoomError(response.messeage); // nếu trả về lỗi thì gán lỗi đó cho roomError và thoát
                console.log("response", response); //
                setRoom(response?.roomId);
                setPlayers(response?.players);
                setOrientation("black");
                setRoomDialogOpen(false);
            });
        }}
      >
        <TextField
          autoFocus
          margin="dense"
          id="room"
          label="Room ID"
          name="room"
          value={roomInput}
          required
          onChange={(e) => setRoomInput(e.target.value)}
          type="text"
          fullWidth
          variant="standard"
          error={Boolean(roomError)}
          helperText={
            !roomError ? "Enter a room ID" : `Invalid room ID: ${roomError}`
          }
        />
      </CustomDialog>
      {/** button bắt đầu 1 cuộc chơi */}
      <Button
        variant="contained"
        onClick={() => {
            // tạo 1 phòng chơi
            // phát ra sự kiện WebSocket createRoom, socket.io server sẽ lắng nghe sự kiện này
            socket.emit("createRoom", (roomId) => { 
                console.log(roomId);
                setRoom(roomId);
                setOrientation("white");
            })
        }}
      >Start a game</Button>

      {/** button tham gia 1 cuộc chơi */}
      <Button
        onClick={() => {
            setRoomDialogOpen(true)
        }}
      >Join a game</Button>
    </Stack>
  );
}
