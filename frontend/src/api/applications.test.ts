import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "./client";
import { listApplications } from "./applications";

vi.mock("./client", () => ({
	apiClient: { get: vi.fn() },
}));

describe("listApplications", () => {
	beforeEach(() => {
		vi.mocked(apiClient.get).mockResolvedValue({
			data: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 1000 },
		});
	});

	// Regression guard: with no explicit size the endpoint falls back to Spring's default of 20
	// and silently drops every application past it — no error, just missing rows.
	it("requests a page large enough to hold the whole result set", async () => {
		await listApplications();

		expect(apiClient.get).toHaveBeenCalledWith("/api/applications", {
			params: { size: 1000 },
		});
	});

	it("returns the page payload unchanged", async () => {
		const page = await listApplications();

		expect(page.content).toEqual([]);
		expect(page.totalElements).toBe(0);
	});
});
