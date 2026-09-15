import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient, refreshClient, REFRESH_TOKEN_KEY, TOKEN_KEY } from "./client";

function ok(config: InternalAxiosRequestConfig, data: unknown = {}): AxiosResponse {
	return { data, status: 200, statusText: "OK", headers: {}, config };
}

function unauthorized(config: InternalAxiosRequestConfig): AxiosError {
	const error = new AxiosError("Unauthorized", "401", config);
	error.response = { data: {}, status: 401, statusText: "Unauthorized", headers: {}, config };
	return error;
}

describe("apiClient session handling", () => {
	beforeEach(() => {
		localStorage.clear();
		localStorage.setItem(TOKEN_KEY, "expired-access-token");
		localStorage.setItem(REFRESH_TOKEN_KEY, "valid-refresh-token");
		// jsdom refuses real navigation; the interceptor only reads pathname and assigns href.
		Object.defineProperty(window, "location", {
			value: { pathname: "/dashboard", href: "" },
			writable: true,
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("refreshes once on 401 and retries the original request", async () => {
		let calls = 0;
		apiClient.defaults.adapter = (async (config) => {
			calls += 1;
			if (calls === 1) throw unauthorized(config);
			return ok(config, { retriedWith: config.headers.Authorization });
		}) as AxiosAdapter;
		refreshClient.defaults.adapter = (async (config) =>
			ok(config, { token: "fresh-access-token", refreshToken: "rotated-refresh-token" })) as AxiosAdapter;

		const response = await apiClient.get("/api/applications");

		expect(response.data).toEqual({ retriedWith: "Bearer fresh-access-token" });
		expect(localStorage.getItem(TOKEN_KEY)).toBe("fresh-access-token");
		// The rotated token must be stored, or the next refresh spends a token the server burned.
		expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe("rotated-refresh-token");
	});

	it("shares one refresh across requests that expire together", async () => {
		let refreshes = 0;
		const expired = new Set<string>();
		apiClient.defaults.adapter = (async (config) => {
			const url = config.url ?? "";
			if (!expired.has(url)) {
				expired.add(url);
				throw unauthorized(config);
			}
			return ok(config, { url });
		}) as AxiosAdapter;
		refreshClient.defaults.adapter = (async (config) => {
			refreshes += 1;
			return ok(config, { token: "fresh-access-token", refreshToken: "rotated-refresh-token" });
		}) as AxiosAdapter;

		await Promise.all([
			apiClient.get("/api/applications"),
			apiClient.get("/api/dashboard/statistics"),
			apiClient.get("/api/calendar/interviews"),
		]);

		// Refresh tokens are single-use and rotating: a second concurrent refresh would replay an
		// already-rotated token, which the server treats as a breach and revokes the whole family.
		expect(refreshes).toBe(1);
	});

	it("does not attempt a refresh when an auth call itself fails", async () => {
		let refreshes = 0;
		apiClient.defaults.adapter = (async (config) => {
			throw unauthorized(config);
		}) as AxiosAdapter;
		refreshClient.defaults.adapter = (async (config) => {
			refreshes += 1;
			return ok(config, { token: "x", refreshToken: "y" });
		}) as AxiosAdapter;

		// A wrong password is a real 401, not an expired session.
		await expect(apiClient.post("/api/auth/login", {})).rejects.toBeInstanceOf(AxiosError);
		expect(refreshes).toBe(0);
	});

	it("clears the session and redirects when the refresh token is no longer valid", async () => {
		apiClient.defaults.adapter = (async (config) => {
			throw unauthorized(config);
		}) as AxiosAdapter;
		refreshClient.defaults.adapter = (async (config) => {
			throw unauthorized(config);
		}) as AxiosAdapter;

		await expect(apiClient.get("/api/applications")).rejects.toBeInstanceOf(AxiosError);

		expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
		expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
		expect(window.location.href).toBe("/login");
	});
});
