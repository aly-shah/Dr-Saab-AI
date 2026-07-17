import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import WhyWhatsApp from "@/components/WhyWhatsApp";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import VideoBlock from "@/components/VideoBlock";
import Reveal from "@/components/Reveal";

export default function Home() {
  return (
    <>
      <a
        href="#how"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-primary focus:shadow-card"
      >
        Skip to content
      </a>
      <Nav />
      <main>
        <Hero />
        <section className="py-12 sm:py-16">
          <div className="container-page">
            <VideoBlock src="/intro.mp4" poster="/intro-poster.jpg" caption="DrSaab helps people with diabetes stay consistent with the daily habits that lead to better health. Through WhatsApp, DrSaab provides personalized guidance, accountability, education, and support to make diabetes management simpler and more sustainable." />
          </div>
        </section>
        <TrustBar />
        <HowItWorks />
        <Features />
        <WhyWhatsApp />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <Reveal />
    </>
  );
}
