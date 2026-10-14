import { describe, it, expect } from "vitest";
import { providerRegistry } from "../providers/registry";

describe("ProviderRegistry", () => {
  it("routes Indian equity symbols (.NS) to yfinance", () => {
    const provider = providerRegistry.getProvider("RELIANCE.NS");
    expect(provider.name).toBe("yfinance");
  });

  it("routes Indian BSE symbols (.BO) to yfinance", () => {
    const provider = providerRegistry.getProvider("TCS.BO");
    expect(provider.name).toBe("yfinance");
  });

  it("routes index symbols (^) to yfinance", () => {
    const provider = providerRegistry.getProvider("^NSEI");
    expect(provider.name).toBe("yfinance");
  });

  it("getAllProviders returns registered providers", () => {
    const providers = providerRegistry.getAllProviders();
    expect(providers.length).toBeGreaterThan(0);
  });
});
