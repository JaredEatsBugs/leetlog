import { describe, expect, it } from "vitest";
import { parseProblemQuery, problemUrl, slugFromTitle, titleFromSlug } from "./leetcode";

describe("parseProblemQuery", () => {
  it("reads problem numbers", () => {
    expect(parseProblemQuery("1")).toEqual({ kind: "number", frontendId: 1 });
    expect(parseProblemQuery(" #146 ")).toEqual({ kind: "number", frontendId: 146 });
    expect(parseProblemQuery("3000.")).toEqual({ kind: "number", frontendId: 3000 });
  });

  it("reads slugs out of LeetCode URLs", () => {
    for (const url of [
      "https://leetcode.com/problems/two-sum/",
      "https://leetcode.com/problems/two-sum/description/?envType=study-plan",
      "leetcode.com/problems/two-sum",
      "https://leetcode.cn/problems/two-sum/solutions/",
      "https://LeetCode.com/problems/Two-Sum/",
    ]) {
      expect(parseProblemQuery(url)).toEqual({ kind: "slug", slug: "two-sum" });
    }
  });

  it("reads bare slugs", () => {
    expect(parseProblemQuery("lru-cache")).toEqual({ kind: "slug", slug: "lru-cache" });
  });

  it("treats everything else as title text", () => {
    expect(parseProblemQuery("two sum")).toEqual({ kind: "text", text: "two sum" });
    expect(parseProblemQuery("Sqrt(x)")).toEqual({ kind: "text", text: "Sqrt(x)" });
    // a single word is more likely a title fragment than a slug
    expect(parseProblemQuery("palindrome")).toEqual({ kind: "text", text: "palindrome" });
  });
});

describe("problemUrl", () => {
  it("builds the leetcode.com URL", () => {
    expect(problemUrl("two-sum")).toBe("https://leetcode.com/problems/two-sum/");
  });
});

describe("slug / title guesses", () => {
  it("guesses a slug from a title", () => {
    expect(slugFromTitle("Two Sum")).toBe("two-sum");
    expect(slugFromTitle("  Best Time to Buy and Sell Stock II ")).toBe(
      "best-time-to-buy-and-sell-stock-ii",
    );
    expect(slugFromTitle("Pow(x, n)")).toBe("pow-x-n");
  });

  it("guesses a title from a slug", () => {
    expect(titleFromSlug("two-sum")).toBe("Two Sum");
    expect(titleFromSlug("3sum")).toBe("3sum");
  });
});
