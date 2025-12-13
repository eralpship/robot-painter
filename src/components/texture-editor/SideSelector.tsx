import type React from "react";
import { useContext } from "react";
import { TextureEditorContext } from "../../contexts/texture-editor-context";

export function SideSelector() {
	const ctx = useContext(TextureEditorContext);

	if (!ctx) {
		console.error("SideSelector must be used within TextureEditorProvider");
		return null;
	}

	const { side, setSide } = ctx;

	const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSide(e.target.value as typeof side);
	};

	return (
		<div className="side-selector">
			<select
				id="side-select"
				value={side}
				onChange={handleChange}
				className="side-dropdown"
			>
				<option value="lid">Lid</option>
				<option value="left">Left</option>
				<option value="right">Right</option>
				<option value="front">Front</option>
				<option value="back">Back</option>
			</select>
		</div>
	);
}
