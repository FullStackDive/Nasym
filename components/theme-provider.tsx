"use client";

import { createContext, useContext, useEffect, useCallback } from "react";

export type Theme = "light" | "dark" | "system";

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void; toggle: () => void; resolved: "light" | "dark" }>({
  theme: "light",
  setTheme: () => {},
  toggle: () => {},
  resolved: "light",
});

function applyLight() {
  document.documentElement.classList.remove("dark");
  document.documentElement.dataset.theme = "coastal";
  localStorage.setItem("theme", "light");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyLight();
  }, []);

  const setTheme = useCallback((_t: Theme) => {
    applyLight();
  }, []);

  const toggle = useCallback(() => {
    applyLight();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "light", setTheme, toggle, resolved: "light" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
