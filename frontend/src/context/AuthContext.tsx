import { createContext, useContext, useState, type ReactNode } from "react";
import * as authApi from "../api/auth";
import i18n from "../i18n/config";

const TOKEN_KEY = "nextrole_token";
const EMAIL_KEY = "nextrole_email";
const LANGUAGE_KEY = "nextrole_language";
const CURRENCY_KEY = "nextrole_default_currency";

interface AuthContextValue {
	email: string | null;
	language: string;
	defaultCurrency: string;
	isAuthenticated: boolean;
	login: (email: string, password: string) => Promise<void>;
	register: (email: string, password: string) => Promise<void>;
	logout: () => void;
	updateLocalSettings: (settings: { language?: string; defaultCurrency?: string }) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [email, setEmail] = useState<string | null>(() => localStorage.getItem(EMAIL_KEY));
	const [language, setLanguage] = useState<string>(() => localStorage.getItem(LANGUAGE_KEY) ?? "en");
	const [defaultCurrency, setDefaultCurrency] = useState<string>(() => localStorage.getItem(CURRENCY_KEY) ?? "EUR");

	function persistSession(response: authApi.AuthResponse) {
		localStorage.setItem(TOKEN_KEY, response.token);
		localStorage.setItem(EMAIL_KEY, response.email);
		localStorage.setItem(LANGUAGE_KEY, response.language);
		localStorage.setItem(CURRENCY_KEY, response.defaultCurrency);
		setEmail(response.email);
		setLanguage(response.language);
		setDefaultCurrency(response.defaultCurrency);
		i18n.changeLanguage(response.language);
	}

	async function login(emailInput: string, password: string) {
		const response = await authApi.login(emailInput, password);
		persistSession(response);
	}

	async function register(emailInput: string, password: string) {
		const response = await authApi.register(emailInput, password);
		persistSession(response);
	}

	function logout() {
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem(EMAIL_KEY);
		localStorage.removeItem(LANGUAGE_KEY);
		localStorage.removeItem(CURRENCY_KEY);
		setEmail(null);
	}

	function updateLocalSettings(settings: { language?: string; defaultCurrency?: string }) {
		if (settings.language) {
			localStorage.setItem(LANGUAGE_KEY, settings.language);
			setLanguage(settings.language);
			i18n.changeLanguage(settings.language);
		}
		if (settings.defaultCurrency) {
			localStorage.setItem(CURRENCY_KEY, settings.defaultCurrency);
			setDefaultCurrency(settings.defaultCurrency);
		}
	}

	return (
		<AuthContext.Provider
			value={{ email, language, defaultCurrency, isAuthenticated: email !== null, login, register, logout, updateLocalSettings }}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
