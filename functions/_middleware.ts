const ALLOWED_ORIGIN = "robot.eralp.dev";

const PROTECTED_EXTENSIONS = new Set([".gltf", ".bin"]);

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const extension = url.pathname.slice(url.pathname.lastIndexOf("."));

  if (!PROTECTED_EXTENSIONS.has(extension)) {
    return context.next();
  }

  const referer = context.request.headers.get("Referer");
  const origin = context.request.headers.get("Origin");

  // Allow direct browser navigation (no referer) for HTML pages
  // but block embedded/hotlinked assets from other origins
  if (referer) {
    const refererHost = new URL(referer).hostname;
    if (refererHost !== ALLOWED_ORIGIN) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  if (origin) {
    const originHost = new URL(origin).hostname;
    if (originHost !== ALLOWED_ORIGIN) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  return context.next();
};
