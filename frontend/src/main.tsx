import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "./i18n/config";
import { App } from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import { PipelineStagesProvider } from "./context/PipelineStagesContext";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<ThemeProvider>
				<AuthProvider>
					<PipelineStagesProvider>
						<ToastProvider>
							<App />
						</ToastProvider>
					</PipelineStagesProvider>
				</AuthProvider>
			</ThemeProvider>
		</BrowserRouter>
	</StrictMode>
);
