import { Navigate, Route, Routes } from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CalendarPage } from "./pages/CalendarPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ApplicationsPage } from "./pages/ApplicationsPage";
import { ApplicationDetailPage } from "./pages/ApplicationDetailPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

export function App() {
	return (
		<Routes>
			<Route path="/login" element={<AuthPage />} />
			<Route
				path="/dashboard"
				element={
					<ProtectedRoute>
						<DashboardPage />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/calendar"
				element={
					<ProtectedRoute>
						<CalendarPage />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/analytics"
				element={
					<ProtectedRoute>
						<AnalyticsPage />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/applications"
				element={
					<ProtectedRoute>
						<ApplicationsPage />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/applications/:id"
				element={
					<ProtectedRoute>
						<ApplicationDetailPage />
					</ProtectedRoute>
				}
			/>
			<Route path="*" element={<Navigate to="/dashboard" replace />} />
		</Routes>
	);
}
