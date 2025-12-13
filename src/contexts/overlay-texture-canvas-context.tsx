import type React from "react";
import { createContext, useCallback, useState } from "react";
import { CANVAS_SIZE } from "./texture-editor-context";

export type OverlayTextureSides = {
	lid: HTMLImageElement;
	left: HTMLImageElement;
	right: HTMLImageElement;
	front: HTMLImageElement;
	back: HTMLImageElement;
};

type OverlayTextureContextType = OverlayTextureSides & {
	setSide: (side: keyof OverlayTextureSides, image: HTMLImageElement) => void;
};

export const OverlayTextureContext =
	createContext<OverlayTextureContextType | null>(null);

interface OverlayTextureProviderProps {
	children: React.ReactNode;
}

export function createBlankTexture(color: string) {
	const canvas = document.createElement("canvas");
	canvas.width = CANVAS_SIZE;
	canvas.height = CANVAS_SIZE;
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("Failed to get 2d context");
	}
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
	const img = new Image();
	img.src = canvas.toDataURL();
	return img;
}

export function OverlayTextureCanvasProvider({
	children,
}: OverlayTextureProviderProps) {
	const [lid, setLid] = useState(createBlankTexture("white"));
	const [left, setLeft] = useState(createBlankTexture("white"));
	const [right, setRight] = useState(createBlankTexture("white"));
	const [front, setFront] = useState(createBlankTexture("white"));
	const [back, setBack] = useState(createBlankTexture("white"));

	const setSide = useCallback<OverlayTextureContextType["setSide"]>(
		(side, image) => {
			switch (side) {
				case "lid":
					setLid(image);
					break;
				case "left":
					setLeft(image);
					break;
				case "right":
					setRight(image);
					break;
				case "front":
					setFront(image);
					break;
				case "back":
					setBack(image);
					break;
			}
		},
		[],
	);

	return (
		<OverlayTextureContext.Provider
			value={{
				lid,
				left,
				right,
				front,
				back,
				setSide,
			}}
		>
			{children}
		</OverlayTextureContext.Provider>
	);
}
