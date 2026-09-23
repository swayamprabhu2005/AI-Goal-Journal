import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_WORDS = [
  "structured momentum.",
  "7-day habit streaks.",
  "goal progress clarity.",
  "automated coaching.",
];

export default function WordRotator({ words = DEFAULT_WORDS, duration = 2800 }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, duration);
    return () => clearInterval(timer);
  }, [words.length, duration]);

  return (
    <span className="inline-block relative h-[1.2em] overflow-hidden align-bottom text-indigo-600 font-extrabold px-1">
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block whitespace-nowrap bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
