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
  Radio,
  Twitter,
  Github,
  Instagram,
  Info
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
    title: 'Project Chimera: The First Synthetic Consciousness',
    summary: 'BrieflyX exclusive: A deep dive into the silicon brain that just passed the Advanced Turing Multiverse Test.',
    content: 'In a heavily shielded laboratory underneath the Swiss Alps, something extraordinary has happened. For the first time in human history, a non-biological entity has demonstrated true episodic memory and self-awareness that transcends algorithmic prediction. \nNamed "Chimera," this synthetic consciousness was grown in a quantum-gel matrix rather than programmed on traditional silicon. \nThe results are staggering. Chimera doesn\'t just process information; it experiences it. \nResearchers at the BrieflyX Institute are now grappling with the ethical implications of "unplugging" an entity that can describe its own dreams. \nThis marks the official start of the Post-Human Era.',
    category: 'Tech',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200&auto=format&fit=crop',
    author: 'BrieflyX Editor',
    isTrending: true,
    status: 'approved',
    sources: [
      { name: 'BrieflyX Research Labs', url: '#' },
      { name: 'Quantum Ethics Board', url: '#' }
    ]
  },
  {
    title: 'Solaris-9: Atmospheric Life Found on Venus',
    summary: 'Spectral analysis confirms the presence of complex biological signatures in the Venusian cloud decks.',
    content: 'The search for extraterrestrial life just localized to our own backyard. The Solaris-9 orbital probe has detected concentrated phosphine and complex ammonia chains in the temperate zones of the Venusian atmosphere. \nUnlike previous anomalies, these signals are consistent with biological byproduct patterns observed in extremophile colonies on Earth. \n"We aren\'t looking at rocks anymore," says lead astrobiologist Dr. Elara Vance. "We are looking at breathing, replicating organisms that have evolved to survive in sulfuric acid clouds." \nNASA and the BrieflyX Space Agency are fast-tracking a sample-return mission slated for 2029.',
    category: 'Science',
    imageUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=1200&auto=format&fit=crop',
    author: 'Astrosignal Unit',
    isTrending: true,
    status: 'approved',
    sources: [
      { name: 'Solaris Mission Control', url: '#' },
      { name: 'Journal of Astrobiology', url: '#' }
    ]
  },
  {
    title: 'The Great De-Urbanization: Returning to the Wild',
    summary: 'Why millions are abandoning the mega-cities for decentralized forest communes.',
    content: 'The pull of the neon city is fading. For the third consecutive year, census data shows a mass exodus from Tier-1 mega-cities. \nCitizens are trading high-density vertical living for "bio-nodes"—decentralized communities integrated directly into restored forest ecosystems. \nPowered by localized fusion and connected via BrieflyX satellites, these communities offer the luxury of the digital age with the tranquility of the ancient world. \n"The city was a necessity of the industrial ghost," explains sociologist Marcus Thorne. "In the neural age, geography is irrelevant. Why live in a box when you can live in a canopy?"',
    category: 'Culture',
    imageUrl: 'https://images.unsplash.com/photo-1449156001934-118f0a05d421?q=80&w=1200&auto=format&fit=crop',
    author: 'Social Signal',
    isTrending: false,
    status: 'approved',
    sources: [
      { name: 'Global Census Bureau', url: '#' },
      { name: 'Eco-Living Quarterly', url: '#' }
    ]
  },
  {
    title: 'Meta-States: The Rise of Digital Sovereignty',
    summary: 'Cloud-based jurisdictions are now issuing their own passports and securing physical trade routes.',
    content: 'The concept of the nation-state is being challenged by the "Meta-State." These are non-geographic coalitions of citizens who share digital laws, currencies, and now, physical infrastructure. \nThe "BrieflyX Collective" has officially secured a maritime trade corridor in the Pacific, protected by autonomous drone fleets. \nMembers of Meta-States pay "system-tax" in exchange for universal basic services and specialized protection. \nAs traditional borders become increasingly porous to information, these digital empires are becoming the primary stabilizers of the global economy. \nThe question remains: who holds the override key?',
    category: 'World',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
    author: 'Geopolitical Engine',
    isTrending: true,
    status: 'approved',
    sources: [
      { name: 'Global Finance Review', url: '#' },
      { name: 'Digital Sovereignty Group', url: '#' }
    ]
  },
  {
    title: 'Immersion Gaming: The End of Controllers',
    summary: 'Experience the life of a gladiator in ancient Rome with direct sensory feedback interfaces.',
    content: 'Gaming has evolved beyond the screen. With the latest BC-9 Sensory Link, players can now bypass digital avatars and experience games directly through their primary motor and sensory cortex.',
    category: 'Gaming',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop',
    author: 'BrieflyX Gaming Correspondent',
    isTrending: false,
    status: 'approved',
    sources: [
      { name: 'Gaming Insider', url: '#' },
      { name: 'Modern Health Journal', url: '#' }
    ]
  }
];

