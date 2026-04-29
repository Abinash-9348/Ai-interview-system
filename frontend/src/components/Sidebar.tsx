import { motion } from 'framer-motion';
import { Code2, Coffee, ChevronLeft } from 'lucide-react';
import { useState } from 'react';

const languages = [
  { name: 'JavaScript', icon: Coffee, content: '// JavaScript basics...' },
];

interface SidebarProps {
  onLanguageSelect: (content: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ onLanguageSelect, isOpen, onToggle }: SidebarProps) {
  const [selectedLang, setSelectedLang] = useState(languages[0].name);

  return (
    <>
      <motion.div
        initial={false}
        animate={{ 
          x: isOpen ? 0 : -256,
          width: isOpen ? 256 : 0
        }}
        className="fixed left-0 top-0 bottom-0 bg-black/50 backdrop-blur-xl border-r border-[#00ff88]/20 overflow-hidden z-40"
      >
        <div className="p-4 space-y-6">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center space-x-3">
              <Code2 className="w-8 h-8 text-[#00ff88]" />
              <h1 className="text-[#00ff88] text-xl font-bold">DevStation</h1>
            </div>
          </div>
          
          <nav className="space-y-2">
            {languages.map((lang) => (
              <motion.button
                key={lang.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedLang(lang.name);
                  onLanguageSelect(lang.content);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg 
                         transition-all duration-200
                         ${selectedLang === lang.name 
                           ? 'text-white bg-[#00ff88]/20 border-[#00ff88]/40 shadow-[0_0_15px_rgba(0,255,136,0.2)]' 
                           : 'text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border-[#00ff88]/20 hover:border-[#00ff88]/40'}
                         border
                         hover:shadow-[0_0_15px_rgba(0,255,136,0.1)]`}
              >
                <lang.icon className="w-5 h-5" />
                <span>{lang.name}</span>
              </motion.button>
            ))}
          </nav>
        </div>
      </motion.div>
      
      <button
        onClick={onToggle}
        className={`fixed top-20 ${isOpen ? 'left-64' : 'left-0'} z-50 p-2 bg-black/50 backdrop-blur-xl border border-[#00ff88]/20 rounded-r-lg transition-all duration-300`}
      >
        <ChevronLeft className={`w-5 h-5 text-[#00ff88] transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} />
      </button>
    </>
  );
}