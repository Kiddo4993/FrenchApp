// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

const req = (auth?: string) => new NextRequest("https://example.com/", auth ? { headers: { authorization: auth } } : {});
const basic = (pw: string) => "Basic " + Buffer.from(`me:${pw}`).toString("base64");
const passes = (res: Response) => res.headers.get("x-middleware-next") === "1";

describe("optional app password", () => {
  afterEach(() => { delete process.env.APP_PASSWORD; });

  it("lets everything through when APP_PASSWORD isn't set (same as today)", () => {
    expect(passes(middleware(req()))).toBe(true);
  });

  it("asks for the password when it's set", () => {
    process.env.APP_PASSWORD = "s3cret";
    const res = middleware(req());
    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toContain("Basic");
  });

  it("accepts the right password", () => {
    process.env.APP_PASSWORD = "s3cret";
    expect(passes(middleware(req(basic("s3cret"))))).toBe(true);
  });

  it("rejects a wrong password", () => {
    process.env.APP_PASSWORD = "s3cret";
    expect(middleware(req(basic("nope"))).status).toBe(401);
  });
});
