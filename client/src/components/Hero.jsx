import { ArrowRightIcon, PlayIcon, ZapIcon, CheckIcon } from "lucide-react";
import { PrimaryButton, GhostButton } from "./Buttons";
import { motion } from "framer-motion";
import { Show, SignUpButton } from "@clerk/react";
import RepositoryInput from "./RepositoryInput";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Hero() {
  const navigate = useNavigate();

  const mainImageUrl =
    "https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?q=80&w=1600&auto=format&fit=crop";

  const galleryStripImages = [
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=100",
    "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=100",
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=100",
  ];

  const handleAnalyze = (repoUrl) => {
    navigate("/onboard", {
      state: {
        mode: "new",
        repoUrl,
      },
    });
  };

  return (
    <>
      <section id="home" className="relative z-10">
        <div className="max-w-6xl mx-auto px-4 min-h-screen max-md:w-screen max-md:overflow-hidden pt-32 md:pt-26 flex items-center justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="text-left">
              <motion.h1
                className="text-4xl md:text-5xl font-bold leading-tight mb-6 max-w-xl"
                initial={{ y: 60, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 70,
                  mass: 1,
                  delay: 0.1,
                }}
              >
                Understand your codebase <br />
                <span className="bg-clip-text text-transparent bg-linear-to-r from-indigo-300 to-indigo-400">
                  like never before
                </span>
              </motion.h1>

              <motion.p
                className="text-gray-300 max-w-lg mb-8"
                initial={{ y: 60, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 70,
                  mass: 1,
                  delay: 0.2,
                }}
              >
                Your AI-powered codebase assistant. Connect your GitHub
                repository, explore complex code, and get instant, context-aware
                answers with the power of Retrieval-Augmented Generation.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row items-center gap-4 mb-8"
                initial={{ y: 60, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 70,
                  mass: 1,
                  delay: 0.3,
                }}
              >
                <Show when="signed-out">
                  <SignUpButton mode="modal">
                    <PrimaryButton className="max-sm:w-full py-3 px-7">
                      Get Started
                      <ArrowRightIcon className="size-4" />
                    </PrimaryButton>
                  </SignUpButton>
                </Show>

                <Show when="signed-in">
                  <RepositoryInput onAnalyze={handleAnalyze} />
                </Show>
              </motion.div>

              <motion.div
                className="flex sm:inline-flex overflow-hidden items-center max-sm:justify-center text-sm text-gray-200 bg-white/10 rounded"
                initial={{ y: 60, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 70,
                  mass: 1,
                  delay: 0.1,
                }}
              >
                <div className="flex items-center gap-2 p-2 px-3 sm:px-6.5 hover:bg-white/3 transition-colors">
                  <ZapIcon className="size-4 text-sky-500" />
                  <div>
                    <div>AI-powered code intelligence</div>
                    <div className="text-xs text-gray-400">
                      Understand code faster
                    </div>
                  </div>
                </div>

                <div className="hidden sm:block h-6 w-px bg-white/6" />

                <div className="flex items-center gap-2 p-2 px-3 sm:px-6.5 hover:bg-white/3 transition-colors">
                  <CheckIcon className="size-4 text-cyan-500" />
                  <div>
                    <div>Seamless GitHub integration</div>
                    <div className="text-xs text-gray-400">
                      Your entire codebase, connected
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right: modern mockup card */}
            <motion.div
              className="mx-auto w-full max-w-lg"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                type: "spring",
                stiffness: 250,
                damping: 70,
                mass: 1,
                delay: 0.5,
              }}
            >
              <motion.div className="rounded-3xl overflow-hidden border border-white/6 shadow-2xl bg-linear-to-b from-black/50 to-transparent">
                <div className="relative aspect-16/10 bg-gray-900">
                  <img
                    src={mainImageUrl}
                    alt="agency-work-preview"
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
