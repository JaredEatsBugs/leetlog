import { describe, expect, it } from "vitest";
import { parseProblemQuery, problemUrl } from "./leetcode";

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
