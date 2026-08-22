import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SettingsModal } from "./SettingsModal";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import { ThemeProvider } from "../context/ThemeContext";
import * as settingsApi from "../api/settings";

vi.mock("../api/settings");

function renderSettingsModal(onClose = vi.fn()) {
	localStorage.setItem("nextrole_email", "user@example.com");
	localStorage.setItem("nextrole_token", "fake-token");
	localStorage.setItem("nextrole_language", "en");
	localStorage.setItem("nextrole_default_currency", "EUR");
	return {
		onClose,
		...render(
			<ThemeProvider>
				<AuthProvider>
					<ToastProvider>
						<SettingsModal onClose={onClose} />
					</ToastProvider>
				</AuthProvider>
			</ThemeProvider>
		),
	};
}

describe("SettingsModal", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
	});

	it("saves the selected language and default currency", async () => {
		vi.mocked(settingsApi.updateSettings).mockResolvedValue({ language: "de", defaultCurrency: "USD" });
		const { onClose } = renderSettingsModal();

		await userEvent.selectOptions(screen.getByLabelText("Language"), "de");
		await userEvent.selectOptions(screen.getByLabelText("Default currency"), "USD");
		await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

		await waitFor(() => {
			expect(settingsApi.updateSettings).toHaveBeenCalledWith({ language: "de", defaultCurrency: "USD" });
		});
		expect(localStorage.getItem("nextrole_language")).toBe("de");
		expect(localStorage.getItem("nextrole_default_currency")).toBe("USD");
		expect(onClose).toHaveBeenCalled();
	});
});
