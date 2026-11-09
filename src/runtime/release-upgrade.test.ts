import { describe, expect, it, vi } from "vitest";
import source from "../../public/release-upgrade.js?raw";

function worker(active: boolean, windows: Array<{url: string; navigate: ReturnType<typeof vi.fn>}>) {
  let activate: (event: {waitUntil: (promise: Promise<void>) => void}) => void;
  const claim = vi.fn(async () => undefined);
  const matchAll = vi.fn(async () => windows);
  const self = {
    registration: { active: active ? {} : null, scope: "https://phone.test/app/" },
    clients: { claim, matchAll },
    addEventListener: vi.fn((type: string, callback: typeof activate) => {
      if (type === "activate") activate = callback;
    }),
  };
  new Function("self", source)(self);
  const run = async () => {
    const jobs: Promise<void>[] = [];
    activate!({waitUntil: (promise) => jobs.push(promise)});
    await Promise.all(jobs);
  };
  return {run, claim, matchAll};
}

describe("service worker release handoff", () => {
  it("does not reload the page on its first installation", async () => {
    const navigate = vi.fn(async () => undefined);
    const w = worker(false, [{url: "https://phone.test/app/", navigate}]);
    await w.run();
    expect(w.claim).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("updates existing scoped windows once and preserves their full URLs", async () => {
    const a = vi.fn(async () => undefined), b = vi.fn(async () => undefined);
    const outside = vi.fn(async () => undefined), foreign = vi.fn(async () => undefined);
    const first = "https://phone.test/app/?screen=bubble#thread";
    const second = "https://phone.test/app/index.html?preview=test";
    const w = worker(true, [
      {url: first, navigate: a}, {url: second, navigate: b},
      {url: "https://phone.test/another/", navigate: outside},
      {url: "https://other.test/app/", navigate: foreign},
    ]);
    await w.run();
    await w.run();
    expect(w.claim).toHaveBeenCalledTimes(1);
    expect(w.matchAll).toHaveBeenCalledWith({type: "window", includeUncontrolled: true});
    expect(a).toHaveBeenCalledExactlyOnceWith(first);
    expect(b).toHaveBeenCalledExactlyOnceWith(second);
    expect(outside).not.toHaveBeenCalled();
    expect(foreign).not.toHaveBeenCalled();
  });

  it("allows activation to finish if a tab closes during navigation", async () => {
    const failed = vi.fn(async () => {throw new Error("Tab closed");});
    const live = vi.fn(async () => undefined);
    const w = worker(true, [{url: "https://phone.test/app/", navigate: failed}, {url: "https://phone.test/app/?next=1", navigate: live}]);
    await expect(w.run()).resolves.toBeUndefined();
    expect(live).toHaveBeenCalledTimes(1);
  });
});
