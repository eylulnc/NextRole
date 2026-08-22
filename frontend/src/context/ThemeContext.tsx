import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "system";

const THEME_KEY = "nextrole_theme";

function systemPrefersDark(): boolean {
	return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

interface ThemeContextValue {
	theme: Theme;
	resolvedTheme: "light" | "dark";
	setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem(THEME_KEY) as Theme | null) ?? "system");
	const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => (theme === "system" ? (systemPrefersDark() ? "dark" : "light") : theme));

	useEffect(() => {
		if (theme !== "system") {
			document.documentElement.dataset.theme = theme;
			setResolvedTheme(theme);
			return;
		}
		document.documentElement.dataset.theme = "";
		setResolvedTheme(systemPrefersDark() ? "dark" : "light");

		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const listener = () => setResolvedTheme(systemPrefersDark() ? "dark" : "light");
		media.addEventListener("change", listener);
		return () => media.removeEventListener("change", listener);
	}, [theme]);

	function setTheme(next: Theme) {
		localStorage.setItem(THEME_KEY, next);
		setThemeState(next);
	}

	return <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
