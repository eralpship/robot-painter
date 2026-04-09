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

  const refererMatch =
    referer && new URL(referer).hostname === ALLOWED_ORIGIN;
  const originMatch =
    origin && new URL(origin).hostname === ALLOWED_ORIGIN;

  if (!refererMatch && !originMatch) {
    return new Response("Forbidden", { status: 403 });
  }

  return context.next();
};
