import React from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { GameHistory as GameHistoryType } from "../../types/game";
import { format } from "date-fns";

interface GameHistoryProps {
  history: GameHistoryType[];
}

export const GameHistory: React.FC<GameHistoryProps> = ({ history }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Game History
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Player</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  {format(new Date(entry.timestamp), "HH:mm:ss")}
                </TableCell>
                <TableCell>{entry.player}</TableCell>
                <TableCell>{entry.action}</TableCell>
                <TableCell>
                  {Object.entries(entry.details).map(([key, value]) => (
                    <Typography key={key} variant="body2">
                      {key}: {value}
                    </Typography>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