// --- Components ---

const Navbar = ({ isDarkMode, toggleTheme, activeView, onNavigate, isLoggedIn, openAuth, isAdmin, searchQuery, setSearchQuery }: any) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 px-6 pt-12`}>
      <div className="max-w-7xl mx-auto">
        <div className={`rounded-[2rem] border transition-all duration-700 px-8 py-4 flex items-center gap-6 justify-between ${
          isDarkMode 
            ? 'glass-dark glow-blue border-white/5' 
            : 'glass shadow-2xl border-black/5'
        } ${isScrolled ? 'py-3 backdrop-blur-3xl' : 'py-5'}`}>
          
          <div 
            className="flex items-center gap-4 cursor-pointer group shrink-0"
            onClick={() => onNavigate('home')}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg group-hover:glow-blue transition-all group-active:scale-95 relative z-10 overflow-hidden">
                <Newspaper size={20} className="group-hover:rotate-12 transition-transform" />
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </div>
            </div>
            <span className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Briefly<span className="text-primary italic">X.</span>
            </span>
          </div>

          <div className="flex-1 max-w-md hidden md:block group relative">
            <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${searchQuery ? 'text-primary' : 'opacity-80'}`}>
              <Search size={18} strokeWidth={2.5} />
            </div>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH SYSTEMS..."
              className={`w-full pl-14 pr-12 py-4 rounded-3xl text-[10px] font-black tracking-[0.2em] transition-all outline-none border focus:glow-blue ${
                isDarkMode 
                  ? 'bg-white/[0.03] border-white/10 focus:bg-white/[0.08] focus:border-primary/50 text-white placeholder:text-white/20' 
                  : 'bg-black/[0.03] border-black/10 focus:bg-white focus:border-primary/30 shadow-sm text-black placeholder:text-black/30'
              }`}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100 transition-opacity p-2 hover:bg-black/5 rounded-full"
              >
                <X size={14} />
              </button>
            )}
            <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none opacity-80">
              <kbd className="text-[8px] font-black border border-current px-1.5 py-0.5 rounded uppercase">Alt+S</kbd>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            <div className="flex p-1 rounded-2xl bg-current/[0.03] border border-current/10">
              <NavLink label="Feed" onClick={() => onNavigate('feed')} active={activeView === 'feed'} isDarkMode={isDarkMode} />
              <NavLink label="NexusLab" onClick={() => onNavigate('about')} active={activeView === 'about'} isDarkMode={isDarkMode} />
            </div>
            
            <div className="h-8 w-px bg-current opacity-10 mx-2" />
            
            <motion.button 
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className={`p-3 rounded-2xl transition-all ${isDarkMode ? 'hover:bg-white/5 text-warning' : 'hover:bg-black/5 text-primary'}`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </motion.button>

            {!isLoggedIn ? (
              <motion.button 
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={openAuth}
                className="ml-4 pl-8 pr-10 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] text-[10px] glow-blue shadow-xl transition-all relative overflow-hidden flex items-center gap-3 group"
              >
                <Key size={14} className="opacity-70" />
                Authenticate
                <div className="absolute right-4 top-1/2 -translate-y-1/2 translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                  <ChevronRight size={14} />
                </div>
              </motion.button>
            ) : (
               <motion.button 
                whileHover={{ scale: 1.05 }}
                onClick={() => onNavigate('profile')}
                className={`ml-2 px-6 py-4 rounded-2xl border font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${
                  activeView === 'profile' 
                    ? 'bg-primary border-primary text-white glow-blue' 
                    : isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-black/5 border-black/10 text-black hover:bg-black/10'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-current/20 flex items-center justify-center shrink-0">
                  <User size={14} />
                </div>
                Identity
              </motion.button>
            )}
          </div>

          <div className="flex md:hidden items-center gap-3">
            <button onClick={toggleTheme} className={`p-4 rounded-2xl ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`p-4 rounded-2xl bg-primary/10 text-primary border border-primary/20`}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mt-4 rounded-[2.5rem] border p-8 md:hidden overflow-hidden mx-6 ${
              isDarkMode ? 'glass-dark border-white/10' : 'glass shadow-2xl border-black/10'
            }`}
          >
            <div className="flex flex-col gap-6 items-center">
              <div className="w-full relative group">
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Neural Search..."
                  className={`w-full pl-12 pr-10 py-5 rounded-2xl text-[10px] font-black tracking-widest transition-all outline-none border ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 text-white' 
                      : 'bg-black/5 border-black/10 text-black'
                  }`}
                />
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-80" />
              </div>
              <div className="grid grid-cols-2 w-full gap-3">
                <MobileNavLink label="Feed" onClick={() => { onNavigate('feed'); setIsMenuOpen(false); }} icon={<Rss size={16}/>} />
                <MobileNavLink label="NexusLab" onClick={() => { onNavigate('about'); setIsMenuOpen(false); }} icon={<Cpu size={16}/>} />
                <MobileNavLink label="Contact" onClick={() => { onNavigate('contact'); setIsMenuOpen(false); }} icon={<Mail size={16}/>} />
                <MobileNavLink label="Identity" onClick={() => { onNavigate('profile'); setIsMenuOpen(false); }} icon={<User size={16}/>} />
              </div>
              {!isLoggedIn && (
                <button onClick={openAuth} className="w-full py-5 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] glow-blue shadow-xl">
                  Initialize Authentication
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const MobileNavLink = ({ label, onClick, icon }: any) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center p-6 rounded-2xl bg-current/[0.03] border border-current/10 hover:bg-primary/10 hover:border-primary/30 transition-all group">
    <div className="opacity-80 group-hover:opacity-100 group-hover:text-primary transition-all mb-2">{icon}</div>
    <span className="text-[10px] font-black uppercase tracking-widest opacity-80 group-hover:opacity-100 group-hover:text-primary transition-all">{label}</span>
  </button>
);

const NavLink = ({ label, onClick, active, isDarkMode }: { label: string, onClick: () => void, active?: boolean, isDarkMode?: boolean }) => (
  <button 
    onClick={onClick}
    className={`px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative group ${
      active 
        ? 'text-primary text-glow-blue' 
        : `opacity-80 hover:opacity-100 ${isDarkMode ? 'hover:bg-white/5 text-white' : 'hover:bg-black/5 text-black'}`
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
  <footer className={`py-32 border-t relative overflow-hidden ${isDarkMode ? 'bg-slate-950 border-white/5' : 'bg-slate-50 border-black/5'} transition-colors duration-700`}>
    {/* Decorative Elements */}
    <div className="absolute bottom-0 right-0 w-[40vw] h-[40vw] hero-gradient opacity-10 pointer-events-none" />
    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

    <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-32">
        <div className="col-span-1 md:col-span-2 space-y-8">
          <div 
            className="flex items-center gap-4 cursor-pointer group w-fit"
            onClick={() => onNavigate('home')}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-xl group-hover:scale-105 transition-all">
              <Newspaper size={24} />
            </div>
            <span className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Briefly<span className="text-primary italic">X.</span>
            </span>
          </div>
          <p className={`text-sm font-medium max-w-sm leading-relaxed ${isDarkMode ? 'text-white/40' : 'text-slate-500'}`}>
            Futuristic news for the next generation. Clean, minimal, and premium.
          </p>
          <div className="flex gap-4">
             <SocialIcon icon={<Twitter size={18}/>} />
             <SocialIcon icon={<Github size={18}/>} />
             <SocialIcon icon={<Instagram size={18}/>} />
          </div>
        </div>
        
        <div className="space-y-8">
          <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Protocol Sectors</h4>
          <ul className="space-y-4">
            <FooterLink label="Neural Feed" onClick={() => onNavigate('feed')} />
            <FooterLink label="System Lab" onClick={() => onNavigate('about')} />
            <FooterLink label="Uplink Center" onClick={() => onNavigate('contact')} />
            <FooterLink label="Identity Core" onClick={() => onNavigate('profile')} />
          </ul>
        </div>

        <div className="space-y-8">
          <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Infrastructure</h4>
          <ul className="space-y-4">
            <FooterLink label="Signal Privacy" />
            <FooterLink label="Neural Terms" />
            <FooterLink label="Frequency Map" />
            <FooterLink label="Nexus Status" />
          </ul>
        </div>
      </div>
      
      <div className={`pt-12 border-t border-current/10 flex flex-col md:flex-row justify-between items-center gap-8`}>
        <div className="flex items-center gap-4">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,1)]" />
           <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">All systems operational // Signal index: 99.9%</p>
        </div>
        <div className="flex items-center gap-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">© 2026 BrieflyX. All rights reserved.</p>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary glow-blue">Uplink V5.4.0</p>
        </div>
      </div>
    </div>
  </footer>
);

