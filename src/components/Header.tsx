import React, { useState } from 'react';
import { Award, BookOpen, Swords, PlusCircle, Volume2, VolumeX, ChevronDown, Sparkles, Bot } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { soundManager } from '../utils/sound';

export type ActiveTab = 'assessment' | 'tsumego' | 'ai-play' | 'play' | 'creator';

interface Props {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenProfileModal: () => void;
}

export const Header: React.FC<Props> = ({ activeTab, onTabChange, onOpenProfileModal }) => {
  const { activeUser } = useUser();
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundManager.enabled);

  const toggleSound = () => {
    soundManager.enabled = !soundManager.enabled;
    setSoundEnabled(soundManager.enabled);
    if (soundManager.enabled) {
      soundManager.playStoneClick();
    }
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'assessment', label: '段位實力鑑定', icon: <Award className="w-4 h-4" /> },
    { id: 'tsumego', label: '死活棋練習', icon: <BookOpen className="w-4 h-4" />, badge: '自適應' },
    { id: 'ai-play', label: 'AI 對弈大廳', icon: <Bot className="w-4 h-4" />, badge: '熱門' },
    { id: 'play', label: '歷史棋譜庫', icon: <Swords className="w-4 h-4" /> },
    { id: 'creator', label: '題庫擴充創作', icon: <PlusCircle className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-stone-950/80 backdrop-blur-md border-b border-stone-800/80 text-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 border border-amber-500/50 flex items-center justify-center shadow-lg shadow-amber-900/40">
            {/* Yin yang / Go stones motif */}
            <div className="flex items-center -space-x-1">
              <span className="w-3.5 h-3.5 rounded-full bg-stone-950 ring-1 ring-stone-700 shadow" />
              <span className="w-3.5 h-3.5 rounded-full bg-stone-100 ring-1 ring-stone-400 shadow" />
            </div>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-extrabold tracking-tight text-stone-100 flex items-center gap-1.5">
              弈道 <span className="text-amber-400 font-serif font-normal text-xs tracking-widest border-l border-stone-700 pl-1.5">圍棋研習院</span>
            </h1>
            <p className="text-[10px] text-stone-400">段位鑑定 • 自適應死活 • 棋譜記錄</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  soundManager.playStoneClick();
                  onTabChange(item.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shrink-0 transition-all ${
                  isActive
                    ? 'bg-amber-600 text-stone-950 shadow-md shadow-amber-600/30 font-bold'
                    : 'text-stone-300 hover:text-stone-100 hover:bg-stone-850'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`hidden md:inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      isActive ? 'bg-amber-800 text-amber-200' : 'bg-stone-800 text-amber-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right tools: Sound toggle & User Profile Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-stone-900 border-stone-700 text-stone-300 hover:text-amber-400'
                : 'bg-stone-900 border-stone-800 text-stone-500'
            }`}
            title={soundEnabled ? '音效已開啟 (點擊關閉)' : '音效已關閉 (點擊開啟)'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Active User Switcher Pill */}
          <button
            onClick={onOpenProfileModal}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-700/80 transition-all text-left shadow-sm group"
          >
            <span className="text-lg leading-none">{activeUser.avatar}</span>
            <div className="hidden md:block">
              <div className="text-xs font-bold text-stone-200 group-hover:text-amber-300 transition-colors flex items-center gap-1">
                {activeUser.name}
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </div>
              <div className="text-[10px] text-amber-400 font-mono">
                {activeUser.currentRank} ({activeUser.eloRating})
              </div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
