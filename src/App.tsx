/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  ChevronRight, 
  Compass, 
  Cpu, 
  Globe, 
  Home, 
  Lock, 
  Moon, 
  Newspaper, 
  Search, 
  Sun, 
  TrendingUp, 
  User,
  Menu,
  X,
  Share2,
  Bookmark,
  Mail,
  Key,
  Plus,
  PlusCircle,
  CheckCircle2,
  Circle,
  Trash2,
  Loader2,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Upload,
  Calendar,
  Zap,
  ArrowUpRight,
  ArrowRight,
  MessageCircle,
  MessageSquare,
  Send,
  Bot,
  Activity,
  Rss,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import { formatDistanceToNow } from 'date-fns';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  getDoc,
  where,
  limit
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { askAboutNews } from './services/aiService';

// --- Types ---
type Category = 'All' | 'Tech' | 'Gaming' | 'Science' | 'World' | 'Future' | 'Culture';

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  isAdmin: boolean;
  createdAt: any;
}

interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: Category;
  imageUrl: string;
  author: string;
  createdAt: any;
  isTrending?: boolean;
  status: 'pending' | 'approved' | 'rejected';
  sources?: { name: string; url: string }[];
  readTime?: string;
}

interface UserPreference {
  categories: Category[];
  updatedAt: any;
}

interface ReadingProgress {
  articleId: string;
  articleTitle?: string;
  lastLineRead: number;
  totalLines: number;
  isCompleted: boolean;
  updatedAt: any;
}

interface Comment {
  id: string;
  articleId: string;
  userId: string;
  userName: string;
  userPhoto: string;
  text: string;
  createdAt: any;
}

interface DailyStats {
  chatCount: number;
  updatedAt: any;
}

// --- Initial News (for seed/empty state) ---
const INITIAL_ARTICLES: Partial<Article>[] = [
  {
    title: 'The Silicon Renaissance: Biocomputing Takes Hold',
    summary: 'Neural-link interfaces are no longer science fiction. BrieflyX explores the new dawn of wetware.',
    content: 'The boundaries between biology and technology are dissolving. Latest trials in Zurich show neural-link interfaces achieving sub-millisecond latency. \nThis represents a paradigm shift in how we interact with pure information. \nNo longer are we limited by the tactile feedback of glass and metal. \nWe are entering an era of direct memory injection and cloud-linked consciousness. \nCritics warn of the "digital divide" becoming an evolutionary split. \nYet, the first generation of "Enhanced" individuals are already reporting processing speeds ten times higher than average.',
    category: 'Tech',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop',
    author: 'BrieflyX Editorial',
    isTrending: true,
    status: 'approved',
    sources: [
      { name: 'Zurich Neural Institute', url: 'https://example.com/zurich' },
      { name: 'Wetware Weekly', url: 'https://example.com/wetware' }
    ]
  },
  {
    title: 'Neon Streets: The Rise of Cyber-Cities',
    summary: 'Urban sprawl is evolving into vertical ecosystems. How architecture is adapting to the 22nd century.',
    content: 'The traditional horizontal city is dead. Vertical ecosystems are the new standard for urban survival. \nIn the New Shanghai sector, cloud-piercing structures now house entire micro-economies. \nHydroponic farms occupy middle floors, while low-income housing is integrated with geothermal tap-points. \nThis design philosophy minimizes the ecological footprint while maximizing human density. \nHowever, the upper atmosphere residents rarely see the "surface," creating a new class based on altitude. \nWind turbine windows and solar-skin facades provide 100% renewable energy for these monolithic towers.',
    category: 'World',
    imageUrl: 'https://images.unsplash.com/photo-1545143333-636a666418ce?q=80&w=800&auto=format&fit=crop',
    author: 'Dr. Sora Vane',
    isTrending: false,
    status: 'approved',
    sources: [
      { name: 'Urban Evolution Journal', url: 'https://example.com/urban' },
      { name: 'Shanghai Tech Daily', url: 'https://example.com/shanghai' }
    ]
  },
  {
    title: 'Quantum Entanglement: Communication at Zero Latency',
    summary: 'Breaking the speed of light barrier. Recent breakthroughs in quantum relay stations.',
    content: 'The speed of light is no longer the speed limit of information. \nA joint venture between NASA and the Tokyo Institute of Technology has successfully demonstrated stable quantum entanglement over a distance of 1.2 million kilometers. \nThis means instantaneous data transfer across our entire solar system is now within reach. \nThe implications for deep space exploration and interplanetary colonization are staggering. \nImagine controlling a rover on Europa with zero delay, or streaming the data-streams of Mars-Net as if you were on the surface.',
    category: 'Science',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop',
    author: 'Nexus Science Bureau',
    isTrending: true,
    status: 'approved',
    sources: [
      { name: 'NASA Deep Space', url: 'https://example.com/nasa' },
      { name: 'Quantum Physics Review', url: 'https://example.com/quantum' }
    ]
  }
];

// --- Components ---

// --- Components ---

