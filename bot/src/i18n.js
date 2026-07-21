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
    btn_admin_skip: "🧪 Skip (admin)",
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
      "📋 *Explain My Report*\n\n📸 *Just send your report right here in the chat* — a photo, image, or PDF. You can also paste the values as text.\n\nI'll explain your results in simple language, highlight anything important, and tell you what it may mean for your diabetes.\n\n*Supported reports:*\n• Blood tests\n• HbA1c reports\n• Cholesterol / Lipid Profile\n• Kidney function tests\n• Liver function tests\n• Urine tests\n• Hospital laboratory reports\n• Diabetes-related investigations\n_Tap Back to Menu when done._",
    btn_upload_lab: "📎 Attach Report",
    btn_take_photo_lab: "📸 Take a Photo",
    upload_lab_hint:
      "📸 Attach the report and send.\n\n_Tap the attach icon (paperclip) in your chat, pick your report (image or PDF) or take a fresh photo, and hit send. I'll analyse it and add it to your record._",
    lab_pdf_unreadable:
      "I received the PDF but couldn't read any text from it — it may be a scanned image. Please share a photo or screenshot of the report instead.",
    lab_unsupported_file:
      "That file type isn't supported yet — please attach a photo, an image file, or a PDF of your report.",
    lab_image_unreadable:
      "📸 I couldn't read the report clearly — the image looks blurry or the text isn't sharp enough. Please send a clearer photo (good lighting, no shadows, the whole report in focus) or type the values as text.",
    lab_partial_unreadable:
      "⚠️ *Note:* Some parts of the image were not clear, so I couldn't analyse everything — {reason}. If you'd like those values explained too, please send a clearer photo of that section or type the values as text.",
    lab_partial_unreadable_generic:
      "⚠️ *Note:* Some parts of the image were not clear, so I couldn't analyse everything. If you'd like those values explained too, please send a clearer photo of that section or type the values as text.",
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
    progress_no_goals: "_You haven't set any goals yet._",
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
    error_ai_credits:
      "💳 Our AI credits have run out for now, so I can't analyse this right now. Our team has been notified and will top up shortly — please try again later. Your data is safe.",
    error_ai_unavailable:
      "🤖 The AI service is temporarily unreachable. Please try again in a few minutes — your data is safe.",
    error_ai_config:
      "⚙️ Something is off on our side and the AI couldn't reply. Our team has been notified — please try again shortly.",
    error_too_large:
      "📎 That file is too large for me to analyse. Try a smaller image (ideally under 5 MB) or send a shorter document.",
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
      "As Salam Alaikum and welcome to DrSaab — your AI Coach for Diabetes 👋🏼\n\nI can help you understand your diabetes, build healthier habits, stay consistent, and improve your long-term health.\n\nFor اردو messaging, please select Urdu below.\n\nAur WhatsApp wali Urdu mein baat karnay ke liye, WhatsApp Urdu ka option use karain.",
    welcome_salaam:
      "Walaikumussalam and welcome to *DrSaab* — your AI Coach for Diabetes.\n\nI can help you understand your diabetes, build healthier habits, stay consistent, and improve your long-term health.\n\nFor اردو messaging, please select Urdu below.\n\nAur WhatsApp wali Urdu mein baat karnay ke liye, WhatsApp Urdu ka option use karain.",
    welcome_urdu_intent:
      "وعلیکم السلام اور ڈاکٹر صاحب میں خوش آمدید۔\nمیں آپ کو ذیابیطس کو بہتر سمجھنے، صحت مند عادات بنانے، مستقل مزاج رہنے اور اپنی صحت بہتر بنانے میں مدد دوں گا۔\n\nEnglish mein baat karne ke liye English select karein.\n\nWhatsapp wali Urdu mein baat karne ke liye WhatsApp Urdu select karein.",
    btn_lang_english: "English",
    btn_lang_urdu: "اردو",
    btn_lang_whatsapp_urdu: "WhatsApp Urdu",

    voice_note_saved: "Thanks — I've received your voice note and saved it. For the fastest help, you can also type your question.",
    ask_name_v2: "Before we begin, what's your name?",
    name_ack:
      "Nice to meet you, *{name}* 👋\nLet's build your profile so I can personalize my coaching for you.",
    ask_user_type: "Which best describes you?",
    ut_type1: "I have Type 1 Diabetes",
    ut_type2: "I have Type 2 Diabetes",
    ut_prediabetes: "I have Prediabetes",
    ut_gestational: "I have Gestational Diabetes",
    ut_healthier: "I want to live healthier",
    ut_doctor: "🩺 I'm a Doctor",

    // ---------- Doctor onboarding (v1.0) ----------
    doc_ask_specialty: "Great — let's set up your professional profile.\n\nWhat's your *medical specialty*? (e.g. Endocrinology, Family Medicine, Cardiology)",
    doc_ask_location: "What's your *primary practice location*? (city, hospital or clinic name)",
    doc_ask_email: "Please share your *professional email* — we'll use it for account recovery and doctor-only updates.",
    doc_email_invalid: "That doesn't look like a valid email. Please send a full address like `name@clinic.com`.",
    doc_ask_patient_use: "Would you also like to use DrSaab for *your own personal health*? You can switch to your doctor menu anytime.",
    doc_setup_complete: "✅ Your doctor profile is ready, *Dr. {name}*.\n\nYour permanent referral code is *{code}*.\nShare it with patients so they can link their records to your practice.",

    // Doctor main menu
    doc_menu_title: "🩺 *Doctor Menu* — how can I help today, Dr. {name}?",
    btn_doc_reports: "📊 Patient Reports",
    btn_doc_referral: "🔑 Referral Code",
    btn_doc_myhealth: "❤️ My Health",
    btn_doc_switch_patient: "🔄 Switch to Patient Menu",
    btn_doc_switch_doctor: "🩺 Switch to Doctor Menu",
    btn_doc_test_dp: "🧪 Test DP Cap Flow",
    dp_test_patient_name: "Test Patient",
    btn_doc_upgrade_dp: "⭐ Upgrade to Doctor Pro",

    // Referral code screen
    doc_referral_title: "🔑 *Your Referral Code*",
    doc_referral_body: "Share this code with your patients so they can link their DrSaab profile to your practice:\n\n*{code}*\n\nThe code is permanent — you'll always see the same one here.",

    // Patient reports (aggregated)
    doc_reports_title: "📊 *Practice Overview*",
    doc_reports_pick_window: "📊 *Practice Overview*\n\nWhich timeframe would you like to see?",
    doc_reports_window_weekly: "📅 Weekly summary — last 7 days",
    doc_reports_window_monthly: "📅 Monthly summary — last 30 days",
    doc_reports_window_all: "📊 All-time summary",
    btn_doc_rep_weekly: "📅 Weekly",
    btn_doc_rep_monthly: "📅 Monthly",
    btn_doc_rep_all: "📊 All-time",
    doc_reports_empty: "No patients are linked to your practice yet.\n\nShare your referral code *{code}* — once patients add it under ❤️ My Health → My Doctor, their aggregated insights will appear here.",
    doc_reports_body:
      "*Connected patients:* {patients}\n*Engagement:* {engagement}\n*Average SMI:* {smi}\n\n📈 *Trends*\n• HbA1c average: {hba1c}\n• Weight average: {weight}\n• Activity: {activity}\n• Medication adherence: {adherence}\n\n🟢 *Green flags*\n{green}\n\n🔴 *Red flags*\n{red}\n\n💡 *Suggested actions*\n{actions}",
    doc_reports_none: "—",
    doc_reports_green_default: "• Patients logging consistently\n• Engagement holding steady",
    doc_reports_red_default: "• Watch for patients missing check-ins",
    doc_reports_actions_default: "• Encourage patients with low engagement to check in this week\n• Follow up with anyone whose HbA1c trend is rising",

    // Patient-side: My Doctor
    btn_my_doctor: "👨‍⚕️ My Doctor",
    my_doctor_title_none: "👨‍⚕️ *My Doctor*\n\nYou haven't linked a doctor yet.\n\nEnter a *DS#XXXX* referral code from your doctor to connect.",
    my_doctor_title_linked:
      "👨‍⚕️ *My Doctor*\n\n*{name}*\nSpecialty: {specialty}\nLocation: {location}\nLinked: {linked}\n\nYou can change or remove your doctor at any time.",
    btn_add_doctor: "➕ Add Doctor",
    btn_change_doctor: "🔄 Change Doctor",
    btn_remove_doctor: "❌ Remove Doctor",
    my_doctor_ask_code: "Please enter your doctor's referral code (format: *DS#XXXX*).",
    my_doctor_code_invalid: "That code doesn't look right. Please send a code in the format *DS#XXXX* (e.g. `DS#A7K9`).",
    my_doctor_not_found: "I couldn't find a doctor with that code. Please double-check *DS#XXXX* and try again.",
    my_doctor_confirm:
      "I found this doctor:\n\n*{name}*\nSpecialty: {specialty}\nLocation: {location}\n\nDo you want to link your DrSaab profile to this doctor? Only aggregated insights are shared — never individual chats.",
    btn_confirm_link: "✅ Yes, Link",
    btn_cancel_link: "Cancel",
    my_doctor_linked_ok: "✅ You're now linked to *Dr. {name}*.",
    my_doctor_remove_confirm: "Remove *Dr. {name}* from your DrSaab profile? Your data stays with you — the doctor simply stops seeing your aggregated insights.",
    btn_confirm_remove: "Yes, remove",
    my_doctor_removed_ok: "✅ Doctor removed. You can link a new one anytime.",

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

    // ---- Quick Shortcuts (universal shortcut system, spec 2026-07) ----
    quick_shortcuts_title: "⚡ *Quick Shortcuts*",
    quick_shortcuts_body:
      "Type any of these anytime:\n\n📋 *menu* – Open the Main Menu\n❓ *help* – See how DrSaab works\n❤️ *health* – View your health summary\n🩸 *sugar* – Log blood sugar\n💊 *meds* – Check in your medicines\n🍽️ *food* – Get food help\n📄 *report* – Upload a health report\n🎯 *progress* – View goals and progress\n🏆 *challenge* – View or join challenges\n🩺 *doctor* – Doctor and referral options\n\n💬 Or just ask naturally — for example:\n_\"Can I eat biryani?\"_\n_\"My sugar is 145.\"_\n_\"Show my latest HbA1c.\"_",
    shortcut_sugar_needs_context:
      "Got it — I saw *{value}*. Was this *fasting*, *random*, *before a meal*, *after a meal*, or *bedtime*? Reply with the timing so I can log it correctly.",
    shortcut_flow_paused:
      "Paused your *{flow}* check-in — your answers so far are safe. Type *resume* to continue where you left off.",
    shortcut_no_paused_flow: "You don't have a paused check-in to resume.",
    shortcut_resumed: "Resuming your *{flow}* check-in. ↩️",
    shortcut_hba1c_none:
      "I don't have a stored HbA1c for you yet. Tap *report* or send a lab report and I'll extract it.",
    shortcut_hba1c_latest:
      "🧪 *Your latest HbA1c*: *{value}%*{date}\n\nTap *report* to upload a new lab result, or ask me anything about it.",
    shortcut_confirm_log_sugar:
      "Would you like me to save *{value}* as a blood-sugar reading? Reply *yes* to log it, or ask a question.",
    shortcut_flow_glucose: "blood sugar",
    shortcut_flow_med: "medication",
    shortcut_flow_weight: "weight",
    shortcut_flow_activity: "activity",
    shortcut_flow_symptoms: "symptoms",
    shortcut_flow_wellbeing: "wellbeing",
    shortcut_flow_health: "health",
    shortcut_flow_myhealth: "My Health",
    shortcut_flow_lab: "lab report",
    shortcut_flow_mydoc: "doctor link",

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

    // ==================================================================
    // Challenges v1.0 (spec 2026-07) — full module (new `chal_*` prefix)
    // ==================================================================
    chal_menu_title: "🏆 *Challenges*",
    chal_menu_intro:
      "Join a challenge, build consistency and see how your progress compares with the DrSaab community.\n\nChoose an option:",
    btn_chal_active: "🔥 Active Challenges",
    btn_chal_join: "➕ Join a Challenge",
    btn_chal_rankings: "🏆 Rankings",
    btn_chal_history: "🏅 My Challenge History",

    chal_available_title: "🏆 *Choose a Challenge*",
    chal_available_intro:
      "Everyone follows the same rules. Join, use DrSaab normally and see how much progress you can make.",
    chal_type_hba1c: "🎯 HbA1c Challenge",
    chal_type_activity: "🚶 Activity Challenge",
    chal_type_healthy_plate: "📸 Meal Challenge",

    // -------- HbA1c challenge (§6) --------
    chal_hba1c_intro_title: "🎯 *90-Day HbA1c Challenge*",
    chal_hba1c_intro_body:
      "Join other DrSaab users working to improve their HbA1c over the next 90 days.\n\nYour ranking will consider:\n🧪 How much your HbA1c improves\n📱 How consistently you use DrSaab\n\nReady to join?",
    chal_hba1c_how_title: "📘 *How It Works*",
    chal_hba1c_how_body:
      "*1.* Add your latest HbA1c result\n*2.* Keep using DrSaab during the next 90 days\n*3.* Add a new HbA1c result near the end\n*4.* See your improvement and final ranking\n\nYour public ranking will never show your starting or final HbA1c numbers.",

    chal_hba1c_collect_title:
      "🧪 Send your latest HbA1c result to set your starting number.",
    chal_hba1c_collect_body:
      "You can upload your report or type the result.\n\nExample: *8.2%*",
    chal_hba1c_reuse:
      "🧪 I found a recent HbA1c result in your health records:\n\n*HbA1c: {value}%*\n*Test date: {date}*\n\nUse this as your starting result?",
    chal_hba1c_reuse_no_date:
      "🧪 I found a recent HbA1c result in your health records:\n\n*HbA1c: {value}%*\n\nUse this as your starting result?",
    chal_hba1c_invalid:
      "That does not look like a valid HbA1c result.\n\nPlease enter the percentage shown on your report.\n\nExample: *8.2%*",
    chal_hba1c_baseline_stale_warning:
      "_Tip: for the best comparison, your starting HbA1c should be from the last 30 days._",

    chal_hba1c_confirm_title: "🎯 *You're In!*",
    chal_hba1c_confirm_body:
      "Starting HbA1c: *{baseline}%*\nChallenge duration: *90 days*\nEnd date: *{end_date}*\n\nKeep using DrSaab to check in, log activity, analyze meals and manage your health.\n\nNear the end of the challenge, I'll ask for your latest HbA1c result.",
    chal_hba1c_confirm_doctor_footer:
      "Your challenge progress will also be available to *Dr. {doctor}*.",

    chal_hba1c_final_prompt_title:
      "🧪 Your HbA1c Challenge is approaching the finish line.",
    chal_hba1c_final_prompt_body:
      "Upload your latest report or type your new HbA1c result so I can calculate your progress and ranking.",
    chal_hba1c_final_saved_title: "🎯 *Your HbA1c Challenge Result*",
    chal_hba1c_final_saved_body:
      "Starting HbA1c: *{baseline}%*\nFinal HbA1c: *{final}%*\nChange: *{change} percentage points*\nFinal rank: *{rank} of {total}*",
    chal_hba1c_supportive_improved:
      "That's real progress — well done for staying consistent. Keep the habits going. 💚",
    chal_hba1c_supportive_flat:
      "Holding steady is still a win. Small changes compound — keep going. 💚",
    chal_hba1c_supportive_up:
      "HbA1c can move for many reasons. This is not a failure — let's keep working on the habits that help most.",

    btn_chal_join_now: "✅ Join Challenge",
    btn_chal_how: "📘 How It Works",
    btn_chal_upload: "📎 Upload Report",
    btn_chal_enter: "⌨️ Enter Result",
    btn_chal_cancel: "❌ Cancel",
    btn_chal_reuse_yes: "✅ Yes, Use This",
    btn_chal_reuse_another: "🔄 Add Another Result",
    btn_chal_remind_later: "Remind Me Later",

    // -------- Activity challenge (§7) --------
    chal_activity_intro_title: "🚶 *30-Day Activity Challenge*",
    chal_activity_intro_body:
      "Move regularly for the next 30 days and climb the DrSaab challenge rankings.\n\nYour ranking will consider:\n🚶 Number of active days\n⏱️ Activity duration\n📱 Consistency on DrSaab\n\nReady to join?",
    chal_activity_how_title: "📘 *How It Works*",
    chal_activity_how_body:
      "Log your walks, workouts, swimming, sports or other physical activity through DrSaab.\n\nAn activity must last at least *20 minutes* to count.\n\nOnly one active day counts towards the ranking each day, even if you complete more than one activity.",
    chal_activity_join_title: "🚀 *You're In!*",
    chal_activity_join_body:
      "The 30-Day Activity Challenge begins today.\n\nLog your activity through DrSaab and your score will update automatically.\n\nMinimum qualifying activity: *20 minutes*\nEnd date: *{end_date}*",
    chal_activity_progress:
      "🚶 *Activity Challenge Progress*\n\nActive days: *{active_days}*\nTotal activity minutes: *{minutes}*\nCurrent streak: *{streak} days*\nChallenge day: *{day} of 30*\nCurrent rank: *{rank} of {total}*",

    // -------- Healthy Plate challenge (§8) --------
    chal_hp_intro_title: "📸 *30-Day Healthy Plate Challenge*",
    chal_hp_intro_body:
      "Share your meals with DrSaab and see how many healthier plates you can build over the next 30 days.\n\nYour ranking will consider:\n🥗 Number of Healthy Plates\n📸 Meal-logging consistency\n📱 Overall DrSaab participation\n\nReady to join?",
    chal_hp_how_title: "📘 *How It Works*",
    chal_hp_how_body:
      "*1.* Send a meal photo or description\n*2.* DrSaab analyzes the meal\n*3.* Meals classified as a Healthy Plate count automatically\n*4.* Keep going for 30 days and see your final rank\n\nYou do not need to log every meal.",
    chal_hp_join_title: "🥗 *You're In!*",
    chal_hp_join_body:
      "The 30-Day Healthy Plate Challenge begins today.\n\nSend DrSaab a photo or description of your meals. Meals classified as a Healthy Plate will count automatically.\n\nEnd date: *{end_date}*",
    chal_hp_meal_hit:
      "🟢 *Healthy Plate!*\n\nThis meal counts towards your challenge.\n\nHealthy Plates: *{count}*\nCurrent rank: *{rank} of {total}*",
    chal_hp_meal_miss:
      "🟡 This meal does not count as a Healthy Plate yet, but it still helps us understand your eating habits.",

    // -------- Rankings / leaderboard (§11) --------
    chal_rankings_title: "🏆 *{name} Rankings*",
    chal_rankings_empty: "_Rankings will appear here once other users join. Keep going!_",
    chal_rankings_row: "{rank}. {name} — {outcome}",
    chal_rankings_you_suffix: "  ← *you*",
    chal_rankings_you_position: "\nYour position: *{rank} of {total}*",
    chal_rankings_hba1c_note:
      "_Ranked within your baseline band ({band}). Public rankings never show your HbA1c numbers._",
    chal_rankings_pick_intro: "Pick a challenge to see the rankings:",
    chal_rankings_none_active: "Rankings will appear once you join a challenge.",

    // -------- History (§4) --------
    chal_history_title: "🏅 *My Challenge History*",
    chal_history_empty: "You haven't completed any challenges yet.",
    chal_history_row_completed: "• *{name}* — {outcome} (rank {rank}/{total})",
    chal_history_row_incomplete: "• *{name}* — {status}",
    chal_history_status_expired: "no final result",
    chal_history_status_withdrawn: "withdrew",
    chal_history_status_disqualified: "removed",

    // -------- Active challenges list --------
    chal_active_title: "🔥 *Active Challenges*",
    chal_active_none:
      "You have no active challenges. Tap *Join a Challenge* to get started.",
    chal_active_line_hba1c:
      "🎯 *90-Day HbA1c Challenge* — day {day}/{total}",
    chal_active_line_activity:
      "🚶 *30-Day Activity Challenge* — day {day}/{total} · {active_days} active day(s)",
    chal_active_line_healthy_plate:
      "📸 *30-Day Healthy Plate Challenge* — day {day}/{total} · {count} Healthy Plate(s)",
    chal_active_awaiting_hba1c:
      "🎯 *90-Day HbA1c Challenge* — waiting for your final result",

    // -------- Doctor notifications (§12) --------
    chal_dr_joined:
      "🏆 *Patient Joined a Challenge*\n\nPatient: *{patient}*\nChallenge: *{challenge}*\nStart date: *{start}*\nEnd date: *{end}*",
    chal_dr_weekly:
      "📊 *Weekly Challenge Update*\n\nPatient: *{patient}*\nChallenge: *{challenge}*\nProgress: *{progress}*\nParticipation: *{participation}*\nCurrent rank/percentile: *{rank}*\nStatus: *{status}*",
    chal_dr_completed:
      "🏁 *Challenge Completed*\n\nPatient: *{patient}*\nChallenge: *{challenge}*\nStarting value: *{baseline}*\nFinal value: *{final}*\nMeasured change: *{outcome}*\nParticipation: *{participation}* pts\nFinal rank: *{rank}* (percentile {percentile})\nStatus: *{status}*",
    chal_dr_incomplete:
      "⏰ *Challenge Ended Without Result*\n\nPatient: *{patient}*\nChallenge: *{challenge}*\nOutcome: {reason}",

    // -------- Reminders (§13) --------
    chal_reminder_activity:
      "🚶 You've completed *{active_days} active days* so far.\n\nA 20-minute walk today can keep your challenge moving. 💪",
    chal_reminder_healthy_plate:
      "🥗 You're at *{count} Healthy Plates*.\n\nSend your next meal whenever you're ready. 📸",
    chal_reminder_hba1c:
      "🎯 Your HbA1c Challenge is still moving forward.\n\nFocus on the next helpful choice today — not a perfect 90 days.",
    reminder_template_challenge_final_result_prompt:
      "🧪 Your HbA1c Challenge is nearing the finish line — send your latest HbA1c result when you can.",
    reminder_template_challenge_checkin:
      "🏆 Keep your challenge moving today — a small log, check-in or meal all count.",

    // -------- Result formatting helpers --------
    chal_outcome_hba1c_change: "↓ {change} percentage points",
    chal_outcome_hba1c_up:     "↑ {change} percentage points",
    chal_outcome_hba1c_steady: "steady",
    chal_outcome_active_days:  "{value} active day(s)",
    chal_outcome_plates:       "{value} Healthy Plate(s)",

    chal_join_already:
      "You've already joined the *{name}*. Tap 🔥 Active Challenges to see your progress.",
    chal_start_generic_confirm:
      "✅ You're in! Keep using DrSaab normally — I'll count everything that qualifies.",
    chal_error_no_defs:
      "No challenges are open right now. Check back soon!",
    chal_ineligible_hba1c:
      "The HbA1c Challenge is designed for people with prediabetes or diabetes. Tap another challenge or check back later.",
    chal_baseline_band_lt7:     "Below 7.0%",
    chal_baseline_band_7_8_9:   "7.0%–8.9%",
    chal_baseline_band_9_10_9:  "9.0%–10.9%",
    chal_baseline_band_11_plus: "11.0% and above",

    // Detail view + withdraw + opt-out (spec §11 + §15)
    btn_chal_hide_ranking: "🙈 Hide me from public leaderboard",
    btn_chal_show_ranking: "👁 Show me on public leaderboard",
    btn_chal_withdraw:     "🚪 Leave this challenge",
    btn_chal_withdraw_confirm: "✅ Yes, leave",
    chal_leaderboard_optin_on:
      "✅ You're now visible on the public leaderboard.",
    chal_leaderboard_optin_off:
      "✅ You're hidden from the public leaderboard. Your progress and doctor updates continue.",
    chal_withdraw_confirm_prompt:
      "Are you sure you want to leave *{name}*? Your progress will stop counting and this challenge will move to your history.",
    chal_withdraw_done: "You've left *{name}*. You can join another challenge anytime.",
    chal_detail_activity:
      "🚶 *30-Day Activity Challenge*\n\nActive days: *{active_days}*\nTotal activity minutes: *{minutes}*\nCurrent streak: *{streak} days*\nChallenge day: *{day} of 30*\nCurrent rank: *{rank} of {total}*",
    chal_detail_healthy_plate:
      "📸 *30-Day Healthy Plate Challenge*\n\nHealthy Plates: *{count}*\nChallenge day: *{day} of 30*\nCurrent rank: *{rank} of {total}*",
    chal_detail_hba1c:
      "🎯 *90-Day HbA1c Challenge*\n\nStarting HbA1c: *{baseline}%*\nChallenge day: *{day} of 90*\nParticipation: *{points} points*\nCurrent streak: *{streak} days*\n\nYour final ranking will be calculated once your closing HbA1c is submitted.",
    chal_detail_awaiting_final:
      "🎯 *90-Day HbA1c Challenge*\n\nYour challenge duration is complete. Send your latest HbA1c so I can calculate your final ranking.",

    // §7.4 Qualifying activities
    chal_activity_qualifying_list:
      "\n\n*Qualifying activities:*\n• Walking\n• Running\n• Gym workout\n• Swimming\n• Cycling\n• Sports\n• Home workout\n• Yoga or mobility\n• Any other intentional physical activity",

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
    menu_v2_title:
      "🩺 DrSaab is ready!\n💬 Ask me anything.\n⚡ Use a quick command.\n👇 Or choose from the menu below.",
    btn_checkin: "🩺 Check In",
    btn_foodhelp: "🍽️ Food Help",
    btn_checkreport: "📋 Explain My Report",
    // btn_myprogress removed — "Goals & Progress" retired per 2026-07 revision.
    btn_askdrsaab: "💬 Ask DrSaab",
    btn_more: "🌟 More",
    btn_main_menu: "🏠 Main Menu",
    btn_myhealth: "❤️ My Health",

    // ===== ❤️ My Health (spec "Main Menu Revision v2.1", 2026-07) =====
    // Buttons
    btn_mh_start: "1️⃣ Start",
    btn_mh_yes: "1️⃣ Yes",
    btn_mh_edit: "2️⃣ Edit",
    btn_mh_skip: "Skip ⏭",
    btn_mh_ctx_fasting: "Fasting",
    btn_mh_ctx_random: "Random",
    btn_mh_ctx_postmeal: "After a meal",
    // Intro (not started)
    mh_intro:
      "❤️ *My Health*\n\nThe more I know about your health, the better I can personalize my advice.\n\nThis only takes about 2 minutes.",
    // Resume (in progress)
    mh_resume_welcome: "❤️ *My Health*\n\nWelcome back! Last time we talked about {done}.\n\nLet's continue.",
    mh_resume_welcome_nostep: "❤️ *My Health*\n\nWelcome back! Let's continue where we left off.",
    // Recap snippets (used in the resume banner). Keys are step-agnostic so
    // question order can be re-shuffled in code without churning i18n.
    mh_recap_aboutyou: "your basics",
    mh_recap_conditions: "your health conditions",
    mh_recap_medications: "your medicines",
    mh_recap_metrics: "your health numbers",
    mh_recap_lifestyle: "your lifestyle",
    mh_recap_goal: "your goal",
    mh_recap_anything: "anything else",
    // Question headers / prompts (2026-07 spec: 7 conversational steps)
    mh_question_of: "*Question {n} of {total}*",
    // Q1 — About You. Pre-fill: {known_block} lists whatever gender/age/height/
    // weight we already have; {ask} is a per-state sentence (all known / some
    // missing / none known).
    mh_q_aboutyou:
      "👋 *About You*\n\n{known_block}{ask}",
    mh_q_aboutyou_ask_confirm:
      "Everything look right? Reply *ok* to keep it, or type any updates (e.g. \"weight 76kg\", \"female, 32\").",
    mh_q_aboutyou_ask_missing:
      "Please also tell me your *{missing}* — just type naturally.",
    mh_q_aboutyou_ask_none:
      "Tell me your *gender*, *age*, *height* and *current weight* — just type naturally (e.g. \"female, 32, 168cm, 62kg\").",
    mh_q_aboutyou_missing_gender: "gender",
    mh_q_aboutyou_missing_age: "age",
    mh_q_aboutyou_missing_height: "height",
    mh_q_aboutyou_missing_weight: "current weight",
    mh_aboutyou_line_gender: "• Gender: *{value}*",
    mh_aboutyou_line_age: "• Age: *{value}*",
    mh_aboutyou_line_height: "• Height: *{value} cm*",
    mh_aboutyou_line_weight: "• Weight: *{value} kg*",
    mh_aboutyou_ok_ack: "Great — thanks for confirming.",
    mh_aboutyou_updated: "✅ Updated your basics.",
    mh_none_aboutyou:
      "I didn't catch any details there. Try something like \"male, 42, 174cm, 78kg\" — or just the parts I'm missing.",
    // Q2 — Health conditions
    mh_q_conditions:
      "❤️ *Your Health*\n\nWhich health conditions do you currently have? Just tell me naturally.\n\nExample: \"I have Type 2 diabetes, high blood pressure and cholesterol.\"",
    // Q3 — Medicines
    mh_q_medications:
      "💊 *Medicines*\n\nWhat medicines or supplements do you currently take?\n\nYou can:\n• Type them\n• Send a photo of the medicine boxes\n• Send a photo of your prescription",
    // Q4 — Health numbers (expanded to include cholesterol)
    mh_q_metrics:
      "📊 *Health Numbers*\n\nTell me any recent health numbers you know — HbA1c, blood sugar, blood pressure, weight, cholesterol, etc.\n\nJust list whichever ones you know.",
    // Q5 — Lifestyle (expanded to smoking, alcohol, exercise, sleep)
    mh_q_lifestyle:
      "🌿 *Your Lifestyle*\n\nTell me a little about your lifestyle — smoking, alcohol, exercise and sleep.\n\nJust answer naturally.",
    // Q6 — Goal
    mh_q_goal:
      "🎯 *Your Goal*\n\nWhat's the biggest thing you'd like to improve over the next few months?\n\nExample: better blood sugar, lose weight, build muscle, stay healthy, run a 5K.",
    // Q7 — Anything Else? (free-text catch-all)
    mh_q_anything:
      "😊 *Anything Else?*\n\nAnything important DrSaab should know? Surgery, injury, allergies, pregnancy, or anything else. If not, simply reply *Nothing else*.",
    mh_anything_none_ack: "Got it — nothing else to note.",
    mh_anything_saved: "✅ Noted. Thanks for sharing.",
    // Confirmation card
    mh_confirm_intro: "I've recorded:\n\n{lines}\n\nIs that correct?",
    mh_edit_reask: "No problem — go ahead and type it again.",
    mh_saved_ok: "✅ Saved.",
    // "couldn't extract" nudges
    mh_none_conditions:
      "I didn't quite catch any conditions there. You can type them (e.g. \"Type 2 diabetes, high blood pressure\"), or tap Skip.",
    mh_none_medications:
      "I didn't catch any medicines. You can type them, send a photo of the boxes/prescription, or tap Skip.",
    mh_none_metrics:
      "I didn't catch any numbers. You can type them (e.g. \"HbA1c 7.2, weight 81kg\"), or tap Skip.",
    // Glucose context follow-up
    mh_glucose_context_q: "Got it — was that reading *fasting*, *random*, or *after a meal*?",
    // Setup complete
    mh_setup_complete: "❤️ That's everything I need for now — your health profile is ready. Thank you!",
    // Summary (completed)
    mh_summary_header: "❤️ *My Health*\n\nHere's what I currently know about your health:",
    mh_summary_footer:
      "To update anything, simply type it below.\n\nExamples:\n\"My weight is now 79 kg.\"\n\"My HbA1c is 6.8.\"\n\"I've stopped taking Tagipmet.\"\n\"I've also been diagnosed with fatty liver.\"",
    mh_summary_dash: "—",
    mh_lbl_conditions: "🩺 *Conditions:*",
    mh_lbl_meds: "💊 *Medicines:*",
    mh_lbl_hba1c: "🧪 *Latest HbA1c:*",
    mh_lbl_glucose: "🩸 *Latest Glucose:*",
    mh_lbl_weight: "⚖️ *Weight:*",
    mh_lbl_bp: "🫀 *Blood Pressure:*",
    mh_lbl_smoking: "🚬 *Smoking:*",
    mh_lbl_activity: "🏃 *Activity:*",
    mh_lbl_goal: "🎯 *Goal:*",
    mh_smoking_smoker: "Smoker",
    mh_smoking_non_smoker: "Non-smoker",
    mh_smoking_ex_smoker: "Ex-smoker",
    // Update mode
    mh_update_hint:
      "Just tell me what's changed and I'll update your health profile.\n\nExamples: \"My fasting sugar was 104\", \"I now weigh 76 kg\", \"I've started taking Ozempic.\"",
    mh_update_saved: "✅ Updated your health profile.",
    // Summary card buttons (spec 2026-07: Update My Health Profile + Main Menu)
    btn_mh_update_profile: "✏️ Update My Health Profile",
    btn_mh_main_menu: "🏠 Main Menu",
    mh_update_profile_confirm:
      "Restarting your health profile will walk you through the 7 questions again. Your existing conditions, medicines and history stay saved. Continue?",
    btn_mh_update_yes: "✅ Yes, restart",
    btn_mh_update_no: "↩️ Cancel",

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

    // "My Progress" / "Goals & Progress" submenu removed per 2026-07 revision —
    // a data-trend summary now lives inside ❤️ My Health.

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
      "Let's set up your medications. 💊\nYou can either:\n\n📷 *Send a photo* of your medications or prescription right here in the chat (multiple medications in one photo is fine), or\n\n✍️ *Type your medications* in a message.\n\n_Example:_\n• Metformin 500mg twice daily\n• Rosuvastatin 10mg once daily\n• Humalog insulin 8 units before breakfast\n• Lantus insulin 20 units at bedtime",
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
    reminder_template_med_consistency: "💊 Don't forget to take your medications:\n{name}",

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
    rem_cat_medication: "💊 Medication",
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

    // Subscription Module — Upgrade flow (spec §2–§8)
    upsell_menu_title:
      "🟢 *Consistency Coach*\nRs 799/month\nPersonalized AI coaching & premium features.\n\n⭐ *Executive Coach*\nRs 7,999/month\nPremium one-to-one coaching.",
    btn_upsell_consistency: "🟢 Consistency",
    btn_upsell_executive: "⭐ Executive",
    upsell_executive_unavailable:
      "⭐ *Executive Coach* isn't available yet.\nPlease check back soon.",
    upsell_consistency_title: "🟢 *Consistency Coach*",
    upsell_consistency_features:
      "*Premium features:*\n• 🤖 Advanced AI\n• 🧠 Personalized guidance\n• 🏋️ Fitness plans\n• 🥗 Meal plans\n• 🎥 Exclusive videos\n• ⌚ Wearable integration (WHOOP, Fitbit, Apple Health & Google Fit)",
    upsell_consistency_offers:
      "💰 *Offers*\n• 1 Month – Rs 799\n• ⭐ 6 Months – Pay for 5 Months (Rs 3,995)\n• 💎 12 Months – Pay for 10 Months (Rs 7,990)",
    btn_upsell_1m: "1 Month",
    btn_upsell_6m: "6 Months",
    btn_upsell_12m: "12 Months",

    // Plan confirmation card (§4)
    upsell_confirm_1m:
      "🟢 *1 Month Plan*\n💰 Rs 799\nOne month of Consistency Coach.",
    upsell_confirm_6m:
      "🟢 *6 Month Plan*\nPay for 5 months\n💰 Rs 3,995\nYou get 6 full months.",
    upsell_confirm_12m:
      "🟢 *12 Month Plan*\nPay for 10 months\n💰 Rs 7,990\nYou get 12 full months.",
    btn_upsell_continue: "Continue",
    btn_upsell_change_plan: "Change Plan",
    btn_upsell_test_activate: "🧪 Test Activate (skip payment)",
    test_activation_disabled:
      "🧪 Test activation isn't enabled for your account. Send the admin password to unlock, or set TEST_ACTIVATION_ENABLED=true in .env.",
    admin_promoted:
      "🔓 *Admin mode unlocked.*\nYou'll now see the 🧪 test buttons on the upgrade and doctor menus. Send /menu to refresh.\n\n_Send `admin off` to exit admin mode._",
    admin_demoted:
      "🔒 *Admin mode disabled.*\nTest buttons are hidden again. Send the admin password to re-enter.",

    // Payment method (§5)
    pay_method_title: "Choose a payment method:",
    btn_pay_bank: "🏦 Bank",
    btn_pay_jazzcash: "💳 JazzCash",

    // Bank payment (§6)
    pay_bank_title: "🏦 *Payment Details*",
    pay_bank_body:
      "*Bank:* Bank AL Habib\n*Account:* M/S. MEEBO TECHNOLOGIES\n*IBAN:* PK48BAHL1036098100995201\n*Amount:* Rs {amount}\n\n📸 After payment, send the screenshot or deposit slip here.",

    // JazzCash payment (§7)
    pay_jazzcash_title: "💳 *JazzCash Payment*",
    pay_jazzcash_body:
      "(JazzCash account details to be added later.)\n\n*Amount:* Rs {amount}\n\n📸 After payment, send the transaction screenshot here.",

    btn_pay_ive_paid: "I've Paid",
    btn_pay_cancel: "Cancel",

    // Screenshot upload state (§8)
    pay_awaiting_proof:
      "📸 Please send the payment screenshot or deposit slip as a photo.",
    pay_proof_not_image:
      "That doesn't look like an image. Please send the payment screenshot as a photo.",
    pay_proof_received:
      "✅ Thanks for the screenshot! We're processing your payment.\nOnce it's processed we'll notify you on WhatsApp.",
    pay_session_lost:
      "Looks like your payment session was interrupted. Tap *Upgrade Plan* to pick your plan again — your health data is safe.",
    pay_cancelled: "Payment cancelled. You can restart from Upgrade anytime.",

    // Admin notification (§9) — sent to Yasir Abbasi
    admin_new_payment:
      "🔔 *New payment submission*\n\n*User:* {name}\n*WhatsApp:* {whatsapp}\n*Plan:* {plan}\n*Amount:* Rs {amount}\n*Method:* {method}\n*Submitted:* {when}\n\nPayment #{id}",
    admin_new_payment_caption: "Payment #{id} proof",
    btn_admin_approve: "✅ Approve",
    btn_admin_reject:  "❌ Reject",
    btn_admin_better:  "🔄 Better Image",
    admin_help:
      "*Subscription admin commands*\n\n`/sub pending` — list submissions awaiting review\n`/sub approve <id>` — approve payment #id and activate the user\n`/sub reject <id> [reason]` — reject payment #id (optional reason)\n`/sub better <id>` — ask the user to send a clearer screenshot",
    admin_pending_empty: "No pending payments.",
    admin_pending_row:
      "*Payment #{id}* — {name} (+{whatsapp})\n{plan} · Rs {amount} · {method} · {when}",
    admin_action_not_found: "No payment with that id.",
    admin_action_already_reviewed:
      "Payment #{id} was already {status} on {when}. No action taken.",
    admin_approved_ack:
      "✅ Payment #{id} approved.\n{name} is now a member until {expiry}.\n{notify}",
    admin_rejected_ack: "❌ Payment #{id} rejected.\n{notify}",
    admin_better_ack:
      "🔄 Asked user to send a better screenshot for payment #{id}.\n{notify}",
    admin_user_notified: "📣 User notified on WhatsApp.",
    admin_user_notify_failed:
      "⚠️ Couldn't reach the user on WhatsApp (session window may be closed). Backend was still updated.",
    admin_db_error:
      "⚠️ Couldn't update payment #{id} in the database. Please try again. Error: {err}",

    // §11 Activation — sent to the user once admin approves
    pay_activated:
      "🎉 You're now a *Consistency Coach* member!\n\n*Valid Until:* {expiry}\n\nEnjoy your premium features! 💚",

    // §12 Rejection + retry
    pay_rejected:
      "I couldn't verify your payment.\nPlease send another screenshot.",
    pay_better_proof:
      "The screenshot you sent isn't clear enough for us to verify. Could you send a clearer photo of the receipt or deposit slip?",
    btn_pay_upload_again: "📸 Upload Again",

    // §13 Renewal reminders
    sub_reminder_7d: "⏳ Your subscription expires in 7 days.",
    sub_reminder_1d: "🔔 Your subscription ends tomorrow.",
    sub_reminder_today: "Your premium plan expires today.",
    btn_sub_renew: "Renew",
    btn_sub_later: "Later",

    // §14 Automatic downgrade at expiry
    sub_expired_downgrade:
      "Your premium plan has ended.\nYou're now using the Free version.\nYour health data is still safe.",
    btn_sub_main_menu: "Main Menu",

    // ------------------------------------------------------------------
    // Doctor Pro Addendum (§2–§7)
    // ------------------------------------------------------------------
    dp_title: "🩺 *Doctor Pro*",
    dp_price: "*Price:* PKR 4,999/month",
    dp_plan_label: "Doctor Pro",
    dp_benefits:
      "*Benefits:*\n• Unlimited patients\n• Unlimited referral usage\n• Advanced patient reports\n• Priority access to new features",
    btn_dp_continue: "Continue",
    btn_dp_month: "Doctor Pro",

    // §4 — cap-reached prompt (sent to the doctor)
    dp_cap_a_patient: "a patient",
    dp_cap_reached:
      "⚠️ *You've reached your free limit of 10 patients.*\n\n{patient} just tried to connect but couldn't be added.\n\nUpgrade to *Doctor Pro (PKR 4,999/month)* to continue adding new patients.",
    btn_dp_upgrade: "Upgrade",
    btn_dp_later: "Later",

    // Patient-side message shown when the doctor they picked is full
    dp_patient_cap_reached:
      "Sorry — *{name}* isn't accepting new patients right now. Please try another referral code or check back later.",

    // §7 — activation & expiry messages (doctor voice)
    dp_activated:
      "🎉 You're now a *Doctor Pro* member!\n\n*Valid Until:* {expiry}\n\nYour 10-patient limit is lifted — new referrals will be accepted. 💚",
    dp_expired_downgrade:
      "Your *Doctor Pro* subscription has ended.\nExisting patients remain connected, but new patients can't be added until you renew.\nYour data and reports are safe.",

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
      "Thanks. I'd like you to watch this short video — it explains how sugary drinks and ultra-processed foods can affect your long-term health.\n\n[▶️ Watch the video](https://www.youtube.com/shorts/iNaq4vHPQYY)",
    // Step 4 — reflection
    pd_crav_reflection_q:
      "After watching the video, what changes do you think you could realistically make over the next few weeks?",
    // Step 5 — one small change
    pd_crav_commit_q: "If you had to make just one small change this week, what feels realistic?",
    btn_pd_commit_skip_sugary: "🥤 Skip sugary drinks",
    btn_pd_commit_skip_junk:   "🍟 Skip one junk snack a day",
    btn_pd_commit_walk10:      "🚶 Walk 10 minutes after dinner",
    btn_pd_commit_one_plate:   "🍽️ Stick to one plate",
    btn_pd_commit_wait10:      "⏰ Wait 10 minutes before snacking",
    btn_pd_commit_other:       "Something else",
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

    // Habit Builder — spec 2026-07 (replaces the old free-form habit picker).
    bm_habit_title: "🎯 *Habit Builder*",
    bm_habit_intro:
      "🌱 Let's build one small habit at a time.\n\nWhich habit would you like to work on?",
    // Habit library (5 MVP habits)
    bm_habit_lib_move: "🚶 Move for 20 Minutes",
    bm_habit_lib_water: "💧 Reach Your Water Goal",
    bm_habit_lib_sleep: "😴 Sleep Before Your Target Time",
    bm_habit_lib_smoke_free: "🚭 Stay Smoke-Free",
    bm_habit_lib_no_food_after_dinner: "🌙 No Food After Dinner",
    // Per-habit setup intros
    bm_habit_setup_move:
      "Your goal is to move for at least 20 minutes a day. Walking, exercise, swimming, cycling or any other physical activity counts.",
    bm_habit_setup_water_q: "How many glasses of water would you like to aim for each day?",
    bm_habit_setup_water_other_q: "How many glasses per day would you like to aim for? Type a number.",
    bm_habit_setup_sleep_q: "What time would you like to be asleep by?",
    bm_habit_setup_sleep_other_q: "Type your target bedtime (e.g., 10:30 PM).",
    bm_habit_setup_smoke_free:
      "Your goal is to stay completely smoke-free each day. A difficult day does not erase your progress.",
    bm_habit_setup_no_food_after_dinner:
      "Once dinner is finished, avoid eating again until breakfast.",
    // Water target buttons
    btn_hb_water_6: "6",
    btn_hb_water_8: "8",
    btn_hb_water_10: "10",
    btn_hb_water_other: "Another amount",
    // Sleep time buttons
    btn_hb_sleep_1030: "10:30 PM",
    btn_hb_sleep_1100: "11:00 PM",
    btn_hb_sleep_1130: "11:30 PM",
    btn_hb_sleep_other: "Another time",
    // Activation confirmation
    bm_habit_activation_msg:
      "✅ Your habit has been added.\n\nFor the first 7 days, DrSaab will check in with you daily. If the habit is going well, check-ins will then move to Sundays.",
    btn_hb_start: "🌱 Start",
    btn_hb_start_silent: "🔕 Start Without Reminders",
    btn_hb_cancel: "❌ Cancel",
    bm_habit_started_reminders:
      "🌱 Great — I'll check in with you tomorrow. Say the word any time to pause or stop reminders.",
    bm_habit_started_silent:
      "🌱 Habit saved. Reminders are off — log your progress from Habit Builder whenever you like.",
    bm_habit_cancelled: "Cancelled. Come back whenever you're ready to try again.",
    // One-active-habit enforcement
    bm_habit_already_active_title: "You're currently working on: *{name}*",
    bm_habit_already_active_body:
      "You can continue with it, adjust it, pause it, stop reminders or remove it before starting another habit.",
    // Daily reminder — three rotating variations (spec §8)
    bm_habit_daily_v1: "🌱 Quick habit check: {question}",
    bm_habit_daily_v2: "Small actions add up. {question}",
    bm_habit_daily_v3: "You're on a *{streak}-day* streak for *{name}*. {question}",
    bm_habit_daily_v3_zero: "Every streak begins with one completed day. {question}",
    // Per-habit daily questions (rendered as {question})
    bm_habit_q_move: "Did you move for at least 20 minutes today?",
    bm_habit_q_water: "Did you reach your water goal today ({target} glasses)?",
    bm_habit_q_sleep: "Were you asleep before {target}?",
    bm_habit_q_smoke_free: "Did you stay smoke-free today?",
    bm_habit_q_no_food_after_dinner: "Did you avoid eating after dinner?",
    // Daily response buttons + acks
    btn_hb_yes: "✅ Yes",
    btn_hb_no: "❌ Not Today",
    btn_hb_stop: "🔕 Stop Reminders",
    bm_habit_ack_yes: "✅ Done. Another small win added.",
    bm_habit_ack_no:
      "That's okay. One missed day does not cancel your progress. We'll try again tomorrow.",
    // Stop-reminders confirm
    bm_habit_stop_confirm: "Turn off reminders for *{name}*?",
    btn_hb_stop_yes: "🔕 Yes, Stop Reminders",
    btn_hb_keep_reminders: "↩️ Keep Reminders",
    bm_habit_stop_done:
      "🔕 Reminders for *{name}* have been turned off. Your progress has been saved. You can restart anytime from Habit Builder.",
    // Active-habit summary card
    bm_habit_summary_title: "🌱 *Your Current Habit*",
    bm_habit_summary_body:
      "*{name}*\nStatus: {status}\nCurrent streak: *{streak}* days\nThis cycle: *{completed}/{responded}* completed",
    bm_habit_status_setup: "Setup pending",
    bm_habit_status_daily: "Daily check-ins",
    bm_habit_status_disabled: "Reminders off",
    bm_habit_status_paused: "Paused",
    btn_hb_stop_short: "🔕 Stop Reminders",
    btn_hb_main_menu: "🏠 Main Menu",

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

    // 10-Minute Wins — spec 2026-07 (one challenge per day, no streaks).
    bm_wins_title: "⚡ *Today's 10-Minute Win*",
    bm_wins_prompt: "*{title}*\n\n{desc}",
    btn_bm_wins_done: "✅ Done",
    btn_bm_wins_skip: "❌ Not Today",
    btn_bm_wins_swap: "🔄 Give Me Another Win",
    // Rotating encouragements after Done (spec §Completion Flow)
    bm_wins_enc_1: "🎉 Small wins build lasting habits.",
    bm_wins_enc_2: "🎉 Every healthy choice counts.",
    bm_wins_enc_3: "🎉 Ten minutes today is better than zero.",
    bm_wins_ack_skip: "That's okay. Tomorrow is another opportunity for a small win.",
    bm_wins_swap_used: "You've already swapped today's win. Here it is again — give it a try or come back tomorrow for a fresh one.",
    bm_wins_already_done: "You already completed today's win. 🌱 Come back tomorrow for a fresh one.",
    bm_wins_already_skipped: "You've closed out today's win. Tomorrow will bring another chance.",
    // Challenge library — id keys mirror WIN_CHALLENGES in betterme.js
    bm_win_walk_title: "🚶 Take a 10-Minute Walk",
    bm_win_walk_desc: "Take a brisk 10-minute walk. Indoors or outdoors — it all counts.",
    bm_win_stretch_title: "🤸 Stretch for 10 Minutes",
    bm_win_stretch_desc: "Stretch your neck, shoulders, back and legs gently for 10 minutes.",
    bm_win_water_title: "💧 Drink Water & Recharge",
    bm_win_water_desc: "Drink two glasses of water over the next 10 minutes and take a short break from your screen.",
    bm_win_declutter_title: "🧹 Declutter One Small Space",
    bm_win_declutter_desc: "Spend 10 minutes tidying one small area such as your desk, bedside table or kitchen counter.",
    bm_win_unplug_title: "🧘 Unplug for 10 Minutes",
    bm_win_unplug_desc: "Put your phone away for 10 minutes. Sit quietly, breathe deeply or simply enjoy a few minutes without notifications.",

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
    menu_v2_title:
      "🩺 DrSaab حاضر ہے!\n💬 کچھ بھی پوچھیں۔\n⚡ یا فوری کمانڈ استعمال کریں۔\n👇 یا نیچے مینو سے چنیں۔",
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
    btn_admin_skip: "🧪 چھوڑیں (ایڈمن)",
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
      "📋 *اپنی رپورٹ سمجھیں*\n\n📸 *اپنی رپورٹ اسی چیٹ میں بھیج دیں* — تصویر یا PDF۔ چاہیں تو ویلیوز ٹیکسٹ میں بھی لکھ سکتے ہیں۔\n\nمیں آپ کے نتائج آسان الفاظ میں سمجھاؤں گا، اہم چیزوں پر روشنی ڈالوں گا، اور بتاؤں گا کہ آپ کی ذیابیطس کے لیے اس کا کیا مطلب ہو سکتا ہے۔\n\n*قابل قبول رپورٹس:*\n• خون کے ٹیسٹ\n• HbA1c رپورٹ\n• کولیسٹرول / لپڈ پروفائل\n• گردے کے ٹیسٹ\n• جگر کے ٹیسٹ\n• پیشاب کے ٹیسٹ\n• ہسپتال کی لیبارٹری رپورٹس\n• ذیابیطس سے متعلق تحقیقات\n_مینو پر واپس دبائیں۔_",
    btn_upload_lab: "📎 تصویر اپلوڈ کریں",
    upload_lab_hint:
      "📸 بس رپورٹ کی تصویر منسلک کر کے بھیج دیں۔\n\n_چیٹ میں اٹیچ (پیپر کلپ) کے نشان پر کلک کریں، اپنی رپورٹ کی تصویر منتخب کریں اور بھیج دیں۔ میں تجزیہ کر کے آپ کے ریکارڈ میں محفوظ کر دوں گا۔_",
    lab_image_unreadable:
      "📸 میں رپورٹ واضح طور پر پڑھ نہیں سکا — تصویر دھندلی ہے یا الفاظ صاف نہیں۔ براہِ کرم واضح تصویر بھیجیں (اچھی روشنی میں، بغیر سائے کے، پوری رپورٹ فوکس میں) یا ویلیوز ٹیکسٹ میں لکھ دیں۔",
    lab_partial_unreadable:
      "⚠️ *نوٹ:* تصویر کے کچھ حصے واضح نہیں تھے، اس لیے میں سب کچھ نہیں پڑھ سکا — {reason}۔ اگر آپ چاہتے ہیں کہ باقی ویلیوز بھی سمجھائی جائیں تو اُس حصے کی صاف تصویر بھیجیں یا ٹیکسٹ میں لکھ دیں۔",
    lab_partial_unreadable_generic:
      "⚠️ *نوٹ:* تصویر کے کچھ حصے واضح نہیں تھے، اس لیے میں سب کچھ نہیں پڑھ سکا۔ اگر آپ چاہتے ہیں کہ باقی ویلیوز بھی سمجھائی جائیں تو اُس حصے کی صاف تصویر بھیجیں یا ٹیکسٹ میں لکھ دیں۔",
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
    error_ai_credits:
      "💳 ہمارے اے آئی کریڈٹس فی الحال ختم ہو گئے ہیں، اس لیے میں ابھی تجزیہ نہیں کر سکتا۔ ٹیم کو اطلاع دی جا چکی ہے اور جلد ری چارج کر دیا جائے گا — براہِ کرم بعد میں دوبارہ کوشش کریں۔ آپ کا ڈیٹا محفوظ ہے۔",
    error_ai_unavailable:
      "🤖 اے آئی سروس عارضی طور پر دستیاب نہیں۔ چند منٹ بعد دوبارہ کوشش کریں — آپ کا ڈیٹا محفوظ ہے۔",
    error_ai_config:
      "⚙️ ہماری طرف سے کچھ مسئلہ ہے اور اے آئی جواب نہیں دے سکا۔ ٹیم کو اطلاع دی جا چکی ہے — تھوڑی دیر بعد دوبارہ کوشش کریں۔",
    error_too_large:
      "📎 یہ فائل تجزیہ کے لیے بہت بڑی ہے۔ چھوٹی تصویر (5 MB سے کم) یا مختصر دستاویز بھیجیں۔",
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
    ut_doctor: "🩺 میں ڈاکٹر ہوں",

    // ---------- Doctor onboarding (v1.0) ----------
    doc_ask_specialty: "بہت خوب — آئیے آپ کی پیشہ ورانہ پروفائل بناتے ہیں۔\n\nآپ کی *طبی تخصص* کیا ہے؟ (مثلاً اینڈوکرینولوجی، فیملی میڈیسن، کارڈیالوجی)",
    doc_ask_location: "آپ کی *پرائمری پریکٹس لوکیشن* کیا ہے؟ (شہر، ہسپتال یا کلینک کا نام)",
    doc_ask_email: "براہِ کرم اپنا *پیشہ ورانہ ای میل* بھیجیں — ہم اسے اکاؤنٹ ریکوری اور ڈاکٹر اپڈیٹس کے لیے استعمال کریں گے۔",
    doc_email_invalid: "یہ درست ای میل نہیں لگ رہا۔ براہِ کرم مکمل پتہ بھیجیں جیسے `name@clinic.com`۔",
    doc_ask_patient_use: "کیا آپ DrSaab کو *اپنی ذاتی صحت* کے لیے بھی استعمال کرنا چاہیں گے؟ آپ کسی بھی وقت ڈاکٹر مینو پر جا سکتے ہیں۔",
    doc_setup_complete: "✅ آپ کی ڈاکٹر پروفائل تیار ہے، *ڈاکٹر {name}*۔\n\nآپ کا مستقل ریفرل کوڈ ہے *{code}*۔\nاپنے مریضوں کو یہ کوڈ دیں تاکہ وہ اپنا ریکارڈ آپ کی پریکٹس سے منسلک کر سکیں۔",

    doc_menu_title: "🩺 *ڈاکٹر مینو* — آج کیسے مدد کروں، ڈاکٹر {name}؟",
    btn_doc_reports: "📊 مریضوں کی رپورٹس",
    btn_doc_referral: "🔑 ریفرل کوڈ",
    btn_doc_myhealth: "❤️ میری صحت",
    btn_doc_switch_patient: "🔄 پیشنٹ مینو پر جائیں",
    btn_doc_switch_doctor: "🩺 ڈاکٹر مینو پر جائیں",
    btn_doc_test_dp: "🧪 DP Cap ٹیسٹ",
    dp_test_patient_name: "ٹیسٹ مریض",
    btn_doc_upgrade_dp: "⭐ Doctor Pro پر اپ گریڈ",

    doc_referral_title: "🔑 *آپ کا ریفرل کوڈ*",
    doc_referral_body: "یہ کوڈ اپنے مریضوں کو دیں تاکہ وہ اپنی DrSaab پروفائل آپ کی پریکٹس سے منسلک کر سکیں:\n\n*{code}*\n\nیہ کوڈ مستقل ہے — یہاں ہمیشہ یہی نظر آئے گا۔",

    doc_reports_title: "📊 *پریکٹس کا جائزہ*",
    doc_reports_pick_window: "📊 *پریکٹس کا جائزہ*\n\nآپ کون سا وقتی خلاصہ دیکھنا چاہیں گے؟",
    doc_reports_window_weekly: "📅 ہفتہ وار خلاصہ — پچھلے 7 دن",
    doc_reports_window_monthly: "📅 ماہانہ خلاصہ — پچھلے 30 دن",
    doc_reports_window_all: "📊 مکمل خلاصہ",
    btn_doc_rep_weekly: "📅 ہفتہ وار",
    btn_doc_rep_monthly: "📅 ماہانہ",
    btn_doc_rep_all: "📊 مکمل",
    doc_reports_empty: "ابھی آپ کی پریکٹس سے کوئی مریض منسلک نہیں۔\n\nاپنا ریفرل کوڈ *{code}* شیئر کریں — جیسے ہی مریض ❤️ میری صحت → میرا ڈاکٹر میں یہ کوڈ ڈالیں گے، ان کی مجموعی معلومات یہاں ظاہر ہوں گی۔",
    doc_reports_body:
      "*منسلک مریض:* {patients}\n*مصروفیت:* {engagement}\n*اوسط SMI:* {smi}\n\n📈 *رجحانات*\n• HbA1c اوسط: {hba1c}\n• وزن اوسط: {weight}\n• جسمانی سرگرمی: {activity}\n• ادویات کا تسلسل: {adherence}\n\n🟢 *مثبت اشارے*\n{green}\n\n🔴 *خطرے کے اشارے*\n{red}\n\n💡 *تجویز کردہ اقدامات*\n{actions}",
    doc_reports_none: "—",
    doc_reports_green_default: "• مریض باقاعدگی سے لاگ کر رہے ہیں\n• مصروفیت مستحکم ہے",
    doc_reports_red_default: "• چیک اِن نہ کرنے والے مریضوں پر نظر رکھیں",
    doc_reports_actions_default: "• کم مصروف مریضوں کو اس ہفتے چیک اِن کی ترغیب دیں\n• جن کی HbA1c ٹرینڈ بڑھ رہی ہو ان سے فالو اپ کریں",

    btn_my_doctor: "👨‍⚕️ میرا ڈاکٹر",
    my_doctor_title_none: "👨‍⚕️ *میرا ڈاکٹر*\n\nآپ نے ابھی کسی ڈاکٹر کو منسلک نہیں کیا۔\n\nاپنے ڈاکٹر کا *DS#XXXX* ریفرل کوڈ درج کر کے منسلک ہو جائیں۔",
    my_doctor_title_linked:
      "👨‍⚕️ *میرا ڈاکٹر*\n\n*{name}*\nتخصص: {specialty}\nمقام: {location}\nمنسلک: {linked}\n\nآپ کسی بھی وقت اپنا ڈاکٹر تبدیل یا ہٹا سکتے ہیں۔",
    btn_add_doctor: "➕ ڈاکٹر شامل کریں",
    btn_change_doctor: "🔄 ڈاکٹر تبدیل کریں",
    btn_remove_doctor: "❌ ڈاکٹر ہٹائیں",
    my_doctor_ask_code: "براہِ کرم اپنے ڈاکٹر کا ریفرل کوڈ درج کریں (فارمیٹ: *DS#XXXX*)۔",
    my_doctor_code_invalid: "کوڈ صحیح نہیں لگ رہا۔ براہِ کرم *DS#XXXX* فارمیٹ میں بھیجیں (مثلاً `DS#A7K9`)۔",
    my_doctor_not_found: "یہ کوڈ کسی ڈاکٹر سے میچ نہیں ہوا۔ براہِ کرم *DS#XXXX* دوبارہ چیک کریں۔",
    my_doctor_confirm:
      "یہ ڈاکٹر ملا ہے:\n\n*{name}*\nتخصص: {specialty}\nمقام: {location}\n\nکیا آپ اپنی DrSaab پروفائل اس ڈاکٹر سے منسلک کرنا چاہیں گے؟ صرف مجموعی معلومات شیئر ہوں گی — کبھی بھی انفرادی چیٹس نہیں۔",
    btn_confirm_link: "✅ ہاں، منسلک کریں",
    btn_cancel_link: "منسوخ",
    my_doctor_linked_ok: "✅ آپ اب *ڈاکٹر {name}* سے منسلک ہیں۔",
    my_doctor_remove_confirm: "*ڈاکٹر {name}* کو ہٹا دیں؟ آپ کا ڈیٹا آپ کے پاس ہی رہے گا — ڈاکٹر کو صرف مجموعی معلومات نظر آنا بند ہو جائیں گی۔",
    btn_confirm_remove: "ہاں، ہٹائیں",
    my_doctor_removed_ok: "✅ ڈاکٹر ہٹا دیا گیا۔ آپ کسی بھی وقت نیا شامل کر سکتے ہیں۔",

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
    quick_shortcuts_title: "⚡ *فوری شارٹ کٹس*",
    quick_shortcuts_body:
      "کبھی بھی ان میں سے کوئی بھی ٹائپ کریں:\n\n📋 *menu* – مرکزی مینو کھولیں\n❓ *help* – DrSaab کا استعمال دیکھیں\n❤️ *health* – اپنی صحت کا خلاصہ دیکھیں\n🩸 *sugar* – بلڈ شوگر لاگ کریں\n💊 *meds* – اپنی دوائیں چیک اِن کریں\n🍽️ *food* – کھانے میں مدد لیں\n📄 *report* – ہیلتھ رپورٹ اپلوڈ کریں\n🎯 *progress* – اہداف اور پیش رفت دیکھیں\n🏆 *challenge* – چیلنجز میں شامل ہوں یا دیکھیں\n🩺 *doctor* – ڈاکٹر اور ریفرل کے آپشنز\n\n💬 یا سیدھا بات کریں — مثلاً:\n_\"کیا میں بریانی کھا سکتا ہوں؟\"_\n_\"میری شوگر 145 ہے۔\"_\n_\"میرا تازہ HbA1c دکھاؤ۔\"_",
    shortcut_sugar_needs_context:
      "سمجھ گیا — میں نے *{value}* دیکھی۔ یہ *fasting*، *random*، *کھانے سے پہلے*، *کھانے کے بعد*، یا *سونے سے پہلے* تھی؟ ٹائمنگ بتائیں تاکہ میں صحیح لاگ کر سکوں۔",
    shortcut_flow_paused:
      "آپ کا *{flow}* چیک اِن روک دیا — آپ کے جوابات محفوظ ہیں۔ جاری رکھنے کے لیے *resume* لکھیں۔",
    shortcut_no_paused_flow: "دوبارہ شروع کرنے کے لیے کوئی روکا ہوا چیک اِن نہیں ہے۔",
    shortcut_resumed: "آپ کا *{flow}* چیک اِن پھر شروع کر رہے ہیں۔ ↩️",
    shortcut_hba1c_none:
      "ابھی آپ کا محفوظ HbA1c نہیں ہے۔ *report* دبائیں یا لیب رپورٹ بھیجیں، میں اسے نکال لوں گا۔",
    shortcut_hba1c_latest:
      "🧪 *آپ کا تازہ HbA1c*: *{value}%*{date}\n\nنئی لیب رپورٹ اپلوڈ کرنے کے لیے *report* دبائیں، یا مجھ سے کچھ بھی پوچھیں۔",
    shortcut_confirm_log_sugar:
      "کیا میں *{value}* کو بلڈ شوگر ریڈنگ کے طور پر محفوظ کر لوں؟ لاگ کرنے کے لیے *yes* لکھیں، یا سوال پوچھیں۔",
    shortcut_flow_glucose: "بلڈ شوگر",
    shortcut_flow_med: "دوائی",
    shortcut_flow_weight: "وزن",
    shortcut_flow_activity: "سرگرمی",
    shortcut_flow_symptoms: "علامات",
    shortcut_flow_wellbeing: "طبیعت",
    shortcut_flow_health: "صحت",
    shortcut_flow_myhealth: "میری صحت",
    shortcut_flow_lab: "لیب رپورٹ",
    shortcut_flow_mydoc: "ڈاکٹر لنک",
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
    progress_no_goals: "_ابھی کوئی ہدف نہیں۔_",
    progress_free_upgrade:
      "🔒 *پریمیم* حاصل کریں:\n• تفصیلی پیش رفت رپورٹس\n• ہدف ٹریکنگ\n• ذاتی اے آئی سفارشات\n• جدید رجحان تجزیہ\n• ڈاکٹر کے لیے تیار خلاصے",
    progress_upgrade_cta: "⭐ ابھی اپ گریڈ کریں",
    progress_paid_intro:
      "یہ آپ کی ذاتی پیش رفت رپورٹ ہے — آپ کے اہداف، بلڈ شوگر، وزن، سرگرمی، ادویات، تندرستی اور لیب نتائج کے حساب سے۔",
    scores_title: "📊 *آپ کے اسکور* (100 میں سے)",
    reports_title: "📑 *رپورٹس*",
    challenges_title: "🏆 *چیلنجز*",
    exec_title: "⭐ *ایگزیکٹو سروسز*",

    // ==================================================================
    // Challenges v1.0 — Urdu
    // ==================================================================
    chal_menu_title: "🏆 *چیلنجز*",
    chal_menu_intro:
      "کسی چیلنج میں شامل ہوں، تسلسل قائم رکھیں اور دیکھیں کہ آپ کی پیش رفت ڈاکٹر صاحب کمیونٹی کے مقابلے میں کہاں ہے۔\n\nایک آپشن منتخب کریں:",
    btn_chal_active: "🔥 فعال چیلنجز",
    btn_chal_join: "➕ چیلنج میں شامل ہوں",
    btn_chal_rankings: "🏆 درجہ بندی",
    btn_chal_history: "🏅 میری چیلنج ہسٹری",

    chal_available_title: "🏆 *چیلنج منتخب کریں*",
    chal_available_intro:
      "سب کے لیے قوانین یکساں ہیں۔ شامل ہوں، ڈاکٹر صاحب کو معمول کے مطابق استعمال کریں اور اپنی پیش رفت دیکھیں۔",
    chal_type_hba1c: "🎯 HbA1c چیلنج",
    chal_type_activity: "🚶 سرگرمی چیلنج",
    chal_type_healthy_plate: "📸 کھانے کا چیلنج",

    chal_hba1c_intro_title: "🎯 *90 دن کا HbA1c چیلنج*",
    chal_hba1c_intro_body:
      "دیگر ڈاکٹر صاحب صارفین کے ساتھ اگلے 90 دن اپنا HbA1c بہتر بنانے کی کوشش کریں۔\n\nآپ کی درجہ بندی میں دیکھا جائے گا:\n🧪 آپ کا HbA1c کتنا بہتر ہوا\n📱 آپ نے کتنی مستقل مزاجی سے ڈاکٹر صاحب استعمال کیا\n\nشامل ہونے کے لیے تیار ہیں؟",
    chal_hba1c_how_title: "📘 *یہ کیسے کام کرتا ہے*",
    chal_hba1c_how_body:
      "*1.* اپنا تازہ ترین HbA1c شامل کریں\n*2.* اگلے 90 دن ڈاکٹر صاحب استعمال کرتے رہیں\n*3.* آخر کے قریب نیا HbA1c شامل کریں\n*4.* اپنی بہتری اور حتمی درجہ دیکھیں\n\nآپ کی عوامی درجہ بندی میں HbA1c کے اصل اعداد کبھی ظاہر نہیں ہوں گے۔",

    chal_hba1c_collect_title:
      "🧪 اپنا شروعاتی نمبر مقرر کرنے کے لیے تازہ HbA1c بھیجیں۔",
    chal_hba1c_collect_body:
      "آپ رپورٹ اپلوڈ کر سکتے ہیں یا نتیجہ لکھ سکتے ہیں۔\n\nمثال: *8.2%*",
    chal_hba1c_reuse:
      "🧪 مجھے آپ کے صحت ریکارڈ میں حالیہ HbA1c ملا:\n\n*HbA1c: {value}%*\n*ٹیسٹ کی تاریخ: {date}*\n\nاسے شروعاتی نتیجہ کے طور پر استعمال کریں؟",
    chal_hba1c_reuse_no_date:
      "🧪 مجھے آپ کے صحت ریکارڈ میں حالیہ HbA1c ملا:\n\n*HbA1c: {value}%*\n\nاسے شروعاتی نتیجہ کے طور پر استعمال کریں؟",
    chal_hba1c_invalid:
      "یہ HbA1c نتیجہ درست نہیں لگتا۔\n\nبراہِ کرم اپنی رپورٹ پر لکھا فیصد درج کریں۔\n\nمثال: *8.2%*",
    chal_hba1c_baseline_stale_warning:
      "_مشورہ: بہترین موازنے کے لیے شروعاتی HbA1c پچھلے 30 دن کا ہونا چاہیے۔_",

    chal_hba1c_confirm_title: "🎯 *آپ شامل ہو گئے!*",
    chal_hba1c_confirm_body:
      "شروعاتی HbA1c: *{baseline}%*\nچیلنج کی مدت: *90 دن*\nآخری تاریخ: *{end_date}*\n\nڈاکٹر صاحب کو معمول کے مطابق استعمال کرتے رہیں۔\n\nچیلنج کے اختتام کے قریب میں آپ سے تازہ HbA1c پوچھوں گا۔",
    chal_hba1c_confirm_doctor_footer:
      "آپ کی چیلنج پیش رفت *ڈاکٹر {doctor}* کو بھی نظر آئے گی۔",

    chal_hba1c_final_prompt_title:
      "🧪 آپ کا HbA1c چیلنج تقریباً مکمل ہونے والا ہے۔",
    chal_hba1c_final_prompt_body:
      "براہِ کرم اپنی تازہ HbA1c رپورٹ اپلوڈ کریں یا نتیجہ لکھیں تاکہ میں پیش رفت اور درجہ حساب کر سکوں۔",
    chal_hba1c_final_saved_title: "🎯 *آپ کے HbA1c چیلنج کا نتیجہ*",
    chal_hba1c_final_saved_body:
      "شروعاتی HbA1c: *{baseline}%*\nحتمی HbA1c: *{final}%*\nتبدیلی: *{change} فیصد پوائنٹس*\nحتمی درجہ: *{rank} از {total}*",
    chal_hba1c_supportive_improved:
      "یہ حقیقی پیش رفت ہے — تسلسل قائم رکھنے پر شاباش۔ عادات جاری رکھیں۔ 💚",
    chal_hba1c_supportive_flat:
      "استقامت خود ایک کامیابی ہے۔ چھوٹی تبدیلیاں مل کر بڑا فرق لاتی ہیں۔ 💚",
    chal_hba1c_supportive_up:
      "HbA1c کئی وجوہات سے بدلتا ہے۔ یہ ناکامی نہیں — آئیے مفید عادات پر مل کر کام کریں۔",

    btn_chal_join_now: "✅ چیلنج میں شامل ہوں",
    btn_chal_how: "📘 یہ کیسے کام کرتا ہے",
    btn_chal_upload: "📎 رپورٹ اپلوڈ کریں",
    btn_chal_enter: "⌨️ نتیجہ درج کریں",
    btn_chal_cancel: "❌ منسوخ",
    btn_chal_reuse_yes: "✅ ہاں، یہی استعمال کریں",
    btn_chal_reuse_another: "🔄 نیا نتیجہ شامل کریں",
    btn_chal_remind_later: "بعد میں یاد دلائیں",

    chal_activity_intro_title: "🚶 *30 دن کا سرگرمی چیلنج*",
    chal_activity_intro_body:
      "اگلے 30 دن باقاعدگی سے حرکت کریں اور ڈاکٹر صاحب کی درجہ بندی میں اوپر آئیں۔\n\nآپ کی درجہ بندی میں دیکھا جائے گا:\n🚶 فعال دنوں کی تعداد\n⏱️ سرگرمی کا دورانیہ\n📱 ڈاکٹر صاحب پر تسلسل\n\nشامل ہونے کے لیے تیار ہیں؟",
    chal_activity_how_title: "📘 *یہ کیسے کام کرتا ہے*",
    chal_activity_how_body:
      "ڈاکٹر صاحب کے ذریعے چہل قدمی، ورزش، سوئمنگ، کھیل یا کوئی بھی جسمانی سرگرمی لاگ کریں۔\n\nسرگرمی کم از کم *20 منٹ* کی ہونی چاہیے۔\n\nہر دن صرف ایک فعال دن گنتی میں آئے گا، چاہے آپ ایک سے زائد سرگرمیاں کر لیں۔",
    chal_activity_join_title: "🚀 *آپ شامل ہو گئے!*",
    chal_activity_join_body:
      "30 دن کا سرگرمی چیلنج آج سے شروع ہوتا ہے۔\n\nڈاکٹر صاحب کے ذریعے سرگرمی لاگ کریں، اسکور خود بخود اپڈیٹ ہوگا۔\n\nکم از کم اہل سرگرمی: *20 منٹ*\nآخری تاریخ: *{end_date}*",
    chal_activity_progress:
      "🚶 *سرگرمی چیلنج پیش رفت*\n\nفعال دن: *{active_days}*\nکل منٹ: *{minutes}*\nموجودہ سلسلہ: *{streak} دن*\nچیلنج کا دن: *{day} از 30*\nموجودہ درجہ: *{rank} از {total}*",

    chal_hp_intro_title: "📸 *30 دن کا صحت مند پلیٹ چیلنج*",
    chal_hp_intro_body:
      "اپنے کھانوں کی تفصیل ڈاکٹر صاحب سے شیئر کریں اور دیکھیں 30 دن میں آپ کتنی صحت مند پلیٹیں بنا سکتے ہیں۔\n\nآپ کی درجہ بندی میں دیکھا جائے گا:\n🥗 صحت مند پلیٹوں کی تعداد\n📸 کھانے لاگ کرنے کی مستقل مزاجی\n📱 مجموعی ڈاکٹر صاحب استعمال\n\nشامل ہونے کے لیے تیار ہیں؟",
    chal_hp_how_title: "📘 *یہ کیسے کام کرتا ہے*",
    chal_hp_how_body:
      "*1.* کھانے کی تصویر یا تفصیل بھیجیں\n*2.* ڈاکٹر صاحب کھانا تجزیہ کرے گا\n*3.* صحت مند پلیٹیں خود بخود گنتی میں آئیں گی\n*4.* 30 دن تک جاری رکھیں اور حتمی درجہ دیکھیں\n\nہر کھانا لاگ کرنا ضروری نہیں۔",
    chal_hp_join_title: "🥗 *آپ شامل ہو گئے!*",
    chal_hp_join_body:
      "30 دن کا صحت مند پلیٹ چیلنج آج سے شروع ہوتا ہے۔\n\nاپنے کھانوں کی تصویر یا تفصیل بھیجیں۔ صحت مند پلیٹیں خود بخود گنتی میں آئیں گی۔\n\nآخری تاریخ: *{end_date}*",
    chal_hp_meal_hit:
      "🟢 *صحت مند پلیٹ!*\n\nیہ کھانا آپ کے چیلنج میں شامل ہو گیا۔\n\nصحت مند پلیٹیں: *{count}*\nموجودہ درجہ: *{rank} از {total}*",
    chal_hp_meal_miss:
      "🟡 یہ کھانا فی الحال صحت مند پلیٹ کے طور پر نہیں گنا گیا، لیکن اس سے مجھے آپ کی خوراک سمجھنے میں مدد ملتی ہے۔",

    chal_rankings_title: "🏆 *{name} درجہ بندی*",
    chal_rankings_empty: "_دیگر شرکاء کے آنے پر یہاں درجہ بندی نظر آئے گی۔ جاری رکھیں!_",
    chal_rankings_row: "{rank}. {name} — {outcome}",
    chal_rankings_you_suffix: "  ← *آپ*",
    chal_rankings_you_position: "\nآپ کا مقام: *{rank} از {total}*",
    chal_rankings_hba1c_note:
      "_درجہ بندی آپ کے ابتدائی بینڈ ({band}) میں کی گئی ہے۔ HbA1c اعداد عوامی طور پر ظاہر نہیں ہوتے۔_",
    chal_rankings_pick_intro: "درجہ بندی دیکھنے کے لیے چیلنج منتخب کریں:",
    chal_rankings_none_active: "چیلنج میں شامل ہونے کے بعد درجہ بندی نظر آئے گی۔",

    chal_history_title: "🏅 *میری چیلنج ہسٹری*",
    chal_history_empty: "آپ نے ابھی تک کوئی چیلنج مکمل نہیں کیا۔",
    chal_history_row_completed: "• *{name}* — {outcome} (درجہ {rank}/{total})",
    chal_history_row_incomplete: "• *{name}* — {status}",
    chal_history_status_expired: "حتمی نتیجہ نہیں",
    chal_history_status_withdrawn: "الگ ہو گئے",
    chal_history_status_disqualified: "نکال دیا گیا",

    chal_active_title: "🔥 *فعال چیلنجز*",
    chal_active_none:
      "کوئی فعال چیلنج نہیں۔ *چیلنج میں شامل ہوں* پر ٹیپ کریں۔",
    chal_active_line_hba1c: "🎯 *90 دن کا HbA1c چیلنج* — دن {day}/{total}",
    chal_active_line_activity:
      "🚶 *30 دن کا سرگرمی چیلنج* — دن {day}/{total} · {active_days} فعال دن",
    chal_active_line_healthy_plate:
      "📸 *30 دن کا صحت مند پلیٹ چیلنج* — دن {day}/{total} · {count} صحت مند پلیٹ",
    chal_active_awaiting_hba1c:
      "🎯 *90 دن کا HbA1c چیلنج* — حتمی نتیجے کا انتظار",

    chal_dr_joined:
      "🏆 *مریض چیلنج میں شامل ہو گیا*\n\nمریض: *{patient}*\nچیلنج: *{challenge}*\nشروع: *{start}*\nاختتام: *{end}*",
    chal_dr_weekly:
      "📊 *ہفتہ وار چیلنج اپڈیٹ*\n\nمریض: *{patient}*\nچیلنج: *{challenge}*\nپیش رفت: *{progress}*\nشرکت: *{participation}*\nموجودہ درجہ: *{rank}*\nحیثیت: *{status}*",
    chal_dr_completed:
      "🏁 *چیلنج مکمل ہو گیا*\n\nمریض: *{patient}*\nچیلنج: *{challenge}*\nشروعاتی قدر: *{baseline}*\nحتمی قدر: *{final}*\nتبدیلی: *{outcome}*\nشرکت: *{participation}* پوائنٹس\nحتمی درجہ: *{rank}* (پرسینٹائل {percentile})\nحیثیت: *{status}*",
    chal_dr_incomplete:
      "⏰ *چیلنج نتیجے کے بغیر ختم*\n\nمریض: *{patient}*\nچیلنج: *{challenge}*\nوجہ: {reason}",

    chal_reminder_activity:
      "🚶 اب تک *{active_days} فعال دن* مکمل ہو چکے ہیں۔\n\nآج 20 منٹ کی چہل قدمی چیلنج کو جاری رکھ سکتی ہے۔ 💪",
    chal_reminder_healthy_plate:
      "🥗 آپ کے پاس *{count} صحت مند پلیٹیں* ہیں۔\n\nجب چاہیں اگلا کھانا بھیج دیں۔ 📸",
    chal_reminder_hba1c:
      "🎯 آپ کا HbA1c چیلنج جاری ہے۔\n\nآج کے لیے صرف اگلے مفید انتخاب پر توجہ دیں — 90 دن کی کاملیت پر نہیں۔",
    reminder_template_challenge_final_result_prompt:
      "🧪 آپ کا HbA1c چیلنج قریب اختتام ہے — جب ممکن ہو تازہ HbA1c بھیج دیں۔",
    reminder_template_challenge_checkin:
      "🏆 آج اپنا چیلنج جاری رکھیں — چھوٹا سا لاگ، چیک اِن یا کھانا بھی گنتی میں آتا ہے۔",

    chal_outcome_hba1c_change: "↓ {change} فیصد پوائنٹس",
    chal_outcome_hba1c_up:     "↑ {change} فیصد پوائنٹس",
    chal_outcome_hba1c_steady: "برقرار",
    chal_outcome_active_days:  "{value} فعال دن",
    chal_outcome_plates:       "{value} صحت مند پلیٹیں",

    chal_join_already:
      "آپ پہلے ہی *{name}* میں شامل ہیں۔ 🔥 فعال چیلنجز پر ٹیپ کر کے پیش رفت دیکھیں۔",
    chal_start_generic_confirm:
      "✅ آپ شامل ہو گئے! ڈاکٹر صاحب کو معمول کے مطابق استعمال کریں — اہل سرگرمیاں خود شامل ہوں گی۔",
    chal_error_no_defs:
      "ابھی کوئی چیلنج کھلا نہیں ہے۔ جلد چیک کریں!",
    chal_ineligible_hba1c:
      "HbA1c چیلنج پری ڈایابیٹیز یا ذیابیطس والوں کے لیے ہے۔ کوئی دوسرا چیلنج منتخب کریں یا بعد میں دیکھیں۔",
    chal_baseline_band_lt7:     "7.0% سے کم",
    chal_baseline_band_7_8_9:   "7.0%–8.9%",
    chal_baseline_band_9_10_9:  "9.0%–10.9%",
    chal_baseline_band_11_plus: "11.0% یا زیادہ",

    btn_chal_hide_ranking: "🙈 مجھے عوامی درجہ بندی سے چھپائیں",
    btn_chal_show_ranking: "👁 مجھے عوامی درجہ بندی میں دکھائیں",
    btn_chal_withdraw:     "🚪 یہ چیلنج چھوڑ دیں",
    btn_chal_withdraw_confirm: "✅ ہاں، چھوڑ دیں",
    chal_leaderboard_optin_on:
      "✅ اب آپ عوامی درجہ بندی میں دکھائی دیں گے۔",
    chal_leaderboard_optin_off:
      "✅ آپ کو عوامی درجہ بندی سے چھپا دیا گیا ہے۔ آپ کی پیش رفت اور ڈاکٹر اپڈیٹس جاری رہیں گی۔",
    chal_withdraw_confirm_prompt:
      "کیا آپ واقعی *{name}* چھوڑنا چاہتے ہیں؟ آپ کی پیش رفت گنتی میں آنا بند ہو جائے گی اور یہ چیلنج ہسٹری میں چلا جائے گا۔",
    chal_withdraw_done: "آپ نے *{name}* چھوڑ دیا۔ آپ کبھی بھی نیا چیلنج شروع کر سکتے ہیں۔",
    chal_detail_activity:
      "🚶 *30 دن کا سرگرمی چیلنج*\n\nفعال دن: *{active_days}*\nکل منٹ: *{minutes}*\nموجودہ سلسلہ: *{streak} دن*\nچیلنج کا دن: *{day} از 30*\nموجودہ درجہ: *{rank} از {total}*",
    chal_detail_healthy_plate:
      "📸 *30 دن کا صحت مند پلیٹ چیلنج*\n\nصحت مند پلیٹیں: *{count}*\nچیلنج کا دن: *{day} از 30*\nموجودہ درجہ: *{rank} از {total}*",
    chal_detail_hba1c:
      "🎯 *90 دن کا HbA1c چیلنج*\n\nشروعاتی HbA1c: *{baseline}%*\nچیلنج کا دن: *{day} از 90*\nشرکت: *{points} پوائنٹس*\nموجودہ سلسلہ: *{streak} دن*\n\nحتمی درجہ آپ کے تازہ HbA1c جمع کرانے پر کیا جائے گا۔",
    chal_detail_awaiting_final:
      "🎯 *90 دن کا HbA1c چیلنج*\n\nآپ کا چیلنج مکمل ہو چکا ہے۔ حتمی درجہ کے لیے تازہ HbA1c بھیجیں۔",

    chal_activity_qualifying_list:
      "\n\n*اہل سرگرمیاں:*\n• چہل قدمی\n• دوڑ\n• جِم\n• سوئمنگ\n• سائیکلنگ\n• کھیل\n• گھر کی ورزش\n• یوگا / موبیلٹی\n• کوئی بھی جان بوجھ کر کی جانے والی جسمانی سرگرمی",

    // ===== More section v2 (2026-07 spec) =====
    more_subtitle: "براہِ کرم درج ذیل میں سے ایک منتخب کریں:",
    btn_more_subscription_v2: "💳 میری سبسکرپشن",
    btn_more_account: "👤 میرا اکاؤنٹ",

    reminders_prefs_title: "🔔 *یاد دہانیاں*",
    reminders_prefs_intro:
      "منتخب کریں کہ آپ کون سی یاد دہانیاں وصول کرنا چاہتے ہیں۔ آن یا آف کرنے کے لیے کسی زمرے پر دبائیں۔",
    rem_cat_blood_sugar: "🩸 بلڈ شوگر",
    rem_cat_medication: "💊 ادویات",
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

    // Subscription Module — Upgrade flow
    upsell_menu_title:
      "🟢 *Consistency Coach*\nRs 799/ماہ\nذاتی نوعیت کی AI کوچنگ اور پریمیم فیچرز۔\n\n⭐ *Executive Coach*\nRs 7,999/ماہ\nپریمیم ون ٹو ون کوچنگ۔",
    btn_upsell_consistency: "🟢 Consistency",
    btn_upsell_executive: "⭐ Executive",
    upsell_executive_unavailable:
      "⭐ *Executive Coach* ابھی دستیاب نہیں ہے۔\nبراہِ کرم جلد دوبارہ چیک کریں۔",
    upsell_consistency_title: "🟢 *Consistency Coach*",
    upsell_consistency_features:
      "*پریمیم فیچرز:*\n• 🤖 ایڈوانسڈ AI\n• 🧠 ذاتی رہنمائی\n• 🏋️ فٹنس پلانز\n• 🥗 میل پلانز\n• 🎥 خصوصی ویڈیوز\n• ⌚ ویئرایبل انٹیگریشن (WHOOP، Fitbit، Apple Health اور Google Fit)",
    upsell_consistency_offers:
      "💰 *آفرز*\n• 1 ماہ – Rs 799\n• ⭐ 6 ماہ – 5 ماہ کی ادائیگی (Rs 3,995)\n• 💎 12 ماہ – 10 ماہ کی ادائیگی (Rs 7,990)",
    btn_upsell_1m: "1 ماہ",
    btn_upsell_6m: "6 ماہ",
    btn_upsell_12m: "12 ماہ",

    upsell_confirm_1m:
      "🟢 *1 ماہ کا پلان*\n💰 Rs 799\nConsistency Coach ایک ماہ۔",
    upsell_confirm_6m:
      "🟢 *6 ماہ کا پلان*\n5 ماہ کی ادائیگی\n💰 Rs 3,995\nآپ کو مکمل 6 ماہ ملتے ہیں۔",
    upsell_confirm_12m:
      "🟢 *12 ماہ کا پلان*\n10 ماہ کی ادائیگی\n💰 Rs 7,990\nآپ کو مکمل 12 ماہ ملتے ہیں۔",
    btn_upsell_continue: "جاری رکھیں",
    btn_upsell_change_plan: "پلان تبدیل کریں",
    btn_upsell_test_activate: "🧪 ٹیسٹ ایکٹیویٹ (ادائیگی چھوڑیں)",
    test_activation_disabled:
      "🧪 ٹیسٹ ایکٹیویشن آپ کے اکاؤنٹ کے لیے فعال نہیں۔ ایڈمن پاس ورڈ بھیج کر انلاک کریں، یا .env میں TEST_ACTIVATION_ENABLED=true رکھیں۔",
    admin_promoted:
      "🔓 *ایڈمن موڈ کھل گیا۔*\nاب آپ کو اپ گریڈ اور ڈاکٹر مینو پر 🧪 ٹیسٹ بٹن نظر آئیں گے۔ /menu بھیج کر ری فریش کریں۔\n\n_ایڈمن موڈ ختم کرنے کے لیے `admin off` بھیجیں۔_",
    admin_demoted:
      "🔒 *ایڈمن موڈ بند۔*\nٹیسٹ بٹن دوبارہ چھپ گئے۔ دوبارہ داخل ہونے کے لیے ایڈمن پاس ورڈ بھیجیں۔",

    pay_method_title: "ادائیگی کا طریقہ منتخب کریں:",
    btn_pay_bank: "🏦 بینک",
    btn_pay_jazzcash: "💳 JazzCash",

    pay_bank_title: "🏦 *ادائیگی کی تفصیلات*",
    pay_bank_body:
      "*بینک:* Bank AL Habib\n*اکاؤنٹ:* M/S. MEEBO TECHNOLOGIES\n*IBAN:* PK48BAHL1036098100995201\n*رقم:* Rs {amount}\n\n📸 ادائیگی کے بعد یہاں اسکرین شاٹ یا ڈپازٹ سلپ بھیجیں۔",

    pay_jazzcash_title: "💳 *JazzCash ادائیگی*",
    pay_jazzcash_body:
      "(JazzCash اکاؤنٹ کی تفصیلات بعد میں شامل کی جائیں گی۔)\n\n*رقم:* Rs {amount}\n\n📸 ادائیگی کے بعد یہاں لین دین کا اسکرین شاٹ بھیجیں۔",

    btn_pay_ive_paid: "میں نے ادا کر دی",
    btn_pay_cancel: "منسوخ کریں",

    pay_awaiting_proof:
      "📸 براہِ کرم ادائیگی کا اسکرین شاٹ یا ڈپازٹ سلپ تصویر کے طور پر بھیجیں۔",
    pay_proof_not_image:
      "یہ تصویر نہیں لگ رہی۔ براہِ کرم ادائیگی کا اسکرین شاٹ تصویر کے طور پر بھیجیں۔",
    pay_proof_received:
      "✅ اسکرین شاٹ کا شکریہ! ہم آپ کی ادائیگی پروسیس کر رہے ہیں۔\nپروسیس مکمل ہونے پر ہم آپ کو WhatsApp پر مطلع کر دیں گے۔",
    pay_session_lost:
      "لگتا ہے آپ کی ادائیگی کا سیشن رک گیا۔ *پلان اپ گریڈ* پر ٹیپ کر کے دوبارہ پلان منتخب کریں — آپ کا صحت کا ڈیٹا محفوظ ہے۔",
    pay_cancelled:
      "ادائیگی منسوخ کر دی گئی۔ آپ کسی بھی وقت اپ گریڈ سے دوبارہ شروع کر سکتے ہیں۔",

    admin_new_payment:
      "🔔 *نئی ادائیگی موصول*\n\n*صارف:* {name}\n*WhatsApp:* {whatsapp}\n*پلان:* {plan}\n*رقم:* Rs {amount}\n*طریقہ:* {method}\n*جمع کرائی گئی:* {when}\n\nPayment #{id}",
    admin_new_payment_caption: "Payment #{id} ثبوت",
    btn_admin_approve: "✅ منظور",
    btn_admin_reject:  "❌ مسترد",
    btn_admin_better:  "🔄 بہتر تصویر",
    admin_help:
      "*سبسکرپشن ایڈمن کمانڈز*\n\n`/sub pending` — زیرِ جائزہ ادائیگیاں دیکھیں\n`/sub approve <id>` — ادائیگی #id منظور کریں اور صارف کو فعال کریں\n`/sub reject <id> [وجہ]` — ادائیگی #id مسترد کریں (اختیاری وجہ)\n`/sub better <id>` — صارف سے واضح اسکرین شاٹ مانگیں",
    admin_pending_empty: "کوئی زیر التوا ادائیگی نہیں۔",
    admin_pending_row:
      "*Payment #{id}* — {name} (+{whatsapp})\n{plan} · Rs {amount} · {method} · {when}",
    admin_action_not_found: "اس id کی ادائیگی نہیں ملی۔",
    admin_action_already_reviewed:
      "Payment #{id} پہلے ہی {status} کی جا چکی ({when})۔ کوئی کارروائی نہیں کی گئی۔",
    admin_approved_ack:
      "✅ Payment #{id} منظور۔\n{name} اب {expiry} تک ممبر ہیں۔\n{notify}",
    admin_rejected_ack: "❌ Payment #{id} مسترد۔\n{notify}",
    admin_better_ack:
      "🔄 صارف سے Payment #{id} کے لیے بہتر اسکرین شاٹ مانگ لیا گیا۔\n{notify}",
    admin_user_notified: "📣 صارف کو WhatsApp پر مطلع کر دیا گیا۔",
    admin_user_notify_failed:
      "⚠️ WhatsApp پر صارف تک پہنچ نہیں سکے (session window بند ہو سکتی ہے)۔ Backend اپڈیٹ ہو گیا۔",
    admin_db_error:
      "⚠️ Payment #{id} کو database میں اپڈیٹ نہیں کر سکے۔ دوبارہ کوشش کریں۔ Error: {err}",

    pay_activated:
      "🎉 آپ اب *Consistency Coach* ممبر ہیں!\n\n*معیاد ختم:* {expiry}\n\nاپنی پریمیم سہولیات سے لطف اٹھائیں! 💚",

    pay_rejected:
      "میں آپ کی ادائیگی کی تصدیق نہیں کر سکا۔\nبراہِ کرم دوبارہ اسکرین شاٹ بھیجیں۔",
    pay_better_proof:
      "بھیجا گیا اسکرین شاٹ ہمارے لیے واضح نہیں۔ کیا آپ رسید یا ڈپازٹ سلپ کی صاف تصویر بھیج سکتے ہیں؟",
    btn_pay_upload_again: "📸 دوبارہ اپ لوڈ کریں",

    sub_reminder_7d: "⏳ آپ کی سبسکرپشن 7 دن میں ختم ہو رہی ہے۔",
    sub_reminder_1d: "🔔 آپ کی سبسکرپشن کل ختم ہو رہی ہے۔",
    sub_reminder_today: "آپ کا پریمیم پلان آج ختم ہو رہا ہے۔",
    btn_sub_renew: "تجدید کریں",
    btn_sub_later: "بعد میں",

    sub_expired_downgrade:
      "آپ کا پریمیم پلان ختم ہو گیا ہے۔\nاب آپ Free ورژن استعمال کر رہے ہیں۔\nآپ کا صحت کا ڈیٹا محفوظ ہے۔",
    btn_sub_main_menu: "مینو",

    // Doctor Pro Addendum
    dp_title: "🩺 *Doctor Pro*",
    dp_price: "*قیمت:* PKR 4,999/ماہ",
    dp_plan_label: "Doctor Pro",
    dp_benefits:
      "*فوائد:*\n• لامحدود مریض\n• لامحدود ریفرل\n• جدید پیشنٹ رپورٹس\n• نئی سہولیات تک ترجیحی رسائی",
    btn_dp_continue: "جاری رکھیں",
    btn_dp_month: "Doctor Pro",

    dp_cap_a_patient: "ایک مریض",
    dp_cap_reached:
      "⚠️ *آپ 10 مریضوں کی مفت حد تک پہنچ چکے ہیں۔*\n\n{patient} نے ابھی جُڑنے کی کوشش کی لیکن شامل نہیں ہو سکے۔\n\nمزید مریض شامل کرنے کے لیے *Doctor Pro (PKR 4,999/ماہ)* پر اپ گریڈ کریں۔",
    btn_dp_upgrade: "اپ گریڈ",
    btn_dp_later: "بعد میں",

    dp_patient_cap_reached:
      "معذرت — *{name}* اِس وقت نئے مریض قبول نہیں کر رہے۔ کسی اور ریفرل کوڈ کے ساتھ کوشش کریں یا بعد میں دوبارہ چیک کریں۔",

    dp_activated:
      "🎉 آپ اب *Doctor Pro* ممبر ہیں!\n\n*معیاد ختم:* {expiry}\n\n10 مریضوں کی حد ختم — نئے ریفرل قبول ہوں گے۔ 💚",
    dp_expired_downgrade:
      "آپ کی *Doctor Pro* سبسکرپشن ختم ہو گئی ہے۔\nموجودہ مریض جُڑے رہیں گے، مگر تجدید تک نئے مریض شامل نہیں ہو سکتے۔\nآپ کا ڈیٹا اور رپورٹس محفوظ ہیں۔",

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
      "شکریہ۔ ایک مختصر ویڈیو دیکھیں — یہ بتاتی ہے کہ میٹھے مشروبات اور الٹرا پروسیسڈ فوڈز آپ کی طویل مدتی صحت پر کیسے اثر ڈالتے ہیں۔\n\n[▶️ ویڈیو دیکھیں](https://www.youtube.com/shorts/iNaq4vHPQYY)",
    pd_crav_reflection_q:
      "ویڈیو دیکھنے کے بعد آپ کے خیال میں آنے والے ہفتوں میں کون سی حقیقی تبدیلیاں کر سکتے ہیں؟",
    pd_crav_commit_q: "اگر اِس ہفتے صرف ایک چھوٹی تبدیلی کرنی ہو، تو کیا حقیقت پسندانہ لگتا ہے؟",
    btn_pd_commit_skip_sugary: "🥤 میٹھے مشروبات چھوڑ دیں",
    btn_pd_commit_skip_junk:   "🍟 دن میں ایک جنک اسنیک چھوڑ دیں",
    btn_pd_commit_walk10:      "🚶 کھانے کے بعد 10 منٹ چہل قدمی",
    btn_pd_commit_one_plate:   "🍽️ ایک پلیٹ پر اکتفا کریں",
    btn_pd_commit_wait10:      "⏰ ناشتہ کرنے سے پہلے 10 منٹ رکیں",
    btn_pd_commit_other:       "کچھ اور",
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

    bm_habit_title: "🎯 *عادت بنائیں*",
    bm_habit_intro:
      "🌱 آئیے ایک وقت میں ایک چھوٹی عادت بناتے ہیں۔\n\nآپ کون سی عادت پر کام کرنا چاہیں گے؟",
    bm_habit_lib_move: "🚶 20 منٹ چلیں",
    bm_habit_lib_water: "💧 پانی کا ہدف پورا کریں",
    bm_habit_lib_sleep: "😴 مقررہ وقت سے پہلے سو جائیں",
    bm_habit_lib_smoke_free: "🚭 سگریٹ سے پرہیز",
    bm_habit_lib_no_food_after_dinner: "🌙 رات کے کھانے کے بعد کچھ نہیں",
    bm_habit_setup_move:
      "آپ کا مقصد روزانہ کم از کم 20 منٹ کی جسمانی سرگرمی ہے۔ چہل قدمی، ورزش، تیراکی، سائیکلنگ یا کوئی بھی جسمانی حرکت شمار ہوگی۔",
    bm_habit_setup_water_q: "روزانہ کتنے گلاس پانی کا ہدف رکھنا چاہیں گے؟",
    bm_habit_setup_water_other_q: "روزانہ کتنے گلاس کا ہدف رکھنا ہے؟ نمبر لکھیں۔",
    bm_habit_setup_sleep_q: "آپ کس وقت تک سو جانا چاہتے ہیں؟",
    bm_habit_setup_sleep_other_q: "اپنا مقررہ سونے کا وقت لکھیں (مثلاً 10:30 PM)۔",
    bm_habit_setup_smoke_free:
      "آپ کا مقصد ہر روز مکمل طور پر سگریٹ سے پرہیز ہے۔ ایک مشکل دن آپ کی محنت ختم نہیں کرتا۔",
    bm_habit_setup_no_food_after_dinner:
      "رات کا کھانا مکمل ہونے کے بعد ناشتے تک کچھ نہ کھائیں۔",
    btn_hb_water_6: "6",
    btn_hb_water_8: "8",
    btn_hb_water_10: "10",
    btn_hb_water_other: "کوئی اور مقدار",
    btn_hb_sleep_1030: "10:30 PM",
    btn_hb_sleep_1100: "11:00 PM",
    btn_hb_sleep_1130: "11:30 PM",
    btn_hb_sleep_other: "کوئی اور وقت",
    bm_habit_activation_msg:
      "✅ آپ کی عادت شامل کر لی گئی ہے۔\n\nپہلے 7 دن تک DrSaab روزانہ آپ سے پوچھے گا۔ اگر عادت مضبوط ہو رہی ہو تو چیک اِن اتوار کو منتقل ہو جائیں گے۔",
    btn_hb_start: "🌱 شروع کریں",
    btn_hb_start_silent: "🔕 بغیر یاد دہانی کے شروع کریں",
    btn_hb_cancel: "❌ منسوخ کریں",
    bm_habit_started_reminders:
      "🌱 بہت خوب — کل چیک اِن کروں گا۔ کبھی بھی یاد دہانی روکنے یا بند کرنے کے لیے کہہ دیں۔",
    bm_habit_started_silent:
      "🌱 عادت محفوظ ہو گئی۔ یاد دہانی بند ہے — جب چاہیں Habit Builder سے پیش رفت درج کریں۔",
    bm_habit_cancelled: "منسوخ کر دیا۔ جب ہمت ہو دوبارہ آجائیں۔",
    bm_habit_already_active_title: "آپ ابھی *{name}* پر کام کر رہے ہیں",
    bm_habit_already_active_body:
      "نئی عادت شروع کرنے سے پہلے آپ اسے جاری رکھ سکتے ہیں، تبدیل کر سکتے ہیں، عارضی طور پر روک سکتے ہیں، یاد دہانی بند کر سکتے ہیں یا اسے ہٹا سکتے ہیں۔",
    bm_habit_daily_v1: "🌱 عادت چیک: {question}",
    bm_habit_daily_v2: "چھوٹی چھوٹی کوششیں اکٹھی ہو کر بڑا فرق ڈالتی ہیں۔ {question}",
    bm_habit_daily_v3: "*{name}* کے لیے آپ کا *{streak}-دن* کا سلسلہ چل رہا ہے۔ {question}",
    bm_habit_daily_v3_zero: "ہر سلسلہ ایک مکمل دن سے شروع ہوتا ہے۔ {question}",
    bm_habit_q_move: "کیا آج آپ نے کم از کم 20 منٹ حرکت کی؟",
    bm_habit_q_water: "کیا آج آپ نے پانی کا ہدف پورا کیا ({target} گلاس)؟",
    bm_habit_q_sleep: "کیا آج آپ {target} سے پہلے سو گئے؟",
    bm_habit_q_smoke_free: "کیا آج آپ سگریٹ سے مکمل پرہیز کیا؟",
    bm_habit_q_no_food_after_dinner: "کیا آج آپ نے رات کے کھانے کے بعد کچھ نہیں کھایا؟",
    btn_hb_yes: "✅ ہاں",
    btn_hb_no: "❌ آج نہیں",
    btn_hb_stop: "🔕 یاد دہانی بند کریں",
    bm_habit_ack_yes: "✅ ہو گیا۔ ایک اور چھوٹی کامیابی۔",
    bm_habit_ack_no:
      "کوئی بات نہیں۔ ایک چُھوٹا دن آپ کی پیش رفت ختم نہیں کرتا۔ کل دوبارہ کوشش کریں گے۔",
    bm_habit_stop_confirm: "*{name}* کے لیے یاد دہانی بند کریں؟",
    btn_hb_stop_yes: "🔕 ہاں، بند کریں",
    btn_hb_keep_reminders: "↩️ چالو رکھیں",
    bm_habit_stop_done:
      "🔕 *{name}* کی یاد دہانی بند کر دی گئی۔ آپ کی پیش رفت محفوظ ہے۔ جب چاہیں Habit Builder سے دوبارہ شروع کر سکتے ہیں۔",
    bm_habit_summary_title: "🌱 *آپ کی موجودہ عادت*",
    bm_habit_summary_body:
      "*{name}*\nحالت: {status}\nموجودہ سلسلہ: *{streak}* دن\nاس سائیکل میں: *{completed}/{responded}* مکمل",
    bm_habit_status_setup: "ترتیب جاری",
    bm_habit_status_daily: "روزانہ چیک اِن",
    bm_habit_status_disabled: "یاد دہانی بند",
    bm_habit_status_paused: "عارضی طور پر روکا گیا",
    btn_hb_stop_short: "🔕 یاد دہانی بند کریں",
    btn_hb_main_menu: "🏠 مرکزی مینو",

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

    bm_wins_title: "⚡ *آج کی 10 منٹ کی کامیابی*",
    bm_wins_prompt: "*{title}*\n\n{desc}",
    btn_bm_wins_done: "✅ ہو گیا",
    btn_bm_wins_skip: "❌ آج نہیں",
    btn_bm_wins_swap: "🔄 دوسری دیں",
    bm_wins_enc_1: "🎉 چھوٹی کامیابیاں دیرپا عادات بناتی ہیں۔",
    bm_wins_enc_2: "🎉 ہر صحت مند انتخاب معنی رکھتا ہے۔",
    bm_wins_enc_3: "🎉 آج کے 10 منٹ صفر سے بہتر ہیں۔",
    bm_wins_ack_skip: "کوئی بات نہیں۔ کل ایک اور چھوٹی کامیابی کا موقع ہو گا۔",
    bm_wins_swap_used: "آج آپ پہلے ہی ایک بار تبدیل کر چکے ہیں۔ یہی چیلنج آزمائیں یا کل نئی کے لیے آئیں۔",
    bm_wins_already_done: "آج کی کامیابی مکمل ہو چکی ہے۔ 🌱 کل ایک نئی چیلنج کے لیے آئیں۔",
    bm_wins_already_skipped: "آج کا کارڈ بند ہو چکا ہے۔ کل ایک اور موقع ملے گا۔",
    bm_win_walk_title: "🚶 10 منٹ چلیں",
    bm_win_walk_desc: "10 منٹ تیز چہل قدمی کریں۔ اندر ہو یا باہر — دونوں شمار ہوں گے۔",
    bm_win_stretch_title: "🤸 10 منٹ اسٹریچنگ",
    bm_win_stretch_desc: "گردن، کندھوں، کمر اور ٹانگوں کو 10 منٹ آرام سے کھینچیں۔",
    bm_win_water_title: "💧 پانی پیئیں اور تازہ دم ہوں",
    bm_win_water_desc: "اگلے 10 منٹ میں دو گلاس پانی پئیں اور اسکرین سے تھوڑا وقفہ لیں۔",
    bm_win_declutter_title: "🧹 ایک جگہ صاف کریں",
    bm_win_declutter_desc: "10 منٹ کوئی چھوٹی جگہ صاف کریں — میز، سائیڈ ٹیبل یا کچن کاؤنٹر۔",
    bm_win_unplug_title: "🧘 10 منٹ فون سے دور",
    bm_win_unplug_desc: "10 منٹ فون رکھ دیں۔ خاموشی سے بیٹھیں، گہرا سانس لیں یا بغیر اطلاعات کے چند لمحے گزاریں۔",

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
    menu_v2_title:
      "🩺 DrSaab ready hai!\n💬 Kuch bhi poochein.\n⚡ Ya quick command use karein.\n👇 Ya neechay menu se chunein.",
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
    btn_admin_skip: "🧪 Skip (admin)",
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
      "📋 *Apni Report Samjhein*\n\n📸 *Apni report yahin chat mein bhej dein* — tasveer ya PDF. Ya values text mein bhi likh sakte hain.\n\nMain aap ke natayij asaan alfaaz mein samjhaonga, ahem cheezon par roshni daaloonga, aur bataonga ke aap ki diabetes ke liye is ka kya matlab ho sakta hai.\n\n*Qabil qabool reports:*\n• Blood tests\n• HbA1c reports\n• Cholesterol / Lipid Profile\n• Gurdon ke tests\n• Jigar ke tests\n• Peshab ke tests\n• Hospital laboratory reports\n• Diabetes se mutalliq tehqeeqat\n_Menu par wapas dabayein._",
    btn_upload_lab: "📎 Tasveer Upload Karein",
    upload_lab_hint:
      "📸 Bas report ki tasveer attach kar ke bhej dein.\n\n_Chat mein attach (paper-clip) icon dabayein, apni report ki tasveer chunein aur bhej dein. Main tajziya kar ke aap ke record mein mehfooz kar doonga._",
    lab_image_unreadable:
      "📸 Main report ko clearly parh nahi saka — tasveer blurry hai ya text saaf nahi. Meharbani karke ek clear tasveer bhejein (achi roshni mein, bina shadow ke, poori report focus mein) ya values text mein type kar dein.",
    lab_partial_unreadable:
      "⚠️ *Note:* Tasveer ke kuch hissay saaf nahi thay, is liye main sab kuch analyse nahi kar saka — {reason}. Agar baaki values bhi samjhna chahte hain to us hissay ki clear tasveer bhejein ya text mein type kar dein.",
    lab_partial_unreadable_generic:
      "⚠️ *Note:* Tasveer ke kuch hissay saaf nahi thay, is liye main sab kuch analyse nahi kar saka. Agar baaki values bhi samjhna chahte hain to us hissay ki clear tasveer bhejein ya text mein type kar dein.",
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
    error_ai_credits:
      "💳 Hamare AI credits filhal khatam ho gaye hain, is liye main abhi analyse nahi kar sakta. Team ko notify kar diya gaya hai aur jald recharge kar diya jayega — meharbani karke baad mein dobara koshish karein. Aap ka data mehfooz hai.",
    error_ai_unavailable:
      "🤖 AI service abhi temporarily unavailable hai. Chand minute baad dobara koshish karein — aap ka data mehfooz hai.",
    error_ai_config:
      "⚙️ Hamari taraf se kuch masla hai aur AI reply nahi de saka. Team ko notify kar diya gaya hai — thori dair baad dobara koshish karein.",
    error_too_large:
      "📎 Yeh file analysis ke liye bohat bari hai. Chhoti image (5 MB se kam) ya chhota document bhejein.",
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
    ut_doctor: "🩺 Main Doctor hoon",

    // ---------- Doctor onboarding (v1.0) ----------
    doc_ask_specialty: "Bohat khoob — aaiye aap ka professional profile banate hain.\n\nAap ki *medical specialty* kya hai? (jaise Endocrinology, Family Medicine, Cardiology)",
    doc_ask_location: "Aap ki *primary practice location* kya hai? (city, hospital ya clinic ka naam)",
    doc_ask_email: "Barah-e-karam apna *professional email* bhejein — hum ise account recovery aur doctor-only updates ke liye use karenge.",
    doc_email_invalid: "Ye valid email nahi lag raha. Poora address bhejein jaise `name@clinic.com`.",
    doc_ask_patient_use: "Kya aap DrSaab ko *apni personal health* ke liye bhi use karna chahenge? Aap kisi bhi waqt apne doctor menu par ja sakte hain.",
    doc_setup_complete: "✅ Aap ka doctor profile tayyar hai, *Dr. {name}*.\n\nAap ka permanent referral code hai *{code}*.\nApne patients ke saath share karein taake wo apna record aap ki practice se link kar sakein.",

    doc_menu_title: "🩺 *Doctor Menu* — aaj kaise madad karoon, Dr. {name}?",
    btn_doc_reports: "📊 Patient Reports",
    btn_doc_referral: "🔑 Referral Code",
    btn_doc_myhealth: "❤️ My Health",
    btn_doc_switch_patient: "🔄 Switch to Patient Menu",
    btn_doc_switch_doctor: "🩺 Switch to Doctor Menu",
    btn_doc_test_dp: "🧪 Test DP Cap Flow",
    dp_test_patient_name: "Test Patient",
    btn_doc_upgrade_dp: "⭐ Doctor Pro par Upgrade",

    doc_referral_title: "🔑 *Aap ka Referral Code*",
    doc_referral_body: "Ye code apne patients ke saath share karein taake wo apni DrSaab profile aap ki practice se link kar sakein:\n\n*{code}*\n\nYe code permanent hai — yahan hamesha yehi nazar aayega.",

    doc_reports_title: "📊 *Practice Overview*",
    doc_reports_pick_window: "📊 *Practice Overview*\n\nKaunsa timeframe dekhna chahenge?",
    doc_reports_window_weekly: "📅 Weekly summary — pichhle 7 din",
    doc_reports_window_monthly: "📅 Monthly summary — pichhle 30 din",
    doc_reports_window_all: "📊 All-time summary",
    btn_doc_rep_weekly: "📅 Weekly",
    btn_doc_rep_monthly: "📅 Monthly",
    btn_doc_rep_all: "📊 All-time",
    doc_reports_empty: "Abhi aap ki practice se koi patient link nahi.\n\nApna referral code *{code}* share karein — jaise hi patients ❤️ My Health → My Doctor mein ye code enter karenge, un ki aggregated insights yahan aa jayengi.",
    doc_reports_body:
      "*Connected patients:* {patients}\n*Engagement:* {engagement}\n*Average SMI:* {smi}\n\n📈 *Trends*\n• HbA1c average: {hba1c}\n• Weight average: {weight}\n• Activity: {activity}\n• Medication adherence: {adherence}\n\n🟢 *Green flags*\n{green}\n\n🔴 *Red flags*\n{red}\n\n💡 *Suggested actions*\n{actions}",
    doc_reports_none: "—",
    doc_reports_green_default: "• Patients regular log kar rahe hain\n• Engagement stable hai",
    doc_reports_red_default: "• Check-in miss karne wale patients par nazar rakhein",
    doc_reports_actions_default: "• Kam engaged patients ko is hafte check-in ki taraf motivate karein\n• Jin ki HbA1c trend barh rahi hai un se follow up karein",

    btn_my_doctor: "👨‍⚕️ Mera Doctor",
    my_doctor_title_none: "👨‍⚕️ *Mera Doctor*\n\nAap ne abhi koi doctor link nahi kiya.\n\nApne doctor ka *DS#XXXX* referral code daal kar link ho jayen.",
    my_doctor_title_linked:
      "👨‍⚕️ *Mera Doctor*\n\n*{name}*\nSpecialty: {specialty}\nLocation: {location}\nLinked: {linked}\n\nAap kisi bhi waqt doctor change ya remove kar sakte hain.",
    btn_add_doctor: "➕ Doctor Add karein",
    btn_change_doctor: "🔄 Doctor Change karein",
    btn_remove_doctor: "❌ Doctor Hataayen",
    my_doctor_ask_code: "Barah-e-karam apne doctor ka referral code enter karein (format: *DS#XXXX*).",
    my_doctor_code_invalid: "Ye code sahi nahi lag raha. Format *DS#XXXX* mein bhejein (jaise `DS#A7K9`).",
    my_doctor_not_found: "Is code se koi doctor match nahi hua. *DS#XXXX* dobara check karein.",
    my_doctor_confirm:
      "Ye doctor mila hai:\n\n*{name}*\nSpecialty: {specialty}\nLocation: {location}\n\nKya aap apni DrSaab profile is doctor se link karna chahenge? Sirf aggregated insights share hongi — kabhi bhi individual chats nahi.",
    btn_confirm_link: "✅ Haan, Link karein",
    btn_cancel_link: "Cancel",
    my_doctor_linked_ok: "✅ Aap ab *Dr. {name}* se linked hain.",
    my_doctor_remove_confirm: "*Dr. {name}* ko hataa dein? Aap ka data aap ke paas hi rahega — sirf doctor ko aggregated insights nazar aana band ho jayen gi.",
    btn_confirm_remove: "Haan, hataayen",
    my_doctor_removed_ok: "✅ Doctor hata diya. Aap kisi bhi waqt naya add kar sakte hain.",

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
    quick_shortcuts_title: "⚡ *Quick Shortcuts*",
    quick_shortcuts_body:
      "Kabhi bhi in mein se koi bhi type karein:\n\n📋 *menu* – Main Menu kholein\n❓ *help* – DrSaab ka use dekhein\n❤️ *health* – Apni health ka summary dekhein\n🩸 *sugar* – Blood sugar log karein\n💊 *meds* – Apni medicines check-in karein\n🍽️ *food* – Khane mein madad lein\n📄 *report* – Health report upload karein\n🎯 *progress* – Goals aur progress dekhein\n🏆 *challenge* – Challenges dekhein ya join karein\n🩺 *doctor* – Doctor aur referral options\n\n💬 Ya seedha baat karein — jaise:\n_\"Kya main biryani kha sakta hoon?\"_\n_\"Meri sugar 145 hai.\"_\n_\"Mera latest HbA1c dikhao.\"_",
    shortcut_sugar_needs_context:
      "Samajh gaya — maine *{value}* dekha. Yeh *fasting*, *random*, *khane se pehle*, *khane ke baad*, ya *sone se pehle* thi? Timing bataein taake sahi log kar sakoon.",
    shortcut_flow_paused:
      "Aap ka *{flow}* check-in rok diya — aap ke jawab mehfooz hain. Jaari rakhne ke liye *resume* likhein.",
    shortcut_no_paused_flow: "Dobara shuru karne ke liye koi paused check-in nahi hai.",
    shortcut_resumed: "Aap ka *{flow}* check-in phir shuru kar rahe hain. ↩️",
    shortcut_hba1c_none:
      "Abhi aap ka save shuda HbA1c nahi hai. *report* daabein ya lab report bhejein, main nikaal lounga.",
    shortcut_hba1c_latest:
      "🧪 *Aap ka latest HbA1c*: *{value}%*{date}\n\nNayi lab report upload karne ke liye *report* daabein, ya mujh se kuch bhi poochein.",
    shortcut_confirm_log_sugar:
      "Kya main *{value}* ko blood sugar reading ke tor par save kar loon? Log karne ke liye *yes* likhein, ya sawal poochein.",
    shortcut_flow_glucose: "blood sugar",
    shortcut_flow_med: "medicine",
    shortcut_flow_weight: "weight",
    shortcut_flow_activity: "activity",
    shortcut_flow_symptoms: "symptoms",
    shortcut_flow_wellbeing: "wellbeing",
    shortcut_flow_health: "health",
    shortcut_flow_myhealth: "My Health",
    shortcut_flow_lab: "lab report",
    shortcut_flow_mydoc: "doctor link",
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
    progress_no_goals: "_Abhi koi goal nahi._",
    progress_free_upgrade:
      "🔒 *Premium* unlock karein:\n• Tafseeli progress reports\n• Goal tracking\n• Personalized AI recommendations\n• Advanced trend analysis\n• Doctor-ready summaries",
    progress_upgrade_cta: "⭐ Abhi Upgrade karein",
    progress_paid_intro:
      "Yeh aap ki personalised progress report hai — aap ke goals, blood sugar, wazan, activity, medication consistency, wellbeing aur lab results ke hisaab se.",
    scores_title: "📊 *Aap ke Scores* (100 mein se)",
    reports_title: "📑 *Reports*",
    challenges_title: "🏆 *Challenges*",
    exec_title: "⭐ *Executive Services*",

    // ==================================================================
    // Challenges v1.0 — Roman Urdu
    // ==================================================================
    chal_menu_title: "🏆 *Challenges*",
    chal_menu_intro:
      "Ek challenge join karein, consistency banayein aur DrSaab community ke saath apni progress compare karein.\n\nEk option chunein:",
    btn_chal_active: "🔥 Active Challenges",
    btn_chal_join: "➕ Challenge Join Karein",
    btn_chal_rankings: "🏆 Rankings",
    btn_chal_history: "🏅 Meri Challenge History",

    chal_available_title: "🏆 *Challenge Chunein*",
    chal_available_intro:
      "Sab ke liye rules same hain. Join karein, DrSaab normally use karein aur apni progress dekhein.",
    chal_type_hba1c: "🎯 HbA1c Challenge",
    chal_type_activity: "🚶 Activity Challenge",
    chal_type_healthy_plate: "📸 Meal Challenge",

    chal_hba1c_intro_title: "🎯 *90-Day HbA1c Challenge*",
    chal_hba1c_intro_body:
      "Doosre DrSaab users ke saath agle 90 din apna HbA1c behtar karne ki koshish karein.\n\nAap ki ranking mein dekha jayega:\n🧪 Aap ka HbA1c kitna behtar hua\n📱 Aap ne DrSaab kitna consistently use kiya\n\nJoin karne ke liye tayyar hain?",
    chal_hba1c_how_title: "📘 *Yeh Kaisay Kaam Karta Hai*",
    chal_hba1c_how_body:
      "*1.* Apna latest HbA1c result add karein\n*2.* Agle 90 din DrSaab use karte rahein\n*3.* End ke qareeb naya HbA1c add karein\n*4.* Apni improvement aur final rank dekhein\n\nAap ka public rank kabhi HbA1c ke real numbers show nahi karega.",

    chal_hba1c_collect_title:
      "🧪 Apna starting number set karne ke liye latest HbA1c bhejein.",
    chal_hba1c_collect_body:
      "Aap report upload kar sakte hain ya result likh sakte hain.\n\nMisal: *8.2%*",
    chal_hba1c_reuse:
      "🧪 Mujhe aap ke health record mein ek recent HbA1c mila:\n\n*HbA1c: {value}%*\n*Test date: {date}*\n\nIse starting result ke tor par use karein?",
    chal_hba1c_reuse_no_date:
      "🧪 Mujhe aap ke health record mein ek recent HbA1c mila:\n\n*HbA1c: {value}%*\n\nIse starting result ke tor par use karein?",
    chal_hba1c_invalid:
      "Yeh HbA1c result sahi nahi lagta.\n\nBarah-e-karam apni report par likha percentage enter karein.\n\nMisal: *8.2%*",
    chal_hba1c_baseline_stale_warning:
      "_Tip: best comparison ke liye starting HbA1c pichle 30 din ka hona chahiye._",

    chal_hba1c_confirm_title: "🎯 *Aap Join Ho Gaye!*",
    chal_hba1c_confirm_body:
      "Starting HbA1c: *{baseline}%*\nDuration: *90 din*\nEnd date: *{end_date}*\n\nDrSaab normally use karte rahein — check-ins, activity, meal analysis sab count hoga.\n\nChallenge ke end ke qareeb main aap se latest HbA1c poochoonga.",
    chal_hba1c_confirm_doctor_footer:
      "Aap ki challenge progress *Dr. {doctor}* ko bhi visible hogi.",

    chal_hba1c_final_prompt_title:
      "🧪 Aap ka HbA1c Challenge lagbhag mukammal hai.",
    chal_hba1c_final_prompt_body:
      "Latest report upload karein ya naya HbA1c likhein taake main progress aur ranking calculate kar sakoon.",
    chal_hba1c_final_saved_title: "🎯 *Aap ke HbA1c Challenge ka Result*",
    chal_hba1c_final_saved_body:
      "Starting HbA1c: *{baseline}%*\nFinal HbA1c: *{final}%*\nChange: *{change} percentage points*\nFinal rank: *{rank} of {total}*",
    chal_hba1c_supportive_improved:
      "Yeh real progress hai — consistent rehne ka shukriya. Habits jari rakhein. 💚",
    chal_hba1c_supportive_flat:
      "Steady rehna bhi win hai. Chhoti tabdeeliyan mil kar bara farq laati hain. 💚",
    chal_hba1c_supportive_up:
      "HbA1c kai wajahat se badalta hai. Yeh failure nahi — chalein useful habits par kaam karte hain.",

    btn_chal_join_now: "✅ Challenge Join Karein",
    btn_chal_how: "📘 Yeh Kaisay Kaam Karta Hai",
    btn_chal_upload: "📎 Report Upload Karein",
    btn_chal_enter: "⌨️ Result Likhein",
    btn_chal_cancel: "❌ Cancel",
    btn_chal_reuse_yes: "✅ Haan, Yehi Use Karein",
    btn_chal_reuse_another: "🔄 Naya Result Add Karein",
    btn_chal_remind_later: "Baad Mein Yaad Dilayein",

    chal_activity_intro_title: "🚶 *30-Day Activity Challenge*",
    chal_activity_intro_body:
      "Agle 30 din regularly move karein aur DrSaab challenge rankings mein upar aayen.\n\nRanking mein dekha jayega:\n🚶 Active days ki tadaad\n⏱️ Activity duration\n📱 DrSaab par consistency\n\nJoin karne ke liye tayyar hain?",
    chal_activity_how_title: "📘 *Yeh Kaisay Kaam Karta Hai*",
    chal_activity_how_body:
      "DrSaab ke through apni walks, workouts, swimming, sports ya koi bhi physical activity log karein.\n\nActivity kam se kam *20 minute* ki honi chahiye.\n\nEk din mein sirf ek active day count hoga, chahe aap ek se zyada activities karein.",
    chal_activity_join_title: "🚀 *Aap Join Ho Gaye!*",
    chal_activity_join_body:
      "30-Day Activity Challenge aaj se shuru hota hai.\n\nDrSaab ke through activity log karein, score automatically update hoga.\n\nMinimum qualifying activity: *20 min*\nEnd date: *{end_date}*",
    chal_activity_progress:
      "🚶 *Activity Challenge Progress*\n\nActive days: *{active_days}*\nTotal minutes: *{minutes}*\nCurrent streak: *{streak} din*\nChallenge day: *{day} of 30*\nCurrent rank: *{rank} of {total}*",

    chal_hp_intro_title: "📸 *30-Day Healthy Plate Challenge*",
    chal_hp_intro_body:
      "Apne meals ki tafseel DrSaab ke saath share karein aur dekhein 30 din mein kitni healthier plates bana sakte hain.\n\nRanking mein dekha jayega:\n🥗 Healthy Plates ki tadaad\n📸 Meal-logging consistency\n📱 DrSaab ka overall use\n\nJoin karne ke liye tayyar hain?",
    chal_hp_how_title: "📘 *Yeh Kaisay Kaam Karta Hai*",
    chal_hp_how_body:
      "*1.* Meal ki photo ya description bhejein\n*2.* DrSaab meal analyze karega\n*3.* Healthy Plates automatically count hongi\n*4.* 30 din tak jari rakhein aur final rank dekhein\n\nHar meal log karna zaroori nahi.",
    chal_hp_join_title: "🥗 *Aap Join Ho Gaye!*",
    chal_hp_join_body:
      "30-Day Healthy Plate Challenge aaj se shuru hota hai.\n\nDrSaab ko apne meals ki photo ya description bhejein. Healthy Plates automatically count hongi.\n\nEnd date: *{end_date}*",
    chal_hp_meal_hit:
      "🟢 *Healthy Plate!*\n\nYeh meal aap ke challenge mein count ho gaya.\n\nHealthy Plates: *{count}*\nCurrent rank: *{rank} of {total}*",
    chal_hp_meal_miss:
      "🟡 Yeh meal abhi Healthy Plate count nahi hua, magar isse meri samajh better hoti hai.",

    chal_rankings_title: "🏆 *{name} Rankings*",
    chal_rankings_empty: "_Doosre users join karenge to yahan rankings dikhengi. Jari rakhein!_",
    chal_rankings_row: "{rank}. {name} — {outcome}",
    chal_rankings_you_suffix: "  ← *aap*",
    chal_rankings_you_position: "\nAap ka position: *{rank} of {total}*",
    chal_rankings_hba1c_note:
      "_Baseline band ({band}) ke andar ranked. Public rankings mein HbA1c numbers kabhi show nahi hote._",
    chal_rankings_pick_intro: "Rankings dekhne ke liye challenge chunein:",
    chal_rankings_none_active: "Challenge join karne ke baad rankings visible hongi.",

    chal_history_title: "🏅 *Meri Challenge History*",
    chal_history_empty: "Aap ne abhi tak koi challenge complete nahi kiya.",
    chal_history_row_completed: "• *{name}* — {outcome} (rank {rank}/{total})",
    chal_history_row_incomplete: "• *{name}* — {status}",
    chal_history_status_expired: "final result nahi diya",
    chal_history_status_withdrawn: "chhor diya",
    chal_history_status_disqualified: "hata diya gaya",

    chal_active_title: "🔥 *Active Challenges*",
    chal_active_none:
      "Aap ka koi active challenge nahi. *Challenge Join Karein* par tap karein.",
    chal_active_line_hba1c: "🎯 *90-Day HbA1c Challenge* — din {day}/{total}",
    chal_active_line_activity:
      "🚶 *30-Day Activity Challenge* — din {day}/{total} · {active_days} active din",
    chal_active_line_healthy_plate:
      "📸 *30-Day Healthy Plate Challenge* — din {day}/{total} · {count} Healthy Plate",
    chal_active_awaiting_hba1c:
      "🎯 *90-Day HbA1c Challenge* — final result ka intezar",

    chal_dr_joined:
      "🏆 *Patient Ne Challenge Join Kiya*\n\nPatient: *{patient}*\nChallenge: *{challenge}*\nStart: *{start}*\nEnd: *{end}*",
    chal_dr_weekly:
      "📊 *Weekly Challenge Update*\n\nPatient: *{patient}*\nChallenge: *{challenge}*\nProgress: *{progress}*\nParticipation: *{participation}*\nCurrent rank: *{rank}*\nStatus: *{status}*",
    chal_dr_completed:
      "🏁 *Challenge Complete Ho Gaya*\n\nPatient: *{patient}*\nChallenge: *{challenge}*\nStarting value: *{baseline}*\nFinal value: *{final}*\nMeasured change: *{outcome}*\nParticipation: *{participation}* pts\nFinal rank: *{rank}* (percentile {percentile})\nStatus: *{status}*",
    chal_dr_incomplete:
      "⏰ *Challenge Bina Result Ke Khatam*\n\nPatient: *{patient}*\nChallenge: *{challenge}*\nReason: {reason}",

    chal_reminder_activity:
      "🚶 Ab tak *{active_days} active din* complete ho chuke hain.\n\nAaj 20 min ki walk aap ka challenge chalta rakh sakti hai. 💪",
    chal_reminder_healthy_plate:
      "🥗 Aap ke pas *{count} Healthy Plates* hain.\n\nJab tayyar ho, agla meal bhejein. 📸",
    chal_reminder_hba1c:
      "🎯 Aap ka HbA1c Challenge chal raha hai.\n\nAaj sirf agle helpful choice par focus karein — 90 din perfect nahi honay chahiye.",
    reminder_template_challenge_final_result_prompt:
      "🧪 Aap ka HbA1c Challenge finish line ke qareeb hai — jab ho sake latest HbA1c bhej dein.",
    reminder_template_challenge_checkin:
      "🏆 Aaj apna challenge chalta rakhein — chhota sa log, check-in ya meal sab count hota hai.",

    chal_outcome_hba1c_change: "↓ {change} percentage points",
    chal_outcome_hba1c_up:     "↑ {change} percentage points",
    chal_outcome_hba1c_steady: "steady",
    chal_outcome_active_days:  "{value} active day(s)",
    chal_outcome_plates:       "{value} Healthy Plate(s)",

    chal_join_already:
      "Aap pehle se *{name}* mein hain. 🔥 Active Challenges par tap kar ke progress dekhein.",
    chal_start_generic_confirm:
      "✅ Aap join ho gaye! DrSaab normally use karein — qualifying actions automatically count honge.",
    chal_error_no_defs:
      "Abhi koi challenge open nahi. Jaldi check karein!",
    chal_ineligible_hba1c:
      "HbA1c Challenge prediabetes ya diabetes wale users ke liye hai. Koi doosra challenge chunein ya baad mein check karein.",
    chal_baseline_band_lt7:     "7.0% se kam",
    chal_baseline_band_7_8_9:   "7.0%–8.9%",
    chal_baseline_band_9_10_9:  "9.0%–10.9%",
    chal_baseline_band_11_plus: "11.0% ya zyada",

    btn_chal_hide_ranking: "🙈 Mujhe public leaderboard se chhupayein",
    btn_chal_show_ranking: "👁 Mujhe public leaderboard par dikhayein",
    btn_chal_withdraw:     "🚪 Yeh challenge chhor dein",
    btn_chal_withdraw_confirm: "✅ Haan, chhor dein",
    chal_leaderboard_optin_on:
      "✅ Ab aap public leaderboard par visible hain.",
    chal_leaderboard_optin_off:
      "✅ Aap public leaderboard se chhup gaye. Progress aur doctor updates jari rahenge.",
    chal_withdraw_confirm_prompt:
      "Kya aap *{name}* chhorna chahte hain? Aap ki progress count hona band ho jayegi aur yeh challenge history mein chala jayega.",
    chal_withdraw_done: "Aap ne *{name}* chhor diya. Aap kabhi bhi naya challenge shuru kar sakte hain.",
    chal_detail_activity:
      "🚶 *30-Day Activity Challenge*\n\nActive days: *{active_days}*\nTotal minutes: *{minutes}*\nCurrent streak: *{streak} din*\nChallenge day: *{day} of 30*\nCurrent rank: *{rank} of {total}*",
    chal_detail_healthy_plate:
      "📸 *30-Day Healthy Plate Challenge*\n\nHealthy Plates: *{count}*\nChallenge day: *{day} of 30*\nCurrent rank: *{rank} of {total}*",
    chal_detail_hba1c:
      "🎯 *90-Day HbA1c Challenge*\n\nStarting HbA1c: *{baseline}%*\nChallenge day: *{day} of 90*\nParticipation: *{points} points*\nCurrent streak: *{streak} din*\n\nAap ki final ranking latest HbA1c submit karne par calculate hogi.",
    chal_detail_awaiting_final:
      "🎯 *90-Day HbA1c Challenge*\n\nAap ka challenge complete ho gaya. Final ranking ke liye latest HbA1c bhejein.",

    chal_activity_qualifying_list:
      "\n\n*Qualifying activities:*\n• Walking\n• Running\n• Gym workout\n• Swimming\n• Cycling\n• Sports\n• Home workout\n• Yoga ya mobility\n• Koi bhi intentional physical activity",

    // ===== More section v2 (2026-07 spec) =====
    more_subtitle: "Neechay diye options mein se ek chunein:",
    btn_more_subscription_v2: "💳 Meri Subscription",
    btn_more_account: "👤 Mera Account",

    reminders_prefs_title: "🔔 *Reminders*",
    reminders_prefs_intro:
      "Chunein ke aap kaun se reminders chahte hain. On ya off karne ke liye category par tap karein.",
    rem_cat_blood_sugar: "🩸 Blood Sugar",
    rem_cat_medication: "💊 Medication",
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

    // Subscription Module — Upgrade flow
    upsell_menu_title:
      "🟢 *Consistency Coach*\nRs 799/mahina\nPersonalized AI coaching aur premium features.\n\n⭐ *Executive Coach*\nRs 7,999/mahina\nPremium one-to-one coaching.",
    btn_upsell_consistency: "🟢 Consistency",
    btn_upsell_executive: "⭐ Executive",
    upsell_executive_unavailable:
      "⭐ *Executive Coach* abhi available nahi hai.\nBaraaye meherbani jald wapas check karein.",
    upsell_consistency_title: "🟢 *Consistency Coach*",
    upsell_consistency_features:
      "*Premium features:*\n• 🤖 Advanced AI\n• 🧠 Personalized guidance\n• 🏋️ Fitness plans\n• 🥗 Meal plans\n• 🎥 Exclusive videos\n• ⌚ Wearable integration (WHOOP, Fitbit, Apple Health & Google Fit)",
    upsell_consistency_offers:
      "💰 *Offers*\n• 1 Month – Rs 799\n• ⭐ 6 Months – Pay for 5 Months (Rs 3,995)\n• 💎 12 Months – Pay for 10 Months (Rs 7,990)",
    btn_upsell_1m: "1 Month",
    btn_upsell_6m: "6 Months",
    btn_upsell_12m: "12 Months",

    upsell_confirm_1m:
      "🟢 *1 Month Plan*\n💰 Rs 799\nConsistency Coach ka aik mahina.",
    upsell_confirm_6m:
      "🟢 *6 Month Plan*\n5 mahine ki payment\n💰 Rs 3,995\nAap ko poore 6 mahine milte hain.",
    upsell_confirm_12m:
      "🟢 *12 Month Plan*\n10 mahine ki payment\n💰 Rs 7,990\nAap ko poore 12 mahine milte hain.",
    btn_upsell_continue: "Continue",
    btn_upsell_change_plan: "Plan tabdeel karein",
    btn_upsell_test_activate: "🧪 Test Activate (payment skip karein)",
    test_activation_disabled:
      "🧪 Test activation aap ke account ke liye enabled nahi. Admin password bhej kar unlock karein, ya .env mein TEST_ACTIVATION_ENABLED=true rakhein.",
    admin_promoted:
      "🔓 *Admin mode unlocked.*\nAb aap ko upgrade aur doctor menu par 🧪 test buttons dikhenge. Refresh ke liye /menu bhejein.\n\n_Admin mode se exit ke liye `admin off` bhejein._",
    admin_demoted:
      "🔒 *Admin mode disabled.*\nTest buttons dobara chhup gaye. Wapas enter karne ke liye admin password bhejein.",

    pay_method_title: "Payment method chunein:",
    btn_pay_bank: "🏦 Bank",
    btn_pay_jazzcash: "💳 JazzCash",

    pay_bank_title: "🏦 *Payment Details*",
    pay_bank_body:
      "*Bank:* Bank AL Habib\n*Account:* M/S. MEEBO TECHNOLOGIES\n*IBAN:* PK48BAHL1036098100995201\n*Amount:* Rs {amount}\n\n📸 Payment ke baad screenshot ya deposit slip yahan bhejein.",

    pay_jazzcash_title: "💳 *JazzCash Payment*",
    pay_jazzcash_body:
      "(JazzCash account details baad mein add ki jayengi.)\n\n*Amount:* Rs {amount}\n\n📸 Payment ke baad transaction screenshot yahan bhejein.",

    btn_pay_ive_paid: "Payment ho gayi",
    btn_pay_cancel: "Cancel",

    pay_awaiting_proof:
      "📸 Baraaye meherbani payment ka screenshot ya deposit slip photo ki tarah bhejein.",
    pay_proof_not_image:
      "Yeh image nahi lag rahi. Baraaye meherbani payment screenshot photo ki tarah bhejein.",
    pay_proof_received:
      "✅ Screenshot ka shukriya! Hum aap ki payment process kar rahe hain.\nProcess mukammal hone par hum aap ko WhatsApp par notify kar denge.",
    pay_session_lost:
      "Lagta hai aap ki payment session ruk gayi. *Plan Upgrade karein* par tap kar ke dobara plan pick karein — aap ka health data mehfooz hai.",
    pay_cancelled:
      "Payment cancel kar di gayi. Aap kisi bhi waqt Upgrade se dobara shuru kar sakte hain.",

    admin_new_payment:
      "🔔 *Nayi payment submission*\n\n*User:* {name}\n*WhatsApp:* {whatsapp}\n*Plan:* {plan}\n*Amount:* Rs {amount}\n*Method:* {method}\n*Submitted:* {when}\n\nPayment #{id}",
    admin_new_payment_caption: "Payment #{id} proof",
    btn_admin_approve: "✅ Approve",
    btn_admin_reject:  "❌ Reject",
    btn_admin_better:  "🔄 Better Image",
    admin_help:
      "*Subscription admin commands*\n\n`/sub pending` — pending payments dekhein\n`/sub approve <id>` — payment #id approve karein aur user activate karein\n`/sub reject <id> [reason]` — payment #id reject karein (optional reason)\n`/sub better <id>` — user se behtar screenshot mangvain",
    admin_pending_empty: "Koi pending payment nahi.",
    admin_pending_row:
      "*Payment #{id}* — {name} (+{whatsapp})\n{plan} · Rs {amount} · {method} · {when}",
    admin_action_not_found: "Is id ki koi payment nahi mili.",
    admin_action_already_reviewed:
      "Payment #{id} pehle hi {status} ho chuki hai ({when}). Koi action nahi liya gaya.",
    admin_approved_ack:
      "✅ Payment #{id} approved.\n{name} ab {expiry} tak member hain.\n{notify}",
    admin_rejected_ack: "❌ Payment #{id} reject kar di.\n{notify}",
    admin_better_ack:
      "🔄 User se Payment #{id} ke liye behtar screenshot mangvaya gaya.\n{notify}",
    admin_user_notified: "📣 User ko WhatsApp par notify kar diya.",
    admin_user_notify_failed:
      "⚠️ WhatsApp par user tak nahi pahunch sake (session window band ho sakti hai). Backend update ho gaya.",
    admin_db_error:
      "⚠️ Payment #{id} ko database mein update nahi kar sake. Dobara try karein. Error: {err}",

    pay_activated:
      "🎉 Aap ab *Consistency Coach* member hain!\n\n*Valid Until:* {expiry}\n\nApni premium features enjoy karein! 💚",

    pay_rejected:
      "Main aap ki payment verify nahi kar saka.\nBaraaye meherbani doosra screenshot bhejein.",
    pay_better_proof:
      "Bheja gaya screenshot verify karne ke liye clear nahi. Kya aap receipt ya deposit slip ki behtar photo bhej sakte hain?",
    btn_pay_upload_again: "📸 Dobara Upload karein",

    sub_reminder_7d: "⏳ Aap ki subscription 7 din mein khatam ho rahi hai.",
    sub_reminder_1d: "🔔 Aap ki subscription kal khatam ho rahi hai.",
    sub_reminder_today: "Aap ka premium plan aaj khatam ho raha hai.",
    btn_sub_renew: "Renew",
    btn_sub_later: "Baad mein",

    sub_expired_downgrade:
      "Aap ka premium plan khatam ho gaya hai.\nAb aap Free version use kar rahe hain.\nAap ka health data mehfooz hai.",
    btn_sub_main_menu: "Menu",

    // Doctor Pro Addendum
    dp_title: "🩺 *Doctor Pro*",
    dp_price: "*Price:* PKR 4,999/month",
    dp_plan_label: "Doctor Pro",
    dp_benefits:
      "*Benefits:*\n• Unlimited patients\n• Unlimited referral usage\n• Advanced patient reports\n• Priority access to new features",
    btn_dp_continue: "Continue",
    btn_dp_month: "Doctor Pro",

    dp_cap_a_patient: "ek patient",
    dp_cap_reached:
      "⚠️ *Aap 10 patients ki free limit tak pahunch chuke hain.*\n\n{patient} ne abhi connect karne ki koshish ki lekin add nahi ho sake.\n\nMazeed patients add karne ke liye *Doctor Pro (PKR 4,999/month)* par upgrade karein.",
    btn_dp_upgrade: "Upgrade",
    btn_dp_later: "Baad mein",

    dp_patient_cap_reached:
      "Sorry — *{name}* is waqt naye patients accept nahi kar rahe. Koi doosra referral code try karein ya baad mein check karein.",

    dp_activated:
      "🎉 Aap ab *Doctor Pro* member hain!\n\n*Valid Until:* {expiry}\n\n10-patient limit hat gayi — naye referrals accept honge. 💚",
    dp_expired_downgrade:
      "Aap ki *Doctor Pro* subscription khatam ho gayi hai.\nMaujooda patients connected rahenge, lekin renewal tak naye patients add nahi ho sakte.\nAap ka data aur reports mehfooz hain.",

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
      "Shukriya. Zara yeh short video dekhein — batati hai ke meethay drinks aur ultra-processed foods long-term health par kaisa asar daaltay hain.\n\n[▶️ Watch the video](https://www.youtube.com/shorts/iNaq4vHPQYY)",
    pd_crav_reflection_q:
      "Video dekhne ke baad aap ke khayal se aane wale haftoun mein kaunsi realistic tabdeeliyan kar saktay hain?",
    pd_crav_commit_q: "Agar iss haftay sirf aik chhoti tabdeeli karni ho, kya realistic lagta hai?",
    btn_pd_commit_skip_sugary: "🥤 Meethay drinks chhorden",
    btn_pd_commit_skip_junk:   "🍟 Din mein ek junk snack chhorden",
    btn_pd_commit_walk10:      "🚶 Khaanay ke baad 10 minute walk",
    btn_pd_commit_one_plate:   "🍽️ Aik plate par bas karein",
    btn_pd_commit_wait10:      "⏰ Snack se pehle 10 minute rukein",
    btn_pd_commit_other:       "Kuch aur",
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

    bm_habit_title: "🎯 *Habit Builder*",
    bm_habit_intro:
      "🌱 Aik waqt mein aik chhoti aadat par kaam karte hain.\n\nAap kaunsi aadat par kaam karna chahenge?",
    bm_habit_lib_move: "🚶 20 minutes chalein",
    bm_habit_lib_water: "💧 Paani ka goal poora karein",
    bm_habit_lib_sleep: "😴 Target time se pehle so jayein",
    bm_habit_lib_smoke_free: "🚭 Cigarette se pura parhez",
    bm_habit_lib_no_food_after_dinner: "🌙 Dinner ke baad kuch nahi",
    bm_habit_setup_move:
      "Goal yeh hai ke rozana kam az kam 20 minutes movement karein. Walk, exercise, swimming, cycling ya koi bhi physical activity count hoti hai.",
    bm_habit_setup_water_q: "Rozana kitne glass paani ka goal rakhna chahenge?",
    bm_habit_setup_water_other_q: "Rozana kitne glass ka goal rakhna hai? Number likh dein.",
    bm_habit_setup_sleep_q: "Kis waqt tak so jaana chahte hain?",
    bm_habit_setup_sleep_other_q: "Apna target bedtime type karein (misal ke tor par 10:30 PM).",
    bm_habit_setup_smoke_free:
      "Goal yeh hai ke har din pura pura smoke-free rahein. Aik mushkil din aap ki progress ko cancel nahi karta.",
    bm_habit_setup_no_food_after_dinner:
      "Dinner ke baad, breakfast tak kuch bhi na khaayein.",
    btn_hb_water_6: "6",
    btn_hb_water_8: "8",
    btn_hb_water_10: "10",
    btn_hb_water_other: "Koi aur amount",
    btn_hb_sleep_1030: "10:30 PM",
    btn_hb_sleep_1100: "11:00 PM",
    btn_hb_sleep_1130: "11:30 PM",
    btn_hb_sleep_other: "Koi aur time",
    bm_habit_activation_msg:
      "✅ Aap ki aadat add ho gayi hai.\n\nPehle 7 din DrSaab rozana check-in karega. Agar aadat set ho rahi hui to check-ins Sunday par shift ho jayenge.",
    btn_hb_start: "🌱 Start",
    btn_hb_start_silent: "🔕 Bina reminders ke start",
    btn_hb_cancel: "❌ Cancel",
    bm_habit_started_reminders:
      "🌱 Set. Kal check-in karoonga. Reminders pause ya band karnay ke liye kabhi bhi keh dein.",
    bm_habit_started_silent:
      "🌱 Aadat save ho gayi. Reminders off hain — jab chahein Habit Builder se progress log kar lein.",
    bm_habit_cancelled: "Cancel ho gaya. Jab dobara ready hon aa jaana.",
    bm_habit_already_active_title: "Aap abhi *{name}* par kaam kar rahe hain",
    bm_habit_already_active_body:
      "Nayi aadat shuru karnay se pehle aap isay continue kar sakte hain, adjust kar sakte hain, pause kar sakte hain, reminders band kar sakte hain ya remove kar sakte hain.",
    bm_habit_daily_v1: "🌱 Quick habit check: {question}",
    bm_habit_daily_v2: "Chhoti actions milkar bara farq banati hain. {question}",
    bm_habit_daily_v3: "*{name}* ke liye aap ki *{streak}-din* ki streak chal rahi hai. {question}",
    bm_habit_daily_v3_zero: "Har streak aik mukammal din se shuru hoti hai. {question}",
    bm_habit_q_move: "Kya aaj aap ne kam az kam 20 minutes movement ki?",
    bm_habit_q_water: "Kya aaj aap ne apna water goal poora kiya ({target} glasses)?",
    bm_habit_q_sleep: "Kya aaj aap {target} se pehle so gaye?",
    bm_habit_q_smoke_free: "Kya aaj aap pure din smoke-free rahe?",
    bm_habit_q_no_food_after_dinner: "Kya aaj aap ne dinner ke baad kuch nahi khaya?",
    btn_hb_yes: "✅ Haan",
    btn_hb_no: "❌ Aaj nahi",
    btn_hb_stop: "🔕 Reminders band karein",
    bm_habit_ack_yes: "✅ Ho gaya. Aik aur chhoti win.",
    bm_habit_ack_no:
      "Koi baat nahi. Aik missed din aap ki progress ko cancel nahi karta. Kal dobara try karenge.",
    bm_habit_stop_confirm: "*{name}* ke reminders band karein?",
    btn_hb_stop_yes: "🔕 Haan, band kar dein",
    btn_hb_keep_reminders: "↩️ Reminders rakhein",
    bm_habit_stop_done:
      "🔕 *{name}* ke reminders band kar diye gaye hain. Aap ki progress save hai. Jab chahein Habit Builder se dobara start kar sakte hain.",
    bm_habit_summary_title: "🌱 *Aap ki current aadat*",
    bm_habit_summary_body:
      "*{name}*\nStatus: {status}\nCurrent streak: *{streak}* din\nIs cycle mein: *{completed}/{responded}* mukammal",
    bm_habit_status_setup: "Setup pending",
    bm_habit_status_daily: "Daily check-ins",
    bm_habit_status_disabled: "Reminders off",
    bm_habit_status_paused: "Pause hai",
    btn_hb_stop_short: "🔕 Reminders band karein",
    btn_hb_main_menu: "🏠 Main Menu",

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

    bm_wins_title: "⚡ *Aaj ki 10-Minute Win*",
    bm_wins_prompt: "*{title}*\n\n{desc}",
    btn_bm_wins_done: "✅ Ho gaya",
    btn_bm_wins_skip: "❌ Aaj nahi",
    btn_bm_wins_swap: "🔄 Doosri dein",
    bm_wins_enc_1: "🎉 Chhoti wins lasting aadatein banati hain.",
    bm_wins_enc_2: "🎉 Har healthy choice ki qadar hai.",
    bm_wins_enc_3: "🎉 Aaj ke 10 minutes zero se behter hain.",
    bm_wins_ack_skip: "Koi baat nahi. Kal aik aur chhoti win ka moqa hoga.",
    bm_wins_swap_used: "Aap aaj pehle hi swap kar chuke hain. Isay try karein ya kal fresh challenge ke liye aayein.",
    bm_wins_already_done: "Aaj ki win mukammal ho gayi hai. 🌱 Kal aik nayi ke liye aayein.",
    bm_wins_already_skipped: "Aaj ka card band ho gaya hai. Kal aik aur moqa milega.",
    bm_win_walk_title: "🚶 10 minutes chalein",
    bm_win_walk_desc: "10 minutes brisk walk karein. Indoor ho ya outdoor — dono count honge.",
    bm_win_stretch_title: "🤸 10 minutes stretching",
    bm_win_stretch_desc: "Neck, shoulders, back aur legs ko 10 minutes halke se stretch karein.",
    bm_win_water_title: "💧 Paani peein aur recharge",
    bm_win_water_desc: "Agle 10 minutes mein 2 glass paani peein aur screen se thora break lein.",
    bm_win_declutter_title: "🧹 Aik jagah declutter karein",
    bm_win_declutter_desc: "10 minutes koi choti jagah tidy karein — desk, side table ya kitchen counter.",
    bm_win_unplug_title: "🧘 10 minutes unplug",
    bm_win_unplug_desc: "10 minutes phone side par rakhein. Chup baithein, deep breath lein ya bina notifications ke kuch minutes enjoy karein.",

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
