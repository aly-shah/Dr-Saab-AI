// Background profile question bank (proposal §3.6): 12 areas, ~60 questions.
// The bot drips ONE of these into normal conversation now and then instead of
// asking everything at signup. Answers are stored on users.profile_answers
// (jsonb) keyed by `key`. Questions are asked in array order; the first key
// not present in profile_answers is the next one to ask.

export const PROFILE_QUESTIONS = [
  // 1. Body & health
  { area: "body_health", key: "bh_target_weight", q: "What's your target weight (kg), if you have one?" },
  { area: "body_health", key: "bh_waist", q: "Roughly what's your waist size (inches)?" },
  { area: "body_health", key: "bh_bp", q: "Do you know your usual blood pressure? (e.g. 130/85, or 'not sure')" },
  { area: "body_health", key: "bh_activity", q: "How active are you most days — low, moderate, or high?" },
  { area: "body_health", key: "bh_sleep", q: "How many hours do you usually sleep at night?" },

  // 2. Daily life
  { area: "daily_life", key: "dl_job", q: "What kind of work do you do?" },
  { area: "daily_life", key: "dl_worktype", q: "Is your day mostly sitting (desk), on your feet (active), or shift work?" },
  { area: "daily_life", key: "dl_commute", q: "How do you usually get around — walk, bike, car, or public transport?" },
  { area: "daily_life", key: "dl_freetime", q: "When do you get a little free time in your day?" },
  { area: "daily_life", key: "dl_stress", q: "How stressful is your daily life — low, medium, or high?" },

  // 3. Family
  { area: "family", key: "fm_marital", q: "Are you married, single, or prefer not to say?" },
  { area: "family", key: "fm_children", q: "Do you have children? If so, how many?" },
  { area: "family", key: "fm_caregiver", q: "Do you care for anyone else's health at home?" },
  { area: "family", key: "fm_history", q: "Does diabetes run in your family?" },
  { area: "family", key: "fm_cooking", q: "Who usually cooks at home?" },

  // 4. Motivation & coaching style
  { area: "motivation", key: "mo_driver", q: "What keeps you going when it's hard — family, health, faith, or something else?" },
  { area: "motivation", key: "mo_style", q: "Do you prefer gentle encouragement or firm, direct coaching?" },
  { area: "motivation", key: "mo_reminders", q: "How often would you like reminders — daily, a few times a week, or rarely?" },
  { area: "motivation", key: "mo_reward", q: "What feels like a win to you — streaks, numbers improving, or kind words?" },
  { area: "motivation", key: "mo_accountability", q: "Would you like someone (family/doctor) to see your progress?" },

  // 5. Faith & values
  { area: "faith_values", key: "fv_faith_importance", q: "How important is faith in your daily routine — very, somewhat, or not much?" },
  { area: "faith_values", key: "fv_fasting", q: "Do you fast (Ramadan or otherwise)?" },
  { area: "faith_values", key: "fv_prayer", q: "Does your day follow prayer times?" },
  { area: "faith_values", key: "fv_diet_restrictions", q: "Any dietary restrictions I should respect (halal, vegetarian, etc.)?" },
  { area: "faith_values", key: "fv_ramadan_plan", q: "During Ramadan, would you like fasting-friendly diabetes tips?" },

  // 6. Diabetes habits & weak spots
  { area: "diabetes_habits", key: "dh_check_freq", q: "How often do you check your sugar in a normal week?" },
  { area: "diabetes_habits", key: "dh_missed_meds", q: "How often do you miss a dose of your medicine — never, sometimes, or often?" },
  { area: "diabetes_habits", key: "dh_foot_care", q: "Do you check your feet for cuts or numbness?" },
  { area: "diabetes_habits", key: "dh_eye_check", q: "When did you last have an eye check-up?" },
  { area: "diabetes_habits", key: "dh_weak_spot", q: "What's your biggest weak spot — diet, exercise, meds, or stress?" },

  // 7. Food & eating habits
  { area: "food_eating", key: "fe_meals", q: "How many meals do you usually eat in a day?" },
  { area: "food_eating", key: "fe_eating_out", q: "How often do you eat out or order food in a week?" },
  { area: "food_eating", key: "fe_sugary_drinks", q: "Do you drink sugary drinks or sweet chai? How often?" },
  { area: "food_eating", key: "fe_carb_portion", q: "Roughly how much roti/rice do you eat at a typical meal?" },
  { area: "food_eating", key: "fe_snacking", q: "Do you snack between meals? On what?" },

  // 8. Comfort with phones & apps
  { area: "phone_comfort", key: "pc_smartphone", q: "How comfortable are you with smartphones — very, okay, or a little?" },
  { area: "phone_comfort", key: "pc_apps", q: "Do you use health or fitness apps already?" },
  { area: "phone_comfort", key: "pc_voice_text", q: "Do you prefer typing or voice notes?" },
  { area: "phone_comfort", key: "pc_data", q: "Is mobile data ever a problem for you?" },
  { area: "phone_comfort", key: "pc_typing_lang", q: "Which do you type most easily — English, Urdu, or Roman Urdu?" },

  // 9. Doctor & clinic
  { area: "doctor_clinic", key: "dc_has_doctor", q: "Do you have a regular doctor for your diabetes?" },
  { area: "doctor_clinic", key: "dc_clinic", q: "Which clinic or hospital do you usually go to?" },
  { area: "doctor_clinic", key: "dc_last_visit", q: "When did you last see your doctor?" },
  { area: "doctor_clinic", key: "dc_follows_plan", q: "Did your doctor give you a plan you're following?" },
  { area: "doctor_clinic", key: "dc_specialist", q: "Do you see a diabetes specialist (endocrinologist)?" },

  // 10. Where they buy medicines
  { area: "medicine_buying", key: "mb_where", q: "Where do you usually buy your medicines?" },
  { area: "medicine_buying", key: "mb_cost", q: "Roughly what do your diabetes medicines cost per month?" },
  { area: "medicine_buying", key: "mb_insurance", q: "Do you have any health insurance or coverage?" },
  { area: "medicine_buying", key: "mb_generic", q: "Do you use generic or brand-name medicines?" },
  { area: "medicine_buying", key: "mb_distance", q: "How far is your pharmacy from home?" },

  // 11. Where they get health info
  { area: "health_info", key: "hi_source", q: "Where do you usually get health information?" },
  { area: "health_info", key: "hi_trust", q: "Who do you trust most for health advice?" },
  { area: "health_info", key: "hi_lang", q: "Which language do you prefer for health information?" },
  { area: "health_info", key: "hi_format", q: "Do you prefer short videos, voice notes, or text?" },
  { area: "health_info", key: "hi_social", q: "Do you follow any health pages on social media?" },

  // 12. Willingness to pay, employer, referrals
  { area: "willingness_pay", key: "wp_willing", q: "Would you consider a small monthly fee for deeper coaching?" },
  { area: "willingness_pay", key: "wp_employer", q: "Does your employer offer any health benefits?" },
  { area: "willingness_pay", key: "wp_who_pays", q: "Who usually pays for your healthcare — you, family, or employer?" },
  { area: "willingness_pay", key: "wp_referral", q: "Would you refer a friend or family member to DrSaab?" },
  { area: "willingness_pay", key: "wp_premium_interest", q: "Would doctor reviews or live coaching interest you?" },
];

// The next unanswered question for a user, or null if the profile is complete.
export function nextProfileQuestion(user) {
  const answered = user?.profile_answers || {};
  return PROFILE_QUESTIONS.find((q) => !(q.key in answered)) || null;
}
