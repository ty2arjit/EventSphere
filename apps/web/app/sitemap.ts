import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * Static routes only. Community/event detail pages aren't included — they'd
 * need a DB read at build/request time, and this project's build step
 * shouldn't depend on database reachability (see CLAUDE.md's notes on the
 * sandboxed dev environment's DB connectivity). /communities and /events
 * are listed instead; both link to every individual page via crawlable
 * <a> tags, so nothing is unreachable to a crawler.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/communities", "/events", "/verify", "/login", "/register", "/privacy"];
  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "daily",
    priority: route === "" ? 1 : 0.7,
  }));
}
