import {
	type MouseEventHandler,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	OverlayTextureContext,
	type OverlayTextureSides,
} from "../../contexts/overlay-texture-canvas-context";
import StencilUvSvgBack from "./back.svg?react";
import StencilUvSvgFront from "./front.svg?react";
import StencilUvSvgLeft from "./left.svg?react";
import StencilUvSvgLid from "./lid.svg?react";
import StencilUvSvgRight from "./right.svg?react";

const stencilSideMap: Record<
	keyof OverlayTextureSides,
	typeof StencilUvSvgLid
> = {
	lid: StencilUvSvgLid,
	front: StencilUvSvgFront,
	back: StencilUvSvgBack,
	left: StencilUvSvgLeft,
	right: StencilUvSvgRight,
};

import Moveable from "react-moveable";
import {
	CANVAS_SIZE,
	TextureEditorContext,
} from "@/contexts/texture-editor-context";
import { toSVGTransform } from "@/utils/transforms";

/**
 * Serialize SVG to string, removing specified elements by id.
 * Uses DOM manipulation for reliable removal of nested elements.
 */
function serializeSvg(
	svgElement: SVGSVGElement,
	filterIds: string[] = [],
): string {
	// Clone the SVG so we don't modify the original
	const clone = svgElement.cloneNode(true) as SVGSVGElement;

	// Remove elements by id
	for (const id of filterIds) {
		const element = clone.querySelector(`#${id}`);
		if (element) {
			element.remove();
		}
	}

	// Also remove any nested SVG elements (from React component imports)
	// These are the stencil SVGs that shouldn't be in the texture
	const nestedSvgs = clone.querySelectorAll("svg svg");
	for (const nested of nestedSvgs) {
		nested.remove();
	}

	// Remove style elements (used for stencil styling, not needed in output)
	const styleElements = clone.querySelectorAll("style");
	for (const style of styleElements) {
		style.remove();
	}

	return new XMLSerializer().serializeToString(clone);
}

