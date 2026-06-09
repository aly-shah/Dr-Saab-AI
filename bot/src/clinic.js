// Pure clinical formulas — no AI, no external calls.

// Estimated HbA1c (%) from average glucose (mg/dL). ADAG/eAG formula.
export function estHbA1c(avgMgdl) {
  if (avgMgdl == null || Number.isNaN(Number(avgMgdl))) return null;
  return Math.round(((Number(avgMgdl) + 46.7) / 28.7) * 10) / 10;
}

// Body Mass Index (kg/m²)
export function bmi(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const m = Number(heightCm) / 100;
  if (!m) return null;
  return Math.round((Number(weightKg) / (m * m)) * 10) / 10;
}

export function bmiCategory(value) {
  if (value == null) return null;
  if (value < 18.5) return "underweight";
  if (value < 25) return "healthy";
  if (value < 30) return "overweight";
  return "obese";
}