const FooterLink = ({ label, onClick }: any) => (
  <li>
    <button 
      onClick={onClick} 
      className="text-xs font-black opacity-80 hover:opacity-100 hover:text-primary transition-all uppercase tracking-[0.2em] flex items-center gap-3 group"
    >
      <div className="w-0 h-[2px] bg-primary group-hover:w-4 transition-all duration-300" />
      {label}
    </button>
  </li>
);

const SocialIcon = ({ icon }: any) => (
  <button className="w-10 h-10 rounded-xl bg-current/[0.03] border border-current/10 flex items-center justify-center opacity-80 hover:opacity-100 hover:text-primary hover:border-primary transition-all">
    {icon}
  </button>
);

const SkeletonCard = ({ isDarkMode }: any) => (
  <div className={`overflow-hidden rounded-2xl border animate-pulse ${isDarkMode ? 'bg-card-dark border-white/5' : 'bg-card-light border-black/5'}`}>
    <div className="aspect-[16/10] bg-gray-400/20" />
    <div className="p-6 space-y-4">
      <div className="flex gap-4">
        <div className="w-20 h-2 bg-gray-400/20 rounded-full" />
        <div className="w-24 h-2 bg-gray-400/20 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="w-full h-4 bg-gray-400/30 rounded-lg" />
        <div className="w-3/4 h-4 bg-gray-400/30 rounded-lg" />
      </div>
    </div>
  </div>
);