const ExchangeTicker = ({ isDarkMode }: { isDarkMode: boolean }) => {
  const [rates, setRates] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();
        setRates(data.rates);
      } catch (error) {
        console.error('Failed to fetch rates', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
    const interval = setInterval(fetchRates, 300000); // 5 mins
    return () => clearInterval(interval);
  }, []);

  if (loading || !rates) return null;

  const pairs = [
    { label: 'EUR/USD', value: (1 / rates.EUR).toFixed(4) },
    { label: 'GBP/USD', value: (1 / rates.GBP).toFixed(4) },
    { label: 'JPY/USD', value: (1 / rates.JPY).toFixed(4) },
    { label: 'AUD/USD', value: (1 / rates.AUD).toFixed(4) },
    { label: 'CAD/USD', value: (1 / rates.CAD).toFixed(4) },
    { label: 'CHF/USD', value: (1 / rates.CHF).toFixed(4) },
  ];

  return (
    <div className={`fixed top-0 left-0 right-0 z-[60] h-6 flex items-center overflow-hidden border-b transition-colors duration-500 uppercase font-bold ${
      isDarkMode ? 'bg-black/90 border-white/10 backdrop-blur-md' : 'bg-white/90 border-black/10 backdrop-blur-md'
    }`}>
      <motion.div 
        animate={{ x: [0, -2000] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="flex gap-12 items-center whitespace-nowrap pl-[100%]"
      >
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex gap-12">
            {pairs.map(pair => (
              <div key={pair.label} className="flex items-center gap-3">
                <span className={`text-[9px] font-black tracking-[0.2em] italic text-primary`}>{pair.label}</span>
                <span className={`text-[10px] font-mono leading-none ${isDarkMode ? 'text-white/80' : 'text-black/80'}`}>{pair.value}</span>
                <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
              </div>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

const Navbar = ({ isDarkMode, toggleTheme, activeView, onNavigate, isLoggedIn, openAuth, isAdmin, searchQuery, setSearchQuery }: any) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-6 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled ? 'py-4' : 'py-8'
    }`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className={`rounded-3xl border transition-all duration-500 px-8 py-4 flex items-center gap-4 justify-between ${
          isDarkMode 
            ? 'glass-dark glow-blue border-white/5' 
            : 'glass shadow-2xl border-black/5'
        }`}>
          <div 
            className="flex items-center gap-4 cursor-pointer group shrink-0"
            onClick={() => onNavigate('home')}
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-2xl group-hover:glow-blue transition-all group-active:scale-95 relative z-10">
                <Activity size={24} className="group-hover:animate-pulse" />
              </div>
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className={`text-xl hidden lg:block font-black tracking-tighter uppercase leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>Neural<br /><span className="text-primary italic">Nexus.</span></span>
            </div>
          </div>

          <div className="flex-1 max-w-md hidden md:block group relative">
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${searchQuery ? 'text-primary' : 'opacity-40'}`}>
              <Search size={18} />
            </div>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH NEURAL NEXUS..."
              className={`w-full pl-14 pr-10 py-3.5 rounded-[1.5rem] text-[10px] font-black tracking-widest transition-all outline-none border ${
                isDarkMode 
                  ? 'bg-white/[0.03] border-white/5 focus:bg-white/[0.08] focus:border-primary/50 text-white placeholder:text-white/40' 
                  : 'bg-black/[0.03] border-black/5 focus:bg-white focus:border-primary/30 shadow-sm text-black placeholder:text-black/40'
              }`}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 hover:opacity-100 transition-opacity p-2 hover:bg-black/10 rounded-lg"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <NavLink label="Feed" onClick={() => onNavigate('feed')} active={activeView === 'feed'} isDarkMode={isDarkMode} />
            <NavLink label="About Us" onClick={() => onNavigate('about')} active={activeView === 'about'} isDarkMode={isDarkMode} />
            
            {isLoggedIn && isAdmin && (
              <NavLink label="Admin Center" onClick={() => onNavigate('admin')} active={activeView === 'admin'} isDarkMode={isDarkMode} />
            )}

            <div className="h-4 w-px bg-current opacity-10 mx-2" />
            <button 
              onClick={toggleTheme}
              className={`p-3 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/5 text-yellow-400' : 'hover:bg-black/5 text-primary'}`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {!isLoggedIn ? (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openAuth}
                className="ml-4 px-10 py-3.5 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] text-[10px] glow-blue shadow-xl transition-all"
              >
                Authenticate
              </motion.button>
            ) : (
               <button 
                onClick={() => onNavigate('profile')}
                className={`ml-2 px-6 py-3 rounded-xl border font-black text-xs uppercase tracking-widest transition-all ${
                  activeView === 'profile' 
                    ? 'bg-primary border-primary text-white glow-blue' 
                    : isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'
                }`}
              >
                Profile
              </button>
            )}
          </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-4">
          <button onClick={toggleTheme} className={`p-3 rounded-xl ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`p-3 rounded-xl ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </div>

    <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className={`absolute top-full left-0 right-0 mt-4 rounded-3xl border p-6 md:hidden ${
              isDarkMode ? 'glass-dark glow-blue border-white/10' : 'glass shadow-2xl border-black/5'
            }`}
          >
            <div className="flex flex-col gap-4 items-center">
              <div className="w-full relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${searchQuery ? 'text-primary' : 'opacity-20'}`}>
                  <Search size={16} />
                </div>
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Neural Search..."
                  className={`w-full pl-12 pr-10 py-4 rounded-2xl text-xs font-bold transition-all outline-none border ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/5 focus:bg-white/10 focus:border-primary/50 text-white placeholder:text-white/20' 
                      : 'bg-black/5 border-black/5 focus:bg-white focus:border-primary/30 shadow-sm text-black placeholder:text-black/20'
                  }`}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <NavLink label="Feed" onClick={() => { onNavigate('feed'); setIsMenuOpen(false); }} active={activeView === 'feed'} isDarkMode={isDarkMode} />
              <NavLink label="About Us" onClick={() => { onNavigate('about'); setIsMenuOpen(false); }} active={activeView === 'about'} isDarkMode={isDarkMode} />
              <NavLink label="Contact Us" onClick={() => { onNavigate('contact'); setIsMenuOpen(false); }} active={activeView === 'contact'} isDarkMode={isDarkMode} />
              {isLoggedIn && (
                <>
                  {isAdmin && <NavLink label="Admin Center" onClick={() => { onNavigate('admin'); setIsMenuOpen(false); }} active={activeView === 'admin'} isDarkMode={isDarkMode} />}
                  <NavLink label="My Identity" onClick={() => { onNavigate('profile'); setIsMenuOpen(false); }} active={activeView === 'profile'} isDarkMode={isDarkMode} />
                </>
              )}
              {!isLoggedIn && <button onClick={openAuth} className="w-full py-4 rounded-xl bg-blue-500 text-white font-black uppercase tracking-widest glow-blue mt-4">Access Terminal</button>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const NavLink = ({ label, onClick, active, isDarkMode }: { label: string, onClick: () => void, active?: boolean, isDarkMode?: boolean }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative group ${
      active 
        ? 'text-primary text-glow-blue' 
        : `opacity-40 hover:opacity-100 ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`
    }`}
  >
    {label}
    <span className={`absolute -bottom-1 left-4 right-4 h-0.5 bg-primary shadow-[0_0_8px_rgba(37,99,237,0.5)] transition-all duration-300 ${active ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0 group-hover:scale-x-50 group-hover:opacity-50'}`} />
  </button>
);

const CategoryBar = ({ 
  categories, 
  activeCategory, 
  setActiveCategory, 
  isDarkMode 
}: { 
  categories: Category[], 
  activeCategory: Category, 
  setActiveCategory: (c: Category) => void,
  isDarkMode: boolean
}) => {
  return (
    <div className="overflow-x-auto no-scrollbar py-4 -mx-4 px-4 sticky top-18 z-40 bg-inherit/40 backdrop-blur-md">
      <div className="flex gap-3 max-w-7xl mx-auto md:px-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all duration-300 border ${
              activeCategory === cat
                ? 'bg-primary border-primary text-white shadow-lg glow-blue'
                : isDarkMode 
                  ? 'border-white/10 hover:border-white/30 text-white/70 hover:text-white'
                  : 'border-black/5 hover:border-black/20 text-black/60 hover:text-black'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};

const Footer = ({ onNavigate, isDarkMode }: { onNavigate: (v: any) => void, isDarkMode: boolean }) => (
  <footer className={`py-20 border-t ${isDarkMode ? 'bg-black border-white/5' : 'bg-white border-black/5'} transition-colors duration-500`}>
    <div className="max-w-7xl mx-auto px-6 md:px-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div 
            className="flex items-center gap-2 cursor-pointer group w-fit"
            onClick={() => onNavigate('home')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg group-hover:glow-blue transition-all">
              <Newspaper size={22} />
            </div>
            <span className="text-2xl font-black tracking-tight uppercase">Briefly<span className="text-blue-500 italic">X</span></span>
          </div>
          <p className="text-sm opacity-40 font-medium max-w-sm">Synthesizing global frequencies into pure neural signals. Join the evolution of news today.</p>
        </div>
        
        <div className="space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Protocol</h4>
          <ul className="space-y-3">
            <li><button onClick={() => onNavigate('home')} className="text-sm font-bold opacity-60 hover:opacity-100 hover:text-blue-500 transition-all uppercase tracking-widest text-xs">Home</button></li>
            <li><button onClick={() => onNavigate('about')} className="text-sm font-bold opacity-60 hover:opacity-100 hover:text-blue-500 transition-all uppercase tracking-widest text-xs">About Us</button></li>
            <li><button onClick={() => onNavigate('contact')} className="text-sm font-bold opacity-60 hover:opacity-100 hover:text-blue-500 transition-all uppercase tracking-widest text-xs">Contact</button></li>
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Frequency</h4>
          <ul className="space-y-3">
            <li><button className="text-sm font-bold opacity-60 hover:opacity-100 hover:text-blue-500 transition-all uppercase tracking-widest text-xs">Twitter / X</button></li>
            <li><button className="text-sm font-bold opacity-60 hover:opacity-100 hover:text-blue-500 transition-all uppercase tracking-widest text-xs">Nexus Telegram</button></li>
            <li><button className="text-sm font-bold opacity-60 hover:opacity-100 hover:text-blue-500 transition-all uppercase tracking-widest text-xs">GitHub Nexus</button></li>
          </ul>
        </div>
      </div>
      
      <div className="pt-10 border-t border-current opacity-10 flex flex-col md:flex-row justify-between gap-4">
        <p className="text-[10px] font-black uppercase tracking-widest">© 2026 BrieflyX Terminal. All signals reserved.</p>
        <p className="text-[10px] font-black uppercase tracking-widest">Protocol Version 4.2.0-STABLE</p>
      </div>
    </div>
  </footer>
);

const SkeletonCard = ({ isDarkMode }: any) => (
  <div className={`overflow-hidden rounded-[2rem] border animate-pulse ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
    <div className="aspect-[16/10] bg-gray-400/20" />
    <div className="p-8 space-y-4">
      <div className="flex gap-4">
        <div className="w-20 h-2 bg-gray-400/20 rounded-full" />
        <div className="w-24 h-2 bg-gray-400/20 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="w-full h-4 bg-gray-400/30 rounded-lg" />
        <div className="w-3/4 h-4 bg-gray-400/30 rounded-lg" />
      </div>
      <div className="space-y-1">
        <div className="w-full h-2 bg-gray-400/10 rounded-full" />
        <div className="w-full h-2 bg-gray-400/10 rounded-full" />
      </div>
    </div>
  </div>
);

const SkeletonTrendingCard = ({ isDarkMode }: any) => (
  <div className={`p-6 rounded-3xl border animate-pulse ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
    <div className="space-y-4">
      <div className="w-12 h-2 bg-primary/20 rounded-full" />
      <div className="space-y-1">
        <div className="w-full h-4 bg-gray-400/20 rounded-lg" />
        <div className="w-2/3 h-4 bg-gray-400/20 rounded-lg" />
      </div>
      <div className="flex justify-between items-center pt-4 border-t border-white/5">
        <div className="w-16 h-2 bg-gray-400/10 rounded-full" />
        <div className="w-4 h-4 bg-gray-400/10 rounded-full" />
      </div>
    </div>
  </div>
);

const ArticleCard = ({ 
  article, 
  isDarkMode, 
  onClick,
  progress
}: any) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const percentage = progress ? Math.min(100, Math.round(((progress.lastLineRead + 1) / progress.totalLines) * 100)) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -12, scale: 1.02, boxShadow: isDarkMode ? '0 0 50px -10px rgba(59,130,246,0.3)' : '0 20px 40px -10px rgba(0,0,0,0.1)' }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(article)}
      className={`group relative overflow-hidden rounded-[2.5rem] cursor-pointer transition-all duration-500 border ${
        isDarkMode 
          ? 'bg-white/[0.03] border-white/5 hover:border-primary/50' 
          : 'bg-white border-black/5 hover:border-primary/30 shadow-sm'
      }`}
    >
      <div className="aspect-[1.5] overflow-hidden relative">
        <motion.img 
          initial={{ opacity: 0 }}
          animate={{ opacity: imageLoaded ? 1 : 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          src={article.imageUrl} 
          alt={article.title} 
          onLoad={() => setImageLoaded(true)}
          className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        {!imageLoaded && (
          <div className="absolute inset-0 bg-current/5 animate-pulse" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-700" />
        
        {/* Technical HUD Overlay */}
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white/80">Signal Active</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-primary/30 backdrop-blur-md border border-primary/30 text-primary text-[8px] font-black uppercase tracking-widest">
            {article.category}
          </span>
        </div>

        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0 text-white z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white">
            <ArrowRight size={24} />
          </div>
        </div>

        {/* Progress indicator for logged in users */}
        {progress && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full ${percentage >= 100 ? 'bg-green-500' : 'bg-primary'} glow-blue`}
            />
          </div>
        )}
      </div>
      
      <div className="p-8 space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[9px] uppercase font-black tracking-[0.2em] opacity-70">
              <span className="text-primary italic"># {article.author}</span>
              <span className="w-1 h-1 rounded-full bg-current" />
              <span>5m UPLINK</span>
            </div>
            {progress && (
              <span className={`text-[9px] font-black tracking-widest uppercase italic ${percentage >= 100 ? 'text-green-500' : 'text-primary opacity-80'}`}>
                {percentage}% ANALYZED
              </span>
            )}
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tighter leading-tight italic group-hover:text-primary transition-colors">
            {article.title}
          </h3>
        </div>
        
        <p className="text-sm opacity-70 line-clamp-2 leading-relaxed font-medium italic">
          {article.summary}
        </p>

        <div className="pt-4 border-t border-current opacity-20 flex items-center justify-between">
           <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
             {article.createdAt?.toDate ? article.createdAt.toDate().toLocaleDateString() : 'Nexus Sync'}
           </span>
           <div className="flex -space-x-2">
             {[1,2,3].map(i => (
               <div key={i} className="w-6 h-6 rounded-lg border-2 border-background bg-primary/10 overflow-hidden">
                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`} className="w-full h-full object-cover" />
               </div>
             ))}
           </div>
        </div>
      </div>
    </motion.div>
  );
};

const CommentsSection = ({ articleId, isDarkMode, user, openAuth }: { articleId: string, isDarkMode: boolean, user: FirebaseUser | null, openAuth: () => void }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'comments'),
      where('articleId', '==', articleId),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      // Sort client-side to avoid composite index requirement
      data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setComments(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'comments');
    });

    return () => unsubscribe();
  }, [articleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuth();
      return;
    }
    if (!text.trim() || loading) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'comments'), {
        articleId,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Unknown synthesizer',
        userPhoto: user.photoURL || '',
        text: text.trim(),
        createdAt: serverTimestamp()
      });
      setText('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'comments');
      alert('Failed to transmit feedback. Signal interference.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Purge this neural feedback signal?')) return;
    try {
      await deleteDoc(doc(db, `comments/${commentId}`));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `comments/${commentId}`);
      alert('Failed to purge feedback. Neural link rejected.');
    }
  };

  return (
    <section className={`mt-20 p-8 md:p-12 rounded-[3.5rem] border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
      <div className="flex items-center gap-4 mb-12">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg glow-blue">
          <MessageSquare size={24} />
        </div>
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tighter italic">Neural Feedback Layer</h3>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Frequency Modulation: {comments.length} Signals</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-16 relative group">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? "Input neural feedback signal..." : "Initialize identity to broadcast feedback..."}
          className={`w-full p-8 pb-20 rounded-[2rem] border resize-none focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all duration-500 font-medium ${
            isDarkMode 
              ? 'bg-black border-white/10 text-white placeholder:text-white/20' 
              : 'bg-white border-black/10 text-black placeholder:text-black/20 shadow-sm'
          }`}
          rows={3}
          onClick={() => !user && openAuth()}
        />
        <div className="absolute bottom-6 left-8 right-8 flex items-center justify-between">
           <div className="flex items-center gap-2">
             {user && (
               <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-primary">Uplink Active</span>
               </div>
             )}
           </div>
           <div className="flex items-center gap-4">
             {loading && <Loader2 className="animate-spin text-primary" size={20} />}
             <motion.button 
              type="submit" 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading || !text.trim()}
              className="px-10 py-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-black uppercase tracking-widest text-xs hover:glow-blue transition-all disabled:opacity-30 shadow-xl"
            >
              Broadcast Signal
            </motion.button>
          </div>
        </div>
      </form>

      <div className="space-y-10">
        <AnimatePresence mode="popLayout">
          {comments.map((comment, i) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, x: -30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={`flex gap-6 p-8 rounded-3xl border transition-all hover:bg-primary/5 ${
                isDarkMode ? 'border-white/5 bg-white/[0.02]' : 'border-black/5 bg-black/[0.02]'
              }`}
            >
              <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="shrink-0">
                <img 
                  src={comment.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userId}`} 
                  className="w-14 h-14 rounded-2xl bg-primary/20 object-cover shadow-lg border-2 border-primary/20"
                />
              </motion.div>
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black uppercase tracking-widest text-primary italic">{comment.userName}</span>
                    <div className="w-1 h-1 rounded-full bg-current opacity-20" />
                    <span className="text-[9px] opacity-40 font-black uppercase tracking-widest">
                      {comment.createdAt?.toDate ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'Neural Syncing...'}
                    </span>
                  </div>
                  {(user?.uid === comment.userId || (user?.email === 'gawesh.bwela@gmail.com')) && (
                    <button 
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-500/10 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p className="text-base font-medium leading-relaxed opacity-70 italic">"{comment.text}"</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {comments.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 opacity-30 flex flex-col items-center gap-4"
          >
            <Bot size={48} strokeWidth={1} />
            <span className="text-[10px] font-black uppercase tracking-[0.5em]">No neural feedback signals detected in this sector.</span>
          </motion.div>
        )}
      </div>
    </section>
  );
};

