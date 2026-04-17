export const ROUTES = [
  { id: "overview", label: "Overview" },
  { id: "recommendations", label: "Recomendaciones" },
  { id: "monitoring", label: "Monitoring" }
];

export const DEFAULT_ROUTE = "overview";

export function getRouteFromHash(hashValue = window.location.hash) {
  const route = hashValue.replace(/^#\/?/, "").trim();
  const validRoute = ROUTES.find((item) => item.id === route);
  return validRoute ? validRoute.id : DEFAULT_ROUTE;
}

export function setHashRoute(route) {
  const nextHash = `#/${route}`;
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
  }
}
