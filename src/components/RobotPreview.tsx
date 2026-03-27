import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useRef } from "react";
import { Model, type ModelRef } from "./E-model";

export function RobotPreview() {
	const modelRef = useRef<ModelRef>(null);

	return (
		<Canvas
			className="h-full w-full bg-transparent"
			orthographic
			camera={{ position: [10, 5, 10], zoom: 20 }}
			gl={{ toneMapping: 0 }} // Disable tone mapping for flat colors
		>
			<Model
				ref={modelRef}
				position={[0, -3.5, 0]}
				scale={1}
				interactive={false}
				lightsOff
				unlit
			/>
			<OrbitControls
				makeDefault
				enableZoom={true}
				enablePan={false}
				minZoom={10}
				maxZoom={80}
			/>
		</Canvas>
	);
}
