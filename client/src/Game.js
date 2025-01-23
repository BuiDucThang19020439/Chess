import {
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    ListSubheader,
    Stack,
    Typography,
    Box,
} from "@mui/material";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useCallback, useMemo, useState, useEffect } from "react";
import CustomDialog from "./components/CustomDialog";
import socket from "./socket";

export default function Game({ players, room, orientation, cleanup }) {
  /**
   * tạo ra 1 phiên bản chess với 0 dependency
   * useMemo cho phép cache những instance của chess giữa những lần re-render, do đó
   * ko cần khởi tạo instance mỗi lần re-render
   * chess instance này sẽ dc dùng để xác thực và tạo nc đi (move);
   */
  const chess = useMemo(() => new Chess(), []);

  //fen forsyth-edward notation: mô tả vị trí quân cờ
  const [fen, setFen] = useState(chess.fen());
  const [over, setOver] = useState("");

  /**
   * Hàm makeAMove cho phép tạo 1 nc đi
   * sử dụng useCallback với chess làm dependency để cache định nghĩa hàm giữa các lần re-render, tránh tạo lại
   * hàm mỗi lần re-render
   * makeAMove nhận 1 nước đi (move) và gọi chess.move với object move làm đối số. Phương thức .move xác thực
   * nước đi (move) và cập nhật internal state của chess instance.
   * Tiếp theo set state fen của component Game để ánh xạ chess instance. Điều này trigger re-render và cập nhật bàn cờ
   * Sau khi thực hiện 1 nước đi; kiểm tra xem nó có dẫn đến game over ko. Nếu đúng, xem nó là chiếu hết hay hòa.
   * Sử dụng trycatch vì việc gọi chess.move với một nc đi ko hợp lệ sẽ gây ra lỗi. Lúc đó sẽ trả về null và xử lý
   * null ở trong hàm onDrop
   */
  const makeAMove = useCallback(
    (move) => {
      try {
        const result = chess.move(move); // cập nhật chess instance
        setFen(chess.fen()); // cập nhật fen state để trigger re-render

        console.log("over","checkmate",chess.isGameOver(),chess.isCheckmate());

        if (chess.isGameOver()) {
          //check nếu nc đi dẫn tới game over
          if (chess.isCheckmate()) {
            // check nếu nc đi chiếu hết
            // đặt thông báo cho việc chiếu hết
            // người chiến thắng là bên đi nc cuối cùng
            setOver(`Checkmate! ${chess.turn() === "w" ? "black" : "white"} wins!`);
          } else if (chess.isDraw()) {
            // nếu hòa
            setOver("Draw");
          } else {
            setOver("Game over");
          }
        }
        return result;
      } catch (error) {
        console.log(error);
        return null; // trả về null nếu nc đi ko hợp lệ
      }
    },
    [chess]
  );
  /**
   * onDrop function dùng để di chuyển quân cờ
   * @param sourceSquare vị trí ban đầu của quân cờ
   * @param targetSquare vị trí đích
   * Bên trong hàm, tạo 1 object là moveData, nhận sourceSquare, targetSquare và color
   * chess.turn() trả về màu hiện tại của quân cờ (b hoặc w);
   * hàm makeAMove chuyển moveData đến instance hiện tại của Chess nhằm xác thực và tạo nc đi
   * @returns true or false tùy thuộc và makeAMove
   */
  function onDrop(sourceSquare, targetSquare) {
    // orientation là 'white' hoặc 'black'. game.turn() trả về 'w' hoặc 'b'
    if (chess.turn() !== orientation[0]) return false; // cấm sử dụng quân cờ của đối thủ
    if (players.length < 2) return false; // ko cho phép di chuyển nếu đối thủ chưa join
    const moveData = {
      from: sourceSquare,
      to: targetSquare,
      color: chess.turn(),
      promotion: "q", // thăng cấp thành queen khi có thể
    };
    const move = makeAMove(moveData);

    // nc di ko hop le
    if (move === null) return false;

    socket.emit("move", {
      move, 
      room,
    }); // emit sự kiện move đến đối thủ thông qua server 
    return true;
  }

  useEffect(() => {
    socket.on("move", (move) => {
      makeAMove(move); //
    });
  }, [makeAMove]);

  useEffect(() => {
    socket.on('playerDisconnected', (player) => {
      setOver(`${player.username} has disconnected`); // set game over
    });
  }, []);

  useEffect(() => {
    socket.on('closeRoom', ({ roomId }) => {
      if (roomId === room) {
        cleanup();
      }
    });
  }, [room, cleanup]);
  // game component returned jsx
  return (
    <Stack>
      <Card>
        <CardContent>
          <Typography variant="h5">Room ID: {room}</Typography>
        </CardContent>
      </Card>
      <Stack flexDirection="row" sx={{ pt: 2 }}>
        <div className="board" style={{
          maxWidth: 600,
          maxHeight: 600,
          flexGrow: 1,
        }}>
          <Chessboard position={fen} onPieceDrop={onDrop} boardOrientation={orientation}/>
        </div>
        {players.length > 0 && (
          <Box>
            <List>
              <ListSubheader>Players</ListSubheader>
              {players.map((p) => (
                <ListItem key={p.id}>
                  <ListItemText primary={p.username} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Stack>
      <CustomDialog // Game Over CustomDialog
        open={Boolean(over)}
        title={over}
        contentText={over}
        handleContinue={() => {
          socket.emit("closeRoom", { roomId: room });
          cleanup();
        }}
      />
    </Stack>
  );
}
