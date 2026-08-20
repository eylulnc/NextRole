import type { ReactNode } from "react";

const BULLET_RE = /^[-*]\s+(.*)/;
const NUMBERED_RE = /^\d+[.)]\s+(.*)/;
const listStyle: React.CSSProperties = { margin: "4px 0", paddingLeft: 20 };

function parseInline(text: string): ReactNode[] {
	return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
		part.startsWith("**") && part.endsWith("**") && part.length > 4 ? <strong key={i}>{part.slice(2, -2)}</strong> : part
	);
}

export function FormattedText({ text }: { text: string }) {
	const lines = text.split("\n");
	const blocks: ReactNode[] = [];
	let listItems: string[] = [];
	let listType: "ul" | "ol" | null = null;

	function flushList() {
		if (listItems.length) {
			const items = listItems.map((item, i) => <li key={i}>{parseInline(item)}</li>);
			blocks.push(
				listType === "ol" ? (
					<ol key={`list-${blocks.length}`} style={listStyle}>
						{items}
					</ol>
				) : (
					<ul key={`list-${blocks.length}`} style={listStyle}>
						{items}
					</ul>
				)
			);
		}
		listItems = [];
		listType = null;
	}

	lines.forEach((line, i) => {
		const bulletMatch = BULLET_RE.exec(line);
		const numberedMatch = NUMBERED_RE.exec(line);
		if (bulletMatch) {
			if (listType !== "ul") flushList();
			listType = "ul";
			listItems.push(bulletMatch[1]);
		} else if (numberedMatch) {
			if (listType !== "ol") flushList();
			listType = "ol";
			listItems.push(numberedMatch[1]);
		} else {
			flushList();
			blocks.push(line.trim() === "" ? <div key={`sp-${i}`} style={{ height: 8 }} /> : <div key={`line-${i}`}>{parseInline(line)}</div>);
		}
	});
	flushList();

	return <>{blocks}</>;
}
