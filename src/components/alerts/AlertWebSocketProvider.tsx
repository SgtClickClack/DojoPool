import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "../../types/alert";
import { useWebSocket } from "../../hooks/useWebSocket";

interface AlertWebSocketContextType {
  alerts: Alert[];
  isConnected: boolean;
  connectionStatus: "connected" | "disconnected" | "error";
  lastUpdate: Date | null;
}

const AlertWebSocketContext = createContext<AlertWebSocketContextType>({
  alerts: [],
  isConnected: false,
  connectionStatus: "disconnected",
  lastUpdate: null,
});

export const useAlertWebSocket = () => useContext(AlertWebSocketContext);

interface AlertWebSocketProviderProps {
  children: React.ReactNode;
}

export const AlertWebSocketProvider: React.FC<AlertWebSocketProviderProps> = ({
  children,
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "error"
  >("disconnected");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { isConnected, subscribe } = useWebSocket({
            url: process.env.REACT_APP_WEBSOCKET_URL || '/socket.io',
  });

  useEffect(() => {
    const handleAlertUpdate = (data: {
      alert: Alert;
      type: "add" | "update" | "delete";
    }) => {
      setLastUpdate(new Date());

      switch (data.type) {
        case "add":
          setAlerts((prev) => [data.alert, ...prev]);
          break;
        case "update":
          setAlerts((prev) =>
            prev.map((alert) =>
              alert.id === data.alert.id ? data.alert : alert,
            ),
          );
          break;
        case "delete":
          setAlerts((prev) =>
            prev.filter((alert) => alert.id !== data.alert.id),
          );
          break;
      }
    };

    const handleConnection = (data: { status: string }) => {
      setConnectionStatus(
        data.status as "connected" | "disconnected" | "error",
      );
    };

    const unsubscribeAlert = subscribe("alert", handleAlertUpdate);
    const unsubscribeConnection = subscribe("connection", handleConnection);

    return () => {
      unsubscribeAlert();
      unsubscribeConnection();
    };
  }, [subscribe]);

  const value = {
    alerts,
    isConnected,
    connectionStatus,
    lastUpdate,
  };

  return (
    <AlertWebSocketContext.Provider value={value}>
      {children}
    </AlertWebSocketContext.Provider>
  );
};
