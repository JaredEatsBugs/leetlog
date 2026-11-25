export type ProblemQuery =
  | { kind: "number"; frontendId: number }
  | { kind: "slug"; slug: string }
  | { kind: "text"; text: string };

const URL_SLUG = /leetcode\.(?:com|cn)\/problems\/([a-z0-9-]+)/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)+$/;

/**
 * Work out what the user typed into the problem box:
 * "1" / "#1" → number, a leetcode.com or leetcode.cn problem URL or "two-sum" → slug,
 * anything else → title text.
 */
export function parseProblemQuery(input: string): ProblemQuery {
  const q = input.trim();

  const number = /^#?(\d{1,5})\.?$/.exec(q);
  if (number) return { kind: "number", frontendId: Number(number[1]) };

  const fromUrl = URL_SLUG.exec(q);
  if (fromUrl) return { kind: "slug", slug: fromUrl[1].toLowerCase() };

  if (SLUG.test(q)) return { kind: "slug", slug: q };

  return { kind: "text", text: q };
}

export function problemUrl(slug: string): string {
  return `https://leetcode.com/problems/${slug}/`;
}

/** Best guess at a LeetCode slug from a title ("Two Sum" → "two-sum"). The user can correct it. */
export function slugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Best guess at a title from a slug ("two-sum" → "Two Sum"). */
export function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}
