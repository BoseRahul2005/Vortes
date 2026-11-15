import Hero from "../components/Hero";
import Features from "../components/Features";
import Pricing from "../components/Pricing";
import Faq from "../components/Faq";
import CTA from "../components/CTA";
import Navbar from "../components/Navbar";
import SoftBackdrop from "../components/SoftBackdrop";
import Footer from "../components/Footer";
import LenisScroll from "../components/lenis";

export default function Home() {
  return (
    <>
      <SoftBackdrop />
      <LenisScroll />
      <Navbar />
      <Hero />
      <Features />
      <Faq />
      <Footer />
    </>
  );
}
