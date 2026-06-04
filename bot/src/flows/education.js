import { send, langOf } from "../utils.js";
import { backKeyboard } from "../keyboards.js";

// Free-tier educational content (static, no AI cost). Short, practical tips.
const CONTENT = {
  en: {
    title: "📚 Diabetes basics — quick tips",
    tips: [
      "🍽 Fill half your plate with non-starchy vegetables, a quarter with protein, a quarter with whole grains.",
      "🚶 A 10–15 minute walk after meals can noticeably lower your blood sugar spike.",
      "💧 Drink water instead of sugary drinks — even 'fresh juice' raises sugar fast.",
      "😴 Poor sleep raises blood sugar. Aim for 7–8 hours.",
      "🩸 Check your sugar at consistent times so trends are meaningful.",
      "⚠️ Know your lows: shakiness, sweating, confusion. Keep a fast sugar source handy.",
    ],
  },
  ur: {
    title: "📚 ذیابیطس کی بنیادی باتیں — مختصر مشورے",
    tips: [
      "🍽 آدھی پلیٹ بغیر نشاستے والی سبزیاں، چوتھائی پروٹین، چوتھائی ثابت اناج۔",
      "🚶 کھانے کے بعد 10–15 منٹ کی چہل قدمی شوگر کا اضافہ کم کرتی ہے۔",
      "💧 میٹھے مشروبات کے بجائے پانی پئیں — 'تازہ جوس' بھی شوگر تیزی سے بڑھاتا ہے۔",
      "😴 ناقص نیند شوگر بڑھاتی ہے۔ 7–8 گھنٹے کی نیند لیں۔",
      "🩸 ایک ہی وقت پر شوگر چیک کریں تاکہ رجحان واضح ہو۔",
      "⚠️ کم شوگر کی علامات جانیں: کپکپی، پسینہ، الجھن۔ فوری میٹھا پاس رکھیں۔",
    ],
  },
  roman_ur: {
    title: "📚 Diabetes ki bunyadi baatein — mukhtasar mashware",
    tips: [
      "🍽 Aadhi plate bagair nashastay wali sabziyan, chauthai protein, chauthai sabit anaaj.",
      "🚶 Khane ke baad 10–15 minute ki walk sugar ka izafa kam karti hai.",
      "💧 Meethay drinks ke bajaye paani piyein — 'fresh juice' bhi sugar tezi se barhata hai.",
      "😴 Naqis neend sugar barhati hai. 7–8 ghante ki neend lein.",
      "🩸 Ek hi waqt par sugar check karein taake rujhan wazeh ho.",
      "⚠️ Kam sugar ki alamaat janein: kapkapi, paseena, uljhan. Foran meetha paas rakhein.",
    ],
  },
};

export async function showEducation(bot, chatId, session) {
  const lang = langOf(session);
  session.state = "idle";
  const c = CONTENT[lang] || CONTENT.en;
  const text = `*${c.title}*\n\n` + c.tips.join("\n\n");
  await send(bot, chatId, text, { keyboard: backKeyboard(lang), markdown: true });
}
