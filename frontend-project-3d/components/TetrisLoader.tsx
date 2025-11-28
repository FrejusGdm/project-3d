"use client";

import { motion } from "framer-motion";

export function TetrisLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
      <div className="grid grid-cols-2 gap-1 w-12 h-12 rotate-45">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="w-full h-full bg-black dark:bg-white rounded-sm"
            initial={{ opacity: 0.2, scale: 0.8 }}
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1, 0.8] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <div className="absolute mt-24 font-mono text-xs tracking-widest uppercase animate-pulse">
        Forging Model...
      </div>
    </div>
  );
}

