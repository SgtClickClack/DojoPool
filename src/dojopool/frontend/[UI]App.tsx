import React from "react";
import { ThemeProvider } from "@mui/material";
import { AuthProvider } from "./contexts/AuthContext";
import { Toast } from "./components/Notifications/[NOTIFY]Toast";
import { Router } from "./[ROUTE]Router";
import theme from "./theme";
import { logError } from "./utils/errorHandling";

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router />
        <Toast />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
