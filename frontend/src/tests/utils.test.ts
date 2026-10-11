import { describe, it, expect } from "vitest";
import { cn } from "../lib/utils";

describe("Utility cn function", () => {
  it("kết hợp các chuỗi class thông thường", () => {
    const result = cn("text-white", "bg-black");
    expect(result).toBe("text-white bg-black");
  });

  it("giải quyết conflict class của Tailwind bằng twMerge", () => {
    // p-4 đè lên p-2
    const result = cn("p-2", "p-4");
    expect(result).toBe("p-4");

    // text-red-500 đè lên text-blue-500
    const colorResult = cn("text-blue-500", "text-red-500");
    expect(colorResult).toBe("text-red-500");
  });

  it("xử lý điều kiện boolean falsy và undefined", () => {
    const isHidden = false;
    const isBordered = true;
    const result = cn("flex", isHidden && "hidden", isBordered && "border", undefined, null);
    expect(result).toBe("flex border");
  });
});
