import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
/**
 * Dialog tự tạo 
 * open: giá trị boolean xác định việc có render dialog hay không
 * children: prop để lấy component con. chúng hiển thị trong dialog content
 * title: tiêu đề của dialog
 * contentText: thông điệp chính hiển thị trên dialog
 * handleContinue: hàm đc gọi khi continue button dc nhấn
 */
export default function CustomDialog({
  open,
  children,
  title,
  contentText,
  handleContinue,
}) {
  return (
    <Dialog open={open}>{/** dialog container */}
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{/**main body of dialog */}
        <DialogContentText>{/**main text */}
          {contentText}
        </DialogContentText>
        {children} {/**other content */}
      </DialogContent>
      <DialogActions>{/** Dialog action buttons */}
        {/* Force users to make input without option to cancel */}
        {/* <Button onClick={handleClose}>Cancel</Button> */}
        <Button onClick={handleContinue}>Continue</Button>
      </DialogActions>
    </Dialog>
  );
}
