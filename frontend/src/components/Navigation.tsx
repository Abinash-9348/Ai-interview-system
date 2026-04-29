import { motion } from 'framer-motion';
import { Code2, BookOpen, Terminal, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', name: 'Home', icon: Home },
  // { path: '/lessons', name: 'Lessons', icon: BookOpen },
  { path: '/code', name: 'Code', icon: Terminal },
];

export default function Navigation() {
  const location = useLocation();

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-[#00ff88]/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Code2 className="w-8 h-8 text-[#00ff88]" />
            <span className="ml-2 text-xl font-bold text-[#00ff88]">Cloud IDE</span>
          </div>
          
          <div className="flex space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all
                  ${location.pathname === item.path
                    ? 'bg-[#00ff88]/20 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}