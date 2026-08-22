import { useTranslation } from "react-i18next";
import { XIcon } from "./IconButton";

export function CloseButton({ onClick }: { onClick: () => void }) {
	const { t } = useTranslation();
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={t("applicationForm.cancel")}
			title={t("applicationForm.cancel")}
			style={{
				position: "absolute",
				top: 10,
				right: 10,
				width: 24,
				height: 24,
				borderRadius: "50%",
				border: "none",
				background: "var(--color-chip-bg)",
				color: "var(--color-text-muted)",
				cursor: "pointer",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<XIcon />
		</button>
	);
}
