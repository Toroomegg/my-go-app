import React, { useState } from 'react';
import { PlusCircle, Save, Trash2, Download, Upload, Check, Sparkles, HelpCircle, Layers } from 'lucide-react';
import { Point, StoneColor, TsumegoProblem, VariationNode, ProblemCategory } from '../types/go';
import { createEmptyBoard, BoardMatrix, playMove } from '../engine/goRules';
import { GoBoard } from './GoBoard';
import { useUser } from '../context/UserContext';
import { soundManager } from '../utils/sound';

export const ProblemCreator: React.FC = () => {
  const { activeUser, addCustomProblem, deleteCustomProblem } = useUser();

  const [boardSize, setBoardSize] = useState<number>(9);
  const [setupMode, setSetupMode] = useState<'stones' | 'solution'>('stones');
  const [placementColor, setPlacementColor] = useState<StoneColor>('black');

  // Problem metadata
  const [title, setTitle] = useState<string>('自訂死活練習題');
  const [level, setLevel] = useState<string>('5k');
  const [category, setCategory] = useState<ProblemCategory>('life');
  const [description, setDescription] = useState<string>('黑先。請找出做活要點。');
  const [hint, setHint] = useState<string>('注意中央樞紐急所。');
  const [commentary, setCommentary] = useState<string>('');

  // Initial stones
  const [blackStones, setBlackStones] = useState<Point[]>([]);
  const [whiteStones, setWhiteStones] = useState<Point[]>([]);

  // Solution sequence moves
  const [solutionMoves, setSolutionMoves] = useState<{ point: Point; color: StoneColor }[]>([]);

  // Board representation
  const board: BoardMatrix = React.useMemo(() => {
    const b = createEmptyBoard(boardSize);
    blackStones.forEach((p) => {
      if (b[p.y] && b[p.y][p.x] !== undefined) b[p.y][p.x] = 'black';
    });
    whiteStones.forEach((p) => {
      if (b[p.y] && b[p.y][p.x] !== undefined) b[p.y][p.x] = 'white';
    });

    if (setupMode === 'solution') {
      solutionMoves.forEach((m) => {
        if (b[m.point.y] && b[m.point.y][m.point.x] !== undefined) {
          b[m.point.y][m.point.x] = m.color;
        }
      });
    }

    return b;
  }, [boardSize, blackStones, whiteStones, setupMode, solutionMoves]);

  const handleBoardClick = (pt: Point) => {
    soundManager.playStoneClick();

    if (setupMode === 'stones') {
      // Toggle stone placement
      const isBlack = blackStones.some((p) => p.x === pt.x && p.y === pt.y);
      const isWhite = whiteStones.some((p) => p.x === pt.x && p.y === pt.y);

      if (isBlack) {
        setBlackStones((prev) => prev.filter((p) => !(p.x === pt.x && p.y === pt.y)));
        if (placementColor === 'white') {
          setWhiteStones((prev) => [...prev, pt]);
        }
      } else if (isWhite) {
        setWhiteStones((prev) => prev.filter((p) => !(p.x === pt.x && p.y === pt.y)));
        if (placementColor === 'black') {
          setBlackStones((prev) => [...prev, pt]);
        }
      } else {
        if (placementColor === 'black') {
          setBlackStones((prev) => [...prev, pt]);
        } else {
          setWhiteStones((prev) => [...prev, pt]);
        }
      }
    } else {
      // Recording solution sequence
      const nextColor: StoneColor = solutionMoves.length % 2 === 0 ? 'black' : 'white';
      setSolutionMoves((prev) => [...prev, { point: pt, color: nextColor }]);
    }
  };

  const handleClearAll = () => {
    setBlackStones([]);
    setWhiteStones([]);
    setSolutionMoves([]);
  };

  const handleSaveProblem = () => {
    if (blackStones.length === 0 && whiteStones.length === 0) {
      alert('請先在棋盤上放置初始棋子！');
      return;
    }
    if (solutionMoves.length === 0) {
      alert('請至少錄製一步正解手數！');
      return;
    }

    // Convert linear solution moves into tree
    const rootMove = solutionMoves[0];
    const tree: VariationNode = {
      x: rootMove.point.x,
      y: rootMove.point.y,
      color: rootMove.color,
      isCorrect: true,
      message: '正解！成功破解死活難題！',
    };

    if (solutionMoves.length > 1) {
      const respMove = solutionMoves[1];
      tree.response = {
        x: respMove.point.x,
        y: respMove.point.y,
        color: respMove.color,
      };

      if (solutionMoves.length > 2) {
        const followMove = solutionMoves[2];
        tree.response.branches = [
          {
            x: followMove.point.x,
            y: followMove.point.y,
            color: followMove.color,
            isCorrect: true,
            message: '正解！妙手連續追擊破敵！',
          },
        ];
      }
    }

    let ratingPoints = 1200;
    if (level.includes('D')) {
      const dan = parseInt(level.replace(/[^0-9]/g, '') || '1', 10);
      ratingPoints = 1700 + dan * 150;
    } else {
      const kyu = parseInt(level.replace(/[^0-9]/g, '') || '5', 10);
      ratingPoints = Math.max(500, 1600 - kyu * 80);
    }

    const newProblem: TsumegoProblem = {
      id: `custom-tsumego-${Date.now()}`,
      title: title.trim() || '自訂死活題',
      level,
      ratingPoints,
      category,
      boardSize,
      initialStones: {
        black: blackStones,
        white: whiteStones,
      },
      playerColor: 'black',
      description,
      hint,
      commentary,
      solutionTree: [tree],
    };

    addCustomProblem(newProblem);
    soundManager.playSuccess();
    alert(`題庫「${newProblem.title}」已成功新增！可前往死活題分頁進行研習！`);
    handleClearAll();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm tracking-wide">
          <Layers className="w-4 h-4" /> 擴充模組 ｜ 題庫創作者工作室
        </div>
        <h2 className="text-2xl font-bold text-stone-100">
          自訂死活題與題庫擴充創作
        </h2>
        <p className="text-stone-400 text-xs leading-relaxed max-w-2xl">
          支援自由佈置初始棋形、錄製正解應手變化樹，建立專屬於你的題目或教學題庫，並無縫整合至死活棋訓練引擎中。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Board Area */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          {/* Palette / Mode controls */}
          <div className="w-full flex flex-wrap items-center justify-between mb-4 gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSetupMode('stones')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  setupMode === 'stones'
                    ? 'bg-amber-600 text-stone-950 shadow'
                    : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                1. 擺設初始棋子
              </button>
              <button
                onClick={() => setSetupMode('solution')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  setupMode === 'solution'
                    ? 'bg-amber-600 text-stone-950 shadow'
                    : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                2. 錄製正解手數 ({solutionMoves.length})
              </button>
            </div>

            {setupMode === 'stones' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400">當前擺放：</span>
                <button
                  onClick={() => setPlacementColor('black')}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 ${
                    placementColor === 'black' ? 'bg-stone-950 text-stone-100 ring-1 ring-amber-500' : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-950 ring-1 ring-stone-600" /> 黑子
                </button>
                <button
                  onClick={() => setPlacementColor('white')}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 ${
                    placementColor === 'white' ? 'bg-stone-200 text-stone-950 ring-1 ring-amber-500' : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-100 ring-1 ring-stone-400" /> 白子
                </button>
              </div>
            )}
          </div>

          <GoBoard
            board={board}
            boardSize={boardSize}
            onPointClick={handleBoardClick}
            hoverColor={setupMode === 'stones' ? placementColor : (solutionMoves.length % 2 === 0 ? 'black' : 'white')}
            interactive={true}
            className="max-w-full"
          />

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition-colors"
            >
              清空重置
            </button>
          </div>
        </div>

        {/* Right Form Area */}
        <div className="lg:col-span-5 bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-amber-400" />
            題目屬性設定
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-stone-400 block mb-1">題目標題</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 text-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                placeholder="例如：角隅破眼死活、經典手筋"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-stone-400 block mb-1">目標難度</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 text-stone-200 rounded-lg p-2.5 focus:outline-none"
                >
                  <option value="15k">15級 (15k)</option>
                  <option value="10k">10級 (10k)</option>
                  <option value="5k">5級 (5k)</option>
                  <option value="1k">1級 (1k)</option>
                  <option value="1D">1段 (1D)</option>
                  <option value="3D">3段 (3D)</option>
                  <option value="5D">5段 (5D)</option>
                </select>
              </div>

              <div>
                <label className="text-stone-400 block mb-1">題型分類</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProblemCategory)}
                  className="w-full bg-stone-800 border border-stone-700 text-stone-200 rounded-lg p-2.5 focus:outline-none"
                >
                  <option value="life">黑先活 (Make Life)</option>
                  <option value="kill">黑先殺 (Kill)</option>
                  <option value="tesuji">手筋妙手 (Tesuji)</option>
                  <option value="ko">劫爭 (Ko Fight)</option>
                  <option value="seki">雙活 (Seki)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-stone-400 block mb-1">問題提示說明</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 text-stone-200 rounded-lg p-2.5 focus:outline-none"
                placeholder="例如：黑先。黑棋如何走出兩眼活棋？"
              />
            </div>

            <div>
              <label className="text-stone-400 block mb-1">要點提示 (Hint)</label>
              <input
                type="text"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 text-stone-200 rounded-lg p-2.5 focus:outline-none"
                placeholder="例如：注意中央直三要害"
              />
            </div>

            <div>
              <label className="text-stone-400 block mb-1">棋理詳解與著手注釋 (Commentary)</label>
              <textarea
                rows={3}
                value={commentary}
                onChange={(e) => setCommentary(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 text-stone-200 rounded-lg p-2.5 focus:outline-none"
                placeholder="解析為什麼這手是正解、白棋應手與後續棋理變化..."
              />
            </div>
          </div>

          <button
            onClick={handleSaveProblem}
            className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-600/20"
          >
            <Save className="w-4 h-4" /> 儲存發佈至當前棋手題庫
          </button>

          {/* Current Custom Problems list */}
          {activeUser.customProblems.length > 0 && (
            <div className="pt-4 border-t border-stone-800 space-y-2">
              <div className="font-bold text-stone-300 text-xs">
                當前棋手自訂題庫 ({activeUser.customProblems.length})
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {activeUser.customProblems.map((cp) => (
                  <div
                    key={cp.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-stone-800/50 border border-stone-800 text-xs"
                  >
                    <div className="truncate text-stone-300 font-medium">
                      {cp.title} <span className="text-amber-400 text-[10px]">({cp.level})</span>
                    </div>
                    <button
                      onClick={() => deleteCustomProblem(cp.id)}
                      className="text-stone-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
