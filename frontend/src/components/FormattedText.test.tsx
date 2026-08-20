import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormattedText } from "./FormattedText";

describe("FormattedText", () => {
	it("renders bold segments marked with **", () => {
		render(<FormattedText text="This role needs **Kotlin** and **Spring Boot**." />);

		expect(screen.getByText("Kotlin", { selector: "strong" })).toBeInTheDocument();
		expect(screen.getByText("Spring Boot", { selector: "strong" })).toBeInTheDocument();
	});

	it("renders a bullet list from dash-prefixed lines", () => {
		render(<FormattedText text={"Requirements:\n- Kotlin\n- PostgreSQL\n- Docker"} />);

		const list = screen.getByText("Kotlin").closest("ul");
		expect(list).toBeInTheDocument();
		expect(screen.getByText("PostgreSQL").tagName).toBe("LI");
		expect(screen.getByText("Docker").tagName).toBe("LI");
	});

	it("renders a numbered list from digit-prefixed lines", () => {
		render(<FormattedText text={"1. First step\n2. Second step"} />);

		const list = screen.getByText("First step").closest("ol");
		expect(list).toBeInTheDocument();
		expect(screen.getByText("Second step").tagName).toBe("LI");
	});

	it("renders plain lines untouched when there is no markup", () => {
		render(<FormattedText text={"Line one\nLine two"} />);

		expect(screen.getByText("Line one")).toBeInTheDocument();
		expect(screen.getByText("Line two")).toBeInTheDocument();
	});
});
