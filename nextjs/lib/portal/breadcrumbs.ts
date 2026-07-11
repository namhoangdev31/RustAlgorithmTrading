export type BreadcrumbItem = {
  label: string;
  path: string;
  active?: boolean;
};

export function resolveBreadcrumbs(
  pathname: string,
  params: { locale?: string; projectId?: string }
): BreadcrumbItem[] {
  const locale = params.locale || "en";
  const segments = pathname.split("/").filter(Boolean);

  // Skip the locale segment if it matches the active locale
  const activeSegments = segments[0] === locale ? segments.slice(1) : segments;
  const items: BreadcrumbItem[] = [];

  // Home/Workspace root marker
  items.push({ label: "Workspace", path: "/overview" });

  let currentPath = "";

  for (let i = 0; i < activeSegments.length; i++) {
    const segment = activeSegments[i];
    currentPath += `/${segment}`;

    // Handle project detail segments
    if (segment === "projects" && i + 1 < activeSegments.length) {
      const nextSegment = activeSegments[i + 1];
      items.push({ label: "Projects", path: "/projects" });
      items.push({
        label: nextSegment,
        path: `/projects/${nextSegment}/overview`,
      });
      // Skip the dynamic project ID segment
      i++;
      currentPath += `/${nextSegment}`;
      continue;
    }

    // Handle LepoShip segments
    if (segment === "lepoship" && i + 1 < activeSegments.length) {
      const nextSegment = activeSegments[i + 1];
      items.push({ label: "LepoShip", path: "/lepoship" });
      items.push({
        label: nextSegment,
        path: `/lepoship/${nextSegment}/overview`,
      });
      // Skip the dynamic project ID segment
      i++;
      currentPath += `/${nextSegment}`;
      continue;
    }

    // General segment mapping
    const label = segment.charAt(0).toUpperCase() + segment.slice(1);
    items.push({ label, path: currentPath });
  }

  const uniqueItems: BreadcrumbItem[] = [];
  const seenPaths = new Set<string>();
  for (const item of items) {
    if (!seenPaths.has(item.path)) {
      seenPaths.add(item.path);
      uniqueItems.push(item);
    }
  }

  if (uniqueItems.length > 0) {
    uniqueItems[uniqueItems.length - 1].active = true;
  }

  return uniqueItems;
}