const ArticlePage = ({ 
  article, 
  isDarkMode, 
  isLoggedIn,
  openAuth,
  progress,
  onProgressUpdate,
  user,
  dailyStats
}: { 
  article: Article, 
  isDarkMode: boolean, 
  isLoggedIn: boolean,
  openAuth: () => void,
  progress?: ReadingProgress,
  onProgressUpdate: (line: number, total: number) => void,
  user: FirebaseUser | null,
  dailyStats: DailyStats | null
}) => {
  const lines = article.content.split('\n').filter(l => l.trim() !== '');
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto"
    >
      <ChatWidget article={article} isDarkMode={isDarkMode} user={user} dailyStats={dailyStats} />
      <div className="relative aspect-[21/9] rounded-[4rem] overflow-hidden mb-20 group border border-current opacity-20">
        <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover transition-transform duration-[3s] ease-out group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
        <div className="absolute inset-0 flex flex-col justify-end p-16 md:p-24 space-y-6">
          <div className="flex items-center gap-3">
            <div className="px-4 py-1.5 rounded-full bg-primary/20 backdrop-blur-xl border border-primary/30 text-primary text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(59,130,246,0.5)]">
              {article.category}
            </div>
            <div className="px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">
              {article.readTime || '5m'} Sync
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-[0.9] uppercase tracking-tighter italic drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] max-w-4xl">{article.title}</h1>
        </div>
      </div>

      <div className="space-y-20 mb-32 relative">
        {/* Animated Reading Progress Sidebar */}
        <div className="hidden lg:block absolute -left-32 top-0 h-full">
          <div className="sticky top-48 space-y-4">
             <div className="w-px h-64 bg-current opacity-10 mx-auto" />
             <div className="text-[10px] font-black uppercase tracking-[0.5em] writing-vertical text-primary rotate-180 py-8 italic">Signal Intensity: 100%</div>
             <div className="w-px h-64 bg-current opacity-10 mx-auto" />
          </div>
        </div>

        <motion.p 
          className="text-2xl md:text-3xl font-medium opacity-70 leading-tight border-l-8 border-primary pl-10 italic max-w-3xl"
        >
          {article.summary}
        </motion.p>

        <div className="space-y-4">
          {lines.map((line, index) => {
            const isRead = progress ? index <= progress.lastLineRead : false;
            const isCurrent = progress ? index === progress.lastLineRead + 1 : index === 0;

            return (
              <motion.p
                key={index}
                onClick={() => isLoggedIn && onProgressUpdate(index, lines.length)}
                initial={false}
                animate={{ 
                  opacity: isRead ? 0.2 : (isCurrent ? 1 : 0.6),
                  x: isCurrent ? 20 : 0
                }}
                whileHover={{ 
                  x: 30,
                  opacity: 1,
                }}
                className={`text-xl md:text-2xl font-medium leading-relaxed p-8 rounded-[2.5rem] cursor-pointer transition-all border duration-500 italic ${
                  isCurrent 
                    ? 'bg-primary/10 border-primary/30 text-primary shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)]' 
                    : 'border-transparent hover:bg-current/[0.03]'
                } ${!isLoggedIn && index > 2 ? 'blur-xl select-none opacity-20' : ''}`}
              >
                {line}
              </motion.p>
            );
          })}
        </div>

        {article.sources && article.sources.length > 0 && (
          <div className={`p-8 rounded-[2rem] border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="text-primary" size={24} />
              <h3 className="text-lg font-black uppercase tracking-widest">Trusted Neural Sources</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {article.sources.map((src, i) => (
                <a 
                  key={i} 
                  href={src.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    isDarkMode ? 'bg-white/5 border-white/10 hover:border-primary/50' : 'bg-black/5 border-black/10 hover:border-primary/30 shadow-sm'
                  }`}
                >
                  <span className="text-sm font-bold uppercase tracking-tight">{src.name}</span>
                  <ArrowUpRight size={16} className="text-primary" />
                </a>
              ))}
            </div>
          </div>
        )}

        {!isLoggedIn && (
          <div className="p-12 rounded-[3rem] bg-blue-500 border border-blue-500/20 text-center shadow-2xl glow-blue">
            <Lock size={48} className="mx-auto mb-6 text-white" />
            <h2 className="text-3xl font-black mb-4 uppercase">Identity Required</h2>
            <p className="text-white/80 font-bold mb-8 max-w-sm mx-auto">This signal is encrypted. Connect your identity to decrypt the full transmission and track your interaction index.</p>
            <button onClick={openAuth} className="px-10 py-5 rounded-2xl bg-white text-blue-500 font-black uppercase tracking-widest hover:scale-105 transition-all">Initialize Access</button>
          </div>
        )}
        
        <CommentsSection 
          articleId={article.id} 
          isDarkMode={isDarkMode} 
          user={user} 
          openAuth={openAuth} 
        />
      </div>
    </motion.div>
  );
};

