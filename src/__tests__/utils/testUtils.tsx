import { ThemeProvider, createTheme } from "@mui/material/styles";
import { render as rtlRender } from "@testing-library/react";
import { ReactElement } from "react";

const theme = createTheme();

export const renderWithProviders = (ui: ReactElement) => {
  return rtlRender(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};
