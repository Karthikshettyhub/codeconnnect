import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

const getInitialTheme = () => {
  try {
    const stored = localStorage.getItem("cc-theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch (e) {
    // localStorage unavailable, fall back to dark
  }
  return "dark";
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  // Apply theme to <html data-theme="..."> so theme.css variables cascade
  // down into every page/component automatically.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("cc-theme", theme);
    } catch (e) {
      // ignore write errors (private browsing, etc.)
    }
  }, [theme]);

  // Keep multiple tabs/windows in sync (optional nice-to-have,
  // doesn't affect single-tab behavior).
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "cc-theme" && (e.newValue === "light" || e.newValue === "dark")) {
        setTheme(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};