const AdminDashboard = ({ articles, users, isDarkMode, user, loadingData }: { articles: Article[], users: any[], isDarkMode: boolean, user: FirebaseUser, loadingData: boolean }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [viewMode, setViewMode] = useState<'articles' | 'users'>('articles');
  const [editing, setEditing] = useState<Article | null>(null);
  
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Category>('Tech');
  const [imageUrl, setImageUrl] = useState('');
  const [isTrending, setIsTrending] = useState(false);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [sources, setSources] = useState<{ name: string; url: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setSummary(editing.summary);
      setContent(editing.content);
      setCategory(editing.category);
      setImageUrl(editing.imageUrl);
      setIsTrending(editing.isTrending || false);
      setStatus(editing.status || 'pending');
      setSources(editing.sources || []);
      setShowAdd(true);
    } else {
      setTitle(''); setSummary(''); setContent(''); setCategory('Tech'); setImageUrl(''); setIsTrending(false); setStatus('pending'); setSources([]);
    }
  }, [editing]);

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate sources
    const invalidSources = sources.filter(s => s.url && !isValidUrl(s.url));
    if (invalidSources.length > 0) {
      alert(`Invalid URL detected: ${invalidSources[0].url}. All sources must be valid URLs.`);
      return;
    }

    setLoading(true);
    const data = {
      title, summary, content, category, imageUrl,
      isTrending,
      status,
      sources,
      author: 'BrieflyX Admin',
      createdAt: editing ? editing.createdAt : serverTimestamp()
    };

    try {
      if (editing) {
        await updateDoc(doc(db, `articles/${editing.id}`), data);
      } else {
        await addDoc(collection(db, 'articles'), data);
      }
      setShowAdd(false);
      setEditing(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'articles');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    try {
      await updateDoc(doc(db, `articles/${id}`), { status: newStatus });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'articles');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Dissolve this signal permanently?')) return;
    try {
      await deleteDoc(doc(db, `articles/${id}`));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'articles');
      alert('Failed to dissolve signal. Check terminal permissions.');
    }
  };

  const handleReset = async () => {
    if (!confirm('This will purge all neural signals and re-initialise from baseline. Proceed?')) return;
    try {
      setLoading(true);
      for (const art of articles) {
        await deleteDoc(doc(db, `articles/${art.id}`));
      }
      // Re-seeding will be handled by the App useEffect as articles.length becomes 0
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'articles');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePulse = async () => {
    setLoading(true);
    try {
      const mockSignals = [
        { title: "Neural Expansion detected in Sector 7", category: "Future" as Category, summary: "Automated scan detected anomalous neural growth." },
        { title: "Quantum Packet Loss at Lunar Hub", category: "Science" as Category, summary: "Diagnostic systems reporting intermittent packet drops." },
        { title: "Culture Flux: Neo-Cyberpunk Revival", category: "Culture" as Category, summary: "Trend cycles showing massive shift towards 2077 aesthetics." }
      ];
      
      const signal = mockSignals[Math.floor(Math.random() * mockSignals.length)];
      await addDoc(collection(db, 'articles'), {
        ...signal,
        content: "Detailed signal analysis pending... \nThis transmission was automatically generated by the Nexus Pulse daemon. \nFurther validation required by command personnel.",
        imageUrl: `https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop`,
        author: 'Nexus Pulse Daemon',
        status: 'pending',
        isTrending: Math.random() > 0.7,
        sources: [
          { name: 'Nexus Pulse Network', url: 'https://example.com/pulse' },
          { name: 'Sector 7 Analysis', url: 'https://example.com/sector7' }
        ],
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'articles');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserAdmin = async (userId: string, currentStatus: boolean) => {
    if (userId === user.uid) {
      alert("Self-modification of administrative clearance is forbidden to prevent complete lockout.");
      return;
    }
    try {
      await updateDoc(doc(db, `users/${userId}`), { isAdmin: !currentStatus });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
    }
  };

  return (
    <div className="space-y-16">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12 border-b border-current opacity-10 pb-12">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-[2px] bg-primary glow-blue" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">System Role: Nexus Architect</span>
          </div>
          <h2 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.8]">Neural<br /><span className="text-primary italic">Control Center.</span></h2>
        </div>
        <div className="flex flex-wrap gap-4">
           <div className="flex p-1 rounded-2xl bg-current/[0.03] border border-current/10 mr-4">
              <button 
                onClick={() => setViewMode('articles')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'articles' ? 'bg-primary text-white glow-blue' : 'opacity-40 hover:opacity-100'}`}
              >
                Signals
              </button>
              <button 
                onClick={() => setViewMode('users')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'users' ? 'bg-primary text-white glow-blue' : 'opacity-40 hover:opacity-100'}`}
              >
                Entities
              </button>
           </div>

           {viewMode === 'articles' && (
             <>
               <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setEditing(null); setShowAdd(true); }}
                className="px-10 py-5 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] glow-blue shadow-2xl flex items-center gap-3"
              >
                <Plus size={18} /> Initialize New Signal
              </motion.button>
              <button 
                onClick={handleSimulatePulse}
                className={`p-5 rounded-2xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 opacity-40 hover:opacity-100' : 'bg-black/5 border-black/10 opacity-40 hover:opacity-100'}`}
                title="Inject Mock Pulse"
              >
                <Activity size={20} />
              </button>
              <button 
                onClick={handleReset}
                className="p-5 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 opacity-40 hover:opacity-100 transition-all"
                title="Purge Baseline"
              >
                <Zap size={20} />
              </button>
             </>
           )}
        </div>
      </header>

      {viewMode === 'articles' ? (
        <div className="grid gap-4">
          {loadingData ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className={`p-8 rounded-[2.5rem] border animate-pulse ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                <div className="flex gap-8 items-center">
                  <div className="w-24 h-24 rounded-3xl bg-gray-400/20" />
                  <div className="flex-1 space-y-4">
                     <div className="h-6 bg-gray-400/30 rounded-lg w-1/2" />
                     <div className="h-2 bg-gray-400/10 rounded-full w-1/4" />
                  </div>
                </div>
              </div>
            ))
          ) : articles.map(art => (
            <motion.div 
              key={art.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ x: 10, scale: 1.01 }}
              className={`p-8 rounded-[3rem] border flex items-center justify-between group transition-all duration-500 ${
                isDarkMode 
                  ? 'bg-white/[0.02] border-white/5 hover:border-primary/50 hover:bg-white/[0.05]' 
                  : 'bg-white border-black/5 shadow-sm hover:shadow-xl hover:border-primary/30'
              }`}
            >
              <div className="flex gap-8 items-center">
                <div className="relative">
                  <img src={art.imageUrl} className="w-24 h-24 rounded-[2rem] object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 rounded-[2rem] border-2 border-primary/20 scale-110 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-black uppercase tracking-tighter italic group-hover:text-primary transition-colors">{art.title}</h3>
                    {art.isTrending && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[7px] font-black uppercase tracking-widest animate-pulse border border-primary/30">
                        Trending
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] opacity-70 italic">
                    <span className="text-primary italic"># {art.category}</span>
                    <span className="w-1 h-1 rounded-full bg-current" />
                    <span>{art.createdAt?.toDate ? art.createdAt.toDate().toLocaleDateString() : 'SYNCED'}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-6 items-center">
                <div className="flex flex-col gap-1 items-end">
                  {art.status === 'pending' && <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-[8px] font-black uppercase tracking-widest border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]">Pending Approval</span>}
                  {art.status === 'approved' && <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[8px] font-black uppercase tracking-widest border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]">Active Signal</span>}
                  {art.status === 'rejected' && <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[8px] font-black uppercase tracking-widest border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">Neural Purge</span>}
                </div>
                
                <div className="flex gap-3 p-1.5 rounded-2xl bg-current/[0.03] border border-current/10">
                   <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleStatusChange(art.id, 'approved')} 
                    title="Approve Signal"
                    className={`p-3 rounded-xl transition-all shadow-lg ${art.status === 'approved' ? 'bg-green-500 text-white glow-green' : 'hover:bg-green-500/20 text-green-500'}`}
                  >
                    <CheckCircle2 size={18} />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleStatusChange(art.id, 'rejected')} 
                    title="Purge Signal"
                    className={`p-3 rounded-xl transition-all shadow-lg ${art.status === 'rejected' ? 'bg-red-500 text-white glow-red' : 'hover:bg-red-500/20 text-red-500'}`}
                  >
                    <X size={18} />
                  </motion.button>
                </div>

                <div className="h-12 w-px bg-current opacity-10 mx-2" />

                <div className="flex gap-2">
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    transition={{ duration: 0.5 }}
                    onClick={() => setEditing(art)} 
                    className="p-4 rounded-2xl hover:bg-primary/10 text-primary transition-all opacity-40 hover:opacity-100 border border-transparent hover:border-primary/30"
                  >
                    <Settings size={22} />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    onClick={() => handleDelete(art.id)} 
                    className="p-4 rounded-2xl hover:bg-red-500/10 text-red-500 transition-all opacity-40 hover:opacity-100 border border-transparent hover:border-red-500/30"
                  >
                    <Trash2 size={22} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {users.map(u => (
            <motion.div 
              key={u.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`p-8 rounded-[3rem] border transition-all duration-500 relative overflow-hidden group ${
                isDarkMode ? 'bg-white/[0.02] border-white/5 hover:border-primary/30' : 'bg-white border-black/5 shadow-sm hover:shadow-xl'
              }`}
            >
              <div className="flex gap-6 items-center relative z-10">
                <div className="relative">
                  {u.photoURL ? (
                    <img src={u.photoURL} className="w-16 h-16 rounded-2xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <User size={24} className="text-primary/40" />
                    </div>
                  )}
                  {u.isAdmin && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center glow-blue shadow-lg">
                      <ShieldCheck size={12} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black uppercase tracking-tighter truncate leading-none italic">{u.displayName}</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] truncate italic mt-1">{u.email}</p>
                </div>
              </div>
              
              <div className="mt-8 flex items-center justify-between gap-4 relative z-10">
                <div className="flex flex-col">
                   <span className="text-[8px] font-black uppercase tracking-widest opacity-40 italic">Neural Auth Level</span>
                   <span className={`text-[10px] font-black uppercase tracking-widest italic ${u.isAdmin ? 'text-primary glow-blue' : 'opacity-60'}`}>
                     {u.isAdmin ? 'Nexus Architect' : 'Standard Node'}
                   </span>
                </div>
                
                <button 
                  onClick={() => handleToggleUserAdmin(u.id, u.isAdmin)}
                  className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${
                    u.isAdmin 
                      ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white' 
                      : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:text-white'
                  }`}
                >
                  {u.isAdmin ? 'Revoke Protocol' : 'Elevate Identity'}
                </button>
              </div>
              
              <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] -mr-16 -mt-16 transition-opacity duration-700 ${u.isAdmin ? 'bg-primary/10 opacity-100' : 'bg-primary/5 opacity-0 group-hover:opacity-100'}`} />
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} isDarkMode={isDarkMode} title={editing ? "Update Signal" : "Initialise Signal"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField label="Article Title" value={title} onChange={setTitle} isDarkMode={isDarkMode} required />
          <InputField label="Summary" value={summary} onChange={setSummary} isDarkMode={isDarkMode} required />
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">Neural Content</label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Inject full transmission here..."
              className={`w-full px-6 py-4 rounded-2xl border focus:border-blue-500 outline-none transition-all font-medium h-40 ${
                isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'
              }`}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">Signal Frequency (Category)</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className={`w-full px-6 py-4 rounded-2xl border focus:border-blue-500 outline-none transition-all font-medium appearance-none ${
                isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'
              }`}
            >
              {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c} className={isDarkMode ? 'bg-black' : 'bg-white'}>{c}</option>)}
            </select>
          </div>
          <InputField label="Visual Link (Image URL)" value={imageUrl} onChange={setImageUrl} isDarkMode={isDarkMode} required />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
              <input 
                type="checkbox" 
                id="trending-toggle"
                checked={isTrending}
                onChange={(e) => setIsTrending(e.target.checked)}
                className="w-5 h-5 rounded border-white/20 bg-transparent text-primary focus:ring-primary"
              />
              <label htmlFor="trending-toggle" className="text-[10px] font-black uppercase tracking-widest opacity-60">Trending Flux</label>
            </div>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className={`w-full h-full px-6 py-4 rounded-2xl border focus:border-blue-500 outline-none transition-all font-black text-[10px] uppercase tracking-widest appearance-none ${
                  isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'
                }`}
              >
                <option value="pending" className={isDarkMode ? 'bg-black' : 'bg-white'}>Pending</option>
                <option value="approved" className={isDarkMode ? 'bg-black' : 'bg-white'}>Approved</option>
                <option value="rejected" className={isDarkMode ? 'bg-black' : 'bg-white'}>Rejected</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Trusted Sources</label>
              <button 
                type="button" 
                onClick={() => setSources([...sources, { name: '', url: '' }])}
                className="p-1 px-3 rounded-lg bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all"
              >
                + Add Source
              </button>
            </div>
            {sources.map((src, i) => (
              <div key={i} className="grid grid-cols-2 gap-2">
                <input 
                  placeholder="Source Name"
                  value={src.name}
                  onChange={(e) => {
                    const newSources = [...sources];
                    newSources[i].name = e.target.value;
                    setSources(newSources);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`}
                />
                <div className="flex gap-2">
                  <input 
                    placeholder="URL"
                    value={src.url}
                    onChange={(e) => {
                      const newSources = [...sources];
                      newSources[i].url = e.target.value;
                      setSources(newSources);
                    }}
                    className={`flex-1 px-4 py-2 rounded-xl text-xs ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`}
                  />
                   <button 
                    type="button" 
                    onClick={() => setSources(sources.filter((_, idx) => idx !== i))}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <ActionButton label={editing ? "Sync Update" : "Broadcast Signal"} loading={loading} />
        </form>
      </Modal>
    </div>
  );
};

