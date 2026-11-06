import React, { useState } from 'react';
import {
  User, Plus, Check, Trash2, Download, Upload, X, Shield,
  Award, BookOpen, CheckCircle2, Trophy, Sparkles
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { soundManager } from '../utils/sound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_OPTIONS = ['🥋', '🎋', '🪨', '🦅', '🐉', '🌸', '🍵', '🏯', '⚔️', '🌊'];

export const UserProfileModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    users,
    activeUser,
    switchUser,
    createUser,
    deleteUser,
    exportData,
    importData
  } = useUser();

  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newAvatar, setNewAvatar] = useState<string>('🥋');
  const [newRank, setNewRank] = useState<string>('10級 (10k)');

  if (!isOpen) return null;

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createUser(newName.trim(), newRank, newAvatar);
    soundManager.playSuccess();
    setNewName('');
    setIsCreating(false);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yidao-go-profiles-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const ok = importData(text);
        if (ok) {
          soundManager.playSuccess();
          alert('成功匯入棋手資料檔案！');
        } else {
          alert('匯入失敗，請確認 JSON 檔案格式是否正確。');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-100">棋手檔案管理中心</h3>
              <p className="text-xs text-stone-400">各使用者享有獨立段位評定、死活成績與棋譜紀錄</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Active User Card Summary */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-stone-800/80 to-stone-850 border border-amber-500/40 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <span className="text-3xl p-2 rounded-xl bg-stone-900 border border-stone-700/60 shadow">
                {activeUser.avatar}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-100 text-base">{activeUser.name}</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {activeUser.currentRank}
                  </span>
                </div>
                <div className="text-xs text-stone-400 mt-1 flex items-center gap-3 font-mono">
                  <span>積分: {activeUser.eloRating}</span>
                  <span>•</span>
                  <span>通關死活: {activeUser.solvedProblemIds.length} 題</span>
                  <span>•</span>
                  <span>對局譜: {activeUser.savedGames.length} 局</span>
                </div>
              </div>
            </div>
          </div>

          {/* User List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                所有棋手列表 ({users.length})
              </span>
              {!isCreating && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-2.5 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> 新增棋手
                </button>
              )}
            </div>

            {/* Create form */}
            {isCreating && (
              <form onSubmit={handleCreateUser} className="p-4 rounded-2xl bg-stone-800/90 border border-amber-500/60 space-y-3">
                <div className="font-bold text-xs text-amber-300">建立新棋手檔案</div>

                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">棋手暱稱</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="例如：弈海行者、阿呆"
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">初選程度 / 預估段位</label>
                  <select
                    value={newRank}
                    onChange={(e) => setNewRank(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none"
                  >
                    <option value="18級 (18k)">啟蒙初學 (18k)</option>
                    <option value="10級 (10k)">入門進階 (10k)</option>
                    <option value="5級 (5k)">基礎紮實 (5k)</option>
                    <option value="1級 (1k)">衝段實力 (1k)</option>
                    <option value="1段 (1D)">業餘一段 (1D)</option>
                    <option value="3段 (3D)">業餘三段 (3D)</option>
                    <option value="5段 (5D)">業餘高段 (5D)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">頭像徽章</label>
                  <div className="flex gap-2 flex-wrap">
                    {AVATAR_OPTIONS.map((av) => (
                      <button
                        type="button"
                        key={av}
                        onClick={() => setNewAvatar(av)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
                          newAvatar === av
                            ? 'bg-amber-500/30 border border-amber-400 scale-110'
                            : 'bg-stone-900 border border-stone-700'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-3 py-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-300 text-xs"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs"
                  >
                    確認建立
                  </button>
                </div>
              </form>
            )}

            {/* List */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {users.map((u) => {
                const isActive = u.id === activeUser.id;
                return (
                  <div
                    key={u.id}
                    onClick={() => switchUser(u.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-stone-800 border-amber-500/80 ring-1 ring-amber-500/40'
                        : 'bg-stone-850 hover:bg-stone-800 border-stone-800 text-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{u.avatar}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-100">{u.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-700 text-amber-300">
                            {u.currentRank}
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                          積分: {u.eloRating} ｜ 通關: {u.solvedProblemIds.length} 題
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          使用中
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            switchUser(u.id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-stone-700 hover:bg-amber-600 hover:text-stone-950 text-stone-300 text-xs font-semibold transition-colors"
                        >
                          切換
                        </button>
                      )}

                      {users.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`確定要刪除棋手「${u.name}」的所有紀錄嗎？`)) {
                              deleteUser(u.id);
                            }
                          }}
                          className="p-1 rounded text-stone-500 hover:text-red-400 transition-colors"
                          title="刪除棋手"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="pt-4 border-t border-stone-800 flex items-center justify-between text-xs">
            <span className="text-stone-400">數據備份與移轉</span>
            <div className="flex items-center gap-2">
              <label className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium cursor-pointer flex items-center gap-1.5 transition-colors">
                <Upload className="w-3.5 h-3.5" /> 匯入備份
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleExport}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> 匯出備份 JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
