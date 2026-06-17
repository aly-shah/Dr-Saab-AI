import PhoneMockup from "./PhoneMockup";
import { SparkleIcon } from "./icons";

// Capability banner: DrSaab chats in the user's own language. English sample is
// in the hero; here we show Roman Urdu and Urdu (script, RTL) conversations.
const ROMAN_URDU = [
  { from: "in", text: "Assalam o Alaikum! Aaj fasting sugar kitni thi?", time: "9:12" },
  { from: "out", text: "142 thi", time: "9:13" },
  { from: "in", text: "MashaAllah — pichle hafte 158 thi. Behtari ho rahi hai. Aaj 10 minute walk zaroor karein.", time: "9:13" },
  { from: "out", text: "Theek hai, shukriya!", time: "9:14" },
  { from: "in", text: "Main shaam ko reminder bhej dunga.", time: "9:14" },
];

const URDU = [
  { from: "in", text: "السلام علیکم! آج ناشتے میں کیا لیا؟", time: "9:20" },
  { from: "out", text: "انڈہ اور ایک روٹی", time: "9:21" },
  { from: "in", text: "اچھا انتخاب۔ تھوڑی سبزی شامل کریں تو شوگر مستحکم رہے گی۔", time: "9:21" },
  { from: "out", text: "ضرور، شکریہ ڈاکٹر صاحب", time: "9:22" },
  { from: "in", text: "میں شام کو یاد دہانی بھیج دوں گا۔", time: "9:22" },
];

export default function TrustBar() {
  return (
    <section className="border-y border-line/60 bg-white/70">
      <div className="container-page py-16">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="eyebrow">
            <SparkleIcon className="h-4 w-4" />
            Speaks your language
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Coaching in English, Urdu &amp; Roman Urdu
          </h2>
        </div>

        <div className="grid items-start justify-items-center gap-10 sm:grid-cols-2">
          <div className="flex flex-col items-center">
            <PhoneMockup messages={ROMAN_URDU} contactName="DrSaab AI" />
            <p className="mt-5 text-sm font-semibold text-ink/70">Roman Urdu</p>
          </div>
          <div className="flex flex-col items-center">
            <PhoneMockup messages={URDU} contactName="DrSaab AI" rtl />
            <p className="mt-5 text-sm font-semibold text-ink/70">اردو</p>
          </div>
        </div>
      </div>
    </section>
  );
}
