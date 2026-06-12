import React from 'react';
import { BookOpen, Crown, Sparkles, Users, ChevronRight, UserRound } from 'lucide-react';
import { FaInstagram, FaTiktok, FaXTwitter } from 'react-icons/fa6';

interface LandingHeroProps {
  onStart: () => void;
  onLogin: () => void;
  onNavigateToDemo: (screen: string) => void;
  onNavigateHome: () => void;
}

export default function LandingHero({ onStart, onLogin, onNavigateToDemo, onNavigateHome }: LandingHeroProps) {
  return (
    <div className="flex flex-col min-h-screen bg-brand-background text-brand-on-background pb-12 pt-[72px]">
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-[72px] items-center justify-between gap-4 border-b border-gray-100 bg-white px-6 shadow-sm">
        <button type="button" onClick={onNavigateHome} className="flex shrink-0 items-center gap-2 text-brand-primary cursor-pointer">
          <BookOpen className="h-5 w-5" fill="currentColor" />
          <span className="font-sans text-lg font-extrabold tracking-tight">StudySync</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onStart}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#f3ebff] px-3 py-2 text-xs font-extrabold text-brand-secondary transition-colors hover:bg-[#e9ddff]"
          >
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">Premium</span>
          </button>
          <button
            onClick={onLogin}
            aria-label="Open profile login"
            title="Log in"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary text-white transition-colors hover:bg-brand-primary-container cursor-pointer"
          >
            <UserRound className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="max-w-[1200px] mx-auto px-6 mt-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Premium Pitch */}
        <div className="lg:col-span-7 flex flex-col pt-4">
          {/* Accent Badge */}
          <div className="inline-flex items-center gap-1.5 self-start px-3.5 py-1.5 rounded-full bg-brand-secondary-container/10 text-brand-secondary text-xs font-semibold tracking-wide mb-6">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Sync Your Mind, Ace Your Grind.</span>
          </div>

          <h1 className="font-sans font-extrabold text-4xl sm:text-5xl text-brand-on-surface tracking-tight leading-tight mb-6">
            Find the right <br />
            <span className="relative text-brand-primary">
              study partner
              <span className="absolute -bottom-1 left-0 w-full h-1 bg-brand-secondary/35 rounded-full" />
            </span> <br />
            faster.
          </h1>

          <p className="text-brand-on-surface-variant font-sans text-md sm:text-lg leading-relaxed mb-8 max-w-xl">
            Stop struggling alone. Connect with high-achieving peers, organize collaborative study sessions, and reach your academic goals with ease.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <button
              onClick={onStart}
              className="px-8 py-4 bg-brand-primary text-white font-semibold text-base rounded-xl shadow-md hover:bg-brand-primary-container hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
            >
              Get Started
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => onNavigateToDemo('product-overview')}
              className="px-8 py-4 bg-white border border-brand-outline-variant text-brand-on-surface-variant font-semibold text-base rounded-xl hover:bg-brand-surface-low hover:text-brand-on-surface hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center cursor-pointer"
            >
              Learn More
            </button>
          </div>

          {/* Joined Platform section */}
          <div>
            <h3 className="text-xs font-bold tracking-wider text-brand-outline uppercase mb-4">
              STUDENTS JOIN US FROM
            </h3>
            <div className="flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white text-brand-on-surface text-sm border border-gray-100 shadow-2xs">
                <FaInstagram size={16} color="#ec4899" />
                Instagram
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white text-brand-on-surface text-sm border border-gray-100 shadow-2xs">
                <FaTiktok size={14} color="#000000" />
                TikTok
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white text-brand-on-surface text-sm border border-gray-100 shadow-2xs">
                <FaXTwitter size={14} color="#000000" />
                X
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Mockup Preview with floating badges */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative w-full">
          {/* Main Visual Image Wrapper */}
          <div className="w-full max-w-[420px] rounded-[2rem] bg-brand-surface-container-high p-4 shadow-xl border border-white/40 overflow-hidden relative">
            <div className="aspect-[4/5] rounded-[1.5rem] overflow-hidden relative bg-slate-900 group">
              <img
                src="https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=600"
                alt="Students studying collaboratively"
                className="w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

              {/* Inner UI element overlays matching screen */}
              <div className="absolute bottom-6 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/20 flex items-center gap-3 animate-bounce-slow">
                <div className="w-10 h-10 rounded-xl bg-brand-secondary-container/10 flex items-center justify-center text-brand-secondary shrink-0">
                  <Users className="w-5 h-5 text-brand-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-brand-on-surface tracking-tight">Example compatibility preview</p>
                  <p className="text-[11px] text-brand-on-surface-variant font-mono">Calculus 101 <span className="text-brand-secondary font-bold">High compatibility</span></p>
                </div>
              </div>
            </div>

            {/* Illustrative workflow preview */}
            <div className="absolute -bottom-2 left-6 right-6 bg-[#263143] text-[#ecf1ff] text-xs py-3 px-4 rounded-xl flex items-center gap-2 justify-center shadow-lg border border-slate-700">
              <span className="font-bold tracking-wider uppercase text-[10px]">Illustrative workflow preview</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
