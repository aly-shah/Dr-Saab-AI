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
      "📋 *Explain My Report*\n\nUpload your blood test or medical report — send a photo, or paste the values as text.\n\nI'll explain your results in simple language, highlight anything important, and tell you what it may mean for your diabetes.\n\n*Supported reports:*\n• Blood tests\n• HbA1c reports\n• Cholesterol / Lipid Profile\n• Kidney function tests\n• Liver function tests\n• Urine tests\n• Hospital laboratory reports\n• Diabetes-related investigations\n_Tap Back to Menu when done._",
    btn_upload_lab: "📎 Upload Image",
    upload_lab_hint:
      "📸 Just attach the report photo and send.\n\n_Tap the attach icon (paperclip) in your chat, pick your report image, and hit send. I'll analyse it and add it to your record._",
    lab_saved: "✅ Your report has been analyzed and added to your health record.",
    lab_disclaimer:
      "_Important: This explanation is for understanding your report only. Please consult your doctor before making any medical decisions or changing your treatment._",
    lab_limit_reached:
      "💎 You've used your *{limit}* free report analyses this month.\nUpgrade to *Consistency Coach* for unlimited report analysis and your full report history.",
    thinking: "✍️ Thinking…",
    // progress / summary
    progress_title: "📈 *Your Progress*",
    progress_body:
      "🔥 Streak: *{streak}* day(s)\n⚖️ Weight: *{weight}*\n🩸 Recent readings:\n{readings}",
    no_readings: "No glucose readings yet — log one from the menu!",
    summary_generating: "🗓 Building your weekly summary…",
    no_data_week: "Not enough data this week yet. Log a few readings and check back! 📥",
    progress_generating: "📈 Building your progress report…",
    progress_low_data:
      "📈 *Your Progress*\n\nI don't have enough of your data yet to give you a useful report. Log a few blood-sugar readings, weight entries or a check-in, and talk to me regularly so I can spot trends. Your report gets better every time you use DrSaab.",
    progress_goals_header: "🎯 *My Goals*",
    progress_no_goals: "_You haven't set any goals yet. Tap Goals & Progress to add one._",
    progress_free_upgrade:
      "🔒 *Unlock Premium* to get:\n• Detailed progress reports\n• Goal tracking\n• Personalised AI recommendations\n• Advanced trend analysis\n• Doctor-ready summaries",
    progress_upgrade_cta: "⭐ Upgrade Now",
    progress_paid_intro:
      "Here's your personalised progress report — combining your goals, blood sugar, weight, activity, medication consistency, wellbeing and lab results.",
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
    error_ai_limit:
      "🤖 I'm getting a lot of messages right now and hit a temporary AI limit. Please try again in a minute — your data is safe.",
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
      "As Salam Alaikum and welcome to DrSaab — your AI Coach for Diabetes 👋🏼\n\nI can help you understand your diabetes, build healthier habits, stay consistent, and improve your long-term health.\n\nFor اردو messaging, please select Urdu below.\nAur WhatsApp wali Urdu mein baat karnay ke liye, WhatsApp Urdu ka option use karain.",
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
    ut_type1: "I have Type 1 Diabetes",
    ut_type2: "I have Type 2 Diabetes",
    ut_prediabetes: "I have Prediabetes",
    ut_gestational: "I have Gestational Diabetes",
    ut_healthier: "I want to live healthier",

    ask_age_v2: "Let's begin. When is your birthday?\nPlease share day, month and year (e.g. 12 March 1985).",
    ask_dob_missing:
      "I just need a complete birthday — please send the missing *{missing}* (e.g. 12 March 1985).",
    btn_multi_done: "Done",
    multi_select_hint: "_Tap multiple options, then press Done._",
    multi_select_selected: "*Selected so far:* {list}",
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
    profile_complete_v2_noname:
      "Perfect ✅\nYour profile is ready.\nI'll use this information to personalize your coaching, reminders, education and progress tracking.\n\nLet's start building healthier habits together.",
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

    // ---- Goals (2026-07: up to 3 active goals, motivation + target date) ----
    goals_title: "🎯 *My Goals*",
    goals_current: "Your current goal: *{goal}*",
    goals_none: "You haven't set a goal yet. Tap *Add a goal* to get started.",
    goals_list_header:
      "🎯 *My Goals* — {count}/{max} active\n\nTap a goal to view or edit it.",
    goals_full: "You already have *{max}* active goals. Mark one complete or remove it before adding a new one.",
    goals_prompt: "Send your main health goal in a sentence (e.g. *lower my HbA1c below 7*), or tap Back.",
    goals_saved: "✅ Goal saved: *{goal}*\nI'll keep this in mind while coaching you.",
    btn_set_goal: "✏️ Set / change goal",
    btn_goal_add: "➕ Add a goal",
    btn_goal_edit: "✏️ Edit goal",
    btn_goal_complete: "✅ Mark as completed",
    btn_goal_delete: "🗑 Remove goal",
    btn_goal_edit_title: "✏️ Edit goal",
    btn_goal_edit_motivation: "💭 Edit motivation",
    btn_goal_edit_target: "📅 Edit target date",

    // Suggested goals (in order per spec)
    goal_pick_prompt: "Choose one of these goals — or tap *Other* to write your own.",
    goalsug_lower_a1c: "Lower my HbA1c",
    goalsug_lose_weight: "Lose weight",
    goalsug_exercise_more: "Exercise more",
    goalsug_walk_more: "Walk more",
    goalsug_improve_blood_sugar: "Improve my blood sugar",
    goalsug_take_meds: "Take my medication consistently",
    goalsug_eat_healthy: "Eat healthier",
    goalsug_improve_cholesterol: "Improve my cholesterol",
    goalsug_improve_bp: "Improve my blood pressure",
    goalsug_sleep_better: "Sleep better",
    goalsug_prepare_surgery: "Prepare for surgery",
    goalsug_run_5k: "Run a 5K",
    goalsug_other: "✏️ Other (write my own)",

    goal_custom_prompt:
      "Write your goal in your own words (one line).\n_Example:_ Lose 5 kg by summer.",
    goal_motivation_prompt:
      "*Why is this goal important to you?* (Optional — tap Skip to move on.)\n\n_Examples:_\n• I want to be healthier for my children.\n• I want to feel more confident.\n• My doctor told me I need to improve.",
    goal_motivation_saved: "💭 Got it. Your motivation is noted.",
    goal_target_prompt:
      "*Set a target date?* (Optional — tap Skip if you'd rather not.)\n\nSend a real date (e.g. `31 December 2026`) or a rough one like `In 6 months` or `Before Eid`.",
    goal_target_saved: "📅 Target date noted.",
    goal_target_skipped: "No target date — that's fine.",
    goal_added:
      "✅ *Goal added*\n\n🎯 {goal}\n\nI'll use this to personalise your coaching and progress reports. Stay consistent — I'm with you.",

    // Detail view
    goal_detail_title: "🎯 *{goal}*",
    goal_detail_motivation: "💭 *Why:* {motivation}",
    goal_detail_target: "📅 *Target:* {target}",
    goal_detail_no_motivation: "_You haven't shared why this goal matters yet._",
    goal_detail_no_target: "_No target date set._",
    goal_completed_ack: "🎉 Goal marked complete. Great work!",
    goal_deleted_ack: "🗑 Goal removed.",

    // Edit prompts
    goal_edit_title_prompt: "Send the new wording for this goal (one line).",
    goal_edit_motivation_prompt:
      "Send an updated *why* — what makes this goal important to you? (Tap Skip to clear it.)",
    goal_edit_target_prompt:
      "Send a new target date (e.g. `31 December 2026`, `In 3 months`, or `Before Ramadan`). Tap Skip to clear it.",

    // Target-date review reminder
    goal_review_prompt:
      "📅 Today was your target date for your goal:\n*{goal}*\n\nDid you achieve your goal?",
    btn_goal_review_yes: "🎉 Yes",
    btn_goal_review_notyet: "😔 Not Yet",
    goal_review_yes_prompt: "Congratulations! 🎉 What would you like to do with this goal?",
    goal_review_notyet_prompt: "That's okay — progress takes time. What would you like to do?",
    btn_goal_review_new: "🆕 Set a new goal",
    btn_goal_review_continue: "🔄 Continue this goal",
    btn_goal_review_remove: "🗑 Remove this goal",
    btn_goal_review_update_target: "✏️ Update target date",
    goal_review_continue_ack: "🔄 Keeping this goal active. I'll cheer you on.",
    goal_review_remove_ack: "🗑 Goal removed. Well done for the effort you put in.",
    goal_review_update_target_prompt:
      "What's the new target date? Send a date, or a rough one like `In 6 months`.",

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
    menu_v2_title: "Choose an option from the Menu",
    btn_checkin: "🩺 Check In",
    btn_foodhelp: "🍽️ Food Help",
    btn_checkreport: "📋 Explain My Report",
    btn_myprogress: "🎯 Goals & Progress",
    btn_askdrsaab: "💬 Ask DrSaab",
    btn_more: "⚙️ More",
    btn_main_menu: "🏠 Main Menu",

    // Profile-based main-menu additions (shown conditionally per user)
    btn_p_type1: "🤝 Type 1 Community",
    btn_p_type2: "🩸 Type 2 Diabetes",
    btn_p_prediabetes: "🌱 Prediabetes",
    btn_p_healthier: "🌟 Better Me",
    btn_p_gestational: "🤰 Gestational Diabetes",
    profile_menu_stub: "This section is being built — tell me what you'd like help with and I'll do my best.",

    // Check In submenu
    checkin_title: "🩺 *Check In* — what would you like to log?",
    btn_ci_bloodsugar: "🩸 Blood Sugar",
    btn_ci_medication: "💊 Medication",
    btn_ci_weight: "⚖️ Weight",
    btn_ci_activity: "🚶 Physical Activity",
    btn_ci_symptoms: "❤️ Wellbeing",

    // Food Help submenu
    foodhelp_title: "🍽️ *Food Help* — select one of the options below:",
    btn_fh_analyze: "📸 Analyze My Meal",
    btn_fh_caneat: "🥗 What Can I Eat?",
    btn_fh_restaurant: "🍽️ Restaurant Guidance",
    btn_fh_label: "🏷️ Scan Nutrition Label",
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

    // ===== Check-In v2 (2026-07) =====

    // Blood Sugar
    bs_prompt_v2:
      "Let's log your blood sugar! 🩸\nSend your reading and tell me whether it's *Fasting*, *Random*, or *HbA1c*.\n\n_Examples:_ `Fasting 112`, `Random 145`, `Fasting 6.2`, `HbA1c 7.2`",
    bs_first_confirm:
      "✅ *Got it!* Your first blood sugar reading has been saved.\n\nEvery journey starts with one number. Keep logging your readings so I can show you your progress over time.\n\nNext time you can skip the menu and simply type:\n`Log random 125`",
    bs_confirm:
      "✅ *Blood sugar saved.*\n\nYou're building a useful record of your diabetes. Keep it going!\n\n_Tip:_ Next time simply type: `Log fasting 102`",
    bs_reminder_offer: "Would you like a reminder to test your blood sugar regularly?",
    bs_reminder_yes:
      "👍 Got it! I'll remind you if it's been a while since you last logged your blood sugar.",
    bs_reminder_no: "👍 Sure! I won't send any blood sugar reminders. You can turn them back on anytime.",
    bs_invalid: "Send a number (e.g. `Fasting 112` or `Random 6.5`).",

    // Weight
    weight_prompt_v2:
      "Let's record your weight. ⚖️\nSimply send me your current weight.\n\n_Example:_ `72.5 kg`",
    weight_first_confirm:
      "✅ *Your weight has been recorded.*\n\nThis is your first weight entry. Keep logging regularly so I can show you your progress over time.\n\nNext time, you can simply type: `Log weight 72.5`",
    weight_confirm: "✅ *Weight recorded.*",
    weight_trend:
      "📈 You're building your weight history.\nRegular weigh-ins help track long-term progress, not day-to-day changes.",

    // Physical Activity
    activity_prompt_v2:
      "Let's record your activity. 🚶\nTell me what you did today and, if you know it, for how long.\n\n_Examples:_ `Walked 30 minutes`, `Gym for 1 hour`, `8,000 steps`, `Played cricket`",
    activity_first_confirm:
      "✅ *Your activity has been recorded.*\n\nThis is your first activity entry. Keep logging your activities so I can show your progress over time.\n\nNext time, simply type: `Log walked 30 min`",
    activity_confirm: "✅ *Activity recorded.*",
    activity_trend:
      "📈 You're building your activity history.\nEvery activity counts and helps me understand your overall routine.",

    // Wellbeing (replaces Symptoms)
    wb_prompt: "How are you feeling today? ❤️",
    wb_btn_great: "😄 Great",
    wb_btn_good: "🙂 Good",
    wb_btn_okay: "😐 Okay",
    wb_btn_notgreat: "😕 Not Great",
    wb_btn_poor: "😞 Poor",
    wb_reply_great: "😊 That's great to hear! Keep up the good work.",
    wb_reply_good: "👍 Glad to hear it. Let's keep the momentum going.",
    wb_reply_okay: "💙 Thanks for checking in. Some days are just okay, and that's perfectly fine.",
    wb_reply_notgreat: "❤️ I'm sorry to hear that.\n\n*What's been bothering you today?*",
    wb_reply_poor: "❤️ I'm sorry you're having a difficult day.\n\n*Tell me a little about what's been going on.*",
    wb_note_saved: "Thank you for sharing. I'll keep this in mind for our next check-in.",
    wb_trend: "📈 You've been checking in regularly. This helps me understand how you're doing over time — not just how you're feeling today.",

    // Medication — first-time setup
    med_setup_prompt:
      "Let's set up your medications. 💊\nYou can either:\n\n📷 *Upload a photo* of your medications or prescription (multiple medications in one photo is fine), or\n\n✍️ *Type your medications* in a message.\n\n_Example:_\n• Metformin 500mg twice daily\n• Rosuvastatin 10mg once daily\n• Humalog insulin 8 units before breakfast\n• Lantus insulin 20 units at bedtime",
    med_photo_soon:
      "📷 Photo extraction is coming soon. For now, please type your medications — you can list several in one message.",
    med_confirm_intro: "Here's what I understood:\n\n{lines}\n\nIs everything correct?",
    med_edit_ask:
      "No problem — type the medication(s) again with the correction. You can list multiple in one message.",
    med_add_ask: "Great — send the next medication(s) in a single message.",
    med_saved_ok: "✅ Saved. You can update your medications any time from the *Medication* menu.",
    med_setup_none: "I couldn't find a medication in that message. Try something like: `Metformin 500mg twice daily`.",
    med_btn_yes: "✅ Yes",
    med_btn_edit: "✏️ Edit",
    med_btn_add: "➕ Add Another",

    // Consistency Program
    medcp_offer: "Would you like DrSaab to help you stay consistent with taking your medications?",
    medcp_yes: "🎯 Enrolled. I'll check in once a day for the first week to help build the habit.",
    medcp_no: "👍 Got it — I'll only save your medication list without check-ins.",
    medcp_ask: "Did you take all of your medications today?",
    medcp_btn_yes: "✅ Yes",
    medcp_btn_no: "❌ No",
    medcp_ack_yes: "🌟 Great — keep it going.",
    medcp_ack_no: "Thanks for being honest. We'll restart the daily check-ins to help you build the habit back up.\n\nWould you like to tell me what got in the way today?",
    medcp_reason_forgot: "🤔 Forgot",
    medcp_reason_busy: "😴 Busy",
    medcp_reason_side_effects: "🤒 Side Effects",
    medcp_reason_ranout: "💊 Ran Out",
    medcp_reason_other: "Other",
    medcp_reason_saved: "Noted. I'll keep this in mind as we go.",

    // Medication Satisfaction (30-day)
    medsat_ask: "Are you happy with your current medications?",
    medsat_btn_yes: "😊 Yes",
    medsat_btn_notsure: "😐 Not Sure",
    medsat_btn_no: "☹️ No",
    medsat_note_ask: "Thanks for letting me know. Can you tell me what's been bothering you?",
    medsat_note_ack:
      "Thanks for sharing that. It's important to discuss any medication concerns with your doctor before making any changes.",

    // Reminder-firing templates for new categories
    reminder_template_med_consistency: "💊 {name}",

    // Ask DrSaab entry
    askdrsaab_prompt:
      "Hi! I'm *DrSaab*.\nAsk me anything about diabetes, food, exercise, medications or your health.\n\n_Examples:_\n• Is 145 blood sugar okay?\n• Can I eat mango?\n• What should I have for breakfast?\n• I forgot my medication.\n• Can I exercise today?\n• Why is my sugar high in the morning?\n• Explain my HbA1c.\n• Can diabetics fast during Ramadan?\n\n_Tap Back when you're done._",

    // Food Help seeded prompts (2026-07 spec copy)
    foodhelp_analyze_prompt:
      "Send me a photo of your meal, or describe what you're eating. 🍽️\nI'll estimate the carbohydrates, protein, fats and calories, then explain how this meal may affect your blood sugar and suggest healthier alternatives if needed.\n\n_Examples:_\n• Chicken biryani and raita\n• Two chapatis with chicken karahi\n• One apple and a handful of almonds",
    foodhelp_caneat_prompt:
      "What are you planning to eat, or what ingredients do you have? 🥗\nI'll suggest diabetes-friendly options.\n\n_Examples:_\n• What can I eat for breakfast?\n• I have eggs, spinach and bread.\n• Sehri ideas\n• Healthy dinner\n• Vegetarian lunch",
    foodhelp_restaurant_prompt:
      "Tell me the restaurant you're visiting or what you're thinking of ordering. 🍽️\nI'll help you make the healthiest choice.\n\n_Examples:_\n• McDonald's\n• KFC\n• Kolachi\n• BBQ Tonight\n• Pizza Hut\n• I'm having biryani",
    foodhelp_snacks_prompt:
      "Looking for a snack? 🥜\nTell me if you're hungry, craving something sweet, or just need ideas.\n\n_Examples:_\n• Sweet craving\n• Office snack\n• Late-night snack\n• High-protein snack\n• Something under 200 calories",
    foodhelp_label_prompt:
      "Send me a photo of the *Nutrition Facts* label or *ingredients list* on any packaged food. 🏷️\nI'll explain what it means and whether it's a good choice for someone with diabetes.\n\n_Examples:_ Biscuits, breakfast cereal, chips, juice, frozen foods, protein bars, yogurt, bread.\n\nI'll cover:\n• Calories, carbs, added sugars, fibre, protein, serving size\n• A simple 🟢 Good Choice / 🟡 Okay Occasionally / 🔴 Best to Limit rating\n• A healthier alternative when relevant",
    foodhelp_meal_confirm: "✅ Meal analysed.",
    foodhelp_label_confirm: "✅ Nutrition label analysed.",

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

    // ===== More section v2 (2026-07 spec) =====

    // More menu
    more_subtitle: "Select one of the options below:",
    btn_more_subscription_v2: "💳 My Subscription",
    btn_more_account: "👤 My Account",

    // Reminders (category prefs + existing scheduled list)
    reminders_prefs_title: "🔔 *Reminders*",
    reminders_prefs_intro: "Choose which reminders you'd like to receive. Tap a category to turn it on or off.",
    rem_cat_blood_sugar: "🩸 Blood Sugar",
    rem_cat_medication: "💊 Medication Check-ins",
    rem_cat_goals: "🎯 Goal Reminders",
    rem_cat_coaching: "💬 Coaching Messages",
    rem_cat_on: "On",
    rem_cat_off: "Off",
    rem_pref_row: "{icon} {label} — {state}",
    rem_pref_updated: "✅ *{label}* is now *{state}*.",
    reminders_scheduled_header: "*Your scheduled reminders*",
    reminders_scheduled_none: "_You don't have any scheduled reminders yet._",

    // Subscription
    sub_title: "💳 *My Subscription*",
    sub_current_plan: "*Current Plan:* {plan}",
    sub_features_header: "*Features included:*",
    sub_renewal: "*Renews:* {date}",
    sub_no_renewal: "_Free plan — no renewal date._",
    sub_features_free:
      "• Daily check-ins & sugar/medication logging\n• Basic Ask DrSaab\n• Learn library\n• A few lab explanations per month",
    sub_features_consistency:
      "• Everything in Starter\n• Full Ask DrSaab, unlimited lab explanations\n• My Progress with all four scores\n• Weekly & monthly reports\n• Doctor-friendly report\n• Smart reminders\n• All challenges",
    sub_features_executive:
      "• Everything in Consistency Coach\n• Doctor case reviews\n• Live coach sessions\n• 3-monthly executive review\n• Priority help\n• Premium content",
    btn_sub_upgrade: "⭐ Upgrade Plan",
    btn_sub_manage: "💳 Manage Subscription",
    btn_sub_billing: "📄 View Billing History",
    sub_manage_stub:
      "Manage Subscription is coming soon. For now, contact support@drsaabcoach.com to change or cancel your plan.",
    sub_billing_stub:
      "Billing history is coming soon — we'll email your invoices in the meantime.",

    // My Account
    account_title: "👤 *My Account*",
    account_body:
      "*Name:* {name}\n*Email:* {email}\n*WhatsApp Number:* {whatsapp}\n*Member Since:* {joined}\n*Diabetes Type:* {diabetes}",
    account_field_empty: "—",
    btn_account_edit: "✏️ Edit Profile",
    btn_account_deactivate: "⏸️ Deactivate My Account",
    btn_account_close: "🗑 Close My Account",
    edit_profile_stub:
      "Editing your profile from here is coming soon. In the meantime, tell me what you'd like to change and I'll help you update it.",

    // Deactivate flow
    deactivate_confirm_title: "⏸️ *Deactivate My Account*",
    deactivate_confirm_body:
      "Are you sure you want to deactivate your account?\n\nDrSaab will stop sending you messages and reminders, but your account and health information will be kept safely so you can return at any time.",
    btn_confirm_deactivate: "✅ Deactivate",
    btn_cancel: "Cancel",
    deactivate_done:
      "⏸️ Your account has been deactivated.\n\nCoaching and reminders will stop. Whenever you're ready, just send any message and I'll bring you back.",
    reactivated_welcome:
      "👋 Welcome back, *{name}*! Your account has been reactivated. Your data and settings are just as you left them.",

    // Close flow
    close_confirm_title: "🗑 *Close My Account*",
    close_confirm_body:
      "Are you sure you want to close your DrSaab account?\n\nYou will no longer be able to access your account or use DrSaab.\n\nCertain health records and account information may continue to be securely retained in accordance with our Privacy Policy and applicable legal requirements.",
    btn_confirm_close: "🗑 Close My Account",
    close_done:
      "🗑 Your DrSaab account has been closed. Thank you for the time you spent with us — take care.",
    account_closed_reply:
      "This DrSaab account has been closed and can no longer be used. If you'd like to use DrSaab again, please register as a new user.",

    // Type 1 Community — top-level menu for T1 users (spec 2026-07)
    t1c_menu_title: "🤝 *Type 1 Community*",
    t1c_menu_intro:
      "Trusted resources, education and community support for people living with Type 1 diabetes in Pakistan. Pick a section to explore:",
    t1c_menu_not_t1:
      "The Type 1 Community section is only available for people living with Type 1 diabetes. You can update your profile if this changes.",
    btn_t1c_support: "🤝 Support Network",
    btn_t1c_blogs: "📚 Blogs for You",
    btn_t1c_videos: "🎥 Videos for You",
    btn_t1c_dailylife: "🧑‍🏫 Daily Life",
    btn_t1c_events: "📅 Events Near You",
    t1c_support_title: "🤝 *Support Network*",
    t1c_blogs_title: "📚 *Blogs for You*",
    t1c_videos_title: "🎥 *Videos for You*",
    t1c_dailylife_title: "🧑‍🏫 *Daily Life*",
    t1c_events_title: "📅 *Events Near You*",
    t1c_placeholder_body:
      "Content coming soon. We're partnering with trusted diabetes organisations across Pakistan to bring you curated support here. Check back soon!",
    // T1 Community — Daily Life sub-flow
    t1c_dailylife_intro:
      "Practical guidance for everyday situations with Type 1 diabetes. Pick a category:",
    btn_t1c_dl_children: "👨‍👩‍👧 Children & Parents",
    btn_t1c_dl_teens: "🧑‍🎓 Teenagers & Young Adults",
    btn_t1c_dl_adults: "🧑‍💼 Adults",
    t1c_dl_cat_children: "👨‍👩‍👧 *Children & Parents*",
    t1c_dl_cat_teens: "🧑‍🎓 *Teenagers & Young Adults*",
    t1c_dl_cat_adults: "🧑‍💼 *Adults*",
    t1c_dl_pick_topic: "Pick a topic to open its guide:",
    t1c_dl_topic_missing: "This topic isn't available anymore. Please choose another from the list.",
    t1c_dl_topic_no_pdf:
      "*{title}*\n\nThe guide for this topic is being prepared and will be shared here soon.",
    t1c_dl_topic_open:
      "*{title}*\n\nHere's the guide: {url}",

    // Type 1 Diabetes — periodic confidence check
    t1c_prompt: "❤️ *How confident do you feel managing your Type 1 diabetes?*",
    t1c_btn_very: "😊 Very Confident",
    t1c_btn_mostly: "🙂 Mostly Confident",
    t1c_btn_sometimes: "😐 Sometimes Difficult",
    t1c_btn_help: "😟 I Need More Help",
    t1c_reply_very:
      "Wonderful — you're clearly doing a lot right. I'll keep our chats light and celebrate the wins with you. 🌟",
    t1c_reply_mostly:
      "Great to hear. I'll keep supporting you where it matters most and share tips as they come up. 💚",
    t1c_reply_sometimes:
      "Thanks for being honest. I'll pay closer attention to the parts you find tricky and surface help sooner.",
    t1c_reply_help:
      "I hear you — living with Type 1 is hard some days. I'll bring you more guides and community support you can reach out to. You're not alone. ❤️",

    // Prediabetes — Healthy Living menu (spec 2026-07)
    pd_menu_not_pre:
      "The Healthy Living section is currently tailored for people with prediabetes. You can update your profile if this changes.",
    pd_menu_title: "💪 *Healthy Living*",
    pd_menu_intro: "Small daily wins prevent big health problems later. Pick one to start:",
    btn_pd_wins: "⚡ 10-Minute Wins",
    btn_pd_gym: "🏋️ My Gym Plan",
    btn_pd_cravings: "🍟 Beat the Cravings",

    // 10-Minute Wins
    pd_wins_title: "⚡ *10-Minute Wins*",
    pd_wins_prompt: "Here's your quick win:\n\n➡️ *{activity}*\n\nReady to give it a try?",
    btn_pd_wins_do: "✅ I'll Do It",
    btn_pd_wins_another: "🔄 Give Me Another",
    btn_pd_wins_done: "🎉 I Did It",
    pd_wins_go: "Great — go get it done. I'll check back in about 15 minutes to see how it went. 👊",
    pd_wins_check: "Welcome back! 😊\nDid you complete your 10-Minute Win?",
    btn_pd_wins_yes: "🎉 Yes",
    btn_pd_wins_notyet: "😔 Not Yet",
    pd_wins_yes:
      "Fantastic! Small wins like this build lifelong habits.\n\nWhen you're ready, try another Healthy Living activity from the menu.",
    pd_wins_notyet:
      "That's okay. There's always another opportunity later today. Every small step counts.\n\nWhen you're ready, try another Healthy Living activity from the menu.",
    // Activities (random pool)
    pd_win_walk_office: "Walk around your office building.",
    pd_win_walk_block: "Walk around the block.",
    pd_win_stairs: "Climb the stairs for 10 minutes.",
    pd_win_stretch_tv: "Stretch while watching TV.",
    pd_win_home_workout: "Do a simple home workout.",
    pd_win_brisk_walk: "Take a brisk walk after your next meal.",
    pd_win_park_further: "Park further away and walk.",
    pd_win_phone_walk: "Walk while taking a phone call.",

    // My Gym Plan
    pd_gym_title: "🏋️ *My Gym Plan*",
    pd_gym_intro:
      "Let's build a simple beginner routine. Three quick questions and I'll create a plan for you.",
    pd_gym_q1: "*1.* Have you been to a gym before?",
    btn_pd_gym_exp_never: "Never",
    btn_pd_gym_exp_beginner: "Beginner",
    btn_pd_gym_exp_regular: "Regular",
    pd_gym_q2: "*2.* How many days per week can you realistically exercise?",
    pd_gym_q3: "*3.* What's your main goal?",
    btn_pd_gym_goal_lose: "Lose weight",
    btn_pd_gym_goal_build: "Build muscle",
    btn_pd_gym_goal_fitness: "Improve fitness",
    btn_pd_gym_goal_bloodsugar: "Improve blood sugar",
    pd_gym_generating: "Great — building your plan now… 🏗",
    pd_gym_saved:
      "{plan}\n\n_Saved to your profile. Come back anytime to regenerate or update this plan._",
    pd_gym_error:
      "I couldn't generate a plan right now. Please try again in a moment.",
    btn_pd_gym_regen: "🔁 Regenerate My Plan",

    // Beat the Cravings
    pd_crav_title: "🍟 *Beat the Cravings*",
    pd_crav_intro:
      "Understanding your habits is the first step. Let's take it one small change at a time.",
    // Step 1
    pd_crav_drink_q: "Which sugary drink do you have most often?",
    btn_pd_drink_coke: "Coca-Cola",
    btn_pd_drink_pepsi: "Pepsi",
    btn_pd_drink_7up: "7Up",
    btn_pd_drink_sprite: "Sprite",
    btn_pd_drink_mtn: "Mountain Dew",
    btn_pd_drink_energy: "Energy drinks",
    btn_pd_drink_tea: "Sweet tea",
    btn_pd_drink_other: "Other",
    pd_crav_drink_other_q: "No problem — what sugary drink do you have most often?",
    pd_crav_drink_servings_q:
      "Got it — *{drink}*. How many servings do you usually drink each day or week?",
    // Step 2
    pd_crav_junk_q: "Which junk foods do you eat most often?",
    btn_pd_junk_burgers: "Burgers",
    btn_pd_junk_pizza: "Pizza",
    btn_pd_junk_fries: "Fries",
    btn_pd_junk_chips: "Chips",
    btn_pd_junk_biscuits: "Biscuits",
    btn_pd_junk_cakes: "Cakes",
    btn_pd_junk_choco: "Chocolate",
    btn_pd_junk_fast: "Fast food",
    btn_pd_junk_other: "Other",
    pd_crav_junk_other_q: "Which junk foods do you eat most often?",
    pd_crav_junk_freq_q:
      "Got it — *{junk}*. About how many times each week do you eat these foods?",
    // Step 3 — video share
    pd_crav_video:
      "Thanks. I'd like you to watch this short video — it explains how sugary drinks and ultra-processed foods can affect your long-term health.\n\n▶️ https://www.youtube.com/watch?v=DHma9_xQgD8&t=45s",
    // Step 4 — reflection
    pd_crav_reflection_q:
      "After watching the video, what changes do you think you could realistically make over the next few weeks?",
    // Step 5 — one small change
    pd_crav_commit_q: "If you had to make just one small change this week, what feels realistic?",
    btn_pd_commit_less_soda: "One less soft drink each day",
    btn_pd_commit_weekend_only: "Soft drinks only on weekends",
    btn_pd_commit_water: "Replace one sugary drink with water",
    btn_pd_commit_less_fast: "Fast food one less time each week",
    btn_pd_commit_skip_chips: "Skip chips during the week",
    btn_pd_commit_other: "Something else",
    pd_crav_commit_other_q: "Great — what one small change feels realistic this week?",
    // Step 6 — closing
    pd_crav_done:
      "That's a great commitment: *{commitment}*\n\nSmall changes repeated consistently can lead to big improvements over time. I'll remember your goal and encourage you along the way.\n\nWhen you're ready, try another Healthy Living activity from the menu to keep building healthy habits.",
    pd_crav_saved_short: "Saved. ✅",

    // ===== Better Me — for user_type=healthier (spec 2026-07) =====
    bm_menu_not_healthier:
      "The Better Me section is currently tailored for people who chose \"I want to live healthier\". You can update your profile if this changes.",
    bm_menu_title: "🌟 *Better Me*",
    bm_menu_intro: "Select one of the options below:",
    btn_bm_habit: "🎯 Build a New Habit",
    btn_bm_fitness: "🏋️ My Fitness Plan",
    btn_bm_wins: "⚡ 10-Minute Wins",
    btn_bm_journey: "❤️ My Health Journey",

    // Build a New Habit
    bm_habit_title: "🎯 *Build a New Habit*",
    bm_habit_intro: "Small daily habits build lifelong health. Pick one habit to start with:",
    bm_habit_water: "Drink more water",
    bm_habit_sleep: "Sleep earlier",
    bm_habit_walk: "Walk every day",
    bm_habit_exercise: "Exercise regularly",
    bm_habit_veggies: "Eat more vegetables",
    bm_habit_less_sugar: "Reduce sugar",
    bm_habit_quit_smoking: "Quit smoking",
    bm_habit_stress: "Reduce stress",
    bm_habit_read: "Read daily",
    bm_habit_pray: "Pray consistently",
    bm_habit_other: "Something else",
    bm_habit_other_q: "Great — describe the habit you'd like to build (in your own words).",
    bm_habit_why_q:
      "You chose *{habit}*. Why does this habit matter to you?\n\n_A short reason keeps you motivated on tough days._",
    bm_habit_days_q: "How many days each week can you realistically do this?",
    bm_habit_done:
      "✅ Habit set: *{habit}*\nTarget: *{days} day(s)/week*\n\nI'll cheer you on and use this in your future check-ins. Small, steady steps win the race.",

    // My Fitness Plan
    bm_fit_title: "🏋️ *My Fitness Plan*",
    bm_fit_intro:
      "Let's build a simple plan tailored to you. Three quick questions.",
    bm_fit_q1: "*1.* Have you been to a gym before?",
    btn_bm_fit_exp_never: "Never",
    btn_bm_fit_exp_beginner: "Beginner",
    btn_bm_fit_exp_regular: "Regular",
    bm_fit_q2: "*2.* How many days per week can you realistically exercise?",
    bm_fit_q3: "*3.* What's your main goal?",
    btn_bm_fit_goal_lose: "Lose weight",
    btn_bm_fit_goal_build: "Build muscle",
    btn_bm_fit_goal_fitness: "Improve fitness",
    btn_bm_fit_goal_overall: "Improve overall health",
    bm_fit_generating: "Building your fitness plan… 🏗",
    bm_fit_saved:
      "{plan}\n\n_Saved to your profile. Come back anytime to update or regenerate it._",
    bm_fit_error: "I couldn't generate a plan right now. Please try again in a moment.",
    btn_bm_fit_regen: "🔁 Regenerate My Plan",

    // 10-Minute Wins
    bm_wins_title: "⚡ *10-Minute Win*",
    bm_wins_prompt: "Here's your quick win:\n\n➡️ *{activity}*\n\nReady to give it a try?",
    btn_bm_wins_do: "✅ I'll Do It",
    btn_bm_wins_another: "🔄 Give Me Another",
    btn_bm_wins_done: "🎉 I Did It",
    bm_wins_go: "Great — go get it done. I'll check back in about 15 minutes to see how it went. 👊",
    bm_wins_check: "Welcome back! 😊\nDid you complete your 10-Minute Win?",
    btn_bm_wins_yes: "🎉 Yes",
    btn_bm_wins_notyet: "😔 Not Yet",
    bm_wins_yes:
      "Fantastic! Small wins like this build lifelong habits.\n\nWhen you're ready, try another Better Me activity from the menu.",
    bm_wins_notyet:
      "That's okay. Every small step counts. Try another one when you're ready.\n\nWhen you're ready, try another Better Me activity from the menu.",
    // Activity pool (reuses a broader mix for a general audience)
    bm_win_walk_block: "Walk around the block.",
    bm_win_stairs: "Climb the stairs for 10 minutes.",
    bm_win_stretch_tv: "Stretch while watching TV.",
    bm_win_home_workout: "Do a simple home workout.",
    bm_win_brisk_walk: "Take a brisk walk after your next meal.",
    bm_win_park_further: "Park further away and walk.",
    bm_win_phone_walk: "Walk while taking a phone call.",

    // My Health Journey
    bm_journey_title: "❤️ *My Health Journey*",
    bm_journey_conditions_have:
      "Here are the health conditions I have on file for you:\n\n{list}\n\nWould you like to add or update any?",
    bm_journey_conditions_none:
      "I don't have any health conditions on file for you yet. Would you like to add any?\n\n_Examples: High blood pressure, High cholesterol, Asthma, Arthritis, Fatty liver, PCOS, Sleep apnea, Thyroid problems._",
    bm_journey_conditions_prompt:
      "Type the condition(s) you'd like on file (separated by commas), or send *skip* to leave them as-is.",
    bm_journey_conditions_saved: "✅ Conditions updated.",
    bm_journey_goal_q: "What's the biggest health goal you'd like to achieve over the next year?",
    btn_bm_journey_lose: "Lose weight",
    btn_bm_journey_fit: "Get fitter",
    btn_bm_journey_sleep: "Sleep better",
    btn_bm_journey_quit: "Quit smoking",
    btn_bm_journey_stress: "Reduce stress",
    btn_bm_journey_energy: "Feel more energetic",
    btn_bm_journey_overall: "Improve my overall health",
    btn_bm_journey_other: "Something else",
    bm_journey_other_q: "Great — describe your one-year health goal in your own words.",
    bm_journey_done:
      "✅ Saved your one-year goal: *{goal}*\n\nI'll use this to personalise your coaching, reminders and progress reports. Consistency beats intensity — I'm with you every step. 💚",

    // ===== Pregnancy Support — for gestational diabetes users (spec 2026-07) =====
    pg_menu_not_gest:
      "The Pregnancy Support section is currently tailored for people with gestational diabetes. You can update your profile if this changes.",
    pg_menu_title: "🤰 *Pregnancy Support*",
    pg_menu_intro: "Select one of the options below:",
    btn_pg_progress: "🤰 Pregnancy Progress",
    btn_pg_healthy:  "🌼 Healthy Pregnancy",
    btn_pg_checklist: "👜 Pregnancy Checklist",

    // Profile-menu button (Main menu row)
    btn_p_pregnancy: "🤰 Pregnancy Support",

    // ---- Pregnancy Progress — first-time setup ----
    pg_prog_setup_intro:
      "Let's set up your pregnancy progress. 🤰\n\nI'll ask a few short questions so I can support you better during your pregnancy.",
    pg_prog_q_weeks: "*1.* How many weeks pregnant are you?\n_Examples: `24 weeks`, `28`, `I'm not sure`._",
    pg_prog_weeks_notsure: "No problem — we can add that later.",
    pg_prog_q_due: "*2.* What is your expected due date?\n_Examples: `15 October 2026`, `Not sure yet`._",
    pg_prog_due_notsure: "No problem — we can add that later.",
    pg_prog_q_first: "*3.* Is this your first pregnancy?",
    pg_prog_q_prev: "*4.* Have you had gestational diabetes before?",
    pg_prog_q_insulin: "*5.* Are you currently using insulin?",
    pg_prog_q_doctor: "*6.* Who is your pregnancy doctor or clinic?\n_Optional — tap Skip if you'd rather not share._",
    pg_prog_q_delivery: "*7.* Which hospital or clinic are you planning for delivery?\n_Optional — tap Skip._",

    btn_pg_yes: "✅ Yes",
    btn_pg_no: "❌ No",
    btn_pg_notsure: "Not Sure",

    pg_prog_saved:
      "Pregnancy progress saved. 🌼\nI'll use this information to support you with more relevant reminders, tips and coaching during your pregnancy.",

    // View screen
    pg_prog_view_title: "🤰 *Your Pregnancy Progress*",
    pg_prog_view_body:
      "*Weeks pregnant:* {weeks}\n*Due date:* {due}\n*First pregnancy:* {first}\n*Previous gestational diabetes:* {prev}\n*Using insulin:* {insulin}\n*Doctor/Clinic:* {doctor}\n*Delivery hospital:* {delivery}",
    pg_prog_field_empty: "—",
    btn_pg_edit_all: "✏️ Edit Details",
    btn_pg_update_week: "🔄 Update Pregnancy Week",
    pg_prog_update_week_q: "How many weeks pregnant are you now?\n_e.g. `29 weeks` or `I'm not sure`._",
    pg_prog_week_saved: "✅ Pregnancy week updated.",

    // ---- Healthy Pregnancy Tips ----
    pg_tip_header: "Today's Healthy Pregnancy Tip 🌼",
    btn_pg_tip_helpful: "👍 Helpful",
    btn_pg_tip_another: "🔄 Show Me Another",
    pg_tip_thanks: "Glad it helped. 🌼",
    pg_tip_placeholder:
      "New tips are being prepared and will be shared here soon. Check back in a bit! 🌼",

    // Built-in tip fallbacks (used when the admin content pool is empty)
    pg_tip_fallback_1: "Try to include protein with breakfast, such as eggs, yogurt or lentils. It may help you feel full and support steadier blood sugar.",
    pg_tip_fallback_2: "Sip water through the day. Staying well hydrated supports circulation, digestion and steadier blood sugar during pregnancy.",
    pg_tip_fallback_3: "A short 10–15 minute walk after your main meal can gently help your body use the carbs you ate.",
    pg_tip_fallback_4: "Choose whole-grain roti, brown rice or oats over refined white options — the fibre helps steady your sugar levels.",
    pg_tip_fallback_5: "Aim for a small snack every 3–4 hours (fruit + nuts, yogurt, egg on toast) so your sugar doesn't dip too low.",
    pg_tip_fallback_6: "Track how you feel after meals. Noticing patterns helps you and your doctor spot what works best for you.",
    pg_tip_fallback_7: "Rest is medicine too. Try to prioritise 7–9 hours of sleep; poor sleep can push sugar levels up the next day.",
    pg_tip_fallback_8: "Keep a small emergency snack in your bag (a fruit or a few nuts) in case a meal gets delayed.",

    // ---- Pregnancy Checklist ----
    pg_checklist_title: "👜 *Pregnancy Checklist*",
    pg_checklist_intro: "Tap a topic to open its checklist PDF.",
    pg_checklist_placeholder:
      "Checklists are being finalised and will appear here soon. 👜",
    pg_checklist_topic_missing: "This checklist isn't available anymore. Please choose another from the list.",
    pg_checklist_topic_no_pdf:
      "*{title}*\n\nThis checklist is being prepared and will be shared here soon.",
    pg_checklist_topic_open: "*{title}*\n\nHere's your checklist: {url}",

    // Fallback topic titles when the DB table is empty
    pg_cl_hospital_bag: "Hospital Bag Checklist",
    pg_cl_delivery_prep: "Preparing for Delivery",
    pg_cl_questions_dr: "Questions to Ask Your Doctor",
    pg_cl_glucose_testing: "Glucose Testing Checklist",
    pg_cl_newborn: "Newborn Essentials",
    pg_cl_breastfeeding: "Breastfeeding Basics",
    pg_cl_snacks: "Healthy Snacks During Pregnancy",
    pg_cl_activity: "Safe Activity During Pregnancy",
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
    askdrsaab_prompt:
      "السلام علیکم! میں *ڈاکٹر صاحب* ہوں۔\nذیابیطس، کھانے، ورزش، دواؤں یا اپنی صحت کے بارے میں کچھ بھی پوچھیں۔\n\n_مثالیں:_\n• کیا 145 بلڈ شوگر ٹھیک ہے؟\n• کیا میں آم کھا سکتا/سکتی ہوں؟\n• ناشتے میں کیا کھاؤں؟\n• میں دوا لینا بھول گیا/گئی۔\n• کیا آج ورزش کر سکتا/سکتی ہوں؟\n• صبح شوگر زیادہ کیوں ہوتی ہے؟\n• میری HbA1c رپورٹ سمجھائیں۔\n• کیا ذیابیطس والے رمضان میں روزہ رکھ سکتے ہیں؟\n\n_فارغ ہونے پر واپس دبائیں۔_",
    food_prompt:
      "🥗 *فوڈ کوچ*۔ اپنا کھانا بتائیں یا *پلیٹ کی تصویر بھیجیں*، میں کاربز کا اندازہ اور بہتر متبادل بتاؤں گا۔\n_مینو پر واپس دبائیں۔_",
    fitness_prompt:
      "🏃 *فٹنس کوچ*۔ اپنا دن یا توانائی بتائیں، میں محفوظ ورزش تجویز کروں گا۔\n_مینو پر واپس دبائیں۔_",
    lab_prompt:
      "📋 *اپنی رپورٹ سمجھیں*\n\nاپنی خون کی جانچ یا میڈیکل رپورٹ اپلوڈ کریں — تصویر بھیجیں یا ویلیوز ٹیکسٹ میں لکھیں۔\n\nمیں آپ کے نتائج آسان الفاظ میں سمجھاؤں گا، اہم چیزوں پر روشنی ڈالوں گا، اور بتاؤں گا کہ آپ کی ذیابیطس کے لیے اس کا کیا مطلب ہو سکتا ہے۔\n\n*قابل قبول رپورٹس:*\n• خون کے ٹیسٹ\n• HbA1c رپورٹ\n• کولیسٹرول / لپڈ پروفائل\n• گردے کے ٹیسٹ\n• جگر کے ٹیسٹ\n• پیشاب کے ٹیسٹ\n• ہسپتال کی لیبارٹری رپورٹس\n• ذیابیطس سے متعلق تحقیقات\n_مینو پر واپس دبائیں۔_",
    btn_upload_lab: "📎 تصویر اپلوڈ کریں",
    upload_lab_hint:
      "📸 بس رپورٹ کی تصویر منسلک کر کے بھیج دیں۔\n\n_چیٹ میں اٹیچ (پیپر کلپ) کے نشان پر کلک کریں، اپنی رپورٹ کی تصویر منتخب کریں اور بھیج دیں۔ میں تجزیہ کر کے آپ کے ریکارڈ میں محفوظ کر دوں گا۔_",
    lab_saved: "✅ آپ کی رپورٹ کا تجزیہ ہو گیا اور آپ کے صحت کے ریکارڈ میں محفوظ ہو گئی۔",
    lab_disclaimer:
      "_اہم: یہ وضاحت صرف آپ کی رپورٹ سمجھنے کے لیے ہے۔ کوئی بھی طبی فیصلہ کرنے یا علاج تبدیل کرنے سے پہلے اپنے ڈاکٹر سے مشورہ کریں۔_",
    lab_limit_reached:
      "💎 آپ اس ماہ *{limit}* مفت رپورٹ تجزیے استعمال کر چکے ہیں۔\nلامحدود رپورٹ تجزیہ اور مکمل رپورٹ ہسٹری کے لیے *Consistency Coach* پر اپ گریڈ کریں۔",
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
    error_ai_limit:
      "🤖 ابھی بہت زیادہ پیغامات آ رہے ہیں اور اے آئی کی عارضی حد پوری ہو گئی ہے۔ ایک منٹ بعد دوبارہ کوشش کریں — آپ کا ڈیٹا محفوظ ہے۔",
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
    ut_type1: "مجھے ٹائپ 1 ذیابیطس ہے",
    ut_type2: "مجھے ٹائپ 2 ذیابیطس ہے",
    ut_prediabetes: "مجھے پری ذیابیطس ہے",
    ut_gestational: "مجھے حملاتی ذیابیطس ہے",
    ut_healthier: "میں صحت مند زندگی چاہتا/چاہتی ہوں",

    ask_age_v2: "بہت خوب۔ آئیے شروع کرتے ہیں۔ آپ کی تاریخِ پیدائش کیا ہے؟\nبراہِ کرم دن، مہینہ اور سال بتائیں (مثلاً 12 مارچ 1985)۔",
    ask_dob_missing:
      "پوری تاریخِ پیدائش درکار ہے — براہِ کرم *{missing}* بھیجیں (مثلاً 12 مارچ 1985)۔",
    btn_multi_done: "مکمل",
    multi_select_hint: "_ایک سے زیادہ آپشن منتخب کریں، پھر مکمل دبائیں۔_",
    multi_select_selected: "*اب تک منتخب:* {list}",
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
    profile_complete_v2_noname:
      "بہترین ✅\nآپ کا پروفائل مکمل ہو گیا ہے۔\nاب میں اس معلومات کی بنیاد پر آپ کو ذاتی نوعیت کی رہنمائی، یاد دہانیاں، تعلیمی مواد اور پیش رفت کی نگرانی فراہم کر سکوں گا۔\n\nآئیے مل کر صحت مند عادات بناتے ہیں۔",
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
    goals_none: "آپ نے ابھی کوئی ہدف مقرر نہیں کیا۔ شروع کرنے کے لیے *ہدف شامل کریں* دبائیں۔",
    goals_current: "آپ کا موجودہ ہدف: *{goal}*",
    goals_list_header: "🎯 *میرے اہداف* — {count}/{max} فعال\n\nدیکھنے یا ترمیم کے لیے کسی ہدف پر دبائیں۔",
    goals_full: "آپ کے پہلے سے *{max}* فعال اہداف ہیں۔ نیا شامل کرنے سے پہلے کسی کو مکمل یا حذف کریں۔",
    goals_prompt: "اپنا بنیادی صحت کا ہدف ایک جملے میں بھیجیں (مثلاً *HbA1c کو 7 سے کم کرنا*)، یا واپس دبائیں۔",
    goals_saved: "✅ ہدف محفوظ ہو گیا: *{goal}*",
    btn_set_goal: "✏️ ہدف مقرر/تبدیل کریں",
    btn_goal_add: "➕ ہدف شامل کریں",
    btn_goal_edit: "✏️ ہدف میں ترمیم",
    btn_goal_complete: "✅ مکمل بطور نشان زد",
    btn_goal_delete: "🗑 ہدف حذف کریں",
    btn_goal_edit_title: "✏️ ہدف کا متن",
    btn_goal_edit_motivation: "💭 وجہ بدلیں",
    btn_goal_edit_target: "📅 تاریخ بدلیں",

    goal_pick_prompt: "ان اہداف میں سے ایک منتخب کریں — یا *دیگر* دبا کر اپنا لکھیں۔",
    goalsug_lower_a1c: "میرا HbA1c کم کرنا",
    goalsug_lose_weight: "وزن کم کرنا",
    goalsug_exercise_more: "زیادہ ورزش کرنا",
    goalsug_walk_more: "زیادہ چہل قدمی",
    goalsug_improve_blood_sugar: "بلڈ شوگر بہتر بنانا",
    goalsug_take_meds: "ادویات باقاعدگی سے لینا",
    goalsug_eat_healthy: "صحت مند کھانا",
    goalsug_improve_cholesterol: "کولیسٹرول بہتر بنانا",
    goalsug_improve_bp: "بلڈ پریشر بہتر بنانا",
    goalsug_sleep_better: "بہتر نیند",
    goalsug_prepare_surgery: "سرجری کی تیاری",
    goalsug_run_5k: "5K دوڑنا",
    goalsug_other: "✏️ دیگر (خود لکھیں)",

    goal_custom_prompt: "اپنا ہدف اپنے الفاظ میں لکھیں (ایک لائن)۔\n_مثال:_ گرمیوں تک 5 کلو وزن کم کرنا۔",
    goal_motivation_prompt:
      "*یہ ہدف آپ کے لیے کیوں اہم ہے؟* (اختیاری — چھوڑنے کے لیے Skip دبائیں۔)\n\n_مثالیں:_\n• میں اپنے بچوں کے لیے صحت مند رہنا چاہتا/چاہتی ہوں۔\n• میں زیادہ پُراعتماد محسوس کرنا چاہتا/چاہتی ہوں۔\n• ڈاکٹر نے کہا کہ بہتری لازمی ہے۔",
    goal_motivation_saved: "💭 نوٹ کر لیا — آپ کی وجہ محفوظ ہے۔",
    goal_target_prompt:
      "*ہدف کی تاریخ مقرر کریں؟* (اختیاری — چاہیں تو Skip دبائیں۔)\n\nحقیقی تاریخ (مثلاً `31 دسمبر 2026`) یا تخمینی مدت (`6 ماہ میں`, `عید سے پہلے`) بھیجیں۔",
    goal_target_saved: "📅 تاریخ نوٹ کر لی۔",
    goal_target_skipped: "کوئی تاریخ نہیں — کوئی بات نہیں۔",
    goal_added: "✅ *ہدف شامل ہو گیا*\n\n🎯 {goal}\n\nمیں یہ آپ کی کوچنگ اور پیش رفت رپورٹ میں شامل کروں گا۔",

    goal_detail_title: "🎯 *{goal}*",
    goal_detail_motivation: "💭 *وجہ:* {motivation}",
    goal_detail_target: "📅 *ہدف تاریخ:* {target}",
    goal_detail_no_motivation: "_ابھی وجہ درج نہیں۔_",
    goal_detail_no_target: "_کوئی ہدف تاریخ نہیں۔_",
    goal_completed_ack: "🎉 ہدف مکمل بطور نشان زد ہو گیا۔ شاباش!",
    goal_deleted_ack: "🗑 ہدف حذف ہو گیا۔",

    goal_edit_title_prompt: "اس ہدف کا نیا متن (ایک لائن) بھیجیں۔",
    goal_edit_motivation_prompt: "نئی وجہ بھیجیں — یہ ہدف آپ کے لیے کیوں اہم ہے؟ (Skip دبائیں تو خالی ہو جائے گا۔)",
    goal_edit_target_prompt:
      "نئی ہدف تاریخ بھیجیں (مثلاً `31 دسمبر 2026`, `3 ماہ میں`, `رمضان سے پہلے`)۔ Skip دبائیں تو خالی۔",

    goal_review_prompt: "📅 آج آپ کے ہدف کی مقررہ تاریخ ہے:\n*{goal}*\n\nکیا آپ نے ہدف حاصل کر لیا؟",
    btn_goal_review_yes: "🎉 جی ہاں",
    btn_goal_review_notyet: "😔 ابھی نہیں",
    goal_review_yes_prompt: "مبارک ہو! 🎉 اب اس ہدف کے ساتھ کیا کرنا چاہیں گے؟",
    goal_review_notyet_prompt: "کوئی بات نہیں — ترقی میں وقت لگتا ہے۔ اب کیا کرنا چاہیں گے؟",
    btn_goal_review_new: "🆕 نیا ہدف مقرر کریں",
    btn_goal_review_continue: "🔄 یہ ہدف جاری رکھیں",
    btn_goal_review_remove: "🗑 یہ ہدف حذف کریں",
    btn_goal_review_update_target: "✏️ تاریخ اپڈیٹ کریں",
    goal_review_continue_ack: "🔄 ہدف فعال ہے۔ میں آپ کا ساتھ دوں گا۔",
    goal_review_remove_ack: "🗑 ہدف حذف ہو گیا۔ کوشش پر شاباش۔",
    goal_review_update_target_prompt:
      "نئی ہدف تاریخ کیا ہے؟ کوئی تاریخ یا تخمینہ (مثلاً `6 ماہ میں`) بھیجیں۔",

    progress_generating: "📈 آپ کی پیش رفت رپورٹ تیار ہو رہی ہے…",
    progress_low_data:
      "📈 *آپ کی پیش رفت*\n\nمفید رپورٹ کے لیے ابھی کافی معلومات نہیں۔ چند بلڈ شوگر ریڈنگز، وزن، یا چیک اِن لاگ کریں، اور DrSaab سے باقاعدہ بات کریں۔ جتنا آپ استعمال کریں گے، رپورٹ اتنی ہی بہتر ہو گی۔",
    progress_goals_header: "🎯 *میرے اہداف*",
    progress_no_goals: "_ابھی کوئی ہدف نہیں — Goals & Progress سے شامل کریں۔_",
    progress_free_upgrade:
      "🔒 *پریمیم* حاصل کریں:\n• تفصیلی پیش رفت رپورٹس\n• ہدف ٹریکنگ\n• ذاتی اے آئی سفارشات\n• جدید رجحان تجزیہ\n• ڈاکٹر کے لیے تیار خلاصے",
    progress_upgrade_cta: "⭐ ابھی اپ گریڈ کریں",
    progress_paid_intro:
      "یہ آپ کی ذاتی پیش رفت رپورٹ ہے — آپ کے اہداف، بلڈ شوگر، وزن، سرگرمی، ادویات، تندرستی اور لیب نتائج کے حساب سے۔",
    scores_title: "📊 *آپ کے اسکور* (100 میں سے)",
    reports_title: "📑 *رپورٹس*",
    challenges_title: "🏆 *چیلنجز*",
    exec_title: "⭐ *ایگزیکٹو سروسز*",

    // ===== More section v2 (2026-07 spec) =====
    more_subtitle: "براہِ کرم درج ذیل میں سے ایک منتخب کریں:",
    btn_more_subscription_v2: "💳 میری سبسکرپشن",
    btn_more_account: "👤 میرا اکاؤنٹ",

    reminders_prefs_title: "🔔 *یاد دہانیاں*",
    reminders_prefs_intro:
      "منتخب کریں کہ آپ کون سی یاد دہانیاں وصول کرنا چاہتے ہیں۔ آن یا آف کرنے کے لیے کسی زمرے پر دبائیں۔",
    rem_cat_blood_sugar: "🩸 بلڈ شوگر",
    rem_cat_medication: "💊 ادویات چیک اِن",
    rem_cat_goals: "🎯 اہداف کی یاد دہانی",
    rem_cat_coaching: "💬 کوچنگ پیغامات",
    rem_cat_on: "آن",
    rem_cat_off: "آف",
    rem_pref_row: "{icon} {label} — {state}",
    rem_pref_updated: "✅ *{label}* اب *{state}* ہے۔",
    reminders_scheduled_header: "*آپ کی مقرر شدہ یاد دہانیاں*",
    reminders_scheduled_none: "_ابھی کوئی مقرر شدہ یاد دہانی نہیں ہے۔_",

    sub_title: "💳 *میری سبسکرپشن*",
    sub_current_plan: "*موجودہ پلان:* {plan}",
    sub_features_header: "*شامل خصوصیات:*",
    sub_renewal: "*تجدید:* {date}",
    sub_no_renewal: "_مفت پلان — کوئی تجدید کی تاریخ نہیں۔_",
    sub_features_free:
      "• روزانہ چیک اِن اور شوگر/ادویات لاگ\n• بنیادی Ask DrSaab\n• Learn لائبریری\n• ماہانہ چند لیب رپورٹ وضاحتیں",
    sub_features_consistency:
      "• Starter کی سب سہولیات\n• مکمل Ask DrSaab، لامحدود لیب وضاحتیں\n• My Progress کے چاروں اسکور\n• ہفتہ وار و ماہانہ رپورٹس\n• ڈاکٹر کے لیے تیار رپورٹ\n• سمارٹ یاد دہانیاں\n• تمام چیلنجز",
    sub_features_executive:
      "• Consistency Coach کی سب سہولیات\n• ڈاکٹر کیس ریویو\n• لائیو کوچ سیشنز\n• 3 ماہی ایگزیکٹو ریویو\n• ترجیحی مدد\n• پریمیم مواد",
    btn_sub_upgrade: "⭐ پلان اپ گریڈ کریں",
    btn_sub_manage: "💳 سبسکرپشن منظم کریں",
    btn_sub_billing: "📄 بلنگ ہسٹری دیکھیں",
    sub_manage_stub:
      "سبسکرپشن مینجمنٹ جلد آ رہا ہے۔ ابھی کے لیے پلان تبدیل یا منسوخ کرنے کے لیے support@drsaabcoach.com پر رابطہ کریں۔",
    sub_billing_stub: "بلنگ ہسٹری جلد آ رہی ہے — تب تک ہم آپ کو انوائسز ای میل کرتے رہیں گے۔",

    account_title: "👤 *میرا اکاؤنٹ*",
    account_body:
      "*نام:* {name}\n*ای میل:* {email}\n*واٹس ایپ نمبر:* {whatsapp}\n*ممبر شپ کی تاریخ:* {joined}\n*ذیابیطس کی قسم:* {diabetes}",
    account_field_empty: "—",
    btn_account_edit: "✏️ پروفائل ترمیم کریں",
    btn_account_deactivate: "⏸️ اکاؤنٹ عارضی طور پر بند کریں",
    btn_account_close: "🗑 اکاؤنٹ مکمل بند کریں",
    edit_profile_stub:
      "براہِ راست ترمیم جلد آ رہی ہے۔ ابھی کے لیے مجھے بتائیں کہ آپ کیا تبدیل کرنا چاہتے ہیں اور میں اپڈیٹ کرنے میں مدد کروں گا۔",

    deactivate_confirm_title: "⏸️ *اکاؤنٹ عارضی بند*",
    deactivate_confirm_body:
      "کیا آپ واقعی اپنا اکاؤنٹ عارضی طور پر بند کرنا چاہتے ہیں؟\n\nڈاکٹر صاحب پیغامات اور یاد دہانیاں بھیجنا بند کر دے گا، لیکن آپ کا اکاؤنٹ اور صحت کی معلومات محفوظ رہیں گی تاکہ آپ کسی بھی وقت واپس آ سکیں۔",
    btn_confirm_deactivate: "✅ عارضی بند کریں",
    btn_cancel: "منسوخ",
    deactivate_done:
      "⏸️ آپ کا اکاؤنٹ عارضی طور پر بند کر دیا گیا ہے۔\n\nکوچنگ اور یاد دہانیاں رک جائیں گی۔ جب چاہیں کوئی بھی پیغام بھیج دیں، میں دوبارہ فعال کر دوں گا۔",
    reactivated_welcome:
      "👋 واپسی مبارک، *{name}*! آپ کا اکاؤنٹ دوبارہ فعال ہو گیا ہے۔ آپ کا ڈیٹا اور سیٹنگز ویسے ہی محفوظ ہیں جیسے آپ چھوڑ کر گئے تھے۔",

    close_confirm_title: "🗑 *اکاؤنٹ مکمل بند*",
    close_confirm_body:
      "کیا آپ واقعی اپنا ڈاکٹر صاحب اکاؤنٹ مکمل بند کرنا چاہتے ہیں؟\n\nاس کے بعد آپ اپنے اکاؤنٹ تک رسائی حاصل نہیں کر سکیں گے۔\n\nکچھ صحت کے ریکارڈ اور اکاؤنٹ کی معلومات ہماری پرائیویسی پالیسی اور قانونی تقاضوں کے تحت محفوظ رکھی جا سکتی ہیں۔",
    btn_confirm_close: "🗑 اکاؤنٹ بند کریں",
    close_done:
      "🗑 آپ کا ڈاکٹر صاحب اکاؤنٹ بند کر دیا گیا ہے۔ آپ کے ہمارے ساتھ گزارے گئے وقت کا شکریہ — اپنا خیال رکھیے گا۔",
    account_closed_reply:
      "یہ ڈاکٹر صاحب اکاؤنٹ بند کر دیا گیا ہے اور اب استعمال نہیں ہو سکتا۔ اگر آپ ڈاکٹر صاحب دوبارہ استعمال کرنا چاہتے ہیں تو نئے صارف کے طور پر رجسٹر کریں۔",

    // ٹائپ 1 کمیونٹی — T1 صارفین کے لیے اعلیٰ سطح کا مینو
    t1c_menu_title: "🤝 *ٹائپ 1 کمیونٹی*",
    t1c_menu_intro:
      "پاکستان میں ٹائپ 1 ذیابیطس کے ساتھ رہنے والوں کے لیے قابلِ اعتماد وسائل، تعلیم اور کمیونٹی سپورٹ۔ ایک سیکشن منتخب کریں:",
    t1c_menu_not_t1:
      "ٹائپ 1 کمیونٹی سیکشن صرف ٹائپ 1 ذیابیطس والے صارفین کے لیے دستیاب ہے۔ اگر آپ کی حالت بدلی ہو تو اپنی پروفائل اپڈیٹ کریں۔",
    btn_t1c_support: "🤝 سپورٹ نیٹ ورک",
    btn_t1c_blogs: "📚 آپ کے لیے بلاگز",
    btn_t1c_videos: "🎥 آپ کے لیے ویڈیوز",
    btn_t1c_dailylife: "🧑‍🏫 روزمرہ زندگی",
    btn_t1c_events: "📅 قریبی تقریبات",
    t1c_support_title: "🤝 *سپورٹ نیٹ ورک*",
    t1c_blogs_title: "📚 *آپ کے لیے بلاگز*",
    t1c_videos_title: "🎥 *آپ کے لیے ویڈیوز*",
    t1c_dailylife_title: "🧑‍🏫 *روزمرہ زندگی*",
    t1c_events_title: "📅 *قریبی تقریبات*",
    t1c_placeholder_body:
      "مواد جلد آ رہا ہے۔ ہم پاکستان بھر کی معتبر ذیابیطس تنظیموں کے ساتھ مل کر آپ کے لیے منتخب سپورٹ لا رہے ہیں۔ جلد دوبارہ چیک کریں!",
    t1c_dailylife_intro:
      "ٹائپ 1 ذیابیطس کے ساتھ روزمرہ کے حالات کے لیے عملی رہنمائی۔ ایک زمرہ منتخب کریں:",
    btn_t1c_dl_children: "👨‍👩‍👧 بچے اور والدین",
    btn_t1c_dl_teens: "🧑‍🎓 نوجوان",
    btn_t1c_dl_adults: "🧑‍💼 بالغ",
    t1c_dl_cat_children: "👨‍👩‍👧 *بچے اور والدین*",
    t1c_dl_cat_teens: "🧑‍🎓 *نوجوان*",
    t1c_dl_cat_adults: "🧑‍💼 *بالغ*",
    t1c_dl_pick_topic: "گائیڈ کھولنے کے لیے موضوع منتخب کریں:",
    t1c_dl_topic_missing: "یہ موضوع اب دستیاب نہیں۔ فہرست سے کوئی اور منتخب کریں۔",
    t1c_dl_topic_no_pdf:
      "*{title}*\n\nاس موضوع کی گائیڈ تیار ہو رہی ہے اور جلد یہاں شیئر کر دی جائے گی۔",
    t1c_dl_topic_open:
      "*{title}*\n\nیہ رہی گائیڈ: {url}",

    // ٹائپ 1 ذیابیطس — وقتی خود اعتمادی چیک
    t1c_prompt: "❤️ *آپ ٹائپ 1 ذیابیطس کو سنبھالنے میں کتنے پُراعتماد محسوس کرتے ہیں؟*",
    t1c_btn_very: "😊 بہت پُراعتماد",
    t1c_btn_mostly: "🙂 زیادہ تر پُراعتماد",
    t1c_btn_sometimes: "😐 کبھی کبھی مشکل",
    t1c_btn_help: "😟 مجھے مزید مدد چاہیے",
    t1c_reply_very:
      "بہت خوب — آپ واقعی اچھا کر رہے ہیں۔ میں ہماری گفتگو ہلکی رکھوں گا اور آپ کی کامیابیاں مناتا رہوں گا۔ 🌟",
    t1c_reply_mostly:
      "یہ سن کر خوشی ہوئی۔ جہاں سب سے زیادہ ضرورت ہو، میں وہاں آپ کا ساتھ دیتا رہوں گا۔ 💚",
    t1c_reply_sometimes:
      "بتانے کا شکریہ۔ جو حصے آپ کو مشکل لگتے ہیں، میں ان پر زیادہ توجہ دوں گا اور جلد مدد پیش کروں گا۔",
    t1c_reply_help:
      "میں سمجھ سکتا ہوں — کچھ دن ٹائپ 1 کے ساتھ گزارنا مشکل ہوتا ہے۔ میں آپ کے لیے مزید رہنمائی اور کمیونٹی سپورٹ لاؤں گا۔ آپ اکیلے نہیں ہیں۔ ❤️",

    // Prediabetes — Healthy Living menu (spec 2026-07)
    pd_menu_not_pre:
      "صحت مند زندگی کا سیکشن فی الحال پری ذیابیطس والے صارفین کے لیے ہے۔ اگر آپ کی صورتحال بدلی ہو تو پروفائل اپڈیٹ کر سکتے ہیں۔",
    pd_menu_title: "💪 *صحت مند زندگی*",
    pd_menu_intro: "روزانہ کی چھوٹی کامیابیاں بڑی بیماریوں کو روکتی ہیں۔ شروعات کے لیے ایک آپشن چنیں:",
    btn_pd_wins: "⚡ 10 منٹ کی کامیابیاں",
    btn_pd_gym: "🏋️ میرا جِم پلان",
    btn_pd_cravings: "🍟 خواہشات پر قابو",

    pd_wins_title: "⚡ *10 منٹ کی کامیابی*",
    pd_wins_prompt: "یہ رہی آپ کی جلدی کامیابی:\n\n➡️ *{activity}*\n\nآزمانے کے لیے تیار؟",
    btn_pd_wins_do: "✅ میں کروں گا/گی",
    btn_pd_wins_another: "🔄 دوسری بتائیں",
    btn_pd_wins_done: "🎉 مکمل کر لیا",
    pd_wins_go: "بہترین — کر کے آئیں۔ میں تقریباً 15 منٹ بعد پوچھوں گا کہ کیسا رہا۔ 👊",
    pd_wins_check: "خوش آمدید! 😊\nکیا آپ نے اپنی 10 منٹ کی کامیابی مکمل کی؟",
    btn_pd_wins_yes: "🎉 ہاں",
    btn_pd_wins_notyet: "😔 ابھی نہیں",
    pd_wins_yes:
      "شاندار! ایسی چھوٹی کامیابیاں زندگی بھر کی عادات بناتی ہیں۔\n\nجب تیار ہوں، مینو سے صحت مند زندگی کی کوئی اور سرگرمی آزمائیں۔",
    pd_wins_notyet:
      "کوئی بات نہیں۔ دن میں ایک اور موقع ضرور آئے گا۔ ہر چھوٹا قدم اہم ہے۔\n\nجب تیار ہوں، مینو سے صحت مند زندگی کی کوئی اور سرگرمی آزمائیں۔",
    pd_win_walk_office: "اپنے دفتر کی عمارت کے گرد چہل قدمی کریں۔",
    pd_win_walk_block: "بلاک کے گرد چہل قدمی کریں۔",
    pd_win_stairs: "10 منٹ تک سیڑھیاں چڑھیں۔",
    pd_win_stretch_tv: "ٹی وی دیکھتے ہوئے اسٹریچ کریں۔",
    pd_win_home_workout: "گھر پر آسان ورزش کریں۔",
    pd_win_brisk_walk: "اگلے کھانے کے بعد تیز چہل قدمی کریں۔",
    pd_win_park_further: "دور پارک کریں اور چل کر جائیں۔",
    pd_win_phone_walk: "فون پر بات کرتے ہوئے چہل قدمی کریں۔",

    pd_gym_title: "🏋️ *میرا جِم پلان*",
    pd_gym_intro:
      "آئیے ایک آسان ابتدائی روٹین بناتے ہیں۔ تین مختصر سوالات اور آپ کا پلان تیار۔",
    pd_gym_q1: "*1.* کیا آپ پہلے کبھی جِم گئے ہیں؟",
    btn_pd_gym_exp_never: "کبھی نہیں",
    btn_pd_gym_exp_beginner: "ابتدائی",
    btn_pd_gym_exp_regular: "باقاعدہ",
    pd_gym_q2: "*2.* ہفتے میں کتنے دن ورزش کر سکتے ہیں؟",
    pd_gym_q3: "*3.* آپ کا اصل مقصد کیا ہے؟",
    btn_pd_gym_goal_lose: "وزن کم کرنا",
    btn_pd_gym_goal_build: "پٹھے بنانا",
    btn_pd_gym_goal_fitness: "فٹنس بہتر کرنا",
    btn_pd_gym_goal_bloodsugar: "شوگر بہتر کرنا",
    pd_gym_generating: "بہترین — آپ کا پلان تیار کر رہا ہوں… 🏗",
    pd_gym_saved:
      "{plan}\n\n_آپ کی پروفائل میں محفوظ کر لیا گیا۔ کسی بھی وقت واپس آ کر یہ پلان دوبارہ بنا سکتے ہیں۔_",
    pd_gym_error:
      "ابھی پلان تیار نہیں ہو سکا۔ ذرا بعد میں دوبارہ کوشش کیجیے۔",
    btn_pd_gym_regen: "🔁 پلان دوبارہ بنائیں",

    pd_crav_title: "🍟 *خواہشات پر قابو*",
    pd_crav_intro:
      "اپنی عادات کو سمجھنا پہلا قدم ہے۔ ایک وقت میں ایک چھوٹی تبدیلی کرتے ہیں۔",
    pd_crav_drink_q: "کون سا میٹھا مشروب آپ سب سے زیادہ پیتے ہیں؟",
    btn_pd_drink_coke: "کوکا کولا",
    btn_pd_drink_pepsi: "پیپسی",
    btn_pd_drink_7up: "سیون اپ",
    btn_pd_drink_sprite: "اسپرائٹ",
    btn_pd_drink_mtn: "ماؤنٹین ڈیو",
    btn_pd_drink_energy: "انرجی ڈرنکس",
    btn_pd_drink_tea: "میٹھی چائے",
    btn_pd_drink_other: "دیگر",
    pd_crav_drink_other_q: "کوئی بات نہیں — کون سا میٹھا مشروب زیادہ پیتے ہیں؟",
    pd_crav_drink_servings_q:
      "سمجھ گیا — *{drink}*. آپ روزانہ یا ہفتے میں کتنی بار پیتے ہیں؟",
    pd_crav_junk_q: "کون سا جنک فوڈ آپ سب سے زیادہ کھاتے ہیں؟",
    btn_pd_junk_burgers: "برگر",
    btn_pd_junk_pizza: "پیزا",
    btn_pd_junk_fries: "فرائز",
    btn_pd_junk_chips: "چپس",
    btn_pd_junk_biscuits: "بسکٹ",
    btn_pd_junk_cakes: "کیک",
    btn_pd_junk_choco: "چاکلیٹ",
    btn_pd_junk_fast: "فاسٹ فوڈ",
    btn_pd_junk_other: "دیگر",
    pd_crav_junk_other_q: "کون سا جنک فوڈ آپ سب سے زیادہ کھاتے ہیں؟",
    pd_crav_junk_freq_q:
      "سمجھ گیا — *{junk}*. ہفتے میں تقریباً کتنی بار کھاتے ہیں؟",
    pd_crav_video:
      "شکریہ۔ ایک مختصر ویڈیو دیکھیں — یہ بتاتی ہے کہ میٹھے مشروبات اور الٹرا پروسیسڈ فوڈز آپ کی طویل مدتی صحت پر کیسے اثر ڈالتے ہیں۔\n\n▶️ https://www.youtube.com/watch?v=DHma9_xQgD8&t=45s",
    pd_crav_reflection_q:
      "ویڈیو دیکھنے کے بعد آپ کے خیال میں آنے والے ہفتوں میں کون سی حقیقی تبدیلیاں کر سکتے ہیں؟",
    pd_crav_commit_q: "اگر اِس ہفتے صرف ایک چھوٹی تبدیلی کرنی ہو، تو کیا حقیقت پسندانہ لگتا ہے؟",
    btn_pd_commit_less_soda: "روز ایک میٹھا مشروب کم",
    btn_pd_commit_weekend_only: "میٹھے مشروبات صرف ویک اینڈ پر",
    btn_pd_commit_water: "ایک میٹھے مشروب کی جگہ پانی",
    btn_pd_commit_less_fast: "ہفتے میں فاسٹ فوڈ ایک بار کم",
    btn_pd_commit_skip_chips: "ہفتے میں چپس نہ کھانا",
    btn_pd_commit_other: "کچھ اور",
    pd_crav_commit_other_q: "بہت خوب — اِس ہفتے کیا چھوٹی تبدیلی حقیقی لگتی ہے؟",
    pd_crav_done:
      "یہ بہت اچھا وعدہ ہے: *{commitment}*\n\nچھوٹی تبدیلیاں مستقل مزاجی سے بڑی بہتری لاتی ہیں۔ میں آپ کا مقصد یاد رکھوں گا اور راستے میں حوصلہ افزائی کرتا رہوں گا۔\n\nجب تیار ہوں، صحت مند عادات جاری رکھنے کے لیے مینو سے کوئی اور سرگرمی آزمائیں۔",
    pd_crav_saved_short: "محفوظ ہو گیا۔ ✅",

    // ===== Better Me — for user_type=healthier (spec 2026-07) =====
    bm_menu_not_healthier:
      "Better Me سیکشن ان صارفین کے لیے ہے جنہوں نے \"صحت مند زندگی\" منتخب کی ہو۔ اگر آپ کی صورتحال بدلی ہو تو پروفائل اپڈیٹ کر سکتے ہیں۔",
    bm_menu_title: "🌟 *Better Me*",
    bm_menu_intro: "براہِ کرم درج ذیل میں سے ایک منتخب کریں:",
    btn_bm_habit: "🎯 نئی عادت بنائیں",
    btn_bm_fitness: "🏋️ میرا فٹنس پلان",
    btn_bm_wins: "⚡ 10 منٹ کی کامیابیاں",
    btn_bm_journey: "❤️ میرا صحت کا سفر",

    bm_habit_title: "🎯 *نئی عادت بنائیں*",
    bm_habit_intro: "روزانہ کی چھوٹی عادات زندگی بھر کی صحت بناتی ہیں۔ شروع کرنے کے لیے ایک عادت چنیں:",
    bm_habit_water: "زیادہ پانی پیئں",
    bm_habit_sleep: "جلدی سوئیں",
    bm_habit_walk: "روزانہ چہل قدمی کریں",
    bm_habit_exercise: "باقاعدہ ورزش کریں",
    bm_habit_veggies: "زیادہ سبزیاں کھائیں",
    bm_habit_less_sugar: "چینی کم کریں",
    bm_habit_quit_smoking: "سگریٹ چھوڑیں",
    bm_habit_stress: "ذہنی دباؤ کم کریں",
    bm_habit_read: "روزانہ مطالعہ کریں",
    bm_habit_pray: "پابندی سے نماز پڑھیں",
    bm_habit_other: "کچھ اور",
    bm_habit_other_q: "بہت خوب — وہ عادت اپنے الفاظ میں لکھیں جو آپ اپنانا چاہتے ہیں۔",
    bm_habit_why_q:
      "آپ نے *{habit}* چنی۔ یہ عادت آپ کے لیے کیوں اہم ہے؟\n\n_ایک مختصر وجہ مشکل دنوں میں حوصلہ برقرار رکھتی ہے۔_",
    bm_habit_days_q: "ہفتے میں کتنے دن آپ حقیقت پسندانہ طور پر یہ کر سکتے ہیں؟",
    bm_habit_done:
      "✅ عادت طے: *{habit}*\nہدف: *ہفتے میں {days} دن*\n\nمیں آپ کا ساتھ دوں گا اور آنے والے چیک اِن میں یہ استعمال کروں گا۔ چھوٹے ثابت قدم قدم کامیاب ہوتے ہیں۔",

    bm_fit_title: "🏋️ *میرا فٹنس پلان*",
    bm_fit_intro:
      "آئیے آپ کے لیے ایک آسان پلان بناتے ہیں۔ تین مختصر سوالات۔",
    bm_fit_q1: "*1.* کیا آپ پہلے کبھی جِم گئے ہیں؟",
    btn_bm_fit_exp_never: "کبھی نہیں",
    btn_bm_fit_exp_beginner: "ابتدائی",
    btn_bm_fit_exp_regular: "باقاعدہ",
    bm_fit_q2: "*2.* ہفتے میں کتنے دن ورزش کر سکتے ہیں؟",
    bm_fit_q3: "*3.* آپ کا اصل مقصد کیا ہے؟",
    btn_bm_fit_goal_lose: "وزن کم کرنا",
    btn_bm_fit_goal_build: "پٹھے بنانا",
    btn_bm_fit_goal_fitness: "فٹنس بہتر کرنا",
    btn_bm_fit_goal_overall: "مجموعی صحت بہتر کرنا",
    bm_fit_generating: "آپ کا فٹنس پلان تیار کر رہا ہوں… 🏗",
    bm_fit_saved:
      "{plan}\n\n_آپ کی پروفائل میں محفوظ کر لیا گیا۔ کسی بھی وقت واپس آ کر اپڈیٹ یا دوبارہ بنا سکتے ہیں۔_",
    bm_fit_error: "ابھی پلان تیار نہیں ہو سکا۔ ذرا بعد میں دوبارہ کوشش کیجیے۔",
    btn_bm_fit_regen: "🔁 پلان دوبارہ بنائیں",

    bm_wins_title: "⚡ *10 منٹ کی کامیابی*",
    bm_wins_prompt: "یہ رہی آپ کی جلدی کامیابی:\n\n➡️ *{activity}*\n\nآزمانے کے لیے تیار؟",
    btn_bm_wins_do: "✅ میں کروں گا/گی",
    btn_bm_wins_another: "🔄 دوسری بتائیں",
    btn_bm_wins_done: "🎉 مکمل کر لیا",
    bm_wins_go: "بہترین — کر کے آئیں۔ میں تقریباً 15 منٹ بعد پوچھوں گا کہ کیسا رہا۔ 👊",
    bm_wins_check: "خوش آمدید! 😊\nکیا آپ نے اپنی 10 منٹ کی کامیابی مکمل کی؟",
    btn_bm_wins_yes: "🎉 ہاں",
    btn_bm_wins_notyet: "😔 ابھی نہیں",
    bm_wins_yes:
      "شاندار! ایسی چھوٹی کامیابیاں زندگی بھر کی عادات بناتی ہیں۔\n\nجب تیار ہوں، مینو سے Better Me کی کوئی اور سرگرمی آزمائیں۔",
    bm_wins_notyet:
      "کوئی بات نہیں۔ ہر چھوٹا قدم اہم ہے۔ جب تیار ہوں، دوبارہ کوشش کریں۔\n\nجب تیار ہوں، مینو سے Better Me کی کوئی اور سرگرمی آزمائیں۔",
    bm_win_walk_block: "بلاک کے گرد چہل قدمی کریں۔",
    bm_win_stairs: "10 منٹ تک سیڑھیاں چڑھیں۔",
    bm_win_stretch_tv: "ٹی وی دیکھتے ہوئے اسٹریچ کریں۔",
    bm_win_home_workout: "گھر پر آسان ورزش کریں۔",
    bm_win_brisk_walk: "اگلے کھانے کے بعد تیز چہل قدمی کریں۔",
    bm_win_park_further: "دور پارک کریں اور چل کر جائیں۔",
    bm_win_phone_walk: "فون پر بات کرتے ہوئے چہل قدمی کریں۔",

    bm_journey_title: "❤️ *میرا صحت کا سفر*",
    bm_journey_conditions_have:
      "آپ کے پروفائل میں یہ صحت کے مسائل درج ہیں:\n\n{list}\n\nکیا آپ کوئی چیز شامل یا اپڈیٹ کرنا چاہیں گے؟",
    bm_journey_conditions_none:
      "ابھی آپ کے پروفائل میں کوئی صحت کا مسئلہ درج نہیں۔ کیا آپ کوئی شامل کرنا چاہیں گے؟\n\n_مثالیں: ہائی بلڈ پریشر، ہائی کولیسٹرول، دمہ، جوڑوں کا درد، فیٹی لیور، PCOS، سلیپ ایپنیا، تھائیرائیڈ۔_",
    bm_journey_conditions_prompt:
      "جو مسائل درج کرنا چاہتے ہیں لکھیں (کاما سے الگ کریں)، یا *skip* لکھ دیں۔",
    bm_journey_conditions_saved: "✅ صحت کے مسائل اپڈیٹ ہو گئے۔",
    bm_journey_goal_q: "اگلے ایک سال میں آپ کا سب سے بڑا صحت کا ہدف کیا ہے؟",
    btn_bm_journey_lose: "وزن کم کرنا",
    btn_bm_journey_fit: "فٹ ہونا",
    btn_bm_journey_sleep: "بہتر نیند",
    btn_bm_journey_quit: "سگریٹ چھوڑنا",
    btn_bm_journey_stress: "دباؤ کم کرنا",
    btn_bm_journey_energy: "زیادہ توانا محسوس کرنا",
    btn_bm_journey_overall: "مجموعی صحت بہتر کرنا",
    btn_bm_journey_other: "کچھ اور",
    bm_journey_other_q: "بہت خوب — اپنا ایک سالہ صحت کا ہدف اپنے الفاظ میں لکھیں۔",
    bm_journey_done:
      "✅ ایک سالہ ہدف محفوظ ہو گیا: *{goal}*\n\nمیں یہ آپ کی کوچنگ، یاد دہانیوں اور رپورٹس میں شامل کروں گا۔ مستقل مزاجی شدت پر بھاری ہے — میں ہر قدم پر آپ کے ساتھ ہوں۔ 💚",

    // ===== Pregnancy Support — for gestational diabetes users (spec 2026-07) =====
    pg_menu_not_gest:
      "Pregnancy Support سیکشن حملاتی ذیابیطس کی حامل صارفین کے لیے ہے۔ اگر آپ کی صورتحال بدلی ہو تو پروفائل اپڈیٹ کر سکتے ہیں۔",
    pg_menu_title: "🤰 *حمل کی سپورٹ*",
    pg_menu_intro: "براہِ کرم درج ذیل میں سے ایک منتخب کریں:",
    btn_pg_progress: "🤰 حمل کی پیش رفت",
    btn_pg_healthy:  "🌼 صحت مند حمل",
    btn_pg_checklist: "👜 حمل کی چیک لسٹ",

    btn_p_pregnancy: "🤰 حمل کی سپورٹ",

    pg_prog_setup_intro:
      "آئیے آپ کی حمل کی پیش رفت درج کرتے ہیں۔ 🤰\n\nمیں چند مختصر سوالات کروں گا تاکہ حمل کے دوران آپ کی بہتر مدد کر سکوں۔",
    pg_prog_q_weeks: "*1.* آپ کو حمل کتنے ہفتوں کا ہے؟\n_مثال: `24 ہفتے`, `28`, `مجھے یقین نہیں`._",
    pg_prog_weeks_notsure: "کوئی بات نہیں — یہ بعد میں بھی درج ہو سکتا ہے۔",
    pg_prog_q_due: "*2.* آپ کی متوقع تاریخِ پیدائش کیا ہے؟\n_مثال: `15 اکتوبر 2026`, `ابھی یاد نہیں`._",
    pg_prog_due_notsure: "کوئی بات نہیں — بعد میں درج ہو سکتی ہے۔",
    pg_prog_q_first: "*3.* کیا یہ آپ کا پہلا حمل ہے؟",
    pg_prog_q_prev: "*4.* کیا آپ کو پہلے کبھی حملاتی ذیابیطس ہوئی ہے؟",
    pg_prog_q_insulin: "*5.* کیا آپ اِس وقت انسولین لے رہی ہیں؟",
    pg_prog_q_doctor: "*6.* آپ کے ماہرِ حمل ڈاکٹر یا کلینک کا نام؟\n_اختیاری — Skip دبا سکتی ہیں۔_",
    pg_prog_q_delivery: "*7.* ڈیلیوری کے لیے کون سا ہسپتال یا کلینک منتخب کیا ہے؟\n_اختیاری — Skip دبا سکتی ہیں۔_",

    btn_pg_yes: "✅ ہاں",
    btn_pg_no: "❌ نہیں",
    btn_pg_notsure: "یقین نہیں",

    pg_prog_saved:
      "حمل کی پیش رفت محفوظ ہو گئی۔ 🌼\nمیں یہ معلومات آپ کی حملیاتی یاد دہانیوں، مشوروں اور کوچنگ میں استعمال کروں گا۔",

    pg_prog_view_title: "🤰 *آپ کی حمل کی پیش رفت*",
    pg_prog_view_body:
      "*حمل کے ہفتے:* {weeks}\n*متوقع تاریخ:* {due}\n*پہلا حمل:* {first}\n*گزشتہ حملاتی ذیابیطس:* {prev}\n*انسولین:* {insulin}\n*ڈاکٹر/کلینک:* {doctor}\n*ڈیلیوری ہسپتال:* {delivery}",
    pg_prog_field_empty: "—",
    btn_pg_edit_all: "✏️ تفصیلات میں ترمیم",
    btn_pg_update_week: "🔄 حمل کا ہفتہ اپڈیٹ",
    pg_prog_update_week_q: "اِس وقت آپ کو حمل کتنے ہفتوں کا ہے؟\n_مثال: `29 ہفتے` یا `یقین نہیں`._",
    pg_prog_week_saved: "✅ حمل کا ہفتہ اپڈیٹ ہو گیا۔",

    pg_tip_header: "آج کا صحت مند حمل مشورہ 🌼",
    btn_pg_tip_helpful: "👍 مفید",
    btn_pg_tip_another: "🔄 ایک اور دکھائیں",
    pg_tip_thanks: "خوشی ہوئی کہ مددگار رہا۔ 🌼",
    pg_tip_placeholder:
      "نئے مشورے تیار ہو رہے ہیں اور جلد یہاں شیئر کیے جائیں گے۔ 🌼",

    pg_tip_fallback_1: "ناشتے میں پروٹین شامل کریں — انڈے، دہی یا دال۔ اس سے آپ زیادہ بھری ہوئی محسوس کریں گی اور شوگر مستحکم رہے گی۔",
    pg_tip_fallback_2: "دن بھر پانی پیتی رہیں۔ حمل کے دوران مناسب پانی گردش، ہاضمے اور شوگر کے استحکام میں مدد دیتا ہے۔",
    pg_tip_fallback_3: "کھانے کے بعد 10–15 منٹ کی چہل قدمی جسم کو کاربز استعمال کرنے میں مدد دیتی ہے۔",
    pg_tip_fallback_4: "سفید روٹی/چاول کی بجائے پورا اناج (براؤن رائس، آٹا، اوٹس) چنیں — فائبر شوگر کو مستحکم رکھتا ہے۔",
    pg_tip_fallback_5: "ہر 3–4 گھنٹے میں چھوٹا صحت مند سنیک لیں (پھل + میوہ، دہی، انڈا) تاکہ شوگر بہت کم نہ ہو جائے۔",
    pg_tip_fallback_6: "کھانوں کے بعد اپنی حالت کا جائزہ لیں۔ پیٹرن سمجھنے سے آپ اور ڈاکٹر آپ کے لیے بہترین طریقہ چن سکتے ہیں۔",
    pg_tip_fallback_7: "نیند بھی دوا ہے۔ 7–9 گھنٹے کی نیند کو ترجیح دیں؛ کم نیند اگلے دن شوگر بڑھا سکتی ہے۔",
    pg_tip_fallback_8: "بیگ میں ایک چھوٹا ہنگامی سنیک (پھل یا میوہ) رکھیں تاکہ کھانا لیٹ ہو جائے تو کام آئے۔",

    pg_checklist_title: "👜 *حمل کی چیک لسٹ*",
    pg_checklist_intro: "چیک لسٹ PDF کھولنے کے لیے موضوع منتخب کریں۔",
    pg_checklist_placeholder:
      "چیک لسٹس تیار ہو رہی ہیں اور جلد یہاں دستیاب ہوں گی۔ 👜",
    pg_checklist_topic_missing: "یہ چیک لسٹ اب دستیاب نہیں۔ فہرست سے کوئی اور منتخب کریں۔",
    pg_checklist_topic_no_pdf:
      "*{title}*\n\nیہ چیک لسٹ تیار ہو رہی ہے اور جلد یہاں شیئر کر دی جائے گی۔",
    pg_checklist_topic_open: "*{title}*\n\nیہ رہی چیک لسٹ: {url}",

    pg_cl_hospital_bag: "ہسپتال بیگ چیک لسٹ",
    pg_cl_delivery_prep: "ڈیلیوری کی تیاری",
    pg_cl_questions_dr: "ڈاکٹر سے پوچھنے کے سوالات",
    pg_cl_glucose_testing: "گلوکوز ٹیسٹنگ چیک لسٹ",
    pg_cl_newborn: "نومولود کی ضروریات",
    pg_cl_breastfeeding: "بریسٹ فیڈنگ کی بنیادی معلومات",
    pg_cl_snacks: "حمل کے دوران صحت مند سنیکس",
    pg_cl_activity: "حمل کے دوران محفوظ سرگرمی",
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
    askdrsaab_prompt:
      "Hi! Main *DrSaab* hoon.\nDiabetes, khaana, exercise, dawaon ya apni sehat ke baare mein kuch bhi poochein.\n\n_Misaalein:_\n• Kya 145 blood sugar theek hai?\n• Kya main mango kha sakta/sakti hoon?\n• Nashte mein kya loon?\n• Main dawa lena bhool gaya/gayi.\n• Kya aaj exercise kar sakta/sakti hoon?\n• Subah sugar zyada kyun hoti hai?\n• Meri HbA1c samjhayein.\n• Kya diabetes wale Ramadan mein roza rakh sakte hain?\n\n_Farigh ho kar Back dabayein._",
    food_prompt:
      "🥗 *Food Coach*. Apna khana batayein ya *plate ki tasveer bhejein*, main carbs ka andaza aur behtar option bataonga.\n_Menu par wapas dabayein._",
    fitness_prompt:
      "🏃 *Fitness Coach*. Apna din ya energy batayein, main mehfooz exercise tajweez karoonga.\n_Menu par wapas dabayein._",
    lab_prompt:
      "📋 *Apni Report Samjhein*\n\nApni khoon ki jaanch ya medical report upload karein — tasveer bhejein ya values text mein likhein.\n\nMain aap ke natayij asaan alfaaz mein samjhaonga, ahem cheezon par roshni daaloonga, aur bataonga ke aap ki diabetes ke liye is ka kya matlab ho sakta hai.\n\n*Qabil qabool reports:*\n• Blood tests\n• HbA1c reports\n• Cholesterol / Lipid Profile\n• Gurdon ke tests\n• Jigar ke tests\n• Peshab ke tests\n• Hospital laboratory reports\n• Diabetes se mutalliq tehqeeqat\n_Menu par wapas dabayein._",
    btn_upload_lab: "📎 Tasveer Upload Karein",
    upload_lab_hint:
      "📸 Bas report ki tasveer attach kar ke bhej dein.\n\n_Chat mein attach (paper-clip) icon dabayein, apni report ki tasveer chunein aur bhej dein. Main tajziya kar ke aap ke record mein mehfooz kar doonga._",
    lab_saved: "✅ Aap ki report ka tajziya ho gaya aur aap ke health record mein mehfooz ho gayi.",
    lab_disclaimer:
      "_Ahem: Yeh wazahat sirf aap ki report samajhne ke liye hai. Koi bhi tibbi faisla karne ya ilaaj tabdeel karne se pehle apne doctor se mashwara karein._",
    lab_limit_reached:
      "💎 Aap is mahine *{limit}* muft report tajziye istemal kar chuke hain.\nLamehdood report tajziya aur mukammal report history ke liye *Consistency Coach* par upgrade karein.",
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
    error_ai_limit:
      "🤖 Abhi bohat zyada messages aa rahe hain aur AI ki temporary limit puri ho gayi hai. Ek minute baad dobara koshish karein — aap ka data mehfooz hai.",
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
    ut_type1: "Mujhe Type 1 diabetes hai",
    ut_type2: "Mujhe Type 2 diabetes hai",
    ut_prediabetes: "Mujhe prediabetes hai",
    ut_gestational: "Mujhe Gestational diabetes hai",
    ut_healthier: "Main sehatmand zindagi chahta/chahti hoon",

    ask_age_v2: "Bohat khoob. Aaiye shuru karte hain. Aap ki date of birth kya hai?\nDay, month aur year zaroori hain (misaal: 12 March 1985).",
    ask_dob_missing:
      "Mujhe poori date of birth chahiye — barah-e-karam *{missing}* bhejein (misaal: 12 March 1985).",
    btn_multi_done: "Done",
    multi_select_hint: "_Ek se zyada option chunein, phir Done dabayein._",
    multi_select_selected: "*Ab tak chuna:* {list}",
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
    profile_complete_v2_noname:
      "Behtareen ✅\nAap ka profile mukammal ho gaya hai.\nAb main is maloomat ki bunyaad par aap ko zaati rehnumai, reminders, taleemi maloomat aur progress tracking faraham kar sakta hoon.\n\nAaiye mil kar sehatmand aadatein banatay hain.",
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
    goals_none: "Aap ne abhi koi goal set nahi kiya. Shuru karne ke liye *Goal shamil karein* dabayein.",
    goals_current: "Aap ka mojooda goal: *{goal}*",
    goals_list_header: "🎯 *Mere Goals* — {count}/{max} active\n\nKisi goal ko dekhne ya edit karne ke liye us par tap karein.",
    goals_full: "Aap ke pehle se *{max}* active goals hain. Naya add karne se pehle kisi ko complete ya remove karein.",
    goals_prompt: "Apna main health goal ek jumlay mein bhejein (e.g. *HbA1c 7 se kam karna*), ya Back dabayein.",
    goals_saved: "✅ Goal save ho gaya: *{goal}*",
    btn_set_goal: "✏️ Goal set/change karein",
    btn_goal_add: "➕ Goal shamil karein",
    btn_goal_edit: "✏️ Goal edit karein",
    btn_goal_complete: "✅ Complete mark karein",
    btn_goal_delete: "🗑 Goal remove karein",
    btn_goal_edit_title: "✏️ Goal ka matn",
    btn_goal_edit_motivation: "💭 Wajah badlein",
    btn_goal_edit_target: "📅 Target date badlein",

    goal_pick_prompt: "In goals mein se ek chunein — ya *Other* dabayein aur khud likhein.",
    goalsug_lower_a1c: "Mera HbA1c kam karna",
    goalsug_lose_weight: "Wazan kam karna",
    goalsug_exercise_more: "Zyada exercise karna",
    goalsug_walk_more: "Zyada walk karna",
    goalsug_improve_blood_sugar: "Blood sugar behtar karna",
    goalsug_take_meds: "Dawaiyaan mustaqil lena",
    goalsug_eat_healthy: "Sehatmand khana",
    goalsug_improve_cholesterol: "Cholesterol behtar karna",
    goalsug_improve_bp: "Blood pressure behtar karna",
    goalsug_sleep_better: "Behtar neend",
    goalsug_prepare_surgery: "Surgery ki tayyari",
    goalsug_run_5k: "5K run karna",
    goalsug_other: "✏️ Other (khud likhein)",

    goal_custom_prompt: "Apna goal apne alfaaz mein likhein (ek line).\n_Misaal:_ Garmi tak 5 kg wazan kam karna.",
    goal_motivation_prompt:
      "*Yeh goal aap ke liye kyun ahem hai?* (Ikhtiyari — chhorne ke liye Skip dabayein.)\n\n_Misaalein:_\n• Main apne bachon ke liye sehatmand rehna chahta hoon.\n• Main zyada confident feel karna chahta hoon.\n• Doctor ne kaha hai ke behtari zaroori hai.",
    goal_motivation_saved: "💭 Note kar liya — aap ki wajah save ho gayi.",
    goal_target_prompt:
      "*Target date set karein?* (Ikhtiyari — chahein to Skip dabayein.)\n\nAsli tareekh (e.g. `31 December 2026`) ya andaza (`6 months mein`, `Eid se pehle`) bhejein.",
    goal_target_saved: "📅 Target date note ho gayi.",
    goal_target_skipped: "Koi target date nahi — theek hai.",
    goal_added: "✅ *Goal add ho gaya*\n\n🎯 {goal}\n\nMain isay aap ki coaching aur progress reports mein use karoonga.",

    goal_detail_title: "🎯 *{goal}*",
    goal_detail_motivation: "💭 *Wajah:* {motivation}",
    goal_detail_target: "📅 *Target:* {target}",
    goal_detail_no_motivation: "_Aap ne abhi wajah share nahi ki._",
    goal_detail_no_target: "_Koi target date nahi._",
    goal_completed_ack: "🎉 Goal complete mark ho gaya. Shabaash!",
    goal_deleted_ack: "🗑 Goal remove ho gaya.",

    goal_edit_title_prompt: "Is goal ka naya matn (ek line) bhejein.",
    goal_edit_motivation_prompt: "Nayi wajah bhejein — yeh goal aap ke liye kyun ahem hai? (Skip dabayein to clear ho jayegi.)",
    goal_edit_target_prompt:
      "Nayi target date bhejein (e.g. `31 December 2026`, `3 months mein`, `Ramadan se pehle`). Skip dabayein to clear.",

    goal_review_prompt: "📅 Aaj aap ke goal ki target date thi:\n*{goal}*\n\nKya aap ne goal hasil kar liya?",
    btn_goal_review_yes: "🎉 Ji haan",
    btn_goal_review_notyet: "😔 Abhi nahi",
    goal_review_yes_prompt: "Mubarak ho! 🎉 Ab is goal ke saath kya karna chahenge?",
    goal_review_notyet_prompt: "Koi baat nahi — taraqqi mein waqt lagta hai. Ab kya karna chahenge?",
    btn_goal_review_new: "🆕 Naya goal set karein",
    btn_goal_review_continue: "🔄 Yehi goal jari rakhein",
    btn_goal_review_remove: "🗑 Goal remove karein",
    btn_goal_review_update_target: "✏️ Target date update karein",
    goal_review_continue_ack: "🔄 Goal active hai. Main aap ka saath doonga.",
    goal_review_remove_ack: "🗑 Goal remove ho gaya. Koshish par shabaash.",
    goal_review_update_target_prompt:
      "Nayi target date kya hai? Tareekh ya andaza (jaise `6 months mein`) bhejein.",

    progress_generating: "📈 Aap ki progress report ban rahi hai…",
    progress_low_data:
      "📈 *Aap ki Pesh-raft*\n\nMufeed report ke liye abhi kaafi data nahi. Kuch blood sugar readings, wazan, ya check-in log karein aur DrSaab se regular baat karein. Jitna aap use karenge, report utni behtar hoti jayegi.",
    progress_goals_header: "🎯 *Mere Goals*",
    progress_no_goals: "_Abhi koi goal nahi — Goals & Progress se add karein._",
    progress_free_upgrade:
      "🔒 *Premium* unlock karein:\n• Tafseeli progress reports\n• Goal tracking\n• Personalized AI recommendations\n• Advanced trend analysis\n• Doctor-ready summaries",
    progress_upgrade_cta: "⭐ Abhi Upgrade karein",
    progress_paid_intro:
      "Yeh aap ki personalised progress report hai — aap ke goals, blood sugar, wazan, activity, medication consistency, wellbeing aur lab results ke hisaab se.",
    scores_title: "📊 *Aap ke Scores* (100 mein se)",
    reports_title: "📑 *Reports*",
    challenges_title: "🏆 *Challenges*",
    exec_title: "⭐ *Executive Services*",

    // ===== More section v2 (2026-07 spec) =====
    more_subtitle: "Neechay diye options mein se ek chunein:",
    btn_more_subscription_v2: "💳 Meri Subscription",
    btn_more_account: "👤 Mera Account",

    reminders_prefs_title: "🔔 *Reminders*",
    reminders_prefs_intro:
      "Chunein ke aap kaun se reminders chahte hain. On ya off karne ke liye category par tap karein.",
    rem_cat_blood_sugar: "🩸 Blood Sugar",
    rem_cat_medication: "💊 Medication Check-ins",
    rem_cat_goals: "🎯 Goal Reminders",
    rem_cat_coaching: "💬 Coaching Messages",
    rem_cat_on: "On",
    rem_cat_off: "Off",
    rem_pref_row: "{icon} {label} — {state}",
    rem_pref_updated: "✅ *{label}* ab *{state}* hai.",
    reminders_scheduled_header: "*Aap ke scheduled reminders*",
    reminders_scheduled_none: "_Abhi koi scheduled reminder nahi hai._",

    sub_title: "💳 *Meri Subscription*",
    sub_current_plan: "*Mojooda Plan:* {plan}",
    sub_features_header: "*Shamil features:*",
    sub_renewal: "*Renew:* {date}",
    sub_no_renewal: "_Free plan — koi renewal date nahi._",
    sub_features_free:
      "• Rozana check-ins aur sugar/medication logging\n• Basic Ask DrSaab\n• Learn library\n• Har mahine kuch lab report explanations",
    sub_features_consistency:
      "• Starter ke sab features\n• Full Ask DrSaab, unlimited lab explanations\n• My Progress mein charon scores\n• Weekly aur monthly reports\n• Doctor ke liye tayyar report\n• Smart reminders\n• Saare challenges",
    sub_features_executive:
      "• Consistency Coach ke sab features\n• Doctor case reviews\n• Live coach sessions\n• 3 mahine ka executive review\n• Priority help\n• Premium content",
    btn_sub_upgrade: "⭐ Plan Upgrade karein",
    btn_sub_manage: "💳 Subscription manage karein",
    btn_sub_billing: "📄 Billing history dekhein",
    sub_manage_stub:
      "Subscription management jald aa raha hai. Abhi ke liye plan tabdeel ya cancel karne ke liye support@drsaabcoach.com par rabta karein.",
    sub_billing_stub: "Billing history jald aa rahi hai — tab tak hum aap ko invoices email karte rahenge.",

    account_title: "👤 *Mera Account*",
    account_body:
      "*Naam:* {name}\n*Email:* {email}\n*WhatsApp Number:* {whatsapp}\n*Member Since:* {joined}\n*Diabetes Type:* {diabetes}",
    account_field_empty: "—",
    btn_account_edit: "✏️ Profile Edit karein",
    btn_account_deactivate: "⏸️ Account Deactivate karein",
    btn_account_close: "🗑 Account Close karein",
    edit_profile_stub:
      "Yahan se direct edit jald aa raha hai. Abhi ke liye mujhe bata dein ke aap kya tabdeel karna chahte hain, main update karne mein madad karoonga.",

    deactivate_confirm_title: "⏸️ *Account Deactivate*",
    deactivate_confirm_body:
      "Kya aap waqai apna account deactivate karna chahte hain?\n\nDrSaab messages aur reminders bhejna band kar dega, lekin aap ka account aur health information mehfooz rahegi taake aap jab chahen wapas aa sakein.",
    btn_confirm_deactivate: "✅ Deactivate",
    btn_cancel: "Cancel",
    deactivate_done:
      "⏸️ Aap ka account deactivate ho gaya hai.\n\nCoaching aur reminders ruk jayenge. Jab tayyar hon, koi bhi message bhej dein — main dobara activate kar doonga.",
    reactivated_welcome:
      "👋 Wapsi mubarak, *{name}*! Aap ka account dobara active ho gaya hai. Aap ka data aur settings waisay hi mehfooz hain jaise aap chhor kar gaye the.",

    close_confirm_title: "🗑 *Account Close*",
    close_confirm_body:
      "Kya aap waqai apna DrSaab account close karna chahte hain?\n\nIs ke baad aap apne account tak rasai nahi kar sakenge aur DrSaab use nahi kar sakenge.\n\nKuch health records aur account information humari Privacy Policy aur qanooni taqazon ke tehat mehfooz rakhi ja sakti hai.",
    btn_confirm_close: "🗑 Account Close karein",
    close_done:
      "🗑 Aap ka DrSaab account close ho gaya hai. Humaray saath guzaray gaye waqt ka shukriya — apna khayaal rakhein.",
    account_closed_reply:
      "Yeh DrSaab account close ho chuka hai aur ab use nahi ho sakta. Agar aap DrSaab dobara use karna chahte hain to naye user ke tor par register karein.",

    // Type 1 Community — top-level menu for T1 users
    t1c_menu_title: "🤝 *Type 1 Community*",
    t1c_menu_intro:
      "Pakistan mein Type 1 diabetes ke saath rehne walon ke liye trusted resources, education aur community support. Ek section chunein:",
    t1c_menu_not_t1:
      "Type 1 Community section sirf Type 1 diabetes wale users ke liye available hai. Agar aap ki halat badli ho to profile update karein.",
    btn_t1c_support: "🤝 Support Network",
    btn_t1c_blogs: "📚 Aap ke liye Blogs",
    btn_t1c_videos: "🎥 Aap ke liye Videos",
    btn_t1c_dailylife: "🧑‍🏫 Rozmarra Zindagi",
    btn_t1c_events: "📅 Qareeb ki Events",
    t1c_support_title: "🤝 *Support Network*",
    t1c_blogs_title: "📚 *Aap ke liye Blogs*",
    t1c_videos_title: "🎥 *Aap ke liye Videos*",
    t1c_dailylife_title: "🧑‍🏫 *Rozmarra Zindagi*",
    t1c_events_title: "📅 *Qareeb ki Events*",
    t1c_placeholder_body:
      "Content jald aa raha hai. Hum Pakistan bhar ki mo'tabar diabetes organizations ke saath mil kar aap ke liye curated support la rahe hain. Jald wapas check karein!",
    t1c_dailylife_intro:
      "Type 1 diabetes ke saath rozmarra ki situations ke liye practical guidance. Ek category chunein:",
    btn_t1c_dl_children: "👨‍👩‍👧 Bachay aur Walidain",
    btn_t1c_dl_teens: "🧑‍🎓 Nau-Jawan",
    btn_t1c_dl_adults: "🧑‍💼 Baligh",
    t1c_dl_cat_children: "👨‍👩‍👧 *Bachay aur Walidain*",
    t1c_dl_cat_teens: "🧑‍🎓 *Nau-Jawan*",
    t1c_dl_cat_adults: "🧑‍💼 *Baligh*",
    t1c_dl_pick_topic: "Guide kholnay ke liye topic chunein:",
    t1c_dl_topic_missing: "Yeh topic ab available nahi. List se koi aur chunein.",
    t1c_dl_topic_no_pdf:
      "*{title}*\n\nIs topic ka guide tayyar ho raha hai aur jald yahan share kiya jayega.",
    t1c_dl_topic_open:
      "*{title}*\n\nYeh raha guide: {url}",

    // Type 1 Diabetes — periodic confidence check
    t1c_prompt: "❤️ *Aap apni Type 1 diabetes sambhalne mein kitna confident feel karte hain?*",
    t1c_btn_very: "😊 Bohot Confident",
    t1c_btn_mostly: "🙂 Zyada tar Confident",
    t1c_btn_sometimes: "😐 Kabhi kabhi mushkil",
    t1c_btn_help: "😟 Mujhe zyada help chahiye",
    t1c_reply_very:
      "Bohot khoob — aap sach mein achha kar rahe hain. Main hamari baatein halki rakhoonga aur aap ki wins celebrate karta rahoonga. 🌟",
    t1c_reply_mostly:
      "Yeh sun kar khushi hui. Jahan sab se zyada zaroorat ho, wahan main aap ka saath deta rahoonga. 💚",
    t1c_reply_sometimes:
      "Batanay ka shukriya. Jo hissay aap ko mushkil lagtay hain, main un par zyada dhyaan doonga aur jaldi help offer karoonga.",
    t1c_reply_help:
      "Main samajh sakta hoon — kuch din Type 1 ke saath guzaarna mushkil hota hai. Main aap ke liye zyada guides aur community support laoonga. Aap akele nahi hain. ❤️",

    // Prediabetes — Healthy Living menu (spec 2026-07)
    pd_menu_not_pre:
      "Healthy Living section abhi prediabetes wale users ke liye tayaar hai. Aap apni profile update kar sakte hain agar yeh badla ho.",
    pd_menu_title: "💪 *Healthy Living*",
    pd_menu_intro: "Chhoti roz ki wins baray masail rok deti hain. Shuru karnay ke liye ek chunein:",
    btn_pd_wins: "⚡ 10-Minute Wins",
    btn_pd_gym: "🏋️ Mera Gym Plan",
    btn_pd_cravings: "🍟 Cravings pe Qaboo",

    pd_wins_title: "⚡ *10-Minute Win*",
    pd_wins_prompt: "Aap ki jaldi win:\n\n➡️ *{activity}*\n\nAzmanay ke liye tayaar?",
    btn_pd_wins_do: "✅ Main karoonga/karoongi",
    btn_pd_wins_another: "🔄 Doosri batayein",
    btn_pd_wins_done: "🎉 Mukammal kar liya",
    pd_wins_go: "Bohot khoob — jaa ke kar aayein. Main 15 minute baad puchhoonga kaisa raha. 👊",
    pd_wins_check: "Wapas aa gaye! 😊\nKya aap ne apni 10-Minute Win mukammal ki?",
    btn_pd_wins_yes: "🎉 Haan",
    btn_pd_wins_notyet: "😔 Abhi nahi",
    pd_wins_yes:
      "Shaandaar! Aisi chhoti wins zindagi bhar ki aadatein banati hain.\n\nJab tayaar hon, menu se Healthy Living ki koi aur activity azmayein.",
    pd_wins_notyet:
      "Koi baat nahi. Din mein aik aur mauka aayega. Har chhota qadam ahem hai.\n\nJab tayaar hon, menu se Healthy Living ki koi aur activity azmayein.",
    pd_win_walk_office: "Apne office ki building ke ird gird chalein.",
    pd_win_walk_block: "Block ke ird gird chalein.",
    pd_win_stairs: "10 minute seerhiyan charhein.",
    pd_win_stretch_tv: "TV dekhtay hue stretch karein.",
    pd_win_home_workout: "Ghar par asaan workout karein.",
    pd_win_brisk_walk: "Agla khana khanay ke baad brisk walk karein.",
    pd_win_park_further: "Door park karein aur chal ke jaayein.",
    pd_win_phone_walk: "Phone call kartay hue chalein.",

    pd_gym_title: "🏋️ *Mera Gym Plan*",
    pd_gym_intro:
      "Aiye ek asaan beginner routine banate hain. Teen chhotay sawaal aur plan tayaar.",
    pd_gym_q1: "*1.* Kya aap pehle kabhi gym gaye hain?",
    btn_pd_gym_exp_never: "Kabhi nahi",
    btn_pd_gym_exp_beginner: "Beginner",
    btn_pd_gym_exp_regular: "Regular",
    pd_gym_q2: "*2.* Haftay mein kitne din exercise realistically kar saktay hain?",
    pd_gym_q3: "*3.* Aap ka main goal kya hai?",
    btn_pd_gym_goal_lose: "Wazan kam karna",
    btn_pd_gym_goal_build: "Muscle banana",
    btn_pd_gym_goal_fitness: "Fitness behter karna",
    btn_pd_gym_goal_bloodsugar: "Blood sugar behter karna",
    pd_gym_generating: "Bohot khoob — aap ka plan tayaar kar raha hoon… 🏗",
    pd_gym_saved:
      "{plan}\n\n_Aap ki profile mein save ho gaya. Kisi bhi waqt wapas aa kar regenerate ya update kar saktay hain._",
    pd_gym_error:
      "Abhi plan tayaar nahi ho saka. Thora waqt ke baad dobara try karein.",
    btn_pd_gym_regen: "🔁 Plan Dobara Banayein",

    pd_crav_title: "🍟 *Cravings pe Qaboo*",
    pd_crav_intro:
      "Apni aadatein samajhna pehla qadam hai. Aik waqt mein aik chhoti tabdeeli kartay hain.",
    pd_crav_drink_q: "Kaun sa meetha drink aap sab se zyada peetay hain?",
    btn_pd_drink_coke: "Coca-Cola",
    btn_pd_drink_pepsi: "Pepsi",
    btn_pd_drink_7up: "7Up",
    btn_pd_drink_sprite: "Sprite",
    btn_pd_drink_mtn: "Mountain Dew",
    btn_pd_drink_energy: "Energy drinks",
    btn_pd_drink_tea: "Meethi chai",
    btn_pd_drink_other: "Doosra",
    pd_crav_drink_other_q: "Koi baat nahi — kaun sa meetha drink zyada peetay hain?",
    pd_crav_drink_servings_q:
      "Samajh gaya — *{drink}*. Rozana ya haftay mein kitni bar peetay hain?",
    pd_crav_junk_q: "Kaun sa junk food aap sab se zyada khaatay hain?",
    btn_pd_junk_burgers: "Burgers",
    btn_pd_junk_pizza: "Pizza",
    btn_pd_junk_fries: "Fries",
    btn_pd_junk_chips: "Chips",
    btn_pd_junk_biscuits: "Biscuits",
    btn_pd_junk_cakes: "Cakes",
    btn_pd_junk_choco: "Chocolate",
    btn_pd_junk_fast: "Fast food",
    btn_pd_junk_other: "Doosra",
    pd_crav_junk_other_q: "Kaun sa junk food aap sab se zyada khaatay hain?",
    pd_crav_junk_freq_q:
      "Samajh gaya — *{junk}*. Haftay mein taqreeban kitni bar khaatay hain?",
    pd_crav_video:
      "Shukriya. Zara yeh short video dekhein — batati hai ke meethay drinks aur ultra-processed foods long-term health par kaisa asar daaltay hain.\n\n▶️ https://www.youtube.com/watch?v=DHma9_xQgD8&t=45s",
    pd_crav_reflection_q:
      "Video dekhne ke baad aap ke khayal se aane wale haftoun mein kaunsi realistic tabdeeliyan kar saktay hain?",
    pd_crav_commit_q: "Agar iss haftay sirf aik chhoti tabdeeli karni ho, kya realistic lagta hai?",
    btn_pd_commit_less_soda: "Roz aik meetha drink kam",
    btn_pd_commit_weekend_only: "Meethay drinks sirf weekend par",
    btn_pd_commit_water: "Aik meethay drink ki jagah paani",
    btn_pd_commit_less_fast: "Haftay mein fast food aik bar kam",
    btn_pd_commit_skip_chips: "Haftay mein chips na khana",
    btn_pd_commit_other: "Kuch aur",
    pd_crav_commit_other_q: "Bohot khoob — iss haftay kya chhoti tabdeeli realistic lagti hai?",
    pd_crav_done:
      "Yeh acha commitment hai: *{commitment}*\n\nChhoti tabdeeliyan consistently repeat karnay se baray sudhar aatay hain. Main aap ka goal yaad rakhoonga aur raste mein encourage karta rahoonga.\n\nJab tayaar hon, menu se koi aur Healthy Living activity azmayein.",
    pd_crav_saved_short: "Save ho gaya. ✅",

    // ===== Better Me — for user_type=healthier (spec 2026-07) =====
    bm_menu_not_healthier:
      "Better Me section un users ke liye hai jinho ne \"Main sehatmand zindagi chahta/chahti hoon\" chuna hai. Agar aap ki halat badli ho to profile update karein.",
    bm_menu_title: "🌟 *Better Me*",
    bm_menu_intro: "Neechay diye options mein se ek chunein:",
    btn_bm_habit: "🎯 Nayi Aadat Banayein",
    btn_bm_fitness: "🏋️ Mera Fitness Plan",
    btn_bm_wins: "⚡ 10-Minute Wins",
    btn_bm_journey: "❤️ Mera Sehat ka Safar",

    bm_habit_title: "🎯 *Nayi Aadat Banayein*",
    bm_habit_intro: "Rozana ki chhoti aadatein zindagi bhar ki sehat banati hain. Shuru karnay ke liye aik aadat chunein:",
    bm_habit_water: "Zyada paani peein",
    bm_habit_sleep: "Jaldi soyein",
    bm_habit_walk: "Rozana walk karein",
    bm_habit_exercise: "Regularly exercise karein",
    bm_habit_veggies: "Zyada sabziyan khaayein",
    bm_habit_less_sugar: "Sugar kam karein",
    bm_habit_quit_smoking: "Cigarette chhorein",
    bm_habit_stress: "Stress kam karein",
    bm_habit_read: "Rozana mutala karein",
    bm_habit_pray: "Pabandi se namaz parhein",
    bm_habit_other: "Kuch aur",
    bm_habit_other_q: "Bohat khoob — jo aadat aap banana chahtay hain apne alfaaz mein likhein.",
    bm_habit_why_q:
      "Aap ne *{habit}* chuni. Yeh aadat aap ke liye kyun ahem hai?\n\n_Aik chhoti wajah mushkil dinon mein himmat qaim rakhti hai._",
    bm_habit_days_q: "Haftay mein kitne din aap realistically yeh kar saktay hain?",
    bm_habit_done:
      "✅ Aadat set: *{habit}*\nTarget: *{days} din/haftay*\n\nMain aap ka saath doonga aur aane wale check-ins mein yeh use karoonga. Chhotay saabit qadam kaamyaab hote hain.",

    bm_fit_title: "🏋️ *Mera Fitness Plan*",
    bm_fit_intro:
      "Aiye aap ke liye ek asaan plan banate hain. Teen chhotay sawaal.",
    bm_fit_q1: "*1.* Kya aap pehle kabhi gym gaye hain?",
    btn_bm_fit_exp_never: "Kabhi nahi",
    btn_bm_fit_exp_beginner: "Beginner",
    btn_bm_fit_exp_regular: "Regular",
    bm_fit_q2: "*2.* Haftay mein kitne din exercise realistically kar saktay hain?",
    bm_fit_q3: "*3.* Aap ka main goal kya hai?",
    btn_bm_fit_goal_lose: "Wazan kam karna",
    btn_bm_fit_goal_build: "Muscle banana",
    btn_bm_fit_goal_fitness: "Fitness behter karna",
    btn_bm_fit_goal_overall: "Mujmoi sehat behter karna",
    bm_fit_generating: "Aap ka fitness plan tayaar kar raha hoon… 🏗",
    bm_fit_saved:
      "{plan}\n\n_Aap ki profile mein save ho gaya. Kisi bhi waqt wapas aa kar update ya regenerate kar saktay hain._",
    bm_fit_error: "Abhi plan tayaar nahi ho saka. Thora waqt ke baad dobara try karein.",
    btn_bm_fit_regen: "🔁 Plan Dobara Banayein",

    bm_wins_title: "⚡ *10-Minute Win*",
    bm_wins_prompt: "Aap ki jaldi win:\n\n➡️ *{activity}*\n\nAzmanay ke liye tayaar?",
    btn_bm_wins_do: "✅ Main karoonga/karoongi",
    btn_bm_wins_another: "🔄 Doosri batayein",
    btn_bm_wins_done: "🎉 Mukammal kar liya",
    bm_wins_go: "Bohot khoob — jaa ke kar aayein. Main 15 minute baad puchhoonga kaisa raha. 👊",
    bm_wins_check: "Wapas aa gaye! 😊\nKya aap ne apni 10-Minute Win mukammal ki?",
    btn_bm_wins_yes: "🎉 Haan",
    btn_bm_wins_notyet: "😔 Abhi nahi",
    bm_wins_yes:
      "Shaandaar! Aisi chhoti wins zindagi bhar ki aadatein banati hain.\n\nJab tayaar hon, menu se koi aur Better Me activity azmayein.",
    bm_wins_notyet:
      "Koi baat nahi. Har chhota qadam ahem hai. Jab tayaar hon, dobara try karein.\n\nJab tayaar hon, menu se koi aur Better Me activity azmayein.",
    bm_win_walk_block: "Block ke ird gird chalein.",
    bm_win_stairs: "10 minute seerhiyan charhein.",
    bm_win_stretch_tv: "TV dekhtay hue stretch karein.",
    bm_win_home_workout: "Ghar par asaan workout karein.",
    bm_win_brisk_walk: "Agla khana khanay ke baad brisk walk karein.",
    bm_win_park_further: "Door park karein aur chal ke jaayein.",
    bm_win_phone_walk: "Phone call kartay hue chalein.",

    bm_journey_title: "❤️ *Mera Sehat ka Safar*",
    bm_journey_conditions_have:
      "Aap ki profile mein yeh health conditions record hain:\n\n{list}\n\nKya aap koi cheez add ya update karna chahenge?",
    bm_journey_conditions_none:
      "Abhi aap ki profile mein koi health condition record nahi hai. Kya aap koi add karna chahenge?\n\n_Misaalein: High blood pressure, High cholesterol, Asthma, Arthritis, Fatty liver, PCOS, Sleep apnea, Thyroid._",
    bm_journey_conditions_prompt:
      "Jo conditions record karna chahtay hain likhein (comma se alag karein), ya *skip* likh dein.",
    bm_journey_conditions_saved: "✅ Health conditions update ho gayi.",
    bm_journey_goal_q: "Aane wale saal mein aap ka sab se bara sehat ka goal kya hai?",
    btn_bm_journey_lose: "Wazan kam karna",
    btn_bm_journey_fit: "Fit hona",
    btn_bm_journey_sleep: "Behtar neend",
    btn_bm_journey_quit: "Cigarette chhorna",
    btn_bm_journey_stress: "Stress kam karna",
    btn_bm_journey_energy: "Zyada energetic mehsoos karna",
    btn_bm_journey_overall: "Mujmoi sehat behter karna",
    btn_bm_journey_other: "Kuch aur",
    bm_journey_other_q: "Bohat khoob — apna 1-saal ka sehat goal apne alfaaz mein likhein.",
    bm_journey_done:
      "✅ Aik-saal ka goal save ho gaya: *{goal}*\n\nMain isay aap ki coaching, reminders aur reports mein use karoonga. Mustaqil mizaji shiddat par bhaari hai — main har qadam par aap ke saath hoon. 💚",

    // ===== Pregnancy Support — for gestational diabetes users (spec 2026-07) =====
    pg_menu_not_gest:
      "Pregnancy Support section gestational diabetes wali users ke liye hai. Agar aap ki halat badli ho to profile update karein.",
    pg_menu_title: "🤰 *Pregnancy Support*",
    pg_menu_intro: "Neechay diye options mein se ek chunein:",
    btn_pg_progress: "🤰 Pregnancy Progress",
    btn_pg_healthy:  "🌼 Healthy Pregnancy",
    btn_pg_checklist: "👜 Pregnancy Checklist",

    btn_p_pregnancy: "🤰 Pregnancy Support",

    pg_prog_setup_intro:
      "Aiye aap ki pregnancy progress set karte hain. 🤰\n\nMain kuch chhotay sawaal karoonga taake pregnancy ke doran aap ki behtar support kar sakoon.",
    pg_prog_q_weeks: "*1.* Aap ko kitne haftay pregnant hain?\n_Misaal: `24 hafte`, `28`, `Mujhe yaqeen nahi`._",
    pg_prog_weeks_notsure: "Koi baat nahi — baad mein bhi add ho sakta hai.",
    pg_prog_q_due: "*2.* Aap ki expected due date kya hai?\n_Misaal: `15 October 2026`, `Abhi yaad nahi`._",
    pg_prog_due_notsure: "Koi baat nahi — baad mein add ho sakti hai.",
    pg_prog_q_first: "*3.* Kya yeh aap ka pehla pregnancy hai?",
    pg_prog_q_prev: "*4.* Kya aap ko pehle kabhi gestational diabetes hui hai?",
    pg_prog_q_insulin: "*5.* Kya aap is waqt insulin le rahi hain?",
    pg_prog_q_doctor: "*6.* Aap ki pregnancy doctor ya clinic ka naam?\n_Optional — Skip dabayein._",
    pg_prog_q_delivery: "*7.* Delivery ke liye kaunsa hospital ya clinic sochcha hai?\n_Optional — Skip dabayein._",

    btn_pg_yes: "✅ Haan",
    btn_pg_no: "❌ Nahi",
    btn_pg_notsure: "Yaqeen nahi",

    pg_prog_saved:
      "Pregnancy progress save ho gayi. 🌼\nMain yeh maloomat aap ki pregnancy ki reminders, tips aur coaching mein use karoonga.",

    pg_prog_view_title: "🤰 *Aap ki Pregnancy Progress*",
    pg_prog_view_body:
      "*Hafte:* {weeks}\n*Due date:* {due}\n*Pehla pregnancy:* {first}\n*Pehle gestational diabetes:* {prev}\n*Insulin:* {insulin}\n*Doctor/Clinic:* {doctor}\n*Delivery hospital:* {delivery}",
    pg_prog_field_empty: "—",
    btn_pg_edit_all: "✏️ Details Edit karein",
    btn_pg_update_week: "🔄 Pregnancy Week Update",
    pg_prog_update_week_q: "Is waqt aap ko kitne haftay pregnant hain?\n_Misaal: `29 hafte` ya `Yaqeen nahi`._",
    pg_prog_week_saved: "✅ Pregnancy week update ho gaya.",

    pg_tip_header: "Aaj ka Healthy Pregnancy Tip 🌼",
    btn_pg_tip_helpful: "👍 Mufeed",
    btn_pg_tip_another: "🔄 Ek aur dikhayein",
    pg_tip_thanks: "Khushi hui ke madad mili. 🌼",
    pg_tip_placeholder:
      "Naye tips tayaar ho rahe hain aur jald yahan share kiye jayenge. 🌼",

    pg_tip_fallback_1: "Nashtay mein protein shamil karein — anday, dahi ya daal. Isse aap zyada bhari mehsoos karengi aur sugar mustahkam rahegi.",
    pg_tip_fallback_2: "Din bhar paani peeti rahein. Pregnancy mein hydration circulation, hazma aur sugar ko stable rakhne mein madad deta hai.",
    pg_tip_fallback_3: "Khanay ke baad 10–15 minute ki chehl qadmi body ko carbs use karne mein madad deti hai.",
    pg_tip_fallback_4: "Safed roti/chawal ki jagah whole grain (brown rice, atta, oats) chunein — fibre sugar ko stable rakhta hai.",
    pg_tip_fallback_5: "Har 3–4 ghantay mein chhota healthy snack lein (phal + meva, dahi, anda) taake sugar bohot kam na ho jaye.",
    pg_tip_fallback_6: "Khanon ke baad apni halat ka jaiza lein. Patterns samajh kar aap aur doctor aap ke liye behtareen tareeqa chun sakte hain.",
    pg_tip_fallback_7: "Neend bhi ilaaj hai. 7–9 ghantay ki neend ko priority dein; kam neend agli subah sugar barha sakti hai.",
    pg_tip_fallback_8: "Bag mein aik chhota emergency snack (phal ya meva) rakhein agar khana late ho jaye.",

    pg_checklist_title: "👜 *Pregnancy Checklist*",
    pg_checklist_intro: "Checklist PDF kholnay ke liye topic chunein.",
    pg_checklist_placeholder:
      "Checklists tayaar ho rahi hain aur jald yahan available hongi. 👜",
    pg_checklist_topic_missing: "Yeh checklist ab available nahi. List se koi aur chunein.",
    pg_checklist_topic_no_pdf:
      "*{title}*\n\nYeh checklist tayaar ho rahi hai aur jald yahan share ki jayegi.",
    pg_checklist_topic_open: "*{title}*\n\nYeh rahi checklist: {url}",

    pg_cl_hospital_bag: "Hospital Bag Checklist",
    pg_cl_delivery_prep: "Preparing for Delivery",
    pg_cl_questions_dr: "Questions to Ask Your Doctor",
    pg_cl_glucose_testing: "Glucose Testing Checklist",
    pg_cl_newborn: "Newborn Essentials",
    pg_cl_breastfeeding: "Breastfeeding Basics",
    pg_cl_snacks: "Healthy Snacks During Pregnancy",
    pg_cl_activity: "Safe Activity During Pregnancy",
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
