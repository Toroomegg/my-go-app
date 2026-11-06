import React, { useState } from 'react';
import { UserProvider, useUser } from './context/UserContext';
import { Header, ActiveTab } from './components/Header';
import { RankAssessment } from './components/RankAssessment';
import { TsumegoTrainer } from './components/TsumegoTrainer';
import { PlayVsAi } from './components/PlayVsAi';
import { GamePlayAndKifu } from './components/GamePlayAndKifu';
import { ProblemCreator } from './components/ProblemCreator';
import { UserProfileModal } from './components/UserProfileModal';

function MainApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ai-play');
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#110f0d] text-stone-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Background subtle texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #fff 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenProfileModal={() => setProfileModalOpen(true)}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full relative z-10">
        {activeTab === 'assessment' && (
          <RankAssessment onGoToTsumego={() => setActiveTab('tsumego')} />
        )}
        {activeTab === 'tsumego' && <TsumegoTrainer />}
        {activeTab === 'ai-play' && (
          <PlayVsAi onGoToRecords={() => setActiveTab('play')} />
        )}
        {activeTab === 'play' && <GamePlayAndKifu />}
        {activeTab === 'creator' && <ProblemCreator />}
      </main>

      <footer className="py-6 border-t border-stone-800/80 text-center text-xs text-stone-500 space-y-1">
        <div>
          弈道 • 圍棋段位鑑定與死活棋研習院 ｜ 「略懂黑白玄機處，千古無同一局棋」
        </div>
        <div className="text-[11px] text-stone-600">
          支援多棋手獨立檔案記錄 ｜ 棋力自適應死活練習 ｜ SGF 棋譜匯出匯入
        </div>
      </footer>

      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <MainApp />
    </UserProvider>
  );
}
