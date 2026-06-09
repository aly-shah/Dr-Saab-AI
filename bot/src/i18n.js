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
  },
};

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ur", label: "اردو" },
  { code: "roman_ur", label: "Roman Urdu" },
];

export function t(lang, key, vars = {}) {
  const table = STR[lang] || STR.en;
  let s = table[key] ?? STR.en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replaceAll(`{${k}}`, String(v));
  }
  return s;
}
