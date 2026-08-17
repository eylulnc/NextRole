import { Navigate, Route, Routes } from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import { ApplicationsPage } from "./pages/ApplicationsPage";
import { ApplicationDetailPage } from "./pages/ApplicationDetailPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

export function App() {
	return (
		<Routes>
			<Route path="/login" element={<AuthPage />} />
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
			<Route path="*" element={<Navigate to="/applications" replace />} />
		</Routes>
	);
}