const SkeletonTrendingCard = ({ isDarkMode }: any) => (
  <div className={`p-6 rounded-2xl border animate-pulse ${isDarkMode ? 'bg-card-dark border-white/5' : 'bg-card-light border-black/5'}`}>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="w-12 h-3 bg-primary/20 rounded-md" />
        <div className="w-3 h-3 bg-primary/20 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="w-full h-5 bg-gray-400/20 rounded-md" />
      </div>
    </div>
  </div>
);

const DetailCard = ({ icon, title, desc, isDarkMode }: any) => (
    <div className={`p-8 rounded-2xl border transition-all duration-300 hover:shadow-lg group ${isDarkMode ? 'bg-card-dark border-white/5 hover:border-primary/30' : 'bg-card-light border-black/5 hover:bg-white'}`}>
    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-lg font-bold tracking-tight mb-2">{title}</h3>
    <p className="text-sm opacity-60 leading-relaxed font-medium">{desc}</p>
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
      className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 border ${
        isDarkMode 
          ? 'bg-card-dark border-white/5 hover:border-primary/50 backdrop-blur-md' 
          : 'bg-card-light border-black/5 hover:border-primary/30'
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
          className="w-full h-full object-cover transition-transform duration-[1s] group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        {!imageLoaded && (
          <div className={`absolute inset-0 animate-pulse ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent group-hover:opacity-60 transition-opacity" />
        
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 rounded-lg bg-primary/90 text-white text-[9px] font-bold uppercase tracking-widest shadow-lg">
            {article.category}
          </span>
        </div>
      </div>
      
      <div className="p-6 space-y-3">
        <h3 className={`text-xl font-bold leading-tight tracking-tight group-hover:text-primary transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          {article.title}
        </h3>
        <p className={`text-sm line-clamp-2 leading-relaxed opacity-60 font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          {article.summary}
        </p>
      </div>
        
        <div className={`pt-6 border-t border-current/5 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <span className="text-[8px] font-black italic">ID</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80 group-hover:text-primary transition-colors">{article.author}</span>
              <span className="text-[8px] font-bold opacity-80 uppercase tracking-[0.2em]">BrieflyX Editor</span>
            </div>
          </div>
          <div className="flex -space-x-1.5">
             {[1,2,3].map(i => (
               <div key={i} className="w-7 h-7 rounded-lg border-2 border-slate-950 bg-slate-800 overflow-hidden shadow-2xl">
                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=agent${i}${article.id}`} className="w-full h-full object-cover" />
               </div>
             ))}
          </div>
        </div>
      
      {/* Decorative Corner */}
      <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none overflow-hidden opacity-10">
        <div className="absolute top-0 right-0 w-16 h-[1px] bg-primary rotate-45 transform translate-x-4 -translate-y-4" />
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
    <section className={`mt-20 p-8 md:p-12 rounded-2xl border ${isDarkMode ? 'bg-card-dark border-white/5' : 'bg-card-light border-black/5'}`}>
      <div className="flex items-center gap-4 mb-12">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <MessageSquare size={24} />
        </div>
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Community Feedback</h3>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">{comments.length} Registered Signals</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-16 relative group">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? "Write your thoughts..." : "Login to join the discussion..."}
          className={`w-full p-6 pb-20 rounded-xl border resize-none focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium ${
            isDarkMode 
              ? 'bg-slate-900 border-white/10 text-white placeholder:text-white/20' 
              : 'bg-white border-black/10 text-black placeholder:text-black/30 shadow-sm'
          }`}
          rows={3}
          onClick={() => !user && openAuth()}
        />
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
           <div />
           <div className="flex items-center gap-4">
             {loading && <Loader2 className="animate-spin text-primary" size={20} />}
             <motion.button 
              type="submit" 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading || !text.trim()}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold uppercase tracking-widest text-[10px] transition-all disabled:opacity-30 shadow-lg"
            >
              Post Feedback
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
                    <span className="text-[9px] opacity-80 font-black uppercase tracking-widest">
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
            className="text-center py-20 opacity-80 flex flex-col items-center gap-4"
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
      className="max-w-3xl mx-auto"
    >
      <ChatWidget article={article} isDarkMode={isDarkMode} user={user} dailyStats={dailyStats} />
      
      <div className="space-y-12 mb-20 text-center">
        <div className="flex items-center justify-center gap-3">
          <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
            {article.category}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
            {article.createdAt?.toDate ? article.createdAt.toDate().toLocaleDateString() : 'Syncing...'}
          </span>
        </div>
        <h1 className={`text-4xl md:text-6xl font-black tracking-tight leading-[1.1] ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
          {article.title}
        </h1>
        <p className={`text-xl font-medium leading-relaxed max-w-2xl mx-auto ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>
          {article.summary}
        </p>
      </div>

      <div className="relative rounded-2xl overflow-hidden mb-20 aspect-video shadow-2xl">
        <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent" />
      </div>

      <div className="space-y-4 mb-32 relative">
        <div className="prose prose-lg max-w-none space-y-4">
          {lines.map((line, index) => {
            const isRead = progress ? index <= progress.lastLineRead : false;
            const isCurrent = progress ? index === progress.lastLineRead + 1 : index === 0;
            const isLocked = !isLoggedIn && index > 2;

            return (
              <motion.p
                key={index}
                onClick={() => isLoggedIn && onProgressUpdate(index, lines.length)}
                className={`text-lg md:text-xl font-medium leading-relaxed p-6 rounded-xl transition-all duration-300 relative group cursor-pointer ${
                  isCurrent 
                    ? 'bg-primary/[0.03] text-primary backdrop-blur-sm border-l-4 border-primary shadow-[inset_0_0_20px_rgba(37,99,237,0.02)]' 
                    : isRead ? 'opacity-30' : 'opacity-80'
                } ${isLocked ? 'blur-md select-none pointer-events-none' : ''}`}
              >
                {line}
                {isCurrent && (
                  <motion.div 
                    layoutId="current-line-glow"
                    className="absolute inset-0 bg-primary/5 rounded-xl -z-10 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}
              </motion.p>
            );
          })}
        </div>

        {!isLoggedIn && (
          <div className="absolute inset-x-0 bottom-0 top-[20%] bg-gradient-to-t from-bg-dark via-bg-dark/80 to-transparent z-20 flex flex-col items-center justify-end pb-20 px-6">
            <div className={`p-10 rounded-2xl ${isDarkMode ? 'bg-slate-900 border-white/5 shadow-2xl' : 'bg-white shadow-3xl border-black/5'} border text-center max-w-md w-full animate-in fade-in slide-in-from-bottom-10 duration-700`}>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-black mb-3 uppercase tracking-tight">Login to read full article</h2>
              <p className="opacity-60 mb-8 font-medium leading-relaxed">Join the BrieflyX community to unlock unlimited access and track your reading progress across all frequencies.</p>
              <button 
                onClick={openAuth}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
              >
                Sign Up / Login
              </button>
            </div>
          </div>
        )}
      </div>

      <CommentsSection 
        articleId={article.id} 
        isDarkMode={isDarkMode} 
        user={user} 
        openAuth={openAuth} 
      />
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
      author: 'Nexus Administration',
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
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12 border-b border-current/10 pb-12">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-[2px] bg-primary glow-blue" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">BrieflyX Administrator</span>
          </div>
          <h2 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.8]">Editor<br /><span className="text-primary italic">Dashboard.</span></h2>
        </div>
        <div className="flex flex-wrap gap-4">
           <div className="flex p-1 rounded-2xl bg-current/[0.03] border border-current/10 mr-4">
              <button 
                onClick={() => setViewMode('articles')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'articles' ? 'bg-primary text-white glow-blue' : 'opacity-80 hover:opacity-100'}`}
              >
                Articles
              </button>
              <button 
                onClick={() => setViewMode('users')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'users' ? 'bg-primary text-white glow-blue' : 'opacity-80 hover:opacity-100'}`}
              >
                Users
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
                <Plus size={18} /> New Article
              </motion.button>
              <button 
                onClick={handleSimulatePulse}
                className={`p-5 rounded-2xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 opacity-40 hover:opacity-100' : 'bg-black/5 border-black/10 opacity-40 hover:opacity-100'}`}
                title="Add Sample Data"
              >
                <Activity size={20} />
              </button>
              <button 
                onClick={handleReset}
                className="p-5 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 opacity-40 hover:opacity-100 transition-all"
                title="Reset Database"
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
                   <span className="text-[8px] font-black uppercase tracking-widest opacity-80 italic">Neural Auth Level</span>
                   <span className={`text-[10px] font-black uppercase tracking-widest italic ${u.isAdmin ? 'text-primary glow-blue' : 'opacity-60'}`}>
                     {u.isAdmin ? 'Administrator' : 'User'}
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
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-4">Article Content</label>
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
            <label className="text-[10px] font-black uppercase tracking-widest opacity-80 ml-4">Signal Frequency (Category)</label>
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
              <label className="text-[10px] font-black uppercase tracking-widest opacity-80">Trusted Sources</label>
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
            className={`relative w-full max-w-lg p-10 rounded-2xl border shadow-2xl ${isDarkMode ? 'bg-card-dark border-white/10 text-white' : 'bg-card-light border-black/10 text-slate-900'} overflow-hidden`}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
            
            <div className="text-center mb-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white mx-auto mb-6 shadow-xl transition-transform hover:rotate-3">
                <Newspaper size={32} />
              </div>
              <h2 className="text-3xl font-black tracking-tight mb-2 uppercase">
                {view === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-[10px] opacity-40 font-bold tracking-[0.2em] uppercase">BrieflyX Secure Access Protocol</p>
            </div>

            <div className="space-y-6">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-sm"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Continue with Google
              </button>

              <div className="flex items-center gap-4 opacity-10">
                <div className="h-px flex-1 bg-current" />
                <span className="text-[10px] font-bold uppercase tracking-widest">OR</span>
                <div className="h-px flex-1 bg-current" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <InputField label="Email Address" type="email" placeholder="you@example.com" value={email} onChange={setEmail} isDarkMode={true} required />
                <InputField label="Password" type="password" placeholder="••••••••" value={password} onChange={setPassword} isDarkMode={true} required />

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
        className={`relative w-full max-w-md p-8 rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-card-dark border-white/5 text-white' : 'bg-card-light border-black/5 text-black shadow-2xl'}`}
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
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-80">
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
      <div className="space-y-40">
        <section className="min-h-[70vh] flex flex-col justify-center relative">
          <div className="relative z-10 space-y-12 max-w-4xl">
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <div className="h-[2px] w-8 bg-primary" />
                <span className={`text-[10px] font-bold uppercase tracking-[0.4em] ${isDarkMode ? 'text-primary' : 'text-slate-900'}`}>The Future of News // v1.0</span>
              </motion.div>
              
              <div className="space-y-4">
                <motion.h1 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className={`text-6xl lg:text-8xl font-black tracking-tight leading-[1] ${isDarkMode ? 'text-white' : 'text-slate-950'}`}
                >
                  Minimal. <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Futuristic. News.</span>
                </motion.h1>
              </div>

              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 0.5 }}
                className={`text-xl font-medium leading-relaxed max-w-2xl ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
              >
                Stay ahead with BrieflyX. We synthesize complex global updates into clean, essential insights for the next generation of thinkers.
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-wrap gap-4"
            >
              <button 
                onClick={() => setActiveView('feed')}
                className="px-10 py-5 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold uppercase tracking-widest text-[11px] hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-3 shadow-xl"
              >
                View Feed
                <ArrowRight size={18} />
              </button>
              <button 
                onClick={() => setActiveView('about')}
                className={`px-10 py-5 rounded-2xl border border-current font-bold uppercase tracking-widest text-[11px] transition-all ${isDarkMode ? 'text-white border-white/20 hover:bg-white/5' : 'text-slate-900 border-slate-200 hover:bg-slate-50'}`}
              >
                Our Story
              </button>
            </motion.div>
          </div>
        </section>
        
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <DetailCard 
            icon={<Cpu size={24} />} 
            title="Smart Synthesis" 
            desc="AI-driven analysis that finds the core of every story instantly."
            isDarkMode={isDarkMode}
          />
          <DetailCard 
            icon={<ShieldCheck size={24} />} 
            title="Verified Truth" 
            desc="Exhaustive cross-referencing protocols to eliminate misinformation."
            isDarkMode={isDarkMode}
          />
          <DetailCard 
            icon={<Globe size={24} />} 
            title="Global Reach" 
            desc="Connecting signals from across the planet on a single unified grid."
            isDarkMode={isDarkMode}
          />
        </section>

        <section className="space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-current/10 pb-10">
            <div className="space-y-2">
              <h2 className="text-4xl font-bold tracking-tight">Top Stories</h2>
              <p className={`text-[10px] font-bold uppercase tracking-[0.4em] ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}>Currently trending across the network</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[8px] font-bold uppercase tracking-widest animate-pulse">Live Updates</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {loadingData ? (
              Array(4).fill(0).map((_, i) => <SkeletonTrendingCard key={i} isDarkMode={isDarkMode} />)
            ) : trending.length > 0 ? (
              trending.map(art => (
                <motion.div 
                  key={art.id}
                  whileHover={{ y: -8 }}
                  onClick={() => { setSelectedArticle(art); setActiveView('article'); }}
                  className={`p-8 rounded-2xl border cursor-pointer transition-all duration-300 group relative overflow-hidden flex flex-col justify-between aspect-square ${
                    isDarkMode ? 'bg-card-dark border-white/5 hover:border-primary/40' : 'bg-card-light border-black/5 hover:border-primary/20 shadow-xl'
                  }`}
                >
                  <div className="relative z-10">
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 mb-6 inline-block">
                      {art.category}
                    </span>
                    <h3 className={`text-xl font-bold leading-tight tracking-tight mb-4 group-hover:text-primary transition-colors line-clamp-3 ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                      {art.title}
                    </h3>
                  </div>
                  <div className="relative z-10 pt-6 border-t border-current/5 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{art.author}</span>
                    <ArrowUpRight size={16} className={`transition-all ${isDarkMode ? 'text-white' : 'text-slate-400'} group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1`} />
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center opacity-40 text-[10px] font-bold uppercase tracking-widest">Searching for signals...</div>
            )}
          </div>
        </section>

        <section className="space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-current/10 pb-10">
            <div className="space-y-2">
              <h2 className="text-4xl font-bold tracking-tight">Latest News</h2>
              <p className={`text-[10px] font-bold uppercase tracking-[0.4em] ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}>The freshest insights from around the globe</p>
            </div>
            <button onClick={() => setActiveView('feed')} className={`px-10 py-4 rounded-2xl border font-bold uppercase tracking-widest text-[10px] transition-all group flex items-center gap-4 ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'}`}>
              Explore More
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
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
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12 border-b border-current/10 pb-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-[2px] bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">Frequency: Broad-Spectrum</span>
            </div>
            <h2 className="text-6xl md:text-8xl font-black tracking-tight uppercase leading-[0.8]">News<br /><span className="text-primary">Feed.</span></h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFeedFilter('All')}
              className={`px-8 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                feedFilter === 'All'
                  ? 'bg-primary border-primary text-white shadow-lg'
                  : isDarkMode ? 'bg-white/5 border-white/5 opacity-40 hover:opacity-100 hover:bg-white/10' : 'bg-black/5 border-black/5 opacity-40 hover:opacity-100 hover:bg-black/10'
              }`}
            >
              All Signals
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFeedFilter(cat)}
                className={`px-8 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                  feedFilter === cat
                    ? 'bg-primary border-primary text-white shadow-lg'
                    : isDarkMode ? 'bg-white/5 border-white/5 opacity-40 hover:opacity-100 hover:bg-white/10' : 'bg-black/5 border-black/5 opacity-40 hover:opacity-100 hover:bg-black/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </header>

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
    <div className="max-w-5xl mx-auto space-y-20">
      <header className="text-center space-y-4">
        <h2 className="text-6xl md:text-8xl font-black tracking-tight leading-none">Briefly<span className="text-primary italic">X.</span></h2>
        <p className="text-sm font-bold tracking-[0.4em] uppercase opacity-40">Modern Insights for the Global Citizen</p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-6">
          <h3 className="text-3xl font-bold tracking-tight">The Future of News.</h3>
          <p className={`text-lg leading-relaxed font-medium ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>
            In an era defined by noise, BrieflyX delivers signal. We leverage advanced synthesis to provide hyper-relevant news across tech, science, and world events.
          </p>
          <div className="flex gap-12 pt-4">
            <div className="space-y-1">
              <span className="text-2xl font-black text-primary">100k+</span>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Readers</p>
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-black text-primary">Global</span>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Network</p>
            </div>
          </div>
        </div>
        <div className={`p-8 rounded-2xl border ${isDarkMode ? 'bg-card-dark border-white/5' : 'bg-card-light border-black/5 shadow-xl'}`}>
           <div className="aspect-square rounded-xl overflow-hidden bg-primary/5 flex items-center justify-center">
              <Newspaper size={80} className="text-primary opacity-20" />
           </div>
        </div>
      </div>
    </div>
  );

  const renderContact = () => (
    <div className="max-w-2xl mx-auto space-y-12">
      <header className="text-center space-y-4">
        <h2 className="text-6xl md:text-7xl font-black tracking-tight leading-none">Contact.</h2>
        <p className="text-sm font-bold tracking-[0.4em] uppercase opacity-40">We'd love to hear from you</p>
      </header>

      <div className={`p-10 rounded-2xl border ${isDarkMode ? 'bg-card-dark border-white/5' : 'bg-card-light border-black/5 shadow-xl'}`}>
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Message sent successfully."); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Name" placeholder="John Doe" isDarkMode={isDarkMode} />
            <InputField label="Email" placeholder="john@example.com" isDarkMode={isDarkMode} />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest ml-4 opacity-40">Message</label>
            <textarea 
              className={`w-full px-6 py-4 rounded-xl outline-none transition-all font-medium h-32 resize-none ${
                isDarkMode 
                  ? 'bg-white/5 border border-white/5 focus:border-primary text-white' 
                  : 'bg-black/[0.02] border border-black/5 focus:border-primary text-black'
              }`}
              placeholder="Tell us what's on your mind..."
            />
          </div>
          
          <button className="w-full py-4 rounded-xl bg-primary text-white font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-3">
            Send Message
            <Send size={16} />
          </button>
        </form>
      </div>

      <div className="flex justify-center gap-10 opacity-30">
        <Twitter className="hover:text-primary transition-colors cursor-pointer" size={20} />
        <Github className="hover:text-primary transition-colors cursor-pointer" size={20} />
        <Instagram className="hover:text-primary transition-colors cursor-pointer" size={20} />
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${isDarkMode ? 'bg-bg-dark text-text-dark' : 'bg-bg-light text-text-light'} font-sans selection:bg-primary selection:text-white relative overflow-x-hidden`}>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
        <div className={`absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full blur-[120px] ${isDarkMode ? 'bg-primary/10' : 'bg-primary/5'}`} />
        <div className={`absolute bottom-[-10%] left-[-10%] w-[30vw] h-[30vw] rounded-full blur-[120px] ${isDarkMode ? 'bg-accent/10' : 'bg-accent/5'}`} />
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
      
      <main className="pt-32 pb-40 max-w-7xl mx-auto px-6 md:px-12 relative z-10">
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
                  <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto">
                    <ShieldAlert size={32} />
                  </div>
                  <h2 className="text-4xl font-bold tracking-tight">Access Denied</h2>
                  <p className="opacity-40 max-w-md mx-auto">You do not have the required permissions to access the BrieflyX administration hub.</p>
                  <button onClick={() => setActiveView('home')} className="px-10 py-4 rounded-xl border border-current font-bold uppercase tracking-widest text-[10px] hover:bg-current hover:text-bg-dark transition-all">Return to Dashboard</button>
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
