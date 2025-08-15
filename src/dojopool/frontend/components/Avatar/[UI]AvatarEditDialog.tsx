import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AvatarGenerator from "./[UI]AvatarGenerator";

export interface AvatarEditDialogProps {
  open: boolean;
  onClose: () => void;
  onAvatarChange: (avatarUrl: string) => void;
  currentAvatarUrl?: string;
}

const AvatarEditDialog: React.FC<AvatarEditDialogProps> = ({
  open,
  onClose,
  onAvatarChange,
  currentAvatarUrl,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  const handleAvatarGenerated = (avatarUrl: string) => {
    onAvatarChange(avatarUrl);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Edit Avatar
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <AvatarGenerator
          onAvatarGenerated={handleAvatarGenerated}
          currentAvatarUrl={currentAvatarUrl}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AvatarEditDialog;
