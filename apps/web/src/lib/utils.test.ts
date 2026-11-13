import { expect, it } from "vitest";
import { cn } from "./utils";

it("merges tailwind classes, last one wins", () => {
  expect(cn("p-2", "p-4", false && "hidden")).toBe("p-4");
});
