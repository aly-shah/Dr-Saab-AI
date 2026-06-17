// Central plan/tier model — three plans per the signed proposal:
//   Starter (free) · Consistency Coach (paid) · Executive Coach (premium)
//
// The MVP shipped with two legacy slugs ('free' | 'consistency_builder').
// We keep reading those but normalize everything to the canonical slugs
// below so old rows and new rows behave the same.

export const TIERS = {
  free: { slug: "free", rank: 0, nameKey: "plan_free" },
  consistency: { slug: "consistency", rank: 1, nameKey: "plan_consistency" },
  executive: { slug: "executive", rank: 2, nameKey: "plan_executive" },
};

// Map any historical / shorthand value to a canonical slug.
const ALIASES = {
  free: "free",
  starter: "free",
  consistency: "consistency",
  consistency_builder: "consistency", // legacy MVP slug
  consistency_coach: "consistency",
  paid: "consistency",
  executive: "executive",
  executive_coach: "executive",
  premium: "executive",
};

export function normalizeTier(value) {
  const key = String(value || "free").trim().toLowerCase();
  return ALIASES[key] || "free";
}

export function tierRank(value) {
  return TIERS[normalizeTier(value)]?.rank ?? 0;
}

// Does the user meet at least `minSlug`? e.g. hasTier(user, "consistency").
export function hasTier(user, minSlug) {
  return tierRank(user?.tier) >= tierRank(minSlug);
}

// Convenience predicates used across the flows.
export const isPaid = (user) => hasTier(user, "consistency"); // Consistency Coach or above
export const isExecutive = (user) => hasTier(user, "executive");
