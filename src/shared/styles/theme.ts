import "./globals.css";
import { createTheme, Theme } from "@mui/material";

export const customTheme = {
  light: "#e9e9e7",
  cream: "#fcecca",
  grey: "#a79d8a",
  dark: "#121215",
  dark2: "#19191e",

  gold: "#b68f55",
  orange: "#e77517",
  red: "#924a3b",
  cocoa: "#1f1108",
  lunar: "#667a83",

  success: "#79B77AFF",
  error: "#d27272",

  font: {
    industry: "industryMedium",
    graphik: "graphikMedium",
    tungsten: "tungstenBook",
  },
};

declare module "@mui/material/styles" {
  interface BreakpointOverrides {
    xs: true;
    sm: true;
    md: true;
    lg: true;
    xl: true;
    ext: true; // adds the `extension` breakpoint
  }
}

export const theme: Theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: customTheme.dark,
      paper: customTheme.dark,
    },
    primary: {
      light: customTheme.light,
      main: customTheme.gold,
      dark: customTheme.dark,
    },
    text: {
      primary: customTheme.light,
      secondary: customTheme.cream,
    },
    success: {
      main: customTheme.success,
    },
    error: {
      main: customTheme.error,
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
      ext: 450, // extension popup width
    },
  },
  typography: {
    fontFamily: customTheme.font.tungsten,
    h1: {
      fontFamily: customTheme.font.tungsten,
      fontSize: "50px",
      fontWeight: 400,
      lineHeight: "4rem",
    },
    h2: {
      fontFamily: customTheme.font.tungsten,
      fontSize: "24px",
      fontWeight: 600,
      lineHeight: "3rem",
      letterSpacing: "2px",
    },
    h3: {
      fontFamily: customTheme.font.tungsten,
      fontSize: "22px",
      fontWeight: 500,
      letterSpacing: "2px",
    },
    body1: {
      fontFamily: customTheme.font.industry,
      fontSize: "16px",
      fontWeight: 400,
      lineHeight: "1.5rem",
      letterSpacing: "1px",
    },
    button: {
      fontFamily: customTheme.font.industry,
      fontSize: "20px",
      fontWeight: 400,
      lineHeight: "1.25rem",
      textTransform: "none",
    },
  },
  components: {
    MuiMenu: {
      styleOverrides: {
        list: {
          backgroundColor: customTheme.dark,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        root: {
          backgroundColor: customTheme.dark,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          backgroundColor: customTheme.dark,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          backgroundColor: customTheme.dark,
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          backgroundColor: customTheme.dark,
        },
      },
    },
    MuiDialogContentText: {
      styleOverrides: {
        root: {
          backgroundColor: customTheme.dark,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: customTheme.dark,
        },
      },
    },
  },
});
