import { useContext } from "react";
import { Button } from "@/components/ui/Button";
import {
	CANVAS_SIZE,
	TextureEditorContext,
} from "@/contexts/texture-editor-context";
import {
	compressImage,
	DEFAULT_MAX_IMAGE_HEIGHT,
	DEFAULT_MAX_IMAGE_WIDTH,
	formatBytes,
} from "@/utils/image-compression";

// File size limits
const MAX_INPUT_FILE_SIZE = 50 * 1024 * 1024; // 50MB - pre-compression limit
const MAX_COMPRESSED_SIZE = 2 * 1024 * 1024; // 2MB - post-compression limit

export function AddElementToolbar() {
	const ctx = useContext(TextureEditorContext);
	return (
		<>
			<Button
				onClick={() => {
					ctx.addElement({
						type: "text",
						text: "Sample Text",
						fontSize: 192,
						color: "#000000",
						transform: {
							centerX: ctx.center.x,
							centerY: ctx.center.y,
							rotation: 0,
							scaleX: 1,
							scaleY: 1,
						},
						side: ctx.side,
					});
				}}
			>
				add text
			</Button>
			<Button
				onClick={() => {
					const input = document.createElement("input");
					input.type = "file";
					input.accept = "image/*,.svg";
					input.style.display = "none";

					// Append to DOM for Safari compatibility
					document.body.appendChild(input);

					input.onchange = async (e) => {
						const file = (e.target as HTMLInputElement).files?.[0];

						if (file) {
							// Pre-compression file size check to avoid processing extremely large files
							if (file.size > MAX_INPUT_FILE_SIZE) {
								console.error("File too large:", file.size, "bytes");
								alert(
									`Image file is too large. Please use an image smaller than ${formatBytes(MAX_INPUT_FILE_SIZE)}`,
								);
								document.body.removeChild(input);
								return;
							}

							console.log(
								"Loading image:",
								file.name,
								"Size:",
								formatBytes(file.size),
								"Type:",
								file.type,
							);

							try {
								// Compress the image using ImageMagick WASM (converts all formats to PNG)
								const compressed = await compressImage(file, {
									maxWidth: DEFAULT_MAX_IMAGE_WIDTH,
									maxHeight: DEFAULT_MAX_IMAGE_HEIGHT,
								});

								// Check compressed size limit
								if (compressed.compressedSize > MAX_COMPRESSED_SIZE) {
									alert(
										`Compressed image is too large (${formatBytes(compressed.compressedSize)}). ` +
											`Maximum allowed is ${formatBytes(MAX_COMPRESSED_SIZE)}. ` +
											`Try using a simpler image with fewer colors or details.`,
									);
									document.body.removeChild(input);
									return;
								}

								// Calculate scale to fit image within 60% of canvas width
								const maxDisplayWidth = CANVAS_SIZE * 0.6;
								const scaleFactor =
									compressed.width > maxDisplayWidth
										? maxDisplayWidth / compressed.width
										: 1;

								ctx.addElement({
									type: "image",
									base64data: compressed.base64data,
									transform: {
										centerX: ctx.center.x,
										centerY: ctx.center.y,
										rotation: 0,
										scaleX: scaleFactor,
										scaleY: scaleFactor,
									},
									width: compressed.width,
									height: compressed.height,
									side: ctx.side,
								});
								console.log("Image element added to context");
							} catch (error) {
								console.error("Failed to process image:", error);
								alert(
									"Failed to load the image. The file might be corrupted or in an unsupported format.",
								);
							} finally {
								document.body.removeChild(input);
							}
						} else {
							// Clean up if no file selected
							document.body.removeChild(input);
						}
					};

					// Trigger click after a small delay for Safari
					setTimeout(() => {
						input.click();
					}, 100);
				}}
			>
				add image
			</Button>
		</>
	);
}
