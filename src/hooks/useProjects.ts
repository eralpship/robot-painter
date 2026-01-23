import { useLiveQuery } from "dexie-react-hooks";
import { db, type TextureProject } from "@/db/db";

export function useProjects() {
	const projects = useLiveQuery(
		() => db.textureProjects.orderBy("dateModified").reverse().toArray(),
		[],
	);

	return {
		projects: projects as TextureProject[] | undefined,
		isLoading: projects === undefined,
	};
}
