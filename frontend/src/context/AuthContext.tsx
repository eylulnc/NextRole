import { createContext, useContext, useState, type ReactNode } from "react";
import * as authApi from "../api/auth";

const TOKEN_KEY = "nextrole_token";
const EMAIL_KEY = "nextrole_email";

interface AuthContextValue {
	email: string | null;
	isAuthenticated: boolean;
	login: (email: string, password: string) => Promise<void>;
	register: (email: string, password: string) => Promise<void>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [email, setEmail] = useState<string | null>(() => localStorage.getItem(EMAIL_KEY));

	function persistSession(token: string, email: string) {
		localStorage.setItem(TOKEN_KEY, token);
		localStorage.setItem(EMAIL_KEY, email);
		setEmail(email);
	}

	async function login(emailInput: string, password: string) {
		const response = await authApi.login(emailInput, password);
		persistSession(response.token, response.email);
	}

	async function register(emailInput: string, password: string) {
		const response = await authApi.register(emailInput, password);
		persistSession(response.token, response.email);
	}

	function logout() {
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem(EMAIL_KEY);
		setEmail(null);
	}

	return (
		<AuthContext.Provider value={{ email, isAuthenticated: email !== null, login, register, logout }}>
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
