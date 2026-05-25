import type { IndexedDomainSignal, LookalikeSignal } from "./similarity";
import type { ProviderSignal } from "./providers";

export type Verdict = "clean" | "suspicious" | "dangerous";

export type SafetySignals = {
  indexedDomain: IndexedDomainSignal | null;
  lookalike: LookalikeSignal | null;
  googleSafeBrowsing: ProviderSignal | null;
  virusTotal: ProviderSignal | null;
  domainRecord?: {
    domain: string;
    status: "verified" | "watchlist" | "blocked";
    reason: string;
    updatedAt: number;
  } | null;
  cache: boolean;
};

export type SafetyResult = {
  verdict: Verdict;
  url: string;
  reasons: string[];
  signals: SafetySignals;
};

export function combineVerdict(url: string, signals: SafetySignals): SafetyResult {
  const providerSignals = [
    signals.googleSafeBrowsing,
    signals.virusTotal,
  ].filter((signal): signal is ProviderSignal => signal !== null);

  const reasons = new Set<string>();
  for (const signal of providerSignals) {
    if (signal.status === "dangerous" || signal.status === "suspicious") {
      for (const reason of signal.reasons) {
        reasons.add(reason);
      }
    }
  }

  if (signals.lookalike) {
    for (const reason of signals.lookalike.reasons) {
      reasons.add(`${signals.lookalike.candidateDomain}: ${reason}`);
    }
  }

  if (signals.indexedDomain?.status === "indexed") {
    for (const reason of signals.indexedDomain.reasons) {
      reasons.add(reason);
    }
  }

  let verdict: Verdict = "clean";
  if (providerSignals.some((signal) => signal.status === "dangerous")) {
    verdict = "dangerous";
  } else if (
    providerSignals.some((signal) => signal.status === "suspicious") ||
    signals.lookalike !== null
  ) {
    verdict = "suspicious";
  }

  return {
    verdict,
    url,
    reasons:
      reasons.size > 0
        ? [...reasons]
        : ["No known safety warnings were found."],
    signals,
  };
}
