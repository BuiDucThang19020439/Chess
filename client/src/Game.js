import { Chess } from "chess.js";
import { useCallback, useMemo, useState } from "react";
import { Chessboard } from "react-chessboard";
import CustomDialog from "./components/CustomDialog";

export default function Game({players, room, orientation, cleanup}) {
    /**
     * tạo ra 1 phiên bản chess với 0 dependency
     * useMemo cho phép cache những instance của chess giữa những lần re-render, do đó 
     * ko cần khởi tạo instance mỗi lần re-render
     * chess instance này sẽ dc dùng để xác thực và tạo nc đi (move);
     */   
    const chess = useMemo(() => new Chess(), []);
    /**
     * fen forsyth-edward notation: mô tả vị trí quân cờ
     */
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

                console.log("over", "checkmate", chess.isGameOver(), chess.isCheckmate());

                if(chess.isGameOver()) { //check nếu nc đi dẫn tới game over
                    if(chess.isCheckmate()) { // check nếu nc đi chiếu hết
                        // đặt thông báo cho việc chiếu hết
                        // người chiến thắng là bên đi nc cuối cùng
                        setOver(
                            `Checkmate! ${chess.turn() === "w" ? "black" : "white"} wins!`
                        );
                    } else if (chess.isDraw()) { // nếu hòa
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
        }, [chess]
    )

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
        const moveData = {
            from: sourceSquare,
            to: targetSquare,
            color: chess.turn(),
        };
        const move = makeAMove(moveData);

        // nc di ko hop le
        if (move === null) return false;
        return true;
    }

    // game component returned jsx
    return (
        <>
            {/**
             * tạo bàn cờ bằng cách sử dụng <Chessboard> từ react-chessboard
             * truyền fen cho prop position
             * truyền hàm onDrop cho prop onPieceDrop. Hàm onPieceDrop dc gọi mỗi khi 1 quân cờ dc di chuyển
             * */}
            <div className="board">
                <Chessboard position={fen} onPieceDrop={onDrop} />
            </div>
            {/**
             * dialog cho kết thúc trò chơi (over)
             */}
            <CustomDialog 
                open={Boolean(over)}
                title={over}
                contentText={over}
                handleContinue={() => {
                    setOver("");
                }}
            />
        </>
    )
}