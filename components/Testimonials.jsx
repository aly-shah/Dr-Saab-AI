import Image from "next/image";
import { StarIcon, SparkleIcon } from "./icons";

const TESTIMONIALS = [
  {
    quote:
      "My fasting sugar went from the 160s to the 120s in two months. It just feels like texting a kind doctor who actually remembers me.",
    name: "Aisha R.",
    role: "Type 2, managing for 3 years",
    img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80&auto=format&fit=crop&crop=faces",
  },
  {
    quote:
      "I was pre-diabetic and terrified. Dr Saab AI made the changes feel small and doable. My latest HbA1c is back in the normal range.",
    name: "Daniel K.",
    role: "Reversed pre-diabetes",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&auto=format&fit=crop&crop=faces",
  },
  {
    quote:
      "The meal photo feature is genius. I send a picture of dinner and instantly know if I should swap the rice. No more guessing.",
    name: "Marcus T.",
    role: "Type 2, on insulin",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80&auto=format&fit=crop&crop=faces",
  },
];

export default function Testimonials() {
  return (
    <section id="results" className="scroll-mt-24 bg-cloud/60 py-20 sm:py-28">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">
            <SparkleIcon className="h-4 w-4" />
            Real progress
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            People are feeling the difference
          </h2>
          <p className="mt-4 text-lg text-ink/65">
            Thousands use Dr Saab AI every day to steady their sugar and rebuild
            their confidence. Here&apos;s what that looks like.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="reveal card flex flex-col p-7">
              <div className="flex items-center gap-1 text-amber-400" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} className="h-4 w-4" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink/80">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-line/60 pt-5">
                <Image
                  src={t.img}
                  alt={t.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-line"
                />
                <div className="leading-tight">
                  <p className="font-semibold text-ink">{t.name}</p>
                  <p className="text-xs text-ink/55">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
