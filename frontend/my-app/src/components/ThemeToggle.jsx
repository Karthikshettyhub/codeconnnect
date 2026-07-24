import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import "./themetoggle.css";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      className={`theme-switch ${isLight ? "is-light" : "is-dark"}`}
      onClick={toggleTheme}
      role="switch"
      aria-checked={isLight}
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
      aria-label="Toggle light/dark mode"
    >
      <span className="theme-switch-icon theme-switch-icon-moon">
        <Moon size={12} />
      </span>
      <span className="theme-switch-icon theme-switch-icon-sun">
        <Sun size={12} />
      </span>

      <span className="theme-switch-thumb">
        {isLight ? <Sun size={13} /> : <Moon size={13} />}
      </span>
    </button>
  );
};

export default ThemeToggle;