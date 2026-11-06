import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Bot, Swords, Trophy, RotateCcw, SkipForward, Flag, Download,
  Hash, BookOpen, ChevronRight, CheckCircle2, AlertCircle, ArrowLeft,
  Sparkles, Clock, ShieldCheck, Flame, Scale
} from 'lucide-react';
import { Point, StoneColor, MoveRecord, GameRecord } from '../types/go';
import {
  createEmptyBoard, BoardMatrix, playMove, estimateTerritory,
  generateSgf, pointToCoordinate
} from '../engine/goRules';
import { getBotMove, BotDifficulty, BOT_PROFILES, getHandicapStones } from '../engine/goBot';
import { GoBoard, BoardMarker } from './GoBoard';
import { useUser } from '../context/UserContext';
import { soundManager } from '../utils/sound';

interface Props {
  onGoToRecords?: () => void;
}

export const PlayVsAi: React.FC<Props> = ({ onGoToRecords }) => {
  const { activeUser, saveGameRecord } = useUser();

  // Match setup configuration
  const [inGame, setInGame] = useState<boolean>(false);
  const [boardSize, setBoardSize] = useState<number>(19);
  const [selectedBot, setSelectedBot] = useState<BotDifficulty>('intermediate');
  const [colorChoice, setColorChoice] = useState<'black' | 'white' | 'random'>('black');
  const [actualPlayerColor, setActualPlayerColor] = useState<StoneColor>('black');
  const [handicap, setHandicap] = useState<number>(0);
  const [komi, setKomi] = useState<number>(6.5);

  // Active match state
  const [board, setBoard] = useState<BoardMatrix>(() => createEmptyBoard(19));
  const [currentTurn, setCurrentTurn] = useState<StoneColor>('black');
  const [moves, setMoves] = useState<MoveRecord[]>([]);
  const [boardHistory, setBoardHistory] = useState<BoardMatrix[]>([]);
  const [prisoners, setPrisoners] = useState<{ black: number; white: number }>({ black: 0, white: 0 });
  const [koPoint, setKoPoint] = useState<Point | null>(null);
  const [lastPass, setLastPass] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [aiThinking, setAiThinking] = useState<boolean>(false);
  const [showMoveNumbers, setShowMoveNumbers] = useState<boolean>(false);
  const [savedGameId, setSavedGameId] = useState<string | null>(null);

  const [territoryResult, setTerritoryResult] = useState<{
    blackTerritory: Point[];
    whiteTerritory: Point[];
    blackScore: number;
    whiteScore: number;
  } | null>(null);

  const moveLogEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll move list
  useEffect(() => {
    moveLogEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [moves]);

  // Start new match
  const handleStartGame = () => {
    // Determine player color
    let pColor: StoneColor = 'black';
    if (colorChoice === 'random') {
      pColor = Math.random() > 0.5 ? 'black' : 'white';
    } else {
      pColor = colorChoice;
    }
    setActualPlayerColor(pColor);

    // Initial board with handicap stones if any
    const b = createEmptyBoard(boardSize);
    let initialKomi = 6.5;
    if (handicap > 0) {
      initialKomi = 0.5; // handicap games usually 0.5 komi to White
      const handicapPoints = getHandicapStones(boardSize, handicap);
      handicapPoints.forEach((hp) => {
        if (b[hp.y] && b[hp.y][hp.x] !== undefined) {
          b[hp.y][hp.x] = 'black';
        }
      });
    }
    setKomi(initialKomi);

    setBoard(b);
    setBoardHistory([b]);
    setMoves([]);
    setPrisoners({ black: 0, white: 0 });
    setKoPoint(null);
    setLastPass(false);
    setIsGameOver(false);
    setGameResult('');
    setStatusMessage('');
    setTerritoryResult(null);
    setSavedGameId(null);

    // If handicap > 0, Black placed handicap stones, White moves first!
    const startingTurn: StoneColor = handicap > 0 ? 'white' : 'black';
    setCurrentTurn(startingTurn);

    setInGame(true);
    soundManager.playStoneClick();
  };

  const botInfo = BOT_PROFILES[selectedBot];
  const botColor: StoneColor = actualPlayerColor === 'black' ? 'white' : 'black';

  // AI Trigger
  useEffect(() => {
    if (!inGame || isGameOver) return;

    if (currentTurn === botColor) {
      setAiThinking(true);
      const delay = 400 + Math.random() * 300;

      const timer = setTimeout(() => {
        const botMove = getBotMove(board, botColor, selectedBot, koPoint);
        setAiThinking(false);

        if (botMove) {
          executeMove(botMove, botColor);
        } else {
          // AI passes
          executePass(botColor);
        }
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [currentTurn, inGame, isGameOver, board, selectedBot, koPoint, botColor]);

  // Execute a valid move
  const executeMove = (pt: Point, color: StoneColor) => {
    const res = playMove(board, pt, color, koPoint);
    if (!res.valid || !res.newBoard) {
      if (color === actualPlayerColor) {
        setStatusMessage(res.reason || '非法著手');
        soundManager.playFailure();
      }
      return;
    }

    soundManager.playStoneClick();
    if (res.captured.length > 0) {
      setTimeout(() => soundManager.playCapture(), 60);
      setPrisoners((prev) => ({
        ...prev,
        [color]: prev[color] + res.captured.length,
      }));
    }

    const newMoveRecord: MoveRecord = {
      x: pt.x,
      y: pt.y,
      color,
      captured: res.captured,
      moveNumber: moves.length + 1,
    };

    setBoard(res.newBoard);
    setBoardHistory((prev) => [...prev, res.newBoard!]);
    setMoves((prev) => [...prev, newMoveRecord]);
    setKoPoint(res.newKoPoint || null);
    setLastPass(false);
    setCurrentTurn(color === 'black' ? 'white' : 'black');
    setStatusMessage('');
  };

  const handlePlayerBoardClick = (pt: Point) => {
    if (!inGame || isGameOver || aiThinking) return;
    if (currentTurn !== actualPlayerColor) return;

    executeMove(pt, actualPlayerColor);
  };

  const executePass = (color: StoneColor = currentTurn) => {
    if (isGameOver) return;

    if (lastPass) {
      // 2 consecutive passes => Game Over!
      endGameByScoring();
    } else {
      setLastPass(true);
      setCurrentTurn(color === 'black' ? 'white' : 'black');
      setStatusMessage(`${color === 'black' ? '黑方' : '白方'} 停一手 (Pass)`);
    }
  };

  const handlePlayerResign = () => {
    if (isGameOver) return;
    const winnerColor = actualPlayerColor === 'black' ? 'white' : 'black';
    const resultStr = winnerColor === 'black' ? '黑中盤勝' : '白中盤勝';
    setIsGameOver(true);
    setGameResult(resultStr);
    setStatusMessage(`玩家認輸，${resultStr}！`);
    soundManager.playFailure();
    saveFinalGame(resultStr);
  };

  const endGameByScoring = () => {
    const est = estimateTerritory(board);
    const blackTotal = est.blackTerritory.length + prisoners.black;
    const whiteTotal = est.whiteTerritory.length + prisoners.white + komi;

    const winnerStr = blackTotal > whiteTotal
      ? `黑勝 ${(blackTotal - whiteTotal).toFixed(1)} 目`
      : `白勝 ${(whiteTotal - blackTotal).toFixed(1)} 目`;

    setTerritoryResult({
      blackTerritory: est.blackTerritory,
      whiteTerritory: est.whiteTerritory,
      blackScore: blackTotal,
      whiteScore: whiteTotal,
    });

    setIsGameOver(true);
    setGameResult(winnerStr);
    setStatusMessage(`雙方停一手，終局數目結果：${winnerStr}`);

    const isPlayerWin = (winnerStr.includes('黑') && actualPlayerColor === 'black') ||
                        (winnerStr.includes('白') && actualPlayerColor === 'white');

    if (isPlayerWin) {
      soundManager.playSuccess();
      try {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
    } else {
      soundManager.playFailure();
    }

    saveFinalGame(winnerStr);
  };

  const saveFinalGame = (resultString: string) => {
    if (moves.length < 2) return;
    const blackPlayer = actualPlayerColor === 'black' ? activeUser.name : `${botInfo.name} (${botInfo.rank})`;
    const whitePlayer = actualPlayerColor === 'white' ? activeUser.name : `${botInfo.name} (${botInfo.rank})`;

    const sgf = generateSgf(moves, boardSize, blackPlayer, whitePlayer, resultString, komi);

    const gameId = `ai-game-${Date.now()}`;
    const record: GameRecord = {
      id: gameId,
      title: `${boardSize}x${boardSize} 對局 vs ${botInfo.name} (${botInfo.rank})`,
      date: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      boardSize,
      blackPlayer,
      whitePlayer,
      komi,
      handicap,
      moves,
      sgfContent: sgf,
      winner: resultString.includes('黑') ? 'black' : 'white',
      winReason: resultString.includes('中盤') ? 'resign' : 'score',
    };

    saveGameRecord(record);
    setSavedGameId(gameId);
  };

  // Undo move: undo 2 moves (both player and AI) so it's player's turn again
  const handleUndoMove = () => {
    if (moves.length < 2 || isGameOver || aiThinking) return;

    // Rollback 2 moves
    const newMoves = moves.slice(0, moves.length - 2);
    const newHistory = boardHistory.slice(0, boardHistory.length - 2);
    const targetBoard = newHistory[newHistory.length - 1];

    setMoves(newMoves);
    setBoardHistory(newHistory);
    setBoard(targetBoard);
    setKoPoint(null);
    setLastPass(false);
    setCurrentTurn(actualPlayerColor);
    setStatusMessage('已悔棋至你的著手回合');
    soundManager.playStoneClick();
  };

  const moveNumbersMap = useMemo(() => {
    const map = new Map<string, number>();
    moves.forEach((m) => {
      map.set(`${m.x},${m.y}`, m.moveNumber);
    });
    return map;
  }, [moves]);

  const lastMove = moves.length > 0 ? moves[moves.length - 1] : null;

  // Board markers for territory scoring
  const territoryMarkers: BoardMarker[] = useMemo(() => {
    if (!territoryResult) return [];
    const list: BoardMarker[] = [];
    territoryResult.blackTerritory.forEach((p) => {
      list.push({ point: p, type: 'territory-black' });
    });
    territoryResult.whiteTerritory.forEach((p) => {
      list.push({ point: p, type: 'territory-white' });
    });
    return list;
  }, [territoryResult]);

  // Real-time territory estimator balance
  const liveBalance = useMemo(() => {
    if (!inGame || moves.length < 5) return { blackPercent: 50, whitePercent: 50 };
    const est = estimateTerritory(board);
    const bScore = est.blackTerritory.length + prisoners.black + est.blackStonesCount * 0.5;
    const wScore = est.whiteTerritory.length + prisoners.white + est.whiteStonesCount * 0.5 + komi;
    const total = bScore + wScore;
    if (total === 0) return { blackPercent: 50, whitePercent: 50 };
    const bPct = Math.round((bScore / total) * 100);
    return { blackPercent: Math.max(15, Math.min(85, bPct)), whitePercent: 100 - Math.max(15, Math.min(85, bPct)) };
  }, [board, prisoners, komi, inGame, moves.length]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ================= Screen 1: Pre-game Setup ================= */}
      {!inGame && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-10 shadow-2xl text-stone-100 max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-1">
              <Bot className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-extrabold text-amber-200 tracking-tight">
              AI 圍棋大師對弈室
            </h2>
            <p className="text-stone-300 text-sm leading-relaxed">
              挑戰多段位深度 AI 對手，支援 19 路標準盤、讓子局與完整棋譜記錄，鍛鍊全局佈局與實戰計算力。
            </p>
          </div>

          <div className="space-y-6">
            {/* 1. Select AI Opponent */}
            <div>
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-3">
                1. 選擇 AI 對手段位
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(Object.keys(BOT_PROFILES) as BotDifficulty[]).map((key) => {
                  const b = BOT_PROFILES[key];
                  const isSelected = selectedBot === key;
                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedBot(key)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/50 shadow-lg'
                          : 'bg-stone-800/60 hover:bg-stone-800 border-stone-700/60 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl p-2 rounded-xl bg-stone-900 border border-stone-700 shadow">
                          {b.avatar}
                        </span>
                        <div>
                          <div className="font-bold text-stone-100 text-sm">{b.name}</div>
                          <div className="text-xs text-amber-400 font-mono font-bold">{b.rank}</div>
                        </div>
                      </div>
                      <p className="text-[11px] text-stone-400 leading-relaxed">
                        {b.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Board Size & Color & Handicap */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              {/* Board Size */}
              <div className="bg-stone-800/40 p-4 rounded-2xl border border-stone-800 space-y-2">
                <label className="text-xs font-bold text-stone-300 block">棋盤規格 (Board Size)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { sz: 19, label: '19x19', desc: '標準大盤' },
                    { sz: 13, label: '13x13', desc: '中盤較量' },
                    { sz: 9, label: '9x9', desc: '快速練刀' },
                  ].map((item) => (
                    <button
                      key={item.sz}
                      onClick={() => setBoardSize(item.sz)}
                      className={`py-2 px-1 rounded-xl text-center border transition-all ${
                        boardSize === item.sz
                          ? 'bg-amber-600 text-stone-950 border-amber-500 font-bold shadow'
                          : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className="text-[10px] opacity-80">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Choice */}
              <div className="bg-stone-800/40 p-4 rounded-2xl border border-stone-800 space-y-2">
                <label className="text-xs font-bold text-stone-300 block">執黑 / 執白</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setColorChoice('black')}
                    className={`py-2 px-1 rounded-xl text-center border transition-all flex flex-col items-center gap-1 ${
                      colorChoice === 'black'
                        ? 'bg-stone-950 text-stone-100 border-amber-500 ring-1 ring-amber-500 font-bold'
                        : 'bg-stone-800 border-stone-700 text-stone-300'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-stone-950 ring-1 ring-stone-600 shadow" />
                    <span className="text-xs">執黑 (先行)</span>
                  </button>
                  <button
                    onClick={() => setColorChoice('white')}
                    className={`py-2 px-1 rounded-xl text-center border transition-all flex flex-col items-center gap-1 ${
                      colorChoice === 'white'
                        ? 'bg-stone-100 text-stone-950 border-amber-500 ring-1 ring-amber-500 font-bold'
                        : 'bg-stone-800 border-stone-700 text-stone-300'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-stone-100 ring-1 ring-stone-400 shadow" />
                    <span className="text-xs">執白 (後行)</span>
                  </button>
                  <button
                    onClick={() => setColorChoice('random')}
                    className={`py-2 px-1 rounded-xl text-center border transition-all flex flex-col items-center justify-center ${
                      colorChoice === 'random'
                        ? 'bg-amber-600 text-stone-950 border-amber-500 font-bold shadow'
                        : 'bg-stone-800 border-stone-700 text-stone-300'
                    }`}
                  >
                    <span className="text-xs font-bold">猜先</span>
                    <span className="text-[10px] opacity-80">隨機決定</span>
                  </button>
                </div>
              </div>

              {/* Handicap */}
              <div className="bg-stone-800/40 p-4 rounded-2xl border border-stone-800 space-y-2">
                <label className="text-xs font-bold text-stone-300 block">讓子棋設定 (Handicap)</label>
                <select
                  value={handicap}
                  onChange={(e) => setHandicap(parseInt(e.target.value, 10))}
                  className="w-full bg-stone-800 border border-stone-700 text-stone-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value={0}>分先（互不讓子，黑貼 6.5 目）</option>
                  <option value={2}>讓 2 子（白貼 0.5 目）</option>
                  <option value={3}>讓 3 子（白貼 0.5 目）</option>
                  <option value={4}>讓 4 子（四角星位）</option>
                  {boardSize === 19 && <option value={9}>讓 9 子（九星齊備）</option>}
                </select>
                <div className="text-[10px] text-stone-400 italic">
                  讓子局開局自動在星位佈子，由白棋先手落子。
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-4 flex justify-center">
              <button
                onClick={handleStartGame}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black text-base shadow-xl shadow-amber-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Swords className="w-5 h-5" /> 立即與 {botInfo.name} 開局對弈
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= Screen 2: Active AI Match ================= */}
      {inGame && (
        <div className="space-y-4">
          {/* Top Status & Balance Bar */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left: AI Player info */}
            <div className="flex items-center gap-3">
              <span className="text-2xl p-1.5 rounded-xl bg-stone-800 border border-stone-700 shadow">
                {botInfo.avatar}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-stone-100">{botInfo.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 font-mono">
                    {botInfo.rank}
                  </span>
                  <span className="text-xs text-stone-400">
                    ({botColor === 'black' ? '● 執黑' : '○ 執白'})
                  </span>
                </div>
                <div className="text-xs text-stone-400">
                  提子數: <b className="text-stone-200">{prisoners[botColor]}</b>
                </div>
              </div>
            </div>

            {/* Middle: Territory & Winrate Estimator */}
            <div className="w-full md:w-72 space-y-1.5 text-center">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-stone-300">黑方優勢 {liveBalance.blackPercent}%</span>
                <span className="text-amber-400 flex items-center gap-1 font-mono text-xs">
                  <Scale className="w-3.5 h-3.5" /> 形勢估算
                </span>
                <span className="text-stone-300">白方優勢 {liveBalance.whitePercent}%</span>
              </div>
              <div className="h-2 w-full bg-stone-800 rounded-full overflow-hidden flex">
                <div
                  className="bg-stone-300 transition-all duration-500"
                  style={{ width: `${liveBalance.blackPercent}%` }}
                />
                <div
                  className="bg-amber-600 transition-all duration-500"
                  style={{ width: `${liveBalance.whitePercent}%` }}
                />
              </div>
            </div>

            {/* Right: Human Player info */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-xs text-stone-400">
                    ({actualPlayerColor === 'black' ? '● 執黑' : '○ 執白'})
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 font-mono">
                    {activeUser.currentRank}
                  </span>
                  <span className="font-bold text-sm text-stone-100">{activeUser.name}</span>
                </div>
                <div className="text-xs text-stone-400">
                  提子數: <b className="text-stone-200">{prisoners[actualPlayerColor]}</b>
                </div>
              </div>
              <span className="text-2xl p-1.5 rounded-xl bg-stone-800 border border-stone-700 shadow">
                {activeUser.avatar}
              </span>
            </div>
          </div>

          {/* Main Board & Action Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Board Column */}
            <div className="lg:col-span-8 flex flex-col items-center justify-center bg-stone-900 border border-stone-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative">
              {/* Header Bar on Board */}
              <div className="w-full flex items-center justify-between mb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                      currentTurn === actualPlayerColor
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {currentTurn === actualPlayerColor ? '👉 輪到你的著手回合' : '⏳ AI 思考中...'}
                  </span>
                  <span className="text-stone-400 font-mono">手數: {moves.length} 手</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMoveNumbers(!showMoveNumbers)}
                    className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                      showMoveNumbers ? 'bg-amber-600 text-stone-950 font-bold' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    <Hash className="w-3.5 h-3.5" /> 手數標記
                  </button>
                </div>
              </div>

              {/* The Go Board: Now completely responsive and will NOT overflow! */}
              <div className="w-full flex items-center justify-center">
                <GoBoard
                  board={board}
                  boardSize={boardSize}
                  onPointClick={handlePlayerBoardClick}
                  hoverColor={!isGameOver && currentTurn === actualPlayerColor ? actualPlayerColor : null}
                  lastMove={lastMove ? { x: lastMove.x, y: lastMove.y } : null}
                  markers={territoryMarkers}
                  showMoveNumbers={showMoveNumbers}
                  moveNumbersMap={moveNumbersMap}
                  interactive={!isGameOver && currentTurn === actualPlayerColor}
                  className="shadow-2xl"
                />
              </div>

              {/* Status Notice */}
              {statusMessage && (
                <div className="mt-4 w-full p-2.5 rounded-xl bg-stone-800/80 border border-stone-700/60 text-center text-xs text-amber-300 font-medium">
                  {statusMessage}
                </div>
              )}
            </div>

            {/* Sidebar Column: Controls & Move History */}
            <div className="lg:col-span-4 space-y-4">
              {/* Match Control Panel */}
              <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl space-y-3">
                <h4 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                  <Swords className="w-4 h-4 text-amber-400" /> 對局實時控制
                </h4>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    disabled={isGameOver || aiThinking || currentTurn !== actualPlayerColor}
                    onClick={() => executePass(actualPlayerColor)}
                    className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <SkipForward className="w-3.5 h-3.5" /> 停一手 (Pass)
                  </button>

                  <button
                    disabled={moves.length < 2 || isGameOver || aiThinking}
                    onClick={handleUndoMove}
                    className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> 悔棋 (Undo)
                  </button>

                  <button
                    disabled={isGameOver}
                    onClick={handlePlayerResign}
                    className="py-2.5 px-3 rounded-xl bg-red-950/60 hover:bg-red-900/80 disabled:opacity-40 text-red-300 border border-red-800/60 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors col-span-2"
                  >
                    <Flag className="w-3.5 h-3.5" /> 認輸投子 (Resign)
                  </button>
                </div>

                <div className="pt-2 border-t border-stone-800">
                  <button
                    onClick={() => setInGame(false)}
                    className="w-full py-2 px-3 rounded-xl bg-stone-800/50 hover:bg-stone-800 text-stone-400 text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> 返回設定 / 重新開局
                  </button>
                </div>
              </div>

              {/* Move-by-Move Kifu Table */}
              <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-400" /> 即時著手記錄
                  </h4>
                  <span className="text-[11px] text-stone-400 font-mono">
                    共 {moves.length} 手
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
                  {moves.length === 0 ? (
                    <div className="text-center py-8 text-stone-500 text-xs font-sans">
                      尚未落子，等待開局第一手...
                    </div>
                  ) : (
                    moves.map((m) => (
                      <div
                        key={m.moveNumber}
                        className={`flex items-center justify-between py-1 px-2.5 rounded-lg ${
                          m.moveNumber % 2 === 1 ? 'bg-stone-850' : 'bg-stone-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-stone-500 w-6 text-right">{m.moveNumber}.</span>
                          <span className="flex items-center gap-1">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                m.color === 'black' ? 'bg-stone-950 ring-1 ring-stone-600' : 'bg-stone-100 ring-1 ring-stone-400'
                              }`}
                            />
                            <span className="text-stone-200">
                              {pointToCoordinate(m, boardSize)}
                            </span>
                          </span>
                        </div>
                        {m.captured && m.captured.length > 0 && (
                          <span className="text-[10px] text-amber-400 font-sans">
                            提 {m.captured.length} 子
                          </span>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={moveLogEndRef} />
                </div>
              </div>

              {/* Game Over Result Card */}
              {isGameOver && (
                <div className="bg-stone-900 border-2 border-amber-500/80 rounded-3xl p-5 shadow-2xl space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <Trophy className="w-4 h-4" /> 對局終局結算
                  </div>
                  <div className="text-2xl font-black text-amber-300">
                    {gameResult}
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    本局棋譜已完整記錄並歸檔至你的「歷史棋譜庫」，可隨時復盤或下載 SGF 棋譜檔案！
                  </p>

                  <div className="pt-2 flex flex-col gap-2">
                    {onGoToRecords && (
                      <button
                        onClick={onGoToRecords}
                        className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
                      >
                        <BookOpen className="w-3.5 h-3.5" /> 前往棋譜庫復盤
                      </button>
                    )}
                    <button
                      onClick={handleStartGame}
                      className="w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> 再戰一局
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
