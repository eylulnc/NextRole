import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export const TOKEN_KEY = "nextrole_token";
export const REFRESH_TOKEN_KEY = "nextrole_refresh_token";

export const apiClient = axios.create({
	baseURL: API_BASE_URL,
});

// Refreshing goes through its own instance so a failing refresh can't re-enter the interceptor
// below and loop. Exported so tests can stub its transport independently of apiClient's.
export const refreshClient = axios.create({ baseURL: API_BASE_URL });

apiClient.interceptors.request.use((config) => {
	const token = localStorage.getItem(TOKEN_KEY);
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

function clearSessionAndRedirect() {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(REFRESH_TOKEN_KEY);
	if (window.location.pathname !== "/login") {
		window.location.href = "/login";
	}
}

// Several requests can 401 at once when the access token expires; they all await this single
// in-flight refresh rather than each spending the (rotating, single-use) refresh token.
let inFlightRefresh: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
	const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
	if (!refreshToken) throw new Error("No refresh token");

	const response = await refreshClient.post<{ token: string; refreshToken: string }>(
		"/api/auth/refresh",
		{ refreshToken }
	);
	localStorage.setItem(TOKEN_KEY, response.data.token);
	localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
	return response.data.token;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

apiClient.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		const original = error.config as RetriableConfig | undefined;
		const isAuthCall = original?.url?.startsWith("/api/auth/");

		// Retry once, and never for the auth endpoints themselves — a failed login is a real 401,
		// not an expired session.
		if (error.response?.status !== 401 || !original || original._retried || isAuthCall) {
			if (error.response?.status === 401 && !isAuthCall) clearSessionAndRedirect();
			return Promise.reject(error);
		}

		original._retried = true;
		try {
			inFlightRefresh = inFlightRefresh ?? refreshAccessToken().finally(() => {
				inFlightRefresh = null;
			});
			const token = await inFlightRefresh;
			original.headers.Authorization = `Bearer ${token}`;
			return apiClient(original);
		} catch {
			clearSessionAndRedirect();
			return Promise.reject(error);
		}
	}
);
