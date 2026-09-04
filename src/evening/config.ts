import type { EveningSite } from "./state";

// A production preview must behave like a deployed site, without dev servers.
const local =
  import.meta.env.DEV && ["localhost", "127.0.0.1"].includes(location.hostname);
const localOrigin = (port: number) =>
  `${location.protocol}//${location.hostname}:${port}`;
export const AGENT_ORIGIN =
  import.meta.env.VITE_AGENT_ORIGIN ||
  (local ? localOrigin(5273) : location.origin);
export function siteUrl(site: EveningSite, embedded = true): string {
  const configured =
    site === "cinema"
      ? import.meta.env.VITE_CINEMA_URL
      : import.meta.env.VITE_RESTAURANT_URL;
  const fallback = local
    ? `${localOrigin(site === "cinema" ? 5274 : 5275)}/${site}`
    : `${location.origin}/${site}`;
  const url = new URL(configured || fallback, location.href);
  if (embedded) url.searchParams.set("embedded", "1");
  else url.searchParams.delete("embedded");
  return url.href;
}
export const SITE_NAMES: Record<EveningSite, string> = {
  cinema: "LUNA Cinema",
  restaurant: "OLIVA Restaurant",
};
