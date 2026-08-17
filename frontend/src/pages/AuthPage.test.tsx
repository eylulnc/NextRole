import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AuthPage } from "./AuthPage";
import { AuthProvider } from "../context/AuthContext";
import * as authApi from "../api/auth";

vi.mock("../api/auth");

function renderAuthPage() {
	return render(
		<MemoryRouter>
			<AuthProvider>
				<AuthPage />
			</AuthProvider>
		</MemoryRouter>
	);
}

describe("AuthPage", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
	});

	it("logs in with email and password", async () => {
		vi.mocked(authApi.login).mockResolvedValue({ token: "fake-token", email: "user@example.com" });
		renderAuthPage();

		await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
		await userEvent.type(screen.getByLabelText("Password"), "password123");
		await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

		await waitFor(() => {
			expect(authApi.login).toHaveBeenCalledWith("user@example.com", "password123");
		});
		expect(localStorage.getItem("nextrole_token")).toBe("fake-token");
	});

	it("switches to the signup form and registers", async () => {
		vi.mocked(authApi.register).mockResolvedValue({ token: "fake-token", email: "new@example.com" });
		renderAuthPage();

		await userEvent.click(screen.getByRole("link", { name: "Sign up" }));
		expect(screen.getByRole("heading", { name: "Create your account" })).toBeInTheDocument();

		await userEvent.type(screen.getByLabelText("Email"), "new@example.com");
		await userEvent.type(screen.getByLabelText("Password"), "password123");
		await userEvent.click(screen.getByRole("button", { name: "Create account" }));

		await waitFor(() => {
			expect(authApi.register).toHaveBeenCalledWith("new@example.com", "password123");
		});
	});

	it("shows an error message when login fails", async () => {
		vi.mocked(authApi.login).mockRejectedValue(new Error("unauthorized"));
		renderAuthPage();

		await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
		await userEvent.type(screen.getByLabelText("Password"), "wrong-password");
		await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

		expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument();
	});
});
