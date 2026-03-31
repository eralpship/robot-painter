import { FloatingCollapsibleWindow } from "./FloatingCollapsibleWindow";
import { RobotPreview } from "./RobotPreview";
import { TitleBar } from "./TitleBar";
import { TextureEditorWrapper } from "./texture-editor/TextureEditorWrapper";

export function TextureEditorContent() {
	return (
		<>
			<TitleBar />
			<div className="flex-1 min-h-0 relative">
				<TextureEditorWrapper />
				<FloatingCollapsibleWindow
					title="preview"
					x={152}
					y={12}
					width={300}
					height={260}
				>
					<RobotPreview />
				</FloatingCollapsibleWindow>
			</div>
		</>
	);
}

export function TextureEditorContentBasic() {
	return (
		<>
			<TitleBar />
			<TextureEditorWrapper />
		</>
	);
}
