import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles, CheckCircle2, XCircle, RotateCcw, Lightbulb,
  ChevronLeft, ChevronRight, Star, Shuffle, Eye, BookOpen,
  Filter, Layers, Zap, Flame, Award
} from 'lucide-react';
import { TsumegoProblem, VariationNode, Point } from '../types/go';
import { INITIAL_TSUMEGO_PROBLEMS } from '../data/tsumegoData';
import {
  createEmptyBoard, BoardMatrix, playMove, cloneBoard,
  getAdjacentPoints
} from '../engine/goRules';
import { GoBoard, BoardMarker } from './GoBoard';
import { useUser } from '../context/UserContext';
import { soundManager } from '../utils/sound';

export const TsumegoTrainer: React.FC = () => {
  const {
    activeUser,
    recordTsumegoAttempt,
    toggleStarProblem
  } = useUser();

  // Combine initial built-in problems + user's custom created/imported problems
  const allProblems: TsumegoProblem[] = useMemo(() => {
    return [...INITIAL_TSUMEGO_PROBLEMS, ...activeUser.customProblems];
  }, [activeUser.customProblems]);

  // Mode: Adaptive (Auto-matched by user level) vs Manual select
  const [isAdaptiveMode, setIsAdaptiveMode] = useState<boolean>(true);
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [currentProblemIndex, setCurrentProblemIndex] = useState<number>(0);

  // Filtered problem set
  const filteredProblems = useMemo(() => {
    let list = [...allProblems];

    if (isAdaptiveMode) {
      // Sort and prioritize problems close to user's current Elo
      const userElo = activeUser.eloRating || 1000;
      list.sort((a, b) => {
        const diffA = Math.abs(a.ratingPoints - userElo);
        const diffB = Math.abs(b.ratingPoints - userElo);
        return diffA - diffB;
      });
    } else {
      if (selectedLevelFilter !== 'all') {
        if (selectedLevelFilter === 'beginner') {
          list = list.filter((p) => p.ratingPoints <= 950);
        } else if (selectedLevelFilter === 'intermediate') {
          list = list.filter((p) => p.ratingPoints > 950 && p.ratingPoints <= 1350);
        } else if (selectedLevelFilter === 'dan-challenger') {
          list = list.filter((p) => p.ratingPoints > 1350 && p.ratingPoints <= 1750);
        } else if (selectedLevelFilter === 'dan-master') {
          list = list.filter((p) => p.ratingPoints > 1750);
        } else if (selectedLevelFilter === 'custom') {
          list = list.filter((p) => activeUser.customProblems.some((cp) => cp.id === p.id));
        }
      }

      if (selectedCategoryFilter !== 'all') {
        list = list.filter((p) => p.category === selectedCategoryFilter);
      }
    }

    return list.length > 0 ? list : allProblems;
  }, [allProblems, isAdaptiveMode, selectedLevelFilter, selectedCategoryFilter, activeUser.eloRating, activeUser.customProblems]);

  const currentProblem: TsumegoProblem = filteredProblems[currentProblemIndex] || allProblems[0];

  // Board state for active problem
  const [board, setBoard] = useState<BoardMatrix>(() => createEmptyBoard(currentProblem.boardSize || 9));
  const [currentVariationPath, setCurrentVariationPath] = useState<VariationNode[]>([]);
  const [lastMovePoint, setLastMovePoint] = useState<Point | null>(null);
  const [solveStatus, setSolveStatus] = useState<'solving' | 'success' | 'failure'>('solving');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showSolutionExplanation, setShowSolutionExplanation] = useState<boolean>(false);
  const [cropView, setCropView] = useState<boolean>(true);
  const [aiThinking, setAiThinking] = useState<boolean>(false);

  // Initialize or reset board when problem changes
  const resetProblemState = useCallback((prob: TsumegoProblem) => {
    const b = createEmptyBoard(prob.boardSize || 9);
    prob.initialStones.black.forEach((p) => {
      if (b[p.y] && b[p.y][p.x] !== undefined) b[p.y][p.x] = 'black';
    });
    prob.initialStones.white.forEach((p) => {
      if (b[p.y] && b[p.y][p.x] !== undefined) b[p.y][p.x] = 'white';
    });

    setBoard(b);
    setCurrentVariationPath([]);
    setLastMovePoint(null);
    setSolveStatus('solving');
    setStatusMessage('');
    setShowHint(false);
    setShowSolutionExplanation(false);
    setAiThinking(false);
  }, []);

  useEffect(() => {
    if (currentProblem) {
      resetProblemState(currentProblem);
    }
  }, [currentProblem, resetProblemState]);

  // Handle player stone click
  const handlePointClick = (pt: Point) => {
    if (solveStatus !== 'solving' || aiThinking) return;

    // Check if cell is occupied
    if (board[pt.y][pt.x] !== null) return;

    // Execute move in Go Rules engine
    const playRes = playMove(board, pt, currentProblem.playerColor);
    if (!playRes.valid || !playRes.newBoard) {
      setStatusMessage(playRes.reason || '非法著手');
      soundManager.playFailure();
      return;
    }

    // Play stone sound & capture sound if any
    soundManager.playStoneClick();
    if (playRes.captured.length > 0) {
      setTimeout(() => soundManager.playCapture(), 60);
    }

    setBoard(playRes.newBoard);
    setLastMovePoint(pt);

    // Validate with solutionTree
    // Determine active available branches
    let candidateBranches: VariationNode[] = currentProblem.solutionTree;
    if (currentVariationPath.length > 0) {
      const lastNode = currentVariationPath[currentVariationPath.length - 1];
      if (lastNode.response && lastNode.response.branches) {
        candidateBranches = lastNode.response.branches;
      } else if (lastNode.branches) {
        candidateBranches = lastNode.branches;
      } else {
        candidateBranches = [];
      }
    }

    const matchedBranch = candidateBranches.find((node) => node.x === pt.x && node.y === pt.y);

    if (!matchedBranch) {
      // Wrong move
      setSolveStatus('failure');
      setStatusMessage('此著手偏離正解，未擊中要害。白棋有應手化解。');
      soundManager.playFailure();
      recordTsumegoAttempt(currentProblem.id, false, -10);
      return;
    }

    // Matched branch!
    const newPath = [...currentVariationPath, matchedBranch];
    setCurrentVariationPath(newPath);

    // If this node is already terminal and correct
    if (matchedBranch.isCorrect && !matchedBranch.response) {
      setSolveStatus('success');
      setStatusMessage(matchedBranch.message || '正解！漂亮破解死活難題！');
      soundManager.playSuccess();
      recordTsumegoAttempt(currentProblem.id, true, 20);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } catch {
        // Ignore
      }
      return;
    }

    // If opponent has an automatic response move
    if (matchedBranch.response) {
      const resp = matchedBranch.response;
      setAiThinking(true);
      setTimeout(() => {
        // Opponent plays response
        setBoard((prevB) => {
          const opponentColor = currentProblem.playerColor === 'black' ? 'white' : 'black';
          const oppRes = playMove(prevB, { x: resp.x, y: resp.y }, opponentColor);
          if (oppRes.valid && oppRes.newBoard) {
            soundManager.playStoneClick();
            if (oppRes.captured.length > 0) {
              setTimeout(() => soundManager.playCapture(), 60);
            }
            setLastMovePoint({ x: resp.x, y: resp.y });
            return oppRes.newBoard;
          }
          return prevB;
        });

        setAiThinking(false);

        // Check if opponent response had a terminal message or failure
        if (resp.message && !resp.branches) {
          if (resp.message.includes('失敗')) {
            setSolveStatus('failure');
            setStatusMessage(resp.message);
            soundManager.playFailure();
            recordTsumegoAttempt(currentProblem.id, false, -10);
          } else {
            setSolveStatus('success');
            setStatusMessage(resp.message);
            soundManager.playSuccess();
            recordTsumegoAttempt(currentProblem.id, true, 20);
          }
        }
      }, 350);
    }
  };

  const handleNextProblem = () => {
    if (filteredProblems.length <= 1) return;
    setCurrentProblemIndex((prev) => (prev + 1) % filteredProblems.length);
  };

  const handlePrevProblem = () => {
    if (filteredProblems.length <= 1) return;
    setCurrentProblemIndex((prev) => (prev - 1 + filteredProblems.length) % filteredProblems.length);
  };

  const handleRandomProblem = () => {
    if (filteredProblems.length <= 1) return;
    const nextIdx = Math.floor(Math.random() * filteredProblems.length);
    setCurrentProblemIndex(nextIdx);
  };

  const isSolved = activeUser.solvedProblemIds.includes(currentProblem.id);
  const isStarred = activeUser.starredProblemIds.includes(currentProblem.id);

  // Markers for hint
  const boardMarkers: BoardMarker[] = useMemo(() => {
    const list: BoardMarker[] = [];
    if (showHint && currentProblem.solutionTree[0]) {
      const sol = currentProblem.solutionTree[0];
      list.push({
        point: { x: sol.x, y: sol.y },
        label: '?',
        type: 'letter',
        color: '#f59e0b',
      });
    }
    return list;
  }, [showHint, currentProblem]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Filter and Adaptive Banner */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Mode toggler */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAdaptiveMode(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              isAdaptiveMode
                ? 'bg-amber-600 text-stone-950 shadow-md shadow-amber-600/30'
                : 'bg-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            棋力自適應配題 ({activeUser.currentRank})
          </button>

          <button
            onClick={() => setIsAdaptiveMode(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              !isAdaptiveMode
                ? 'bg-amber-600 text-stone-950 shadow-md shadow-amber-600/30'
                : 'bg-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            自由選關難度
          </button>
        </div>

        {/* Right: Manual filter dropdowns when not in adaptive mode */}
        {!isAdaptiveMode && (
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={selectedLevelFilter}
              onChange={(e) => {
                setSelectedLevelFilter(e.target.value);
                setCurrentProblemIndex(0);
              }}
              className="bg-stone-800 border border-stone-700 text-stone-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="all">全難度</option>
              <option value="beginner">初學入門 (15k - 10k)</option>
              <option value="intermediate">基礎進階 (9k - 5k)</option>
              <option value="dan-challenger">段位衝刺 (4k - 1k)</option>
              <option value="dan-master">有段名局 (1D - 4D+)</option>
              {activeUser.customProblems.length > 0 && (
                <option value="custom">自訂與擴充題庫 ({activeUser.customProblems.length})</option>
              )}
            </select>

            <select
              value={selectedCategoryFilter}
              onChange={(e) => {
                setSelectedCategoryFilter(e.target.value);
                setCurrentProblemIndex(0);
              }}
              className="bg-stone-800 border border-stone-700 text-stone-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="all">全部分類</option>
              <option value="life">黑先活</option>
              <option value="kill">黑先殺</option>
              <option value="ko">劫爭死活</option>
              <option value="seki">雙活共生</option>
              <option value="tesuji">手筋妙手</option>
            </select>
          </div>
        )}

        {/* User stats widget */}
        <div className="flex items-center gap-3 text-xs text-stone-400">
          <div className="flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>積分: <b className="text-amber-300 font-mono">{activeUser.eloRating}</b></span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>已通關: <b className="text-emerald-300 font-mono">{activeUser.solvedProblemIds.length}</b></span>
          </div>
        </div>
      </div>

      {/* Main Board & Problem Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Board Column */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-xl relative">
          {/* Header controls over board */}
          <div className="w-full flex items-center justify-between mb-3 text-xs text-stone-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-200">
                {currentProblem.playerColor === 'black' ? '● 黑先' : '○ 白先'}
              </span>
              <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                難度: {currentProblem.level}
              </span>
              {isSolved && (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 已完成
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {currentProblem.cropBounds && (
                <button
                  onClick={() => setCropView(!cropView)}
                  className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  {cropView ? '切換全盤' : '局部放大'}
                </button>
              )}
              <button
                onClick={() => toggleStarProblem(currentProblem.id)}
                className={`p-1 rounded transition-colors ${
                  isStarred ? 'text-amber-400' : 'text-stone-500 hover:text-stone-300'
                }`}
                title="收藏題目"
              >
                <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Go Board */}
          <GoBoard
            board={board}
            boardSize={currentProblem.boardSize}
            cropBounds={cropView ? currentProblem.cropBounds : undefined}
            onPointClick={handlePointClick}
            hoverColor={solveStatus === 'solving' ? currentProblem.playerColor : null}
            lastMove={lastMovePoint}
            markers={boardMarkers}
            interactive={solveStatus === 'solving'}
            className="max-w-full"
          />

          {/* AI Thinking Indicator */}
          {aiThinking && (
            <div className="absolute inset-0 bg-stone-950/40 rounded-2xl flex items-center justify-center backdrop-blur-[1px] pointer-events-none">
              <div className="bg-stone-900 border border-stone-700 text-stone-200 px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 shadow-2xl">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                白棋應手中...
              </div>
            </div>
          )}
        </div>

        {/* Right Info & Actions Column */}
        <div className="lg:col-span-5 space-y-4">
          {/* Problem Details Card */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs text-amber-500 font-semibold tracking-wider uppercase">
                  {currentProblem.category === 'life' && '做活研習'}
                  {currentProblem.category === 'kill' && '聚殺破眼'}
                  {currentProblem.category === 'ko' && '劫爭實戰'}
                  {currentProblem.category === 'seki' && '雙活共生'}
                  {currentProblem.category === 'tesuji' && '神妙手筋'}
                </span>
                <h3 className="text-xl font-bold text-stone-100 mt-1">
                  {currentProblem.title}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {currentProblem.level}
              </span>
            </div>

            <p className="text-sm text-stone-300 leading-relaxed bg-stone-800/40 p-3 rounded-xl border border-stone-800/70">
              {currentProblem.description}
            </p>

            {/* Status Feedback Banner */}
            {solveStatus === 'success' && (
              <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/80 text-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="font-bold text-emerald-300">攻防正解！</div>
                  <div className="text-xs mt-1 text-emerald-200/90 leading-relaxed">
                    {statusMessage}
                  </div>
                </div>
              </div>
            )}

            {solveStatus === 'failure' && (
              <div className="p-4 rounded-xl bg-red-950/70 border border-red-500/80 text-red-200 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="font-bold text-red-300">著手受挫</div>
                  <div className="text-xs mt-1 text-red-200/90 leading-relaxed">
                    {statusMessage}
                  </div>
                </div>
              </div>
            )}

            {/* Hint Box */}
            {showHint && (
              <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-500/50 text-amber-200 text-xs flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">要點提示：</span> {currentProblem.hint}
                </div>
              </div>
            )}

            {/* Commentary Explanation */}
            {showSolutionExplanation && currentProblem.commentary && (
              <div className="p-3.5 rounded-xl bg-stone-800/80 border border-stone-700 text-stone-300 text-xs space-y-1.5">
                <div className="font-bold text-stone-200 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" /> 棋理詳解
                </div>
                <p className="leading-relaxed text-stone-300">
                  {currentProblem.commentary}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => resetProblemState(currentProblem)}
                className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> 重新擺棋
              </button>

              <button
                onClick={() => setShowHint(!showHint)}
                className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5" /> {showHint ? '隱藏提示' : '獲取提示'}
              </button>

              <button
                onClick={() => setShowSolutionExplanation(!showSolutionExplanation)}
                className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors col-span-2"
              >
                <BookOpen className="w-3.5 h-3.5" /> {showSolutionExplanation ? '隱藏棋理詳解' : '查看棋理詳解'}
              </button>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3">
            <button
              onClick={handlePrevProblem}
              className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> 上一題
            </button>

            <div className="text-xs text-stone-400 font-mono">
              第 {currentProblemIndex + 1} / {filteredProblems.length} 題
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRandomProblem}
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors"
                title="隨機抽題"
              >
                <Shuffle className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextProblem}
                className="py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold flex items-center gap-1 transition-colors shadow"
              >
                下一題 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
