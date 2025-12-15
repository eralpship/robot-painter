import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useRef } from "react";
import { Model, type ModelRef } from "./E-model";

// Stable no-op function to prevent re-renders from callback reference changes
const noop = () => {};

export function RobotPreview() {
	const modelRef = useRef<ModelRef>(null);

	return (
		<Canvas
			className="h-full w-full bg-transparent"
			orthographic
			camera={{ position: [10, 5, 10], zoom: 20 }}
			gl={{ toneMapping: 0 }} // Disable tone mapping for flat colors
		>
			<ambientLight intensity={5.5} />
			<directionalLight position={[0, 10, 5]} intensity={0.8} />
			<directionalLight position={[-3, -3, -3]} intensity={0.4} />
			<directionalLight position={[3, -2, 3]} intensity={0.3} />
			<Model
				ref={modelRef}
				position={[0, -3.5, 0]}
				scale={1}
				onLidOpenChanged={noop}
				onTaillightIntensityChanged={noop}
				onHeadlightIntensityChanged={noop}
				initialHeadlightIntensity={0}
				initialTailLightIntensity={0}
				onBogieAmountChanged={noop}
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
