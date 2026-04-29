import { motion } from 'framer-motion';
import { Terminal, Sparkles } from 'lucide-react';

export default function Hero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-8 max-w-4xl mx-auto px-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="inline-flex items-center space-x-3 bg-[#00ff88]/10 text-[#00ff88] px-6 py-2 rounded-full"
      >
        <Terminal className="w-5 h-5" />
        <span>Welcome to the future of coding education</span>
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent 
                   bg-gradient-to-r from-[#00ff88] to-[#00ffff]"
      >
        Learn to Code, Compile & Master Programming
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-xl text-white/70"
      >
        Experience the most immersive and interactive way to learn programming
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-center space-x-4"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-3 bg-[#00ff88] text-black font-semibold rounded-lg
                     flex items-center space-x-2 shadow-[0_0_30px_rgba(0,255,136,0.3)]"
        >
          <Sparkles className="w-5 h-5" />
          <span>Start Learning</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}