// src/hooks/useTheme.js
import { useState, useEffect } from "react";

export default function useTheme() {
  // Determine initial theme
  const getInitialTheme = () => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme) return storedTheme === "dark"; // fixed quotes
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return true; // default dark
  };

  const [isDark, setIsDark] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      root.classList.remove("light");
      try {
        localStorage.setItem("theme", "dark");
      } catch (e) {}
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      try {
        localStorage.setItem("theme", "light");
      } catch (e) {}
    }
  }, [isDark]);

  // Function to toggle theme and reload page
  const toggleTheme = () => {
    setIsDark((prev) => {
      const newTheme = !prev;
      setTimeout(() => {
        window.location.reload(); // force reload after changing theme
      }, 50);
      return newTheme;
    });
  };

  return [isDark, toggleTheme];
}
