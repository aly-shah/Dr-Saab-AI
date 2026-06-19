// Profile helpers — single source of truth for the Build 1 profile axes.
// We keep facts orthogonal in the DB (diabetes_status × age_bracket ×
// newly_diagnosed) and *derive* the human-readable profile from them so we
// can add or remove modifiers without migrating data.

export function isType1(user) {
  return user?.diabetes_status === "type1";
}
export function isType2(user) {
  return user?.diabetes_status === "type2";
}
export function isGestational(user) {
  return user?.diabetes_status === "gestational";
}
export function isChild(user) {
  return user?.age_bracket === "child";
}
export function isTeen(user) {
  return user?.age_bracket === "teen";
}
export function isAdult(user) {
  return user?.age_bracket === "adult";
}
export function isNewlyDiagnosed(user) {
  return !!user?.newly_diagnosed;
}

// Human-readable profile name, used in coaching prompts and the Plan view.
// Combines facts into the labels from the Build 1 spec.
export function profileLabel(user) {
  const parts = [];
  if (isNewlyDiagnosed(user)) parts.push("Newly Diagnosed");
  if (isChild(user) || isTeen(user)) {
    parts.push("Child/Teen with Diabetes");
  } else if (isGestational(user)) {
    parts.push("Gestational Diabetes");
  } else if (isType1(user)) {
    parts.push("Adult Type 1 Diabetes");
  } else if (isType2(user)) {
    parts.push("Adult Type 2 Diabetes");
  }
  return parts.join(" · ") || "Diabetes Coaching";
}

// Capability flags — which profile-specific add-ons should we surface.
// Today these only influence coaching prompts (Profile labels only path per
// Build 1 decision). Future builds can use them to gate new menus.
export function capabilities(user) {
  return {
    insulin_tracking: isType1(user) || isChild(user) || isTeen(user),
    hypoglycemia_support: isType1(user) || isChild(user) || isTeen(user),
    school_considerations: isChild(user) || isTeen(user),
    pregnancy_support: isGestational(user),
    basics_education: isNewlyDiagnosed(user),
  };
}
