import { SparkleIcon } from "./icons";
import VideoBlock from "./VideoBlock";

// "About DrSaab" section (replaces the old results/testimonials block).
// Video file: drop one into /public and set `src` below (e.g. "/about.mp4").
const ABOUT_VIDEO_SRC = ""; // pending — client will share the video
const ABOUT_VIDEO_CAPTION = ""; // pending — client will share the caption text

export default function Testimonials() {
  return (
    <section id="results" className="scroll-mt-24 bg-cloud/60 py-20 sm:py-28">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">
            <SparkleIcon className="h-4 w-4" />
            About DrSaab
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Kam Uljhan. Zyada Control.
          </h2>
          <p className="mt-4 text-lg text-ink/65">
            DrSaab aap ko diabetes ko samajhnay, rozana behtar faislay karnay aur
            sehatmand aadatein barqarar rakhnay mein madad karta hai.
          </p>
        </div>

        <VideoBlock src={ABOUT_VIDEO_SRC} caption={ABOUT_VIDEO_CAPTION} className="mt-14" />
      </div>
    </section>
  );
}
