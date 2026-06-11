"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light" | "minimalist";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme] = useState<Theme>("dark");

  /* Apply [data-theme] attribute to <html> */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  const setTheme = () => {};

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
