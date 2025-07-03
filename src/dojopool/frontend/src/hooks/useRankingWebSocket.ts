import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "react-query";
import { useSnackbar } from "notistack";

interface RankingUpdate {
  type: "ranking_update" | "global_update" | "significant_change";
  data: any;
  timestamp: string;
}

export const useRankingWebSocket = (userId?: number) => {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const connect = useCallback(() => {
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Create new WebSocket connection
    const wsUrl = userId
      ? `http://${window.location.host}/api/ws/rankings/${userId}`
      : `http://${window.location.host}/api/ws/rankings/global`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("Connected to ranking updates");
    };

    ws.onmessage = (event) => {
      const update: RankingUpdate = JSON.parse(event.data);

      switch (update.type) {
        case "ranking_update":
          // Update individual player data
          queryClient.setQueryData(["playerStats", userId], update.data);
          break;

        case "global_update":
          // Update global rankings
          queryClient.setQueryData(["rankings"], update.data);
          break;

        case "significant_change":
          // Show notification for significant changes
          const { old_rank, new_rank, change } = update.data;
          const message =
            change > 0
              ? `Ranking increased by ${change} positions! (${old_rank} → ${new_rank})`
              : `Ranking decreased by ${Math.abs(change)} positions (${old_rank} → ${new_rank})`;

          enqueueSnackbar(message, {
            variant: change > 0 ? "success" : "warning",
            autoHideDuration: 5000,
            anchorOrigin: {
              vertical: "top",
              horizontal: "right",
            },
          });
          break;
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      enqueueSnackbar("Error connecting to ranking updates", {
        variant: "error",
      });
    };

    ws.onclose = () => {
      console.log("Disconnected from ranking updates");
      // Attempt to reconnect after 5 seconds
      setTimeout(connect, 5000);
    };

    wsRef.current = ws;
  }, [userId, queryClient, enqueueSnackbar]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    connected: wsRef.current?.readyState === WebSocket.OPEN,
  };
};