export function TextureEditor({
	style,
	side,
}: {
	style?: React.CSSProperties;
	side: keyof OverlayTextureSides;
}) {
	const editorCtx = useContext(TextureEditorContext);
	const textureCtx = useContext(OverlayTextureContext);
	// Extract setSide to avoid re-creating updateTexture when textures change
	// setSide is stable (created with useCallback([]))
	const setSideTexture = textureCtx?.setSide;

	const containerRef = useRef<HTMLDivElement>(null);
	const svgRef = useRef<SVGSVGElement>(null);
	const moveableRef = useRef<Moveable>(null);

	const hidden = editorCtx.side !== side;

	const updateTexture = useCallback(() => {
		if (!setSideTexture || !svgRef.current) {
			return;
		}
		const serializedSvg = serializeSvg(svgRef.current, [
			"stencil", // a root element in the svg needs to have name "stencil" in inkscape
			"render", // a root element or group in the svg needs to have name "render" in inkscape below it
		]);
		const img = new Image();
		img.onload = () => {
			setSideTexture(side, img);
		};
		img.onerror = (error) => {
			console.error("Failed to load SVG as image:", error);
		};
		const encodedSvg = encodeURIComponent(serializedSvg);
		img.src = `data:image/svg+xml,${encodedSvg}`;
	}, [side, setSideTexture]);

	// Update texture when backgroundColor or elements change (but only after initial load)
	// biome-ignore lint/correctness/useExhaustiveDependencies: backgroundColor and elements affect the SVG DOM that updateTexture() serializes. These dependencies are required to trigger texture updates when the visual content changes.
	useEffect(() => {
		// Don't update texture until initial load is complete
		if (!editorCtx.isLoaded) {
			return;
		}

		// Use requestAnimationFrame to ensure SVG has rendered before serializing
		// This is more reliable than setTimeout(0) and avoids race conditions
		let rafId: number | null = null;

		rafId = requestAnimationFrame(() => {
			updateTexture();
		});

		return () => {
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
			}
		};
	}, [
		editorCtx.backgroundColor,
		editorCtx.elements,
		editorCtx.isLoaded,
		updateTexture,
	]);

	// Notify context when editor is ready (SVG is mounted)
	useEffect(() => {
		if (svgRef.current && !hidden) {
			editorCtx.notifyEditorReady();
		}
	}, [hidden, editorCtx]);

	const elementRefs = useRef<
		Map<string, SVGTextElement | SVGImageElement | SVGRectElement>
	>(new Map());

	const [moveableKey, setMoveableKey] = useState("not-selected");

	const handleSvgMouseDown = useCallback<MouseEventHandler<SVGSVGElement>>(
		(e) => {
			const target = e.target as SVGElement;

			// Check if the clicked element is a selectable element (text/image)
			const isSelectable = (target as Element).classList?.contains(
				"texture-element-selectable",
			);

			if (isSelectable) {
				// Select the element
				const uuid = target.getAttribute("id");
				if (!uuid || editorCtx.selectedElement?.uuid === uuid) {
					return;
				}
				editorCtx.setSelectedElementId(uuid);
				moveableRef.current?.waitToChangeTarget().then(() => {
					moveableRef.current?.dragStart(e.nativeEvent as MouseEvent);
				});
			} else {
				// Check if we're clicking on a Moveable control element
				const moveableControl = (target as Element).closest(
					".moveable-control-box, .moveable-line, .moveable-control, .moveable-direction",
				);
				if (moveableControl) {
					return;
				}

				// Otherwise, deselect
				editorCtx.setSelectedElementId(undefined);
			}
		},
		[editorCtx],
	);

	const handleOnMoveableActionEnd = useCallback(
		(target: SVGElement | HTMLElement) => {
			const uuid = target.getAttribute("id");
			if (!uuid) {
				console.warn("[TextureEditor] No UUID found on target element");
				return;
			}

			// Parse the SVG transform attribute to get the current transform
			const svgTransformAttr = target.getAttribute("transform");
			if (!svgTransformAttr) {
				return;
			}

			// Parse the SVG transform string
			const translateMatch = svgTransformAttr.match(
				/translate\(([-\d.]+),\s*([-\d.]+)\)/,
			);
			const rotateMatch = svgTransformAttr.match(/rotate\(([-\d.]+)\)/);
			const scaleMatch = svgTransformAttr.match(
				/scale\(([-\d.]+),\s*([-\d.]+)\)/,
			);

			const transform = {
				centerX: translateMatch ? parseFloat(translateMatch[1]) : 0,
				centerY: translateMatch ? parseFloat(translateMatch[2]) : 0,
				rotation: rotateMatch ? parseFloat(rotateMatch[1]) : 0,
				scaleX: scaleMatch ? parseFloat(scaleMatch[1]) : 1,
				scaleY: scaleMatch ? parseFloat(scaleMatch[2]) : 1,
			};

			// Update element with the new transform
			editorCtx.updateElement(uuid, { transform });

			updateTexture();
			setMoveableKey(uuid);
		},
		[editorCtx, updateTexture],
	);

	const StencilSvg = stencilSideMap[side];

	// Elements filtered for the current side
	const elements = useMemo(
		() =>
			Array.from(editorCtx.elements.entries()).filter(
				([, i]) => i.side === side,
			),
		[editorCtx.elements, side],
	);

	return (
		<div ref={containerRef} className="relative overflow-hidden" style={style}>
			<svg
				display={hidden ? "none" : undefined}
				ref={svgRef}
				width={CANVAS_SIZE}
				height={CANVAS_SIZE}
				viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
				xmlns="http://www.w3.org/2000/svg"
				style={{
					width: "100%",
					height: "100%",
					userSelect: "none",
					cursor: "default",
				}}
				onMouseDown={handleSvgMouseDown}
				aria-label={`Texture editor canvas for ${side} side`}
			>
				<title>{`Texture editor canvas for ${side} side`}</title>
				{/* Background color rect inside SVG to avoid Safari subpixel gap */}
				<rect
					width={CANVAS_SIZE}
					height={CANVAS_SIZE}
					fill={editorCtx.backgroundColor}
				/>
				{/* CSS to control stencil visibility in background vs overlay layers */}
				<style>{`
					.stencil-background [inkscape\\:label="stencil"] { display: none !important; }
					.stencil-overlay > svg > *:not([inkscape\\:label="stencil"]) { display: none !important; }
				`}</style>
				{/* Background SVG (render group) - stencil hidden */}
				<g className="stencil-background">
					<StencilSvg style={{ width: "100%", height: "100%" }} />
				</g>
				{/* User elements render in middle layer */}
				{elements.map(([uuid, element]) => {
					switch (element.type) {
						case "text": {
							const textTransform = toSVGTransform(element.transform);
							return (
								<text
									ref={(el) => {
										if (el) {
											elementRefs.current.set(uuid, el);
										} else {
											elementRefs.current.delete(uuid);
										}
									}}
									id={uuid}
									key={uuid}
									className="texture-element-selectable"
									xmlSpace="preserve"
									style={{
										fontFamily:
											'-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen"',
										fontWeight: "bold",
										fontSize: `${element.fontSize}px`,
										fill: element.color,
										cursor: "pointer",
										textAlign: "center",
										textAnchor: "middle",
										dominantBaseline: "middle",
										userSelect: "none",
										WebkitUserSelect: "none",
									}}
									transform={textTransform}
								>
									{element.text}
								</text>
							);
						}
						case "image":
							return (
								<image
									ref={(el) => {
										if (el) {
											elementRefs.current.set(uuid, el);
										} else {
											elementRefs.current.delete(uuid);
										}
									}}
									id={uuid}
									key={uuid}
									className="texture-element-selectable"
									xmlSpace="preserve"
									href={element.base64data}
									xlinkHref={element.base64data} // Safari compatibility
									x={-element.width / 2}
									y={-element.height / 2}
									width={element.width}
									height={element.height}
									transform={toSVGTransform(element.transform)}
									style={{
										cursor: "pointer",
									}}
									onError={(e) => {
										console.error("SVG image failed to render:", uuid, e);
									}}
								/>
							);
						case "rectangle":
							return (
								<rect
									ref={(el) => {
										if (el) {
											elementRefs.current.set(uuid, el);
										} else {
											elementRefs.current.delete(uuid);
										}
									}}
									id={uuid}
									key={uuid}
									className="texture-element-selectable"
									x={-element.width / 2}
									y={-element.height / 2}
									width={element.width}
									height={element.height}
									fill={element.color}
									transform={toSVGTransform(element.transform)}
									style={{ cursor: "pointer" }}
								/>
							);
						default:
							return null;
					}
				})}
				{/* Stencil overlay renders last (on top) - only stencil visible, pointer-events: none */}
				<g className="stencil-overlay" style={{ pointerEvents: "none" }}>
					<StencilSvg style={{ width: "100%", height: "100%" }} />
				</g>
			</svg>
			<Moveable
				key={moveableKey}
				ref={moveableRef}
				container={containerRef.current}
				target={
					editorCtx.selectedElement?.uuid
						? elementRefs.current.get(editorCtx.selectedElement.uuid) || null
						: null
				}
				svgOrigin="50% 50%"
				scalable
				draggable
				rotatable
				keepRatio={editorCtx.selectedElement?.type !== "rectangle"}
				onDragStart={(e) => {
					const uuid = e.target.getAttribute("id");
					const element = uuid ? editorCtx.elements.get(uuid) : null;
					if (element) {
						e.datas.initialTransform = { ...element.transform };
					}
				}}
				onDrag={(e) => {
					const initial = e.datas.initialTransform;
					if (initial) {
						const newTransform = {
							...initial,
							centerX: initial.centerX + e.translate[0],
							centerY: initial.centerY + e.translate[1],
						};
						e.target.setAttribute("transform", toSVGTransform(newTransform));
					}
				}}
				onRotateStart={(e) => {
					const uuid = e.target.getAttribute("id");
					const element = uuid ? editorCtx.elements.get(uuid) : null;
					if (element) {
						e.datas.initialTransform = { ...element.transform };
					}
				}}
				onRotate={(e) => {
					const initial = e.datas.initialTransform;
					if (initial) {
						const newTransform = {
							...initial,
							centerX: initial.centerX + (e.drag?.translate?.[0] ?? 0),
							centerY: initial.centerY + (e.drag?.translate?.[1] ?? 0),
							rotation: initial.rotation + e.beforeDist,
						};
						e.target.setAttribute("transform", toSVGTransform(newTransform));
					}
				}}
				onScaleStart={(e) => {
					const uuid = e.target.getAttribute("id");
					const element = uuid ? editorCtx.elements.get(uuid) : null;
					if (element) {
						e.datas.initialTransform = { ...element.transform };
					}
				}}
				onScale={(e) => {
					const initial = e.datas.initialTransform;
					if (initial) {
						const newTransform = {
							...initial,
							centerX: initial.centerX + (e.drag?.translate?.[0] ?? 0),
							centerY: initial.centerY + (e.drag?.translate?.[1] ?? 0),
							scaleX: initial.scaleX * e.scale[0],
							scaleY: initial.scaleY * e.scale[1],
						};
						e.target.setAttribute("transform", toSVGTransform(newTransform));
					}
				}}
				onDragEnd={(e) => handleOnMoveableActionEnd(e.target)}
				onScaleEnd={(e) => handleOnMoveableActionEnd(e.target)}
				onRotateEnd={(e) => handleOnMoveableActionEnd(e.target)}
			/>
		</div>
	);
}
