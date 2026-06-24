// Minimal i18n. t(lang, key, vars) with fallback to English.
// AI-generated replies are localized by the model; these are the fixed UI strings.

const STR = {
  en: {
    choose_language: "👋 Welcome to *DrSaab AI* — your diabetes coach.\n\nPlease choose your language:",
    language_set: "Great! Let's set up your profile. You can type /cancel anytime.",
    ask_name: "What's your *name*?",
    ask_age: "How old are you? (years)",
    ask_gender: "What's your gender?",
    ask_city: "Which *city* do you live in?",
    ask_height: "Your *height* in centimeters? (e.g. 170)",
    ask_weight: "Your *weight* in kilograms? (e.g. 78)",
    ask_diabetes: "What's your diabetes status?",
    ask_goals: "What are your main *health goals*? (e.g. lower my sugar, lose weight)",
    ask_meds: "List your current *medications* (or type \"none\").",
    ask_doctor_code: "Optional: enter a *doctor referral code*, or tap Skip.",
    ask_challenge_code: "Optional: enter a *challenge code*, or tap Skip.",
    ask_team_code: "Optional: enter a *team code*, or tap Skip.",
    invalid_number: "Please send a valid number 🙏",
    onboarding_done:
      "✅ All set, *{name}*! Your profile is ready.\n\nUse the menu below anytime. Stay consistent — I'm with you every day. 💚",
    welcome_back: "👋 Welcome back, *{name}*! What would you like to do?",
    menu_title: "📋 *Main Menu* — choose an option:",
    // menu buttons
    btn_glucose: "🩸 Log Glucose",
    btn_medication: "💊 Medications",
    btn_health: "📝 Daily Check-in",
    btn_coach: "🤖 AI Coach",
    btn_food: "🥗 Food Coach",
    btn_fitness: "🏃 Fitness Coach",
    btn_progress: "📈 My Progress",
    btn_summary: "🗓 Weekly Summary",
    btn_lab: "🧪 Explain Lab Report",
    btn_learn: "📚 Learn",
    btn_profile: "⚙️ Profile",
    btn_subscription: "💎 Subscription",
    btn_menu: "📋 Menu",
    btn_back: "⬅️ Back to Menu",
    btn_skip: "Skip ⏭",
    // gender / status
    g_male: "Male",
    g_female: "Female",
    g_other: "Other",
    ds_type1: "Type 1",
    ds_type2: "Type 2",
    ds_prediabetes: "Prediabetes",
    ds_gestational: "Gestational",
    ds_atrisk: "At risk",
    ds_notsure: "Not sure",
    // glucose
    glucose_prompt:
      "🩸 Send your blood sugar reading in *mg/dL* (e.g. `130`).\nYou can add context like `130 fasting` or `180 post meal`.",
    glucose_saved: "✅ Logged *{value} mg/dL* ({context}). {feedback}\n🔥 Streak: {streak} day(s)",
    glucose_low: "That's on the *low* side — have a quick snack and recheck. If you feel unwell, seek help. ⚠️",
    glucose_normal: "Nice — that's in a healthy range. Keep it up! 💪",
    glucose_high: "That's a bit *high*. Water, a short walk and a light meal can help. Watch the trend. 📈",
    glucose_vhigh: "That's *very high*. Please follow your doctor's plan and seek care if you feel unwell. ⚠️",
    // medication
    medication_prompt:
      "💊 Which medication did you take? Send the *name* (and dose if you like), e.g. `Metformin 500mg`.",
    medication_saved: "✅ Logged: *{name}*. Well done staying on track! 🔥 Streak: {streak} day(s)",
    // health check-in
    health_prompt:
      "📝 Daily check-in. Send any of: weight (kg), steps, mood, sleep (hrs), water (glasses).\nExample: `weight 78, steps 6000, mood good, sleep 7, water 6`",
    health_saved: "✅ Check-in saved. 🔥 Streak: {streak} day(s)",
    health_none: "I couldn't read any values. Try: `weight 78, steps 6000, mood good`",
    // coaches
    coach_prompt:
      "🤖 *AI Coach* is here. Ask me anything about managing your diabetes, habits or motivation.\n_Tap Back to Menu when done._",
    food_prompt:
      "🥗 *Food Coach*. Describe your meal or *send a photo of your plate* and I'll estimate carbs and suggest swaps.\n_Tap Back to Menu when done._",
    fitness_prompt:
      "🏃 *Fitness Coach*. Tell me your day or energy level and I'll suggest safe movement.\n_Tap Back to Menu when done._",
    lab_prompt:
      "🧪 *Explain Lab Report*. Paste your lab values as text *or send a photo* of the report and I'll explain it simply.\n_Tap Back to Menu when done._",
    thinking: "✍️ Thinking…",
    // progress / summary
    progress_title: "📈 *Your Progress*",
    progress_body:
      "🔥 Streak: *{streak}* day(s)\n⚖️ Weight: *{weight}*\n🩸 Recent readings:\n{readings}",
    no_readings: "No glucose readings yet — log one from the menu!",
    summary_generating: "🗓 Building your weekly summary…",
    no_data_week: "Not enough data this week yet. Log a few readings and check back! 📥",
    // misc
    profile_title:
      "⚙️ *Your Profile*\n\nName: {name}\nAge: {age}\nGender: {gender}\nCity: {city}\nDiabetes: {diabetes}\nGoals: {goals}\nPlan: *{tier}*\nLanguage: {language}",
    change_language: "🌐 Change language",
    subscription_info:
      "💎 *Subscription*\n\n*Free*: tracking, education, generic reminders, basic summaries.\n\n*Consistency Builder — Rs 499/mo*: AI Coach, Food Coach, Fitness Coach, lab analysis, personalized reminders & detailed reports.\n\nYour plan: *{tier}*",
    premium_required:
      "💎 This is a *Consistency Builder* feature.\nUpgrade to unlock the AI Coach, Food & Fitness coaches and lab analysis.",
    cancelled: "Cancelled. Back to the menu. 📋",
    error_generic: "😕 Something went wrong. Please try again in a moment.",
    disclaimer:
      "_DrSaab gives general guidance and is not a substitute for professional medical advice._",
    reminder_daily: "Good morning! Time to log your fasting blood sugar. Just send your reading, e.g. 130.",
    reminder_streak: "You're on a {streak}-day streak! Log a reading today to keep it going.",
    reminder_winback: "We've missed you at Dr Saab AI. A quick sugar check or a short walk today keeps you on track.",
    summary_push:
      "*Your weekly health summary*\n\nReadings logged: {count}\nAverage sugar: {avg} mg/dL (range {min}-{max})\nEstimated HbA1c: {hba1c}%\nCurrent streak: {streak} day(s)\n\nKeep it up — small steps every day add up.",
    clinic_hba1c: "Est. HbA1c",
    clinic_bmi: "BMI",

    // ===== v2 onboarding journey (DrSaab MVP) =====
    welcome_eng:
      "Assalamualaikum and welcome to *DrSaab* — your AI Coach for Diabetes.\n\nI can help you understand your diabetes, build healthier habits, stay consistent, and improve your long-term health.\n\nFor اردو messaging, please select Urdu below.\nAur WhatsApp wali Urdu mein baat karnay ke liye, WhatsApp Urdu ka option use karain.",
    welcome_salaam:
      "Walaikumussalam and welcome to *DrSaab* — your AI Coach for Diabetes.\n\nI can help you understand your diabetes, build healthier habits, stay consistent, and improve your long-term health.\n\nFor اردو messaging, please select Urdu below.\nAur WhatsApp wali Urdu mein baat karnay ke liye, WhatsApp Urdu ka option use karain.",
    welcome_urdu_intent:
      "وعلیکم السلام اور ڈاکٹر صاحب میں خوش آمدید۔\nمیں آپ کو ذیابیطس کو بہتر سمجھنے، صحت مند عادات بنانے، مستقل مزاج رہنے اور اپنی صحت بہتر بنانے میں مدد دوں گا۔\n\nEnglish mein baat karne ke liye English select karein.\nWhatsapp wali Urdu mein baat karne ke liye WhatsApp Urdu select karein.",
    btn_lang_english: "English",
    btn_lang_urdu: "اردو",
    btn_lang_whatsapp_urdu: "WhatsApp Urdu",

    ask_name_v2: "Before we begin, what's your name?",
    name_ack:
      "Nice to meet you, *{name}* 👋\nLet's build your profile so I can personalize my coaching for you.",
    ask_user_type: "Which best describes you?",
    ut_diabetes: "I have diabetes",
    ut_prediabetes: "I have prediabetes",
    ut_notsure: "Build healthier habits",
    ut_parent: "I'm a parent/family member",
    ut_exploring: "Just exploring",

    ask_age_v2: "Ok great. Let's begin. When is your birthday?\nPlease share day, month and year (e.g. 12 March 1985).",
    ask_dob_missing:
      "I just need a complete birthday — please send the missing *{missing}* (e.g. 12 March 1985).",
    btn_multi_done: "Done",
    multi_select_hint: "_Tap multiple options, then press Done._",
    g_prefer_not: "Prefer not to say",
    ask_city_v2: "Which city do you live in?",

    ask_diabetes_type: "Do you know which type you have?",
    dt_type1: "Type 1 Diabetes",
    dt_type2: "Type 2 Diabetes",
    dt_prediabetes: "Prediabetes",
    dt_gestational: "Gestational Diabetes",
    dt_notsure: "Not Sure",

    ask_diagnosis_duration: "When were you first diagnosed?",
    dh_lt1: "Less than 1 year ago",
    dh_1_5: "1–5 years ago",
    dh_6_10: "6–10 years ago",
    dh_gt10: "More than 10 years ago",
    dh_notsure: "Not sure",

    ask_hba1c_known: "Do you know your latest HbA1c result?",
    ask_hba1c_value: "What was the HbA1c value?\nExample: 7.2%",
    ask_hba1c_date: "Approximately when was this test done?",
    hd_1m: "Within 1 month",
    hd_1_3: "1–3 months ago",
    hd_3_6: "3–6 months ago",
    hd_gt6: "More than 6 months ago",

    ask_sugar_known: "Do you know any recent blood sugar readings?",
    ask_fasting_value:
      "What's your latest *fasting* blood sugar reading?\nExample: 105\nOr type Skip.",
    ask_fasting_date: "When was this reading taken?",
    ask_random_value:
      "What's your latest *random* blood sugar reading?\nExample: 180\nOr type Skip.",
    ask_random_date: "When was this reading taken?",
    rd_today: "Today",
    rd_week: "This Week",
    rd_month: "This Month",
    rd_notremember: "Don't Remember",

    ask_diab_meds_known: "Are you taking any medicines for diabetes?",
    ask_diab_med_entry:
      "Please type the medicine *name, dose and how often* you take it.\nExamples:\n• Metformin 500mg twice daily\n• Tagipmet XR 50/500 twice daily",
    ask_diab_meds_more: "Any other diabetes medicines?",
    btn_add_another: "Add Another",
    btn_no_more: "No More",

    ask_other_conditions_known: "Do you have any other medical conditions?",
    ask_other_conditions_details:
      "Please tell me the condition(s).\nExamples:\n• High Blood Pressure\n• High Cholesterol\n• Heart Disease\n• Thyroid Disease\n• Depression\n• Anxiety",
    ask_other_meds_known: "Do you take any medicines for these conditions?",
    ask_other_med_entry: "Please type the medicine *name, dose and frequency*.",
    ask_other_meds_more_prompt: "Any other medicines for these conditions?",

    ask_monitoring_habit: "Do you check your blood sugar at home?",
    mh_regularly: "Regularly",
    mh_sometimes: "Sometimes",
    mh_rarely: "Rarely",
    mh_never: "Never",
    ask_monitoring_device: "What do you use?",
    md_glucometer: "Glucometer",
    md_cgm: "CGM Sensor",
    md_both: "Both",

    ask_primary_goal: "What would you most like help with right now?",
    pg_lower_a1c: "Lower my HbA1c",
    pg_lose_weight: "Lose weight",
    pg_eat_healthy: "Eat healthier",
    pg_exercise: "Exercise regularly",
    pg_consistent: "Stay consistent",
    pg_understand: "Understand diabetes better",

    ask_primary_challenge: "What's the biggest thing holding you back?",
    ch_diet: "Diet",
    ch_exercise: "Exercise",
    ch_motivation: "Motivation",
    ch_meds: "Medication Routine",
    ch_stress: "Stress",
    ch_time: "Time",
    ch_understand: "Understanding Diabetes",

    ask_motivation_driver: "What motivates you the most?",
    mt_family: "My Family",
    mt_health: "Better Health",
    mt_longer: "Living Longer",
    mt_complications: "Avoiding Complications",
    mt_looking: "Looking & Feeling Better",
    mt_faith: "My Faith",

    profile_complete_v2:
      "Perfect, *{name}* ✅\nYour profile is ready.\nI'll use this information to personalize your coaching, reminders, education and progress tracking.\n\nLet's start building healthier habits together.",
    disclaimer_v2:
      "*Before we continue:*\n\nDrSaab provides educational information and coaching support. It does not replace medical advice, diagnosis or treatment from a qualified healthcare professional.\n\nIf you experience severe symptoms such as chest pain, fainting, confusion, severe weakness, very high blood sugar, very low blood sugar, or any medical emergency, please seek immediate medical attention.",
    btn_understand: "I Understand",

    btn_yes: "Yes",
    btn_no: "No",

    // ---- Plans / tiers (3-plan model) ----
    plan_free: "Starter (Free)",
    plan_consistency: "Consistency Coach",
    plan_executive: "Executive Coach",
    btn_view_plans: "View Plans",
    btn_maybe_later: "Maybe Later",
    btn_upgrade: "💎 Upgrade",
    upgrade_intro:
      "💎 *DrSaab Plans*\n\n*Starter (Free)* — daily check-ins, sugar & medicine logging, food logging, basic Ask DrSaab, a few lab explanations, goals, free challenges and the Learn library.\n\n*Consistency Coach* — everything in Starter, plus full Ask DrSaab, more lab explanations, My Progress with the four scores, weekly & monthly reports, a doctor-friendly report, smart reminders and all challenges.\n\n*Executive Coach* — everything in Consistency Coach, plus doctor case reviews, live coach sessions, a 3-monthly executive review, priority help and premium content.\n\nYour plan: *{plan}*",

    // ---- common commands ----
    help_text:
      "🤖 *DrSaab Help*\n\nYou can just chat with me, or use these:\n• *Menu / Home* — open the main menu\n• *Back* — go back\n• *Cancel* — stop the current step\n• *Upgrade* — see plans\n• *Help* — show this message\n\nTry logging a sugar reading (e.g. `130 fasting`), ask me a question, or tap a menu option.",

    // ---- menu buttons (new features) ----
    btn_goals: "🎯 My Goals",
    btn_challenges: "🏆 Challenges",
    btn_reports: "📑 Reports",
    btn_executive: "⭐ Executive Services",

    // ---- Goals ----
    goals_title: "🎯 *My Goals*",
    goals_current: "Your current goal: *{goal}*",
    goals_none: "You haven't set a goal yet.",
    goals_prompt: "Send your main health goal in a sentence (e.g. *lower my HbA1c below 7*), or tap Back.",
    goals_saved: "✅ Goal saved: *{goal}*\nI'll keep this in mind while coaching you.",
    btn_set_goal: "✏️ Set / change goal",

    // ---- Scores (4-score system) ----
    scores_title: "📊 *Your Scores* (out of 100)",
    scores_body:
      "🔥 Consistency: *{consistency}*\n💪 Motivation: *{motivation}*\n🩺 Risk: *{risk}*\n💬 Engagement: *{engagement}*",
    score_consistency: "Consistency",
    score_motivation: "Motivation",
    score_risk: "Risk",
    score_engagement: "Engagement",

    // ---- Reports ----
    reports_title: "📑 *Reports*",
    reports_intro: "Choose a report. You can share these with your doctor.",
    btn_report_weekly: "🗓 Weekly summary",
    btn_report_monthly: "📅 Monthly report",
    btn_report_doctor: "🩺 Doctor report",
    report_monthly_generating: "📅 Building your monthly report…",
    no_data_month: "Not enough data this month yet. Keep logging and check back!",
    doctor_report_title: "🩺 *Doctor Report* — {name}",
    doctor_report_body:
      "Period: last 30 days\nDiabetes: {diabetes}\nLatest HbA1c (self-reported): {hba1c}\nEst. HbA1c (from logs): {est_hba1c}\nBMI: {bmi}\n\nGlucose readings: {gcount}\nAverage: {gavg} mg/dL  (min {gmin} / max {gmax})\nIn-range readings: {ginrange}%\nMedication logs: {mcount}\nCheck-ins: {hcount}\nCurrent streak: {streak} day(s)\n\n_Self-reported data from DrSaab. Educational use; not a diagnosis._",

    // ---- Challenges ----
    challenges_title: "🏆 *Challenges*",
    challenges_intro: "Join a challenge to stay motivated. Tap one to join.",
    chl_a1c: "90-Day HbA1c Challenge",
    chl_weight: "Weight Loss Challenge",
    chl_walking: "Walking Challenge",
    chl_consistency: "Consistency Challenge",
    chl_ramadan: "Ramadan Health Challenge",
    chl_doctor: "Doctor Challenge (needs code)",
    chl_corporate: "Corporate Challenge (needs code)",
    challenge_joined: "✅ You've joined the *{name}*. Keep logging daily — I'll track your progress.",
    challenge_code_prompt: "Enter the code for *{name}* (from your doctor or company), or tap Back.",
    challenge_already: "You're already in the *{name}*.",
    my_challenges_title: "Your active challenges:",
    my_challenges_none: "You haven't joined any challenge yet.",
    btn_my_challenges: "📋 My challenges",

    // ---- Executive Services ----
    exec_title: "⭐ *Executive Services*",
    exec_intro: "High-touch support for Executive Coach members. Choose a service and our team will follow up.",
    btn_exec_doctor: "🩺 Request a doctor review",
    btn_exec_session: "📞 Book a live coach session",
    btn_exec_review: "📈 Executive progress review",
    btn_exec_priority: "⚡ Priority help",
    btn_exec_content: "📚 Premium content",
    exec_requested: "✅ Request received: *{service}*. Our team will reach out to you. (Ref #{ref})",
    executive_required:
      "⭐ *Executive Coach* feature.\nUpgrade to Executive Coach for doctor reviews, live coach sessions, priority help and premium content.",

    // ---- Background profile builder ----
    profileq_intro: "Quick question to personalize your coaching (tap Skip to pass):",
    profileq_saved: "Thanks — noted. 👍",
    profileq_done: "Your background profile is complete. Thank you!",

    // ===== Build 1: new menu hierarchy =====
    menu_v2_title: "👋 What would you like help with today?",
    btn_checkin: "🩺 Check In",
    btn_foodhelp: "🍽️ Food Help",
    btn_checkreport: "📋 Check My Report",
    btn_myprogress: "📈 My Progress",
    btn_askdrsaab: "💬 Ask DrSaab",
    btn_more: "⚙️ More",
    btn_main_menu: "🏠 Main Menu",

    // Check In submenu
    checkin_title: "🩺 *Check In* — what would you like to log?",
    btn_ci_bloodsugar: "🩸 Blood Sugar",
    btn_ci_medication: "💊 Medication",
    btn_ci_weight: "⚖️ Weight",
    btn_ci_activity: "🚶 Physical Activity",
    btn_ci_symptoms: "🤒 Symptoms",

    // Food Help submenu
    foodhelp_title: "🍽️ *Food Help* — how can I help?",
    btn_fh_analyze: "📸 Analyze My Meal",
    btn_fh_caneat: "🥗 What Can I Eat?",
    btn_fh_restaurant: "🍔 Restaurant Guidance",
    btn_fh_snacks: "🥜 Healthy Snack Ideas",

    // My Progress submenu
    progress_menu_title: "📈 *My Progress* — choose a view:",
    btn_mp_weekly: "📅 Weekly Summary",
    btn_mp_monthly: "📆 Monthly Summary",
    btn_mp_trends: "📊 Health Trends",
    btn_mp_recent: "📝 Recent Activity",

    // More submenu (keeps Challenges/Goals/Executive reachable)
    more_title: "⚙️ *More*",
    btn_more_reminders: "⏰ Reminders",
    btn_more_language: "🌐 Language",
    btn_more_plan: "⭐ My Plan",
    btn_more_subscription: "💳 Subscription",
    btn_more_support: "🛟 Contact Support",
    btn_more_goals: "🎯 Goals",
    btn_more_challenges: "🏆 Challenges",
    btn_more_executive: "⭐ Executive Services",

    // Profile labels (derived)
    profile_t1: "Type 1 Diabetes",
    profile_t2: "Type 2 Diabetes",
    profile_child: "Child / Teen with Diabetes",
    profile_gestational: "Gestational Diabetes",
    profile_newly: "Newly Diagnosed",

    // Ask DrSaab entry
    askdrsaab_prompt:
      "💬 *Ask DrSaab.* Ask me anything — your diabetes, food, fitness, lab results or just how you're feeling.\n_Tap Back when you're done._",

    // Food Help seeded prompts
    foodhelp_analyze_prompt:
      "📸 Send a photo of your plate (or describe the meal in text) and I'll estimate carbs and suggest swaps.",
    foodhelp_caneat_prompt:
      "🥗 Tell me what's around — a meal, ingredients in the fridge, or a craving — and I'll guide you to diabetes-friendly choices.",
    foodhelp_restaurant_prompt:
      "🍔 Where are you eating? Share the restaurant name or the menu options and I'll suggest the best choices.",
    foodhelp_snacks_prompt:
      "🥜 What kind of snack are you in the mood for — sweet, savory, on-the-go? I'll give you a few healthy ideas.",

    // Blood sugar — reminder offer after first log
    bs_offer_reminder: "Would you like a reminder to check your blood sugar?",
    bs_reminder_pick_time: "Great. What time of day works best? Send 24-hour time, e.g. *08:00* (or type Skip).",
    bs_reminder_pick_freq: "How often?",
    btn_freq_daily: "Daily",
    btn_freq_3x_week: "3 times a week",
    btn_freq_weekly: "Weekly",
    bs_reminder_saved: "✅ Reminder saved. I'll check in at *{time}* ({freq}).",
    bs_reminder_skipped: "No reminder set. You can enable one anytime under More → Reminders.",

    // Medication — full conversational flow
    med_ask_name: "💊 What's the medication? Send the *name and dose*, e.g. `Metformin 500mg` or `Tagipmet XR 50/500`.",
    med_existing_logged: "✅ Logged *{name}*. Well done! 🔥 Streak: {streak} day(s)",
    med_is_new_q: "It looks like this is your first time logging *{name}*. Add it to your medication list?",
    med_ask_frequency: "How often do you take *{name}*?",
    btn_med_freq_once: "Once Daily",
    btn_med_freq_morn_eve: "Morning & Evening",
    btn_med_freq_three: "Three Times Daily",
    btn_med_freq_other: "Other",
    med_other_freq: "How often do you take it? (e.g. *weekly*, *every 2 days*).",
    med_offer_reminder: "Would you like DrSaab to help you stay consistent with *{name}*?",
    med_reminder_pick_time: "What time should I remind you? Send 24-hour time, e.g. *08:00* (or type Skip).",
    med_added_no_reminder: "✅ *{name}* added to your medications (no reminder).",
    med_added_with_reminder: "✅ *{name}* added with a reminder at *{time}*.",

    // Weight
    weight_prompt: "⚖️ Send your weight in *kg*, e.g. `72.5 kg` or just `72.5`.",
    weight_saved: "✅ Weight logged: *{value} kg*.\n🔥 Streak: {streak} day(s)",
    weight_offer_monthly: "Would you like a monthly reminder to weigh yourself?",
    weight_monthly_saved: "✅ Monthly weight reminder set.",

    // Physical activity
    activity_prompt:
      "🚶 What did you do? Examples: `walked 30 minutes`, `gym 45 minutes`, `6500 steps`.",
    activity_saved: "✅ Activity logged.\n🔥 Streak: {streak} day(s)",
    activity_ask_goal: "How many days per week do you think you can realistically stay active?",
    activity_goal_saved: "✅ Goal set: *{days} day(s)/week*. I'll keep this in mind.",

    // Symptoms
    symptoms_prompt:
      "🤒 What symptoms are you noticing? Describe them in your own words (e.g. *headache, dizziness, dry mouth*).",
    symptoms_saved: "✅ Noted. I've added this to your log.",
    symptoms_coach_intro:
      "Here are a few things to consider — but if anything feels severe or worsens, please contact a doctor.",

    // Lab future test reminder
    lab_offer_future_reminder: "Want a reminder for your next HbA1c (in about 3 months)?",
    lab_reminder_saved: "✅ Lab follow-up reminder set for ~3 months from now.",

    // Recent Activity view
    recent_title: "📝 *Recent Activity* — last 7 days",
    recent_none: "No activity in the last 7 days. Log something from the menu!",

    // Reminders management
    reminders_title: "⏰ *Your Reminders*",
    reminders_none: "You don't have any reminders yet. They'll show up here when you set them while logging.",
    reminder_row: "• {label} — {time}, {freq}",
    btn_reminder_cancel: "Cancel {label}",
    reminder_cancelled: "✅ Reminder cancelled.",

    // Plan / support
    plan_title: "⭐ *My Plan*",
    plan_body: "Current plan: *{plan}*\n\nTap Subscription to view or change.",
    support_title: "🛟 *Contact Support*",
    support_body: "Need help? Reach us at support@drsaabcoach.com — we usually reply within 24 hours.",

    // Reminder-firing templates (scheduler)
    reminder_template_glucose: "🩸 Quick check-in: time to log your blood sugar.",
    reminder_template_medication: "💊 Time to take your *{name}*. Tap to log it.",
    reminder_template_weight: "⚖️ Monthly check-in — send your weight today.",
    reminder_template_lab: "🧪 Time for your next HbA1c. Book a test when you can.",
    reminder_template_activity: "🚶 Time to move — how about a short walk today?",
  },

  ur: {
    choose_language: "👋 *DrSaab AI* میں خوش آمدید — آپ کا ذیابیطس کوچ۔\n\nبراہِ کرم اپنی زبان منتخب کریں:",
    language_set: "بہت خوب! آئیے آپ کی پروفائل بناتے ہیں۔ کسی بھی وقت /cancel لکھ سکتے ہیں۔",
    ask_name: "آپ کا *نام* کیا ہے؟",
    ask_age: "آپ کی عمر کتنی ہے؟ (سال)",
    ask_gender: "آپ کی جنس؟",
    ask_city: "آپ کس *شہر* میں رہتے ہیں؟",
    ask_height: "آپ کا *قد* سینٹی میٹر میں؟ (مثلاً 170)",
    ask_weight: "آپ کا *وزن* کلوگرام میں؟ (مثلاً 78)",
    ask_diabetes: "آپ کی ذیابیطس کی کیفیت؟",
    ask_goals: "آپ کے بنیادی *صحت کے اہداف* کیا ہیں؟ (مثلاً شوگر کم کرنا، وزن کم کرنا)",
    ask_meds: "اپنی موجودہ *ادویات* لکھیں (یا \"none\" لکھیں)۔",
    ask_doctor_code: "اختیاری: *ڈاکٹر ریفرل کوڈ* درج کریں، یا Skip دبائیں۔",
    ask_challenge_code: "اختیاری: *چیلنج کوڈ* درج کریں، یا Skip دبائیں۔",
    ask_team_code: "اختیاری: *ٹیم کوڈ* درج کریں، یا Skip دبائیں۔",
    invalid_number: "براہِ کرم درست نمبر بھیجیں 🙏",
    onboarding_done:
      "✅ تیار ہے، *{name}*! آپ کی پروفائل مکمل ہو گئی۔\n\nنیچے دیے مینو کا استعمال کریں۔ ثابت قدم رہیں — میں ہر روز آپ کے ساتھ ہوں۔ 💚",
    welcome_back: "👋 خوش آمدید، *{name}*! آپ کیا کرنا چاہیں گے؟",
    menu_title: "📋 *مرکزی مینو* — ایک آپشن منتخب کریں:",
    btn_glucose: "🩸 شوگر لاگ کریں",
    btn_medication: "💊 ادویات",
    btn_health: "📝 روزانہ چیک اِن",
    btn_coach: "🤖 اے آئی کوچ",
    btn_food: "🥗 فوڈ کوچ",
    btn_fitness: "🏃 فٹنس کوچ",
    btn_progress: "📈 میری پیش رفت",
    btn_summary: "🗓 ہفتہ وار خلاصہ",
    btn_lab: "🧪 لیب رپورٹ سمجھیں",
    btn_learn: "📚 سیکھیں",
    btn_profile: "⚙️ پروفائل",
    btn_subscription: "💎 سبسکرپشن",
    btn_menu: "📋 مینو",
    btn_back: "⬅️ مینو پر واپس",
    btn_skip: "چھوڑیں ⏭",
    g_male: "مرد",
    g_female: "عورت",
    g_other: "دیگر",
    ds_type1: "ٹائپ 1",
    ds_type2: "ٹائپ 2",
    ds_prediabetes: "پری ذیابیطس",
    ds_gestational: "حملاتی",
    ds_atrisk: "خطرے میں",
    ds_notsure: "یقین نہیں",
    glucose_prompt:
      "🩸 اپنی شوگر *mg/dL* میں بھیجیں (مثلاً `130`)۔\nسیاق بھی شامل کر سکتے ہیں جیسے `130 fasting`۔",
    glucose_saved: "✅ لاگ ہو گیا *{value} mg/dL* ({context})۔ {feedback}\n🔥 سلسلہ: {streak} دن",
    glucose_low: "یہ *کم* ہے — کچھ کھائیں اور دوبارہ چیک کریں۔ طبیعت خراب ہو تو مدد لیں۔ ⚠️",
    glucose_normal: "بہت خوب — یہ صحت مند حد میں ہے۔ ایسے ہی جاری رکھیں! 💪",
    glucose_high: "یہ کچھ *زیادہ* ہے۔ پانی، مختصر چہل قدمی اور ہلکا کھانا مددگار ہے۔ 📈",
    glucose_vhigh: "یہ *بہت زیادہ* ہے۔ ڈاکٹر کے مشورے پر عمل کریں اور طبیعت خراب ہو تو فوراً مدد لیں۔ ⚠️",
    medication_prompt:
      "💊 آپ نے کون سی دوا لی؟ *نام* (اور خوراک) بھیجیں، مثلاً `Metformin 500mg`۔",
    medication_saved: "✅ لاگ ہو گیا: *{name}*۔ بہت اچھے! 🔥 سلسلہ: {streak} دن",
    health_prompt:
      "📝 روزانہ چیک اِن۔ بھیجیں: وزن (kg)، قدم، موڈ، نیند (گھنٹے)، پانی (گلاس)۔\nمثال: `weight 78, steps 6000, mood good, sleep 7, water 6`",
    health_saved: "✅ چیک اِن محفوظ ہو گیا۔ 🔥 سلسلہ: {streak} دن",
    health_none: "کوئی قدر سمجھ نہ آئی۔ کوشش کریں: `weight 78, steps 6000, mood good`",
    coach_prompt:
      "🤖 *اے آئی کوچ* حاضر ہے۔ ذیابیطس، عادات یا حوصلہ افزائی کے بارے میں کچھ بھی پوچھیں۔\n_فارغ ہونے پر مینو پر واپس دبائیں۔_",
    food_prompt:
      "🥗 *فوڈ کوچ*۔ اپنا کھانا بتائیں یا *پلیٹ کی تصویر بھیجیں*، میں کاربز کا اندازہ اور بہتر متبادل بتاؤں گا۔\n_مینو پر واپس دبائیں۔_",
    fitness_prompt:
      "🏃 *فٹنس کوچ*۔ اپنا دن یا توانائی بتائیں، میں محفوظ ورزش تجویز کروں گا۔\n_مینو پر واپس دبائیں۔_",
    lab_prompt:
      "🧪 *لیب رپورٹ سمجھیں*۔ اپنی ویلیوز ٹیکسٹ میں بھیجیں *یا تصویر بھیجیں*، میں آسان الفاظ میں سمجھاؤں گا۔\n_مینو پر واپس دبائیں۔_",
    thinking: "✍️ سوچ رہا ہوں…",
    progress_title: "📈 *آپ کی پیش رفت*",
    progress_body:
      "🔥 سلسلہ: *{streak}* دن\n⚖️ وزن: *{weight}*\n🩸 حالیہ ریڈنگز:\n{readings}",
    no_readings: "ابھی کوئی شوگر ریڈنگ نہیں — مینو سے لاگ کریں!",
    summary_generating: "🗓 آپ کا ہفتہ وار خلاصہ بنایا جا رہا ہے…",
    no_data_week: "اس ہفتے ابھی کافی ڈیٹا نہیں۔ کچھ ریڈنگز لاگ کریں اور دوبارہ دیکھیں! 📥",
    profile_title:
      "⚙️ *آپ کی پروفائل*\n\nنام: {name}\nعمر: {age}\nجنس: {gender}\nشہر: {city}\nذیابیطس: {diabetes}\nاہداف: {goals}\nپلان: *{tier}*\nزبان: {language}",
    change_language: "🌐 زبان تبدیل کریں",
    subscription_info:
      "💎 *سبسکرپشن*\n\n*مفت*: ٹریکنگ، تعلیم، عمومی یاد دہانیاں، بنیادی خلاصے۔\n\n*Consistency Builder — Rs 499/ماہ*: اے آئی کوچ، فوڈ کوچ، فٹنس کوچ، لیب تجزیہ، ذاتی یاد دہانیاں اور تفصیلی رپورٹس۔\n\nآپ کا پلان: *{tier}*",
    premium_required:
      "💎 یہ *Consistency Builder* فیچر ہے۔\nاے آئی کوچ، فوڈ و فٹنس کوچ اور لیب تجزیہ کے لیے اپ گریڈ کریں۔",
    cancelled: "منسوخ۔ مینو پر واپس۔ 📋",
    error_generic: "😕 کچھ مسئلہ ہو گیا۔ تھوڑی دیر بعد دوبارہ کوشش کریں۔",
    disclaimer: "_DrSaab عمومی رہنمائی دیتا ہے اور طبی مشورے کا متبادل نہیں۔_",
    reminder_daily: "صبح بخیر! اپنی فاسٹنگ شوگر لاگ کرنے کا وقت ہے۔ بس اپنی ریڈنگ بھیجیں، مثلاً 130۔",
    reminder_streak: "آپ کا {streak} دن کا سلسلہ جاری ہے! آج ایک ریڈنگ لاگ کریں تاکہ یہ برقرار رہے۔",
    reminder_winback: "ہمیں Dr Saab AI پر آپ کی کمی محسوس ہوئی۔ آج ایک مختصر شوگر چیک یا چھوٹی واک آپ کو ٹریک پر رکھے گی۔",
    summary_push:
      "*آپ کا ہفتہ وار صحت خلاصہ*\n\nلاگ کی گئی ریڈنگز: {count}\nاوسط شوگر: {avg} mg/dL (حد {min}-{max})\nتخمینی HbA1c: {hba1c}%\nموجودہ سلسلہ: {streak} دن\n\nجاری رکھیں — روزانہ چھوٹے قدم بڑا فرق لاتے ہیں۔",
    clinic_hba1c: "تخمینی HbA1c",
    clinic_bmi: "بی ایم آئی",

    // ===== v2 onboarding journey =====
    welcome_eng:
      "السلام علیکم اور *ڈاکٹر صاحب* میں خوش آمدید۔\n\nمیں آپ کو ذیابیطس کو بہتر سمجھنے، صحت مند عادات بنانے، مستقل مزاج رہنے، اور اپنی طویل مدتی صحت بہتر بنانے میں مدد دوں گا۔\n\nاردو میں پیغامات حاصل کرنے کے لیے نیچے اردو کا انتخاب کریں۔\nاور واٹس ایپ والی اردو میں بات کرنے کے لیے WhatsApp Urdu کا انتخاب کریں۔",
    welcome_salaam:
      "وعلیکم السلام اور *ڈاکٹر صاحب* میں خوش آمدید۔\n\nمیں آپ کو ذیابیطس کو بہتر سمجھنے، صحت مند عادات بنانے، مستقل مزاج رہنے، اور اپنی طویل مدتی صحت بہتر بنانے میں مدد دوں گا۔\n\nاردو میں پیغامات حاصل کرنے کے لیے نیچے اردو کا انتخاب کریں۔\nاور واٹس ایپ والی اردو میں بات کرنے کے لیے WhatsApp Urdu کا انتخاب کریں۔",
    welcome_urdu_intent:
      "وعلیکم السلام اور *ڈاکٹر صاحب* میں خوش آمدید۔\n\nمیں آپ کو ذیابیطس کو بہتر سمجھنے، صحت مند عادات بنانے، مستقل مزاج رہنے، اور اپنی طویل مدتی صحت بہتر بنانے میں مدد دوں گا۔\n\nانگریزی میں بات کرنے کے لیے English منتخب کریں۔\nواٹس ایپ والی اردو میں بات کرنے کے لیے WhatsApp Urdu منتخب کریں۔",
    btn_lang_english: "English",
    btn_lang_urdu: "اردو",
    btn_lang_whatsapp_urdu: "WhatsApp Urdu",

    ask_name_v2: "شروع کرنے سے پہلے، آپ کا نام کیا ہے؟",
    name_ack:
      "آپ سے مل کر خوشی ہوئی، *{name}* 👋\nآئیے آپ کا پروفائل مکمل کرتے ہیں تاکہ میں آپ کے لیے بہتر رہنمائی فراہم کر سکوں۔",
    ask_user_type: "ان میں سے کون سی بات آپ پر سب سے بہتر لاگو ہوتی ہے؟",
    ut_diabetes: "مجھے ذیابیطس ہے",
    ut_prediabetes: "مجھے پری ذیابیطس ہے",
    ut_notsure: "صحت مند عادات بنانا",
    ut_parent: "میں والدین/اہلِ خانہ ہوں",
    ut_exploring: "بس دیکھ رہا ہوں",

    ask_age_v2: "بہت خوب۔ آئیے شروع کرتے ہیں۔ آپ کی تاریخِ پیدائش کیا ہے؟\nبراہِ کرم دن، مہینہ اور سال بتائیں (مثلاً 12 مارچ 1985)۔",
    ask_dob_missing:
      "پوری تاریخِ پیدائش درکار ہے — براہِ کرم *{missing}* بھیجیں (مثلاً 12 مارچ 1985)۔",
    btn_multi_done: "مکمل",
    multi_select_hint: "_ایک سے زیادہ آپشن منتخب کریں، پھر مکمل دبائیں۔_",
    g_prefer_not: "بتانا نہیں چاہتا",
    ask_city_v2: "آپ کس شہر میں رہتے ہیں؟",

    ask_diabetes_type: "کیا آپ جانتے ہیں کہ آپ کو ذیابیطس کی کون سی قسم ہے؟",
    dt_type1: "ٹائپ 1 ذیابیطس",
    dt_type2: "ٹائپ 2 ذیابیطس",
    dt_prediabetes: "پری ذیابیطس",
    dt_gestational: "حملاتی ذیابیطس",
    dt_notsure: "یقین نہیں",

    ask_diagnosis_duration: "آپ کو ذیابیطس کی تشخیص کب ہوئی تھی؟",
    dh_lt1: "1 سال سے کم",
    dh_1_5: "1–5 سال پہلے",
    dh_6_10: "6–10 سال پہلے",
    dh_gt10: "10 سال سے زیادہ",
    dh_notsure: "یقین نہیں",

    ask_hba1c_known: "کیا آپ کو اپنا تازہ ترین HbA1c معلوم ہے؟",
    ask_hba1c_value: "آپ کا HbA1c کتنا تھا؟\nمثال: 7.2%",
    ask_hba1c_date: "یہ ٹیسٹ تقریباً کب کروایا گیا تھا؟",
    hd_1m: "1 ماہ کے اندر",
    hd_1_3: "1–3 ماہ پہلے",
    hd_3_6: "3–6 ماہ پہلے",
    hd_gt6: "6 ماہ سے زیادہ پہلے",

    ask_sugar_known: "کیا آپ کو اپنی حالیہ شوگر ریڈنگز معلوم ہیں؟",
    ask_fasting_value:
      "آپ کی تازہ ترین *فاسٹنگ* شوگر کتنی تھی؟\nمثال: 105\nیا Skip لکھ دیں۔",
    ask_fasting_date: "یہ ریڈنگ کب لی گئی تھی؟",
    ask_random_value:
      "آپ کی تازہ ترین *رینڈم* شوگر کتنی تھی؟\nمثال: 180\nیا Skip لکھ دیں۔",
    ask_random_date: "یہ ریڈنگ کب لی گئی تھی؟",
    rd_today: "آج",
    rd_week: "اس ہفتے",
    rd_month: "اس مہینے",
    rd_notremember: "یاد نہیں",

    ask_diab_meds_known: "کیا آپ ذیابیطس کی کوئی دوا استعمال کر رہے ہیں؟",
    ask_diab_med_entry:
      "براہِ کرم دوا کا *نام، خوراک اور استعمال کی تعداد* لکھیں۔\nمثال:\n• Metformin 500mg دن میں دو بار\n• Tagipmet XR 50/500 دن میں دو بار",
    ask_diab_meds_more: "کیا کوئی اور ذیابیطس کی دوا بھی استعمال کرتے ہیں؟",
    btn_add_another: "ایک اور شامل کریں",
    btn_no_more: "بس ہو گیا",

    ask_other_conditions_known: "کیا آپ کو کوئی اور بیماری یا طبی مسئلہ بھی ہے؟",
    ask_other_conditions_details:
      "براہِ کرم بیماری یا مسئلے کا نام لکھیں۔\nمثال:\n• ہائی بلڈ پریشر\n• ہائی کولیسٹرول\n• دل کی بیماری\n• تھائیرائیڈ\n• ڈپریشن\n• اینگزائٹی",
    ask_other_meds_known: "کیا آپ ان بیماریوں کے لیے کوئی دوا بھی لیتے ہیں؟",
    ask_other_med_entry: "براہِ کرم دوا کا *نام، خوراک اور استعمال کی تعداد* لکھیں۔",
    ask_other_meds_more_prompt: "ان بیماریوں کے لیے کوئی اور دوا؟",

    ask_monitoring_habit: "کیا آپ گھر پر اپنی شوگر چیک کرتے ہیں؟",
    mh_regularly: "باقاعدگی سے",
    mh_sometimes: "کبھی کبھار",
    mh_rarely: "بہت کم",
    mh_never: "کبھی نہیں",
    ask_monitoring_device: "آپ شوگر چیک کرنے کے لیے کیا استعمال کرتے ہیں؟",
    md_glucometer: "گلوکومیٹر",
    md_cgm: "CGM سینسر",
    md_both: "دونوں",

    ask_primary_goal: "اس وقت آپ سب سے زیادہ کس چیز میں مدد چاہتے ہیں؟",
    pg_lower_a1c: "میرا HbA1c کم کرنا",
    pg_lose_weight: "وزن کم کرنا",
    pg_eat_healthy: "صحت بخش کھانا",
    pg_exercise: "باقاعدہ ورزش",
    pg_consistent: "مستقل مزاجی",
    pg_understand: "ذیابیطس کو بہتر سمجھنا",

    ask_primary_challenge: "آپ کے خیال میں آپ کی سب سے بڑی مشکل کیا ہے؟",
    ch_diet: "خوراک",
    ch_exercise: "ورزش",
    ch_motivation: "حوصلہ",
    ch_meds: "ادویات کا معمول",
    ch_stress: "ذہنی دباؤ",
    ch_time: "وقت",
    ch_understand: "ذیابیطس کی سمجھ",

    ask_motivation_driver: "آپ کو سب سے زیادہ کون سی چیز متحرک کرتی ہے؟",
    mt_family: "میرا خاندان",
    mt_health: "بہتر صحت",
    mt_longer: "لمبی زندگی",
    mt_complications: "پیچیدگیوں سے بچاؤ",
    mt_looking: "اچھا دکھنا اور محسوس کرنا",
    mt_faith: "میرا ایمان",

    profile_complete_v2:
      "بہترین، *{name}* ✅\nآپ کا پروفائل مکمل ہو گیا ہے۔\nاب میں اس معلومات کی بنیاد پر آپ کو ذاتی نوعیت کی رہنمائی، یاد دہانیاں، تعلیمی مواد اور پیش رفت کی نگرانی فراہم کر سکوں گا۔\n\nآئیے مل کر صحت مند عادات بناتے ہیں۔",
    disclaimer_v2:
      "*آگے بڑھنے سے پہلے:*\n\nڈاکٹر صاحب تعلیمی معلومات اور کوچنگ سپورٹ فراہم کرتا ہے۔ یہ کسی مستند ڈاکٹر کے طبی مشورے، تشخیص یا علاج کا متبادل نہیں ہے۔\n\nاگر آپ کو سینے میں درد، بے ہوشی، شدید کمزوری، الجھن، بہت زیادہ یا بہت کم شوگر، یا کسی بھی قسم کی طبی ایمرجنسی کا سامنا ہو تو فوراً اپنے ڈاکٹر یا قریبی ایمرجنسی سروس سے رابطہ کریں۔",
    btn_understand: "میں سمجھ گیا",

    btn_yes: "ہاں",
    btn_no: "نہیں",

    plan_free: "اسٹارٹر (مفت)",
    plan_consistency: "Consistency Coach",
    plan_executive: "Executive Coach",
    btn_view_plans: "پلانز دیکھیں",
    btn_maybe_later: "ابھی نہیں",
    btn_upgrade: "💎 اپ گریڈ",
    btn_goals: "🎯 میرے اہداف",
    btn_challenges: "🏆 چیلنجز",
    btn_reports: "📑 رپورٹس",
    btn_executive: "⭐ ایگزیکٹو سروسز",
    help_text:
      "🤖 *DrSaab مدد*\n\nآپ مجھ سے بات کر سکتے ہیں یا یہ استعمال کریں:\n• *Menu / Home* — مرکزی مینو\n• *Back* — واپس\n• *Cancel* — موجودہ مرحلہ روکیں\n• *Upgrade* — پلانز دیکھیں\n• *Help* — یہ پیغام\n\nشوگر لاگ کریں (مثلاً `130 fasting`)، سوال پوچھیں، یا مینو منتخب کریں۔",
    goals_title: "🎯 *میرے اہداف*",
    goals_none: "آپ نے ابھی کوئی ہدف مقرر نہیں کیا۔",
    goals_current: "آپ کا موجودہ ہدف: *{goal}*",
    goals_prompt: "اپنا بنیادی صحت کا ہدف ایک جملے میں بھیجیں (مثلاً *HbA1c کو 7 سے کم کرنا*)، یا واپس دبائیں۔",
    goals_saved: "✅ ہدف محفوظ ہو گیا: *{goal}*",
    btn_set_goal: "✏️ ہدف مقرر/تبدیل کریں",
    scores_title: "📊 *آپ کے اسکور* (100 میں سے)",
    reports_title: "📑 *رپورٹس*",
    challenges_title: "🏆 *چیلنجز*",
    exec_title: "⭐ *ایگزیکٹو سروسز*",
  },

  roman_ur: {
    choose_language: "👋 *DrSaab AI* mein khush aamdeed — aap ka diabetes coach.\n\nBarae meharbani apni zabaan chunein:",
    language_set: "Bahut khoob! Aaiye aap ki profile banatay hain. Kisi bhi waqt /cancel likh saktay hain.",
    ask_name: "Aap ka *naam* kya hai?",
    ask_age: "Aap ki umar kitni hai? (saal)",
    ask_gender: "Aap ki jins?",
    ask_city: "Aap kis *shehar* mein rehte hain?",
    ask_height: "Aap ka *qad* centimeter mein? (masalan 170)",
    ask_weight: "Aap ka *wazan* kilogram mein? (masalan 78)",
    ask_diabetes: "Aap ki diabetes ki kaifiyat?",
    ask_goals: "Aap ke *sehat ke ahdaaf* kya hain? (masalan sugar kam karna, wazan kam karna)",
    ask_meds: "Apni mojooda *adwiyat* likhein (ya \"none\" likhein).",
    ask_doctor_code: "Optional: *doctor referral code* daalein, ya Skip dabayein.",
    ask_challenge_code: "Optional: *challenge code* daalein, ya Skip dabayein.",
    ask_team_code: "Optional: *team code* daalein, ya Skip dabayein.",
    invalid_number: "Barae meharbani sahi number bhejein 🙏",
    onboarding_done:
      "✅ Tayyar hai, *{name}*! Aap ki profile mukammal ho gayi.\n\nNeechay diye menu ka istemaal karein. Saabit qadam rahein — main har roz aap ke saath hoon. 💚",
    welcome_back: "👋 Khush aamdeed, *{name}*! Aap kya karna chahenge?",
    menu_title: "📋 *Main Menu* — ek option chunein:",
    btn_glucose: "🩸 Sugar Log Karein",
    btn_medication: "💊 Adwiyat",
    btn_health: "📝 Rozana Check-in",
    btn_coach: "🤖 AI Coach",
    btn_food: "🥗 Food Coach",
    btn_fitness: "🏃 Fitness Coach",
    btn_progress: "📈 Meri Pesh-raft",
    btn_summary: "🗓 Haftawaar Khulasa",
    btn_lab: "🧪 Lab Report Samjhein",
    btn_learn: "📚 Seekhein",
    btn_profile: "⚙️ Profile",
    btn_subscription: "💎 Subscription",
    btn_menu: "📋 Menu",
    btn_back: "⬅️ Menu par wapas",
    btn_skip: "Chhorein ⏭",
    g_male: "Mard",
    g_female: "Aurat",
    g_other: "Deegar",
    ds_type1: "Type 1",
    ds_type2: "Type 2",
    ds_prediabetes: "Prediabetes",
    ds_gestational: "Hamlaati",
    ds_atrisk: "Khatre mein",
    ds_notsure: "Yaqeen nahi",
    glucose_prompt:
      "🩸 Apni sugar *mg/dL* mein bhejein (masalan `130`).\nContext bhi likh saktay hain jaise `130 fasting`.",
    glucose_saved: "✅ Log ho gaya *{value} mg/dL* ({context}). {feedback}\n🔥 Streak: {streak} din",
    glucose_low: "Yeh *kam* hai — kuch kha lein aur dobara check karein. Tabiyat kharab ho to madad lein. ⚠️",
    glucose_normal: "Bahut khoob — yeh sehatmand had mein hai. Aisay hi jari rakhein! 💪",
    glucose_high: "Yeh thora *zyada* hai. Paani, choti walk aur halka khana madadgar hai. 📈",
    glucose_vhigh: "Yeh *bohat zyada* hai. Doctor ke mashware par amal karein, tabiyat kharab ho to foran madad lein. ⚠️",
    medication_prompt:
      "💊 Aap ne kaun si dawa li? *Naam* (aur dose) bhejein, masalan `Metformin 500mg`.",
    medication_saved: "✅ Log ho gaya: *{name}*. Shabaash! 🔥 Streak: {streak} din",
    health_prompt:
      "📝 Rozana check-in. Bhejein: wazan (kg), steps, mood, neend (ghante), paani (glass).\nMisaal: `weight 78, steps 6000, mood good, sleep 7, water 6`",
    health_saved: "✅ Check-in mehfooz ho gaya. 🔥 Streak: {streak} din",
    health_none: "Koi value samajh nahi aayi. Koshish karein: `weight 78, steps 6000, mood good`",
    coach_prompt:
      "🤖 *AI Coach* hazir hai. Diabetes, aadaat ya himmat ke baare mein kuch bhi poochein.\n_Farigh ho kar Menu par wapas dabayein._",
    food_prompt:
      "🥗 *Food Coach*. Apna khana batayein ya *plate ki tasveer bhejein*, main carbs ka andaza aur behtar option bataonga.\n_Menu par wapas dabayein._",
    fitness_prompt:
      "🏃 *Fitness Coach*. Apna din ya energy batayein, main mehfooz exercise tajweez karoonga.\n_Menu par wapas dabayein._",
    lab_prompt:
      "🧪 *Lab Report Samjhein*. Apni values text mein bhejein *ya tasveer bhejein*, main asaan alfaaz mein samjhaonga.\n_Menu par wapas dabayein._",
    thinking: "✍️ Soch raha hoon…",
    progress_title: "📈 *Aap ki Pesh-raft*",
    progress_body:
      "🔥 Streak: *{streak}* din\n⚖️ Wazan: *{weight}*\n🩸 Recent readings:\n{readings}",
    no_readings: "Abhi koi sugar reading nahi — menu se log karein!",
    summary_generating: "🗓 Aap ka haftawaar khulasa ban raha hai…",
    no_data_week: "Is hafte abhi kaafi data nahi. Kuch readings log karein aur dobara dekhein! 📥",
    profile_title:
      "⚙️ *Aap ki Profile*\n\nNaam: {name}\nUmar: {age}\nJins: {gender}\nShehar: {city}\nDiabetes: {diabetes}\nAhdaaf: {goals}\nPlan: *{tier}*\nZabaan: {language}",
    change_language: "🌐 Zabaan tabdeel karein",
    subscription_info:
      "💎 *Subscription*\n\n*Free*: tracking, taleem, aam reminders, basic summaries.\n\n*Consistency Builder — Rs 499/mah*: AI Coach, Food Coach, Fitness Coach, lab analysis, personalized reminders aur detailed reports.\n\nAap ka plan: *{tier}*",
    premium_required:
      "💎 Yeh *Consistency Builder* feature hai.\nAI Coach, Food & Fitness coach aur lab analysis ke liye upgrade karein.",
    cancelled: "Cancel. Menu par wapas. 📋",
    error_generic: "😕 Kuch masla ho gaya. Thori dair baad dobara koshish karein.",
    disclaimer: "_DrSaab aam rahnumai deta hai aur tibbi mashware ka mutabadil nahi._",
    reminder_daily: "Good morning! Apni fasting sugar log karne ka waqt hai. Bas apni reading bhejein, masalan 130.",
    reminder_streak: "Aap ka {streak}-din ka streak chal raha hai! Aaj ek reading log karein taake yeh barqarar rahe.",
    reminder_winback: "Humein Dr Saab AI par aap ki kami mehsoos hui. Aaj ek choti sugar check ya walk aap ko track par rakhegi.",
    summary_push:
      "*Aap ka haftawaar sehat khulasa*\n\nLog ki gayi readings: {count}\nAusat sugar: {avg} mg/dL (range {min}-{max})\nEstimated HbA1c: {hba1c}%\nMojooda streak: {streak} din\n\nJari rakhein — rozana chote qadam bara farq latay hain.",
    clinic_hba1c: "Est. HbA1c",
    clinic_bmi: "BMI",

    // ===== v2 onboarding journey =====
    welcome_eng:
      "Assalamualaikum aur *DrSaab* mein khush aamdeed — aap ka AI Coach for Diabetes.\n\nMain aap ko diabetes ko behtar samajhnay, sehatmand aadatein bananay, mustaqil rehnay aur apni sehat behtar karnay mein madad karunga.\n\nUrdu mein messages hasil karnay ke liye Urdu ka option select karein.\nAur WhatsApp wali Urdu mein baat karnay ke liye WhatsApp Urdu ka option select karein.",
    welcome_salaam:
      "Walaikumussalam aur *DrSaab* mein khush aamdeed — aap ka AI Coach for Diabetes.\n\nMain aap ko diabetes ko behtar samajhnay, sehatmand aadatein bananay, mustaqil rehnay aur apni sehat behtar karnay mein madad karunga.\n\nUrdu mein messages hasil karnay ke liye Urdu ka option select karein.\nAur WhatsApp wali Urdu mein baat karnay ke liye WhatsApp Urdu ka option select karein.",
    welcome_urdu_intent:
      "Walaikumussalam aur *DrSaab* mein khush aamdeed — aap ka AI Coach for Diabetes.\n\nMain aap ko diabetes ko behtar samajhnay, sehatmand aadatein bananay, mustaqil rehnay aur apni sehat behtar karnay mein madad karunga.\n\nEnglish mein baat karnay ke liye English select karein.\nUrdu mein baat karnay ke liye Urdu select karein.",
    btn_lang_english: "English",
    btn_lang_urdu: "اردو",
    btn_lang_whatsapp_urdu: "WhatsApp Urdu",

    ask_name_v2: "Shuru karnay se pehlay, aap ka naam kya hai?",
    name_ack:
      "Aap se mil kar khushi hui, *{name}* 👋\nAaiye aap ka profile mukammal karte hain taake main aap ke liye behtar rehnumai faraham kar sakoon.",
    ask_user_type: "In mein se kaunsi baat aap par sab se zyada lagu hoti hai?",
    ut_diabetes: "Mujhe diabetes hai",
    ut_prediabetes: "Mujhe prediabetes hai",
    ut_notsure: "Sehatmand aadatein banana",
    ut_parent: "Main parent/ahl-e-khana hoon",
    ut_exploring: "Bas dekh raha hoon",

    ask_age_v2: "Bohat khoob. Aaiye shuru karte hain. Aap ki date of birth kya hai?\nDay, month aur year zaroori hain (misaal: 12 March 1985).",
    ask_dob_missing:
      "Mujhe poori date of birth chahiye — barah-e-karam *{missing}* bhejein (misaal: 12 March 1985).",
    btn_multi_done: "Done",
    multi_select_hint: "_Ek se zyada option chunein, phir Done dabayein._",
    g_prefer_not: "Batana nahi chahta",
    ask_city_v2: "Aap kis shehar mein rehte hain?",

    ask_diabetes_type: "Kya aap jaantay hain ke aap ko diabetes ki kaunsi type hai?",
    dt_type1: "Type 1 Diabetes",
    dt_type2: "Type 2 Diabetes",
    dt_prediabetes: "Prediabetes",
    dt_gestational: "Gestational Diabetes",
    dt_notsure: "Yaqeen nahi",

    ask_diagnosis_duration: "Aap ko diabetes ki tashkhees kab hui thi?",
    dh_lt1: "1 saal se kam",
    dh_1_5: "1–5 saal pehlay",
    dh_6_10: "6–10 saal pehlay",
    dh_gt10: "10 saal se zyada",
    dh_notsure: "Yaqeen nahi",

    ask_hba1c_known: "Kya aap ko apna latest HbA1c maloom hai?",
    ask_hba1c_value: "Aap ka HbA1c kitna tha?\nMisaal: 7.2%",
    ask_hba1c_date: "Yeh test taqreeban kab hua tha?",
    hd_1m: "1 maah ke andar",
    hd_1_3: "1–3 maah pehlay",
    hd_3_6: "3–6 maah pehlay",
    hd_gt6: "6 maah se zyada pehlay",

    ask_sugar_known: "Kya aap ko apni haal hi ki sugar readings maloom hain?",
    ask_fasting_value:
      "Aap ki latest *fasting* sugar kitni thi?\nMisaal: 105\nYa Skip likh dein.",
    ask_fasting_date: "Yeh reading kab li gayi thi?",
    ask_random_value:
      "Aap ki latest *random* sugar kitni thi?\nMisaal: 180\nYa Skip likh dein.",
    ask_random_date: "Yeh reading kab li gayi thi?",
    rd_today: "Aaj",
    rd_week: "Is hafte",
    rd_month: "Is mahinay",
    rd_notremember: "Yaad nahi",

    ask_diab_meds_known: "Kya aap diabetes ki koi dawa istemal kar rahe hain?",
    ask_diab_med_entry:
      "Barah-e-karam dawa ka *naam, dose aur kitni martaba* lete hain likhein.\nMisaal:\n• Metformin 500mg din mein do martaba\n• Tagipmet XR 50/500 din mein do martaba",
    ask_diab_meds_more: "Kya aap koi aur diabetes ki dawa bhi istemal karte hain?",
    btn_add_another: "Aur shamil karein",
    btn_no_more: "Bas ho gaya",

    ask_other_conditions_known: "Kya aap ko koi aur bemari ya medical masla bhi hai?",
    ask_other_conditions_details:
      "Barah-e-karam bemari ya maslay ka naam likhein.\nMisaal:\n• High blood pressure\n• High cholesterol\n• Dil ki bemari\n• Thyroid\n• Depression\n• Anxiety",
    ask_other_meds_known: "Kya aap in bemariyon ke liye koi dawa bhi lete hain?",
    ask_other_med_entry: "Barah-e-karam dawa ka *naam, dose aur frequency* likhein.",
    ask_other_meds_more_prompt: "In bemariyon ke liye koi aur dawa?",

    ask_monitoring_habit: "Kya aap ghar par apni sugar check karte hain?",
    mh_regularly: "Baqaida",
    mh_sometimes: "Kabhi kabhar",
    mh_rarely: "Bohat kam",
    mh_never: "Kabhi nahi",
    ask_monitoring_device: "Aap sugar check karnay ke liye kya istemal karte hain?",
    md_glucometer: "Glucometer",
    md_cgm: "CGM Sensor",
    md_both: "Dono",

    ask_primary_goal: "Is waqt aap sab se zyada kis cheez mein madad chahtay hain?",
    pg_lower_a1c: "Mera HbA1c kam karna",
    pg_lose_weight: "Wazan kam karna",
    pg_eat_healthy: "Sehatmand khana",
    pg_exercise: "Baqaida exercise",
    pg_consistent: "Mustaqil rehna",
    pg_understand: "Diabetes ko behtar samajhna",

    ask_primary_challenge: "Aap ke khayal mein aap ki sab se badi mushkil kya hai?",
    ch_diet: "Khurak",
    ch_exercise: "Exercise",
    ch_motivation: "Himmat",
    ch_meds: "Dawaiyon ka mamool",
    ch_stress: "Stress",
    ch_time: "Waqt",
    ch_understand: "Diabetes ki samajh",

    ask_motivation_driver: "Aap ko sab se zyada kis cheez se himmat aur motivation milti hai?",
    mt_family: "Mera khandaan",
    mt_health: "Behtar sehat",
    mt_longer: "Lambi zindagi",
    mt_complications: "Complications se bachao",
    mt_looking: "Acha dikhna aur mehsoos karna",
    mt_faith: "Mera imaan",

    profile_complete_v2:
      "Behtareen, *{name}* ✅\nAap ka profile mukammal ho gaya hai.\nAb main is maloomat ki bunyaad par aap ko zaati rehnumai, reminders, taleemi maloomat aur progress tracking faraham kar sakta hoon.\n\nAaiye mil kar sehatmand aadatein banatay hain.",
    disclaimer_v2:
      "*Aagay barhnay se pehlay:*\n\nDrSaab taleemi maloomat aur coaching support faraham karta hai. Yeh kisi qualified doctor ke medical mashwaray, tashkhees ya ilaaj ka mutabadil nahin hai.\n\nAgar aap ko seenay mein dard, behoshi, shadeed kamzori, uljhan, bohat zyada ya bohat kam sugar, ya kisi bhi qisam ki medical emergency ka samna ho to foran apne doctor ya qareebi emergency service se rabta karein.",
    btn_understand: "Main samajh gaya",

    btn_yes: "Haan",
    btn_no: "Nahi",

    plan_free: "Starter (Free)",
    plan_consistency: "Consistency Coach",
    plan_executive: "Executive Coach",
    btn_view_plans: "Plans dekhein",
    btn_maybe_later: "Abhi nahi",
    btn_upgrade: "💎 Upgrade",
    btn_goals: "🎯 Mere Goals",
    btn_challenges: "🏆 Challenges",
    btn_reports: "📑 Reports",
    btn_executive: "⭐ Executive Services",
    help_text:
      "🤖 *DrSaab Help*\n\nAap mujh se baat kar saktay hain ya yeh use karein:\n• *Menu / Home* — main menu\n• *Back* — wapas\n• *Cancel* — mojooda step roken\n• *Upgrade* — plans dekhein\n• *Help* — yeh message\n\nSugar log karein (e.g. `130 fasting`), sawal poochein, ya menu select karein.",
    goals_title: "🎯 *Mere Goals*",
    goals_none: "Aap ne abhi koi goal set nahi kiya.",
    goals_current: "Aap ka mojooda goal: *{goal}*",
    goals_prompt: "Apna main health goal ek jumlay mein bhejein (e.g. *HbA1c 7 se kam karna*), ya Back dabayein.",
    goals_saved: "✅ Goal save ho gaya: *{goal}*",
    btn_set_goal: "✏️ Goal set/change karein",
    scores_title: "📊 *Aap ke Scores* (100 mein se)",
    reports_title: "📑 *Reports*",
    challenges_title: "🏆 *Challenges*",
    exec_title: "⭐ *Executive Services*",
  },
};

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ur", label: "اردو" },
  { code: "roman_ur", label: "WhatsApp Urdu" },
];

export function t(lang, key, vars = {}) {
  const table = STR[lang] || STR.en;
  let s = table[key] ?? STR.en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replaceAll(`{${k}}`, String(v));
  }
  return s;
}