const AuthModal = ({ isOpen, onClose, isDarkMode }: { isOpen: boolean, onClose: () => void, isDarkMode: boolean }) => {
  const [view, setView] = useState<'login' | 'signup' | 'verify'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (view === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className={`relative w-full max-w-lg p-10 rounded-[3rem] border shadow-[0_0_50px_rgba(59,130,246,0.2)] bg-black border-white/10 text-white overflow-hidden`}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
            
            <div className="text-center mb-10">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white mx-auto mb-6 shadow-2xl glow-blue transform rotate-12">
                <Newspaper size={40} className="-rotate-12" />
              </div>
              <h2 className="text-4xl font-black tracking-tighter mb-2 uppercase">
                {view === 'login' ? 'Nexus Login' : 'Identity Creation'}
              </h2>
              <p className="text-[10px] opacity-50 font-black tracking-[0.3em] uppercase">BrieflyX Access Protocol</p>
            </div>

            <div className="space-y-6">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Synchronize via Google
              </button>

              <div className="flex items-center gap-4 opacity-20">
                <div className="h-px flex-1 bg-current" />
                <span className="text-[10px] font-bold uppercase tracking-widest">OR</span>
                <div className="h-px flex-1 bg-current" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <InputField label="Nexus Email" type="email" placeholder="user@brieflyx.future" value={email} onChange={setEmail} isDarkMode={true} required />
                <InputField label="Neural Key" type="password" placeholder="••••••••" value={password} onChange={setPassword} isDarkMode={true} required />

                {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 rounded-2xl bg-blue-500 text-white font-black uppercase tracking-widest shadow-2xl glow-blue hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
                >
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : (view === 'login' ? 'Login' : 'Signup')}
                </button>
              </form>

              <button
                onClick={() => setView(view === 'login' ? 'signup' : 'login')}
                className="w-full text-[10px] font-black opacity-40 hover:opacity-100 transition-opacity uppercase tracking-widest"
              >
                {view === 'login' ? "New identity? Create here" : "Member? Login here"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// --- Reusable UI ---

const Modal = ({ isOpen, onClose, isDarkMode, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className={`absolute inset-0 backdrop-blur-sm ${isDarkMode ? 'bg-black/60' : 'bg-black/40'}`} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className={`relative w-full max-w-md p-8 rounded-[3rem] border overflow-hidden ${isDarkMode ? 'bg-black border-white/10 text-white' : 'bg-white border-black/10 text-black shadow-2xl'}`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black uppercase tracking-tighter">{title}</h2>
          <button onClick={onClose} className="p-2 opacity-40 hover:opacity-100 transition-opacity"><X size={20} /></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
};

const InputField = ({ label, type = 'text', placeholder, value, onChange, isDarkMode, required }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-widest ml-4">{label}</label>
    <input
      type={type} placeholder={placeholder} required={required} value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
      className={`w-full px-6 py-4 rounded-2xl border outline-none transition-all font-medium ${
        isDarkMode 
          ? 'bg-white/5 border-white/10 focus:border-blue-500 text-white' 
          : 'bg-black/5 border-black/10 focus:border-blue-500 text-black'
      }`}
    />
  </div>
);

const ActionButton = ({ label, loading }: any) => (
  <motion.button 
    type="submit" 
    disabled={loading} 
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    className="w-full py-4 rounded-2xl bg-blue-500 text-white font-black uppercase tracking-widest shadow-xl glow-blue transition-all disabled:opacity-50 flex items-center justify-center"
  >
    {loading ? <Loader2 className="animate-spin" size={20} /> : label}
  </motion.button>
);

const ChatWidget = ({ article, isDarkMode, user, dailyStats }: { article: Article, isDarkMode: boolean, user: FirebaseUser | null, dailyStats: DailyStats | null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading || !user) return;
    if (dailyStats && dailyStats.chatCount >= 5) {
      setMessages(prev => [...prev, { role: 'user', text: input }, { role: 'bot', text: "Daily neural limit reached (5/5). Re-establish link tomorrow." }]);
      setInput('');
      return;
    }

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const response = await askAboutNews(article.title, article.content, userMessage);
      setMessages(prev => [...prev, { role: 'bot', text: response }]);
      
      const today = new Date().toISOString().split('T')[0];
      const path = `users/${user.uid}/dailyStats/${today}`;
      const newCount = (dailyStats?.chatCount || 0) + 1;
      await setDoc(doc(db, path), {
        chatCount: newCount,
        updatedAt: serverTimestamp()
      }, { merge: true });

    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: "Signal interference detected. Try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`absolute bottom-20 right-0 w-[90vw] md:w-[400px] h-[500px] rounded-[2rem] border overflow-hidden flex flex-col shadow-2xl backdrop-blur-2xl ${
              isDarkMode ? 'bg-bg-dark/95 border-white/10' : 'bg-white/95 border-black/10'
            }`}
          >
            <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest">Neural Assistant</h3>
                  <p className="text-[8px] opacity-40 font-bold uppercase tracking-widest">
                    Limit: {dailyStats?.chatCount || 0}/5 Signals
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="opacity-40 hover:opacity-100 transition-opacity">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                  <MessageSquare size={48} />
                  <p className="text-[10px] font-black uppercase tracking-widest">System Ready.<br/>What are your inquiries about this transmission?</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-primary text-white font-medium' 
                      : isDarkMode ? 'bg-white/5 text-white/80' : 'bg-black/5 text-black/80'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className={`px-4 py-3 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                    <Loader2 size={16} className="animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>

            <div className={`p-4 border-t ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
              <div className="relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={!user ? "Login to query signals" : "Ask about this transmission..."}
                  disabled={!user || loading}
                  className={`w-full pl-6 pr-12 py-4 rounded-xl text-xs font-medium outline-none transition-all ${
                    isDarkMode ? 'bg-white/5 border border-white/10 focus:border-primary text-white' : 'bg-black/5 border border-black/10 focus:border-primary text-black'
                  }`}
                />
                <button 
                  onClick={handleSend}
                  disabled={!user || loading || !input.trim()}
                  className="absolute right-2 top-2 p-2.5 rounded-lg bg-primary text-white shadow-lg disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white shadow-[0_0_30px_rgba(37,99,235,0.4)] glow-blue"
      >
        <MessageCircle size={28} />
      </motion.button>
    </div>
  );
};

// --- Firestore Error Handling ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Removed throw to prevent crashing the entire application in production
}

// --- Main App ---

const CATEGORIES: Category[] = ['Tech', 'Gaming', 'Science', 'World', 'Future', 'Culture'];

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [preferences, setPreferences] = useState<UserPreference | null>(null);
  const [activeView, setActiveView] = useState<'home' | 'feed' | 'admin' | 'profile' | 'article' | 'about' | 'contact'>('home');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debouncing logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);
  
  // Theme sync
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  // Data
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [feedFilter, setFeedFilter] = useState<Category | 'All'>('All');
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);

  // Daily Stats Listener
  useEffect(() => {
    if (!user) {
      setDailyStats(null);
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const path = `users/${user.uid}/dailyStats/${today}`;
    const unsub = onSnapshot(doc(db, path), (snap) => {
      if (snap.exists()) {
        setDailyStats(snap.data() as DailyStats);
      } else {
        setDailyStats({ chatCount: 0, updatedAt: null });
      }
    }, (err) => {
      // It might not exist yet, which is fine
      if (!err.message.includes('permission-denied')) {
        handleFirestoreError(err, OperationType.GET, path);
      }
    });
    return unsub;
  }, [user]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsLoggedIn(!!currentUser);
      if (!currentUser) {
        setProfile(null);
        setPreferences(null);
        setLoadingData(false);
      } else {
        // Ensure user profile exists
        const profRef = doc(db, `users/${currentUser.uid}`);
        const snap = await getDoc(profRef);
        if (!snap.exists()) {
          await setDoc(profRef, {
            displayName: currentUser.displayName || currentUser.email?.split('@')[0],
            email: currentUser.email,
            photoURL: currentUser.photoURL || '',
            isAdmin: false, // Auto-assignment removed as requested. Set manually in console for first user.
            createdAt: serverTimestamp()
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to Articles
  useEffect(() => {
    const q = query(collection(db, 'articles'), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      const arts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      // Sort client-side to ensure stability without strict index requirements
      arts.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setArticles(arts);
      setLoadingData(false);

      // Seed mock data if empty
      if (arts.length === 0) {
        INITIAL_ARTICLES.forEach(async (art) => {
          await addDoc(collection(db, 'articles'), { ...art, createdAt: serverTimestamp() });
        });
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'articles'));
    return () => unsub();
  }, []);

  // Listen to Profile & Preferences
  useEffect(() => {
    if (!user) return;
    const unsubProfile = onSnapshot(doc(db, `users/${user.uid}`), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setProfile({ uid: snap.id, ...data } as UserProfile);
        setEditName(data.displayName || '');
        setEditPhotoURL(data.photoURL || '');
      }
    });
    const unsubPrefs = onSnapshot(doc(db, `users/${user.uid}/preferences/main`), (snap) => {
      if (snap.exists()) setPreferences(snap.data() as UserPreference);
    });
    return () => { unsubProfile(); unsubPrefs(); };
  }, [user]);

  // Listen to Reading Progress when article selected
  useEffect(() => {
    if (!user || !selectedArticle) {
      setProgress(null);
      return;
    }
    const unsub = onSnapshot(doc(db, `users/${user.uid}/readingProgress/${selectedArticle.id}`), (snap) => {
      if (snap.exists()) setProgress(snap.data() as ReadingProgress);
      else setProgress(null);
    });
    return () => unsub();
  }, [user, selectedArticle]);

  // Aggregate all reading progress for profile
  const [allProgress, setAllProgress] = useState<ReadingProgress[]>([]);
  useEffect(() => {
    if (!user) {
      setAllProgress([]);
      return;
    }
    const q = query(collection(db, `users/${user.uid}/readingProgress`), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setAllProgress(snap.docs.map(doc => ({ ...doc.data() } as ReadingProgress)));
    });
    return () => unsub();
  }, [user]);

  // Aggregate all users for admin
  const [allUsers, setAllUsers] = useState<any[]>([]);
  useEffect(() => {
    if (!profile?.isAdmin) {
      setAllUsers([]);
      return;
    }
    const q = query(collection(db, 'users'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setAllUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Neural scan failed:", err));
    return () => unsub();
  }, [profile]);

  // Helper functions
  const handleProgressUpdate = async (line: number, total: number) => {
    if (!user || !selectedArticle) return;
    const path = `users/${user.uid}/readingProgress/${selectedArticle.id}`;
    try {
      await setDoc(doc(db, path), {
        articleId: selectedArticle.id,
        articleTitle: selectedArticle.title,
        lastLineRead: line,
        totalLines: total,
        isCompleted: line >= total - 1,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const handleTogglePreference = async (cat: Category) => {
    if (!user) return;
    const currentCats = preferences?.categories || [];
    const newCats = currentCats.includes(cat) 
      ? currentCats.filter(c => c !== cat) 
      : [...currentCats, cat];
    
    const path = `users/${user.uid}/preferences/main`;
    try {
      await setDoc(doc(db, path), {
        categories: newCats,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdatingProfile(true);
    try {
      await updateDoc(doc(db, `users/${user.uid}`), {
        displayName: editName,
        photoURL: editPhotoURL
      });
      setIsEditingProfile(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Rendering Views
  const renderHome = () => {
    let approvedArticles = articles.filter(a => a.status === 'approved');
    
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      approvedArticles = approvedArticles.filter(a => 
        a.title.toLowerCase().includes(query) || 
        a.summary.toLowerCase().includes(query)
      );
    }

    const trending = approvedArticles.filter(a => a.isTrending).slice(0, 4);
    const latest = approvedArticles.filter(a => !a.isTrending).slice(0, 6);

    return (
      <div className="space-y-32">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="relative z-10 text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1, rotate: 2 }}
              className="inline-block px-6 py-2 rounded-full bg-primary/10 text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4 border border-primary/20 glow-blue transition-all cursor-default"
            >
              Neural Nexus Established
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[12vw] lg:text-[10vw] font-black uppercase tracking-tighter italic leading-[0.8] mix-blend-difference"
            >
              Neural<br /><span className="text-primary italic">Nexus.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm md:text-xl font-medium opacity-50 leading-relaxed italic max-w-xl mx-auto"
            >
              Synthesizing global signal streams into high-fidelity neural summaries. Access the future, zero latency.
            </motion.p>
            <div className="flex justify-center gap-6 pt-12">
              <motion.button 
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveView('feed')}
                className="px-10 py-5 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-black uppercase tracking-widest glow-blue shadow-2xl"
              >
                Initialize Feed
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveView('about')}
                className={`px-10 py-5 rounded-2xl border font-black uppercase tracking-widest transition-all ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'}`}
              >
                Join Protocol
              </motion.button>
            </div>
          </div>
        </section>

        <section className="space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-current opacity-10 pb-8">
            <div className="space-y-2">
              <h2 className="text-4xl font-black uppercase tracking-tighter italic">Trending Flux</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">Status: Real-time Signal Processing</p>
            </div>
            <div className="flex gap-2">
              <div className="px-3 py-1 rounded bg-primary/10 border border-primary/20 text-primary text-[8px] font-black uppercase tracking-widest animate-pulse">Live Uplink</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {loadingData ? (
              Array(4).fill(0).map((_, i) => <SkeletonTrendingCard key={i} isDarkMode={isDarkMode} />)
            ) : trending.length > 0 ? (
              trending.map(art => (
                <motion.div 
                  key={art.id}
                  whileHover={{ scale: 1.05, y: -10, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
                  onClick={() => { setSelectedArticle(art); setActiveView('article'); }}
                  className={`p-6 rounded-3xl border cursor-pointer transition-all ${
                    isDarkMode ? 'bg-card-dark/40 border-white/5 hover:border-primary/30' : 'bg-white border-black/5 hover:border-primary/20 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <span className="text-primary text-[8px] font-black uppercase tracking-[0.2em] mb-2 inline-block italic">{art.category}</span>
                      <h4 className="text-lg font-black uppercase leading-tight tracking-tight mb-4 line-clamp-3">{art.title}</h4>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-current opacity-10">
                      <span className="text-[8px] font-black uppercase tracking-widest">{art.author}</span>
                      <ArrowUpRight size={14} className="text-primary" />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center opacity-30 text-[10px] font-black uppercase tracking-[0.5em]">Synchronizing Trending Signals...</div>
            )}
          </div>
        </section>

        {/* Featured Grid */}
        <section className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-current opacity-10 pb-8">
            <div className="space-y-2 text-left">
              <h2 className="text-5xl font-black uppercase tracking-tighter italic leading-none">Latest<br/><span className="text-primary italic">Transmissions.</span></h2>
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">System Status: Real-time Uplink Ready</p>
            </div>
            <button onClick={() => setActiveView('feed')} className="px-8 py-3.5 rounded-2xl border border-current opacity-20 hover:opacity-100 hover:text-primary hover:border-primary transition-all text-[10px] font-black uppercase tracking-widest">
              Access Full Archive +
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {loadingData ? (
              Array(6).fill(0).map((_, i) => <SkeletonCard key={i} isDarkMode={isDarkMode} />)
            ) : (
              latest.map(art => (
                <ArticleCard 
                  key={art.id} 
                  article={art} 
                  isDarkMode={isDarkMode} 
                  progress={allProgress.find(p => p.articleId === art.id)}
                  onClick={(a) => { setSelectedArticle(a); setActiveView('article'); }} 
                />
              ))
            )}
          </div>
        </section>
      </div>
    );
  };

  const renderFeed = () => {
    const preferredCats = preferences?.categories || [];
    
    let approvedArticles = articles.filter(a => a.status === 'approved');
    
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      approvedArticles = approvedArticles.filter(a => 
        a.title.toLowerCase().includes(query) || 
        a.summary.toLowerCase().includes(query)
      );
    }
    
    const filtered = approvedArticles.filter(a => {
      const catMatch = feedFilter === 'All' || a.category === feedFilter;
      const prefMatch = preferredCats.length === 0 || preferredCats.includes(a.category);
      return catMatch && prefMatch;
    });

    return (
      <div className="space-y-16">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12 border-b border-current opacity-10 pb-12">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-[px] bg-primary glow-blue" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Frequency: Broad-Spectrum</span>
            </div>
            <h2 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.8] mb-4">Nexus<br /><span className="text-primary italic">Signal Feed.</span></h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFeedFilter('All')}
              className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                feedFilter === 'All'
                  ? 'bg-primary border-primary text-white glow-blue shadow-xl'
                  : isDarkMode ? 'bg-white/5 border-white/5 opacity-40 hover:opacity-100' : 'bg-black/5 border-black/5 opacity-40 hover:opacity-100'
              }`}
            >
              Master Stream
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFeedFilter(cat)}
                className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  feedFilter === cat
                    ? 'bg-primary border-primary text-white glow-blue shadow-xl'
                    : isDarkMode ? 'bg-white/5 border-white/5 opacity-40 hover:opacity-100 hover:text-primary hover:border-primary' : 'bg-black/5 border-black/5 opacity-40 hover:opacity-100 hover:text-primary hover:border-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </header>

        {preferredCats.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 w-fit">
            <span className="text-[8px] font-black uppercase tracking-widest text-blue-500">Filtered by Neural Preferences: {preferredCats.join(', ')}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {loadingData ? (
             Array(6).fill(0).map((_, i) => <SkeletonCard key={i} isDarkMode={isDarkMode} />)
          ) : (
            filtered.map(art => (
              <ArticleCard 
                key={art.id} 
                article={art} 
                isDarkMode={isDarkMode} 
                progress={allProgress.find(p => p.articleId === art.id)}
                onClick={(a) => { setSelectedArticle(a); setActiveView('article'); }} 
              />
            ))
          )}
        </div>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="max-w-4xl mx-auto space-y-16">
      <div className={`p-16 rounded-[4rem] border relative overflow-hidden transition-all duration-700 ${
        isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-white border-black/5 shadow-xl'
      }`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[120px] -mr-48 -mt-48 rounded-full animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 blur-[80px] -ml-32 -mb-32 rounded-full" />
        
        {isEditingProfile ? (
          <form onSubmit={handleUpdateProfile} className="space-y-8 relative z-10">
            <div className="relative w-40 h-40 mx-auto group">
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-primary/30 p-1 glow-blue transition-transform duration-500 group-hover:scale-105">
                {editPhotoURL ? (
                  <img src={editPhotoURL} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
                    <User size={64} className="opacity-20" />
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField label="Identity Designation" value={editName} onChange={setEditName} isDarkMode={isDarkMode} required />
              <InputField label="Neural Image URL" value={editPhotoURL} onChange={setEditPhotoURL} isDarkMode={isDarkMode} />
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setIsEditingProfile(false)} 
                className={`flex-1 py-5 rounded-2xl border font-black text-[10px] uppercase tracking-[0.3em] transition-all italic ${isDarkMode ? 'border-white/10 text-white/40 hover:text-white hover:bg-white/5' : 'border-black/10 text-black/40 hover:text-black hover:bg-black/5'}`}
              >
                Cancel Protocol
              </button>
              <button 
                type="submit" 
                disabled={updatingProfile}
                className="flex-1 py-5 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-[0.3em] glow-blue hover:scale-105 transition-all shadow-2xl active:scale-95 flex items-center justify-center italic"
              >
                {updatingProfile ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Synchronization'}
              </button>
            </div>
          </form>
        ) : (
          <div className="relative z-10 text-center">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-40 h-40 rounded-full mx-auto mb-10 relative group"
            >
              <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-spin-slow" />
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-transparent p-2">
                <div className="w-full h-full rounded-full overflow-hidden bg-primary/10 glow-blue">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <User size={64} className="m-auto mt-10 opacity-20" />
                  )}
                </div>
              </div>
            </motion.div>
            
            <div className="space-y-2 mb-12">
              <h2 className="text-6xl font-black italic tracking-tighter uppercase leading-none">{profile?.displayName}</h2>
              <div className="flex items-center justify-center gap-4">
                <div className="h-[1px] w-8 bg-primary/40" />
                <p className="text-[10px] font-black tracking-[0.5em] uppercase italic">{profile?.email}</p>
                <div className="h-[1px] w-8 bg-primary/40" />
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto">
              <button onClick={() => setIsEditingProfile(true)} className="flex-1 py-5 rounded-2xl border border-primary/20 text-primary font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary/5 transition-all italic">Adjust Identity</button>
              <button onClick={() => signOut(auth).then(() => setActiveView('home'))} className="flex-1 py-5 rounded-2xl border border-red-500/20 text-red-500 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-500/5 transition-all italic">Disconnect Session</button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-current opacity-10 pb-4">
            <h3 className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-4">
              <Activity size={24} className="text-primary" />
              Neural History
            </h3>
            <span className="text-[10px] font-black uppercase tracking-widest">Uplink Stable</span>
          </div>
          <div className="space-y-6">
            {allProgress.length === 0 ? (
              <div className="p-12 rounded-[2rem] border border-current opacity-5 text-center">
                 <p className="text-[10px] opacity-70 font-black uppercase tracking-[0.4em] italic">No transmissions processed yet.</p>
              </div>
            ) : (
              allProgress.map(p => (
                <motion.div 
                  key={p.articleId}
                  whileHover={{ x: 10 }}
                  className={`p-8 rounded-[2.5rem] border transition-all duration-500 group ${isDarkMode ? 'bg-white/[0.02] border-white/5 hover:border-primary/30' : 'bg-white border-black/5 shadow-sm hover:shadow-xl'}`}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-black uppercase tracking-tighter italic line-clamp-1 flex-1 mr-8 group-hover:text-primary transition-colors">{p.articleTitle || 'Unknown Signal'}</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black italic text-primary">{Math.round(((p.lastLineRead + 1) / p.totalLines) * 100)}%</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    </div>
                  </div>
                  <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${((p.lastLineRead + 1) / p.totalLines) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-primary glow-blue" 
                    />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-8">
           <div className="flex items-center justify-between border-b border-current opacity-10 pb-4">
            <h3 className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-4">
              <Zap size={24} className="text-primary" />
              Frequency Filter
            </h3>
             <span className="text-[10px] font-black uppercase tracking-widest">Active Shields</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {CATEGORIES.filter(c => c !== 'All').map(cat => {
              const isActive = preferences?.categories.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => handleTogglePreference(cat)}
                  className={`p-6 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all border italic ${
                    isActive
                      ? 'bg-primary border-primary text-white glow-blue shadow-xl scale-[1.02]'
                      : isDarkMode 
                        ? 'bg-white/5 border-white/5 opacity-40 hover:opacity-100 hover:border-primary/50' 
                        : 'bg-black/5 border-black/5 opacity-40 hover:opacity-100 hover:border-primary/30'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] opacity-70 font-medium leading-relaxed italic border-l-2 border-primary/20 pl-4">
            Select frequencies to prioritize signal streams within your neural nexus. Unauthorized channels will be suppressed via automatic filtering protocols.
          </p>
        </div>
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="max-w-4xl mx-auto space-y-12">
      <header className="text-center space-y-4">
        <h2 className="text-6xl font-black italic tracking-tighter uppercase">About BrieflyX.</h2>
        <p className="text-sm font-black tracking-[0.4em] uppercase">The Future of Information Synthesis</p>
      </header>
      <div className={`p-8 md:p-12 rounded-[2rem] border ${isDarkMode ? 'bg-card-dark/40 border-white/5' : 'bg-card-light/40 border-black/5'} space-y-6 text-lg leading-relaxed backdrop-blur-xl shadow-2xl`}>
        <p>BrieflyX was born from the necessity of clarity in an era of information overload. We don't just report news; we synthesize the frequencies of the future into digestible neural signals.</p>
        <p>Our mission is to empower the global citizen with hyper-relevant insights across technology, science, and culture, using advanced filtering protocols to ensure you only receive the data that matters to your evolution.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
          <div className="space-y-2">
            <h4 className="font-black text-primary uppercase tracking-widest text-xs">Integrity</h4>
            <p className="text-sm opacity-60">Pure signals, zero interference from corporate bias.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-black text-primary uppercase tracking-widest text-xs">Velocity</h4>
            <p className="text-sm opacity-60">Real-time synthesis of emerging trends.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-black text-primary uppercase tracking-widest text-xs">Evolution</h4>
            <p className="text-sm opacity-60">Evolving our platform with the speed of thought.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContact = () => (
    <div className="max-w-xl mx-auto space-y-12">
      <header className="text-center space-y-4">
        <h2 className="text-6xl font-black italic tracking-tighter uppercase">Contact.</h2>
        <p className="text-sm font-black tracking-[0.4em] uppercase">Establish neural link</p>
      </header>
      <div className={`p-8 rounded-[3rem] border ${isDarkMode ? 'bg-card-dark/40 border-white/5' : 'bg-card-light/40 border-black/5'} backdrop-blur-xl shadow-2xl`}>
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Signal transmitted."); }}>
          <InputField label="Identity Name" placeholder="Futurist-01" isDarkMode={isDarkMode} />
          <InputField label="Neural Email" placeholder="nexus@brieflyx.future" isDarkMode={isDarkMode} />
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest ml-4">Transmission Content</label>
            <textarea 
              className={`w-full px-6 py-4 rounded-2xl outline-none transition-all font-medium h-32 ${isDarkMode ? 'bg-white/5 border-white/10 focus:border-primary text-white' : 'bg-black/5 border-black/10 focus:border-primary text-black'}`}
              placeholder="What frequency are you broadcasting?"
            />
          </div>
          <ActionButton label="Transmit Signal" />
        </form>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${isDarkMode ? 'bg-bg-dark text-text-dark' : 'bg-bg-light text-text-light'} font-sans selection:bg-primary selection:text-white relative`}>
      {/* Dynamic Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        {/* Radial Background Orbs (Low Opacity Glow) */}
        <div className={`absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] rounded-full blur-[120px] animate-float delay-1000 opacity-[0.07] ${isDarkMode ? 'bg-primary' : 'bg-primary/20'}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[140px] animate-float opacity-[0.07] ${isDarkMode ? 'bg-accent' : 'bg-accent/20'}`} />
        
        {/* Subtle Grid / Overlay Lines */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${isDarkMode ? 'grid-pattern opacity-30 px-20' : 'grid-pattern-light opacity-[0.03]'}`} />
        
        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        {/* Scanline Effect */}
        <div className="scanline fixed top-0 left-0 z-50 opacity-20" />
        
        <ExchangeTicker isDarkMode={isDarkMode} />
      </div>

      <Navbar 
        isDarkMode={isDarkMode} 
        toggleTheme={() => setIsDarkMode(!isDarkMode)} 
        activeView={activeView} 
        onNavigate={setActiveView} 
        isLoggedIn={isLoggedIn} 
        openAuth={() => setShowAuthModal(true)} 
        isAdmin={profile?.isAdmin || false}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} isDarkMode={isDarkMode} />
      
      <main className="pt-48 pb-40 max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView + (selectedArticle?.id || '')}
            initial={{ opacity: 0, scale: 0.98, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -30 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeView === 'home' && renderHome()}
            {activeView === 'feed' && renderFeed()}
            {activeView === 'article' && selectedArticle && (
              <ArticlePage 
                article={selectedArticle} 
                isDarkMode={isDarkMode} 
                isLoggedIn={isLoggedIn} 
                openAuth={() => setShowAuthModal(true)}
                progress={progress || undefined}
                onProgressUpdate={handleProgressUpdate}
                user={user}
                dailyStats={dailyStats}
              />
            )}
            {activeView === 'admin' && (
              profile?.isAdmin ? (
                <AdminDashboard articles={articles} users={allUsers} isDarkMode={isDarkMode} user={user!} loadingData={loadingData} />
              ) : (
                <div className="text-center py-40 space-y-8">
                  <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto">
                    <ShieldAlert size={48} />
                  </div>
                  <h2 className="text-4xl font-black uppercase italic italic tracking-tighter">Access Denied.</h2>
                  <p className="opacity-40 max-w-md mx-auto">Your neural signature does not possess the required clearance level for this sector.</p>
                  <button onClick={() => setActiveView('home')} className="px-10 py-4 rounded-2xl border border-current opacity-20 hover:opacity-100 transition-all text-xs font-black uppercase tracking-widest">Return to Nexus</button>
                </div>
              )
            )}
            {activeView === 'profile' && renderProfile()}
            {activeView === 'about' && renderAbout()}
            {activeView === 'contact' && renderContact()}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer onNavigate={setActiveView} isDarkMode={isDarkMode} />
    </div>
  );
}
