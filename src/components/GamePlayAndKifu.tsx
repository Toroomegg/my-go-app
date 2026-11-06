import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play, Download, Upload, Trash2, RotateCcw, Flag, SkipForward,
  SkipBack, ChevronLeft, ChevronRight, Hash, Eye, Trophy, Calendar,
  User, CheckCircle2, AlertCircle, Save, Swords, BookOpen
} from 'lucide-react';
import { Point, StoneColor, MoveRecord, GameRecord } from '../types/go';
import {
  createEmptyBoard, BoardMatrix, playMove, estimateTerritory,
  generateSgf, parseSgf, pointToCoordinate
} from '../engine/goRules';
import { getBotMove, BotDifficulty } from '../engine/goBot';
import { GoBoard, BoardMarker } from './GoBoard';
import { useUser } from '../context/UserContext';
import { soundManager } from '../utils/sound';

export const GamePlayAndKifu: React.FC = () => {
  const { activeUser, saveGameRecord, deleteGameRecord } = useUser();

  const [subTab, setSubTab] = useState<'play' | 'records'>('play');

  // ================= Game Play State =================
  const [boardSize, setBoardSize] = useState<number>(9); // 9, 13, 19
  const [gameMode, setGameMode] = useState<'bot' | 'pvp'>('bot');
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('intermediate');
  const [playerColor, setPlayerColor] = useState<StoneColor>('black'); // in bot mode

  const [board, setBoard] = useState<BoardMatrix>(() => createEmptyBoard(9));
  const [currentTurn, setCurrentTurn] = useState<StoneColor>('black');
  const [moves, setMoves] = useState<MoveRecord[]>([]);
  const [prisoners, setPrisoners] = useState<{ black: number; white: number }>({ black: 0, white: 0 });
  const [koPoint, setKoPoint] = useState<Point | null>(null);
  const [lastPass, setLastPass] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [territoryResult, setTerritoryResult] = useState<{
    blackTerritory: Point[];
    whiteTerritory: Point[];
    blackScore: number;
    whiteScore: number;
  } | null>(null);

  // Replay inside game mode
  const [showMoveNumbers, setShowMoveNumbers] = useState<boolean>(false);

  // Initialize new game
  const startNewGame = (size: number = boardSize) => {
    setBoardSize(size);
    setBoard(createEmptyBoard(size));
    setCurrentTurn('black');
    setMoves([]);
    setPrisoners({ black: 0, white: 0 });
    setKoPoint(null);
    setLastPass(false);
    setIsGameOver(false);
    setGameResult('');
    setStatusMessage('');
    setTerritoryResult(null);
  };

  // Bot move trigger
  useEffect(() => {
    if (gameMode !== 'bot' || isGameOver) return;
    const botColor: StoneColor = playerColor === 'black' ? 'white' : 'black';

    if (currentTurn === botColor) {
      const timer = setTimeout(() => {
        const bMove = getBotMove(board, botColor, botDifficulty, koPoint);
        if (bMove) {
          handleExecuteMove(bMove, botColor);
        } else {
          // Bot passes
          handlePass(botColor);
        }
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [currentTurn, gameMode, isGameOver, board, botDifficulty, koPoint, playerColor]);

  const handleExecuteMove = (pt: Point, color: StoneColor) => {
    const res = playMove(board, pt, color, koPoint);
    if (!res.valid || !res.newBoard) {
      if (color === playerColor) {
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
    setMoves((prev) => [...prev, newMoveRecord]);
    setKoPoint(res.newKoPoint || null);
    setLastPass(false);
    setCurrentTurn(color === 'black' ? 'white' : 'black');
    setStatusMessage('');
  };

  const handleBoardClick = (pt: Point) => {
    if (isGameOver) return;
    if (gameMode === 'bot' && currentTurn !== playerColor) return;

    handleExecuteMove(pt, currentTurn);
  };

  const handlePass = (color: StoneColor = currentTurn) => {
    if (isGameOver) return;

    if (lastPass) {
      // Two consecutive passes => Game Over!
      endGameByScoring();
    } else {
      setLastPass(true);
      setCurrentTurn(color === 'black' ? 'white' : 'black');
      setStatusMessage(`${color === 'black' ? '黑棋' : '白棋'} 停一手 (Pass)`);
    }
  };

  const handleResign = (color: StoneColor = currentTurn) => {
    if (isGameOver) return;
    const winner = color === 'black' ? '白中盤勝' : '黑中盤勝';
    setIsGameOver(true);
    setGameResult(winner);
    setStatusMessage(`${color === 'black' ? '黑棋' : '白棋'} 認輸，${winner}`);
    soundManager.playSuccess();
    autoSaveGame(winner);
  };

  const endGameByScoring = () => {
    const est = estimateTerritory(board);
    const komi = 6.5;
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
    setStatusMessage(`雙方停一手，對局結束！計算結果：${winnerStr}`);
    soundManager.playSuccess();
    autoSaveGame(winnerStr);
  };

  const autoSaveGame = (resultString: string) => {
    if (moves.length < 2) return;
    const opponentName = gameMode === 'bot' ? `弈道 AI (${botDifficulty})` : '雙人對局';
    const blackPlayer = playerColor === 'black' ? activeUser.name : opponentName;
    const whitePlayer = playerColor === 'white' ? activeUser.name : opponentName;

    const sgf = generateSgf(moves, boardSize, blackPlayer, whitePlayer, resultString);

    const record: GameRecord = {
      id: `game-${Date.now()}`,
      title: `${boardSize}x${boardSize} 對局 (${blackPlayer} vs ${whitePlayer})`,
      date: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      boardSize,
      blackPlayer,
      whitePlayer,
      komi: 6.5,
      handicap: 0,
      moves,
      sgfContent: sgf,
      winner: resultString.includes('黑') ? 'black' : 'white',
      winReason: resultString.includes('中盤') ? 'resign' : 'score',
    };

    saveGameRecord(record);
  };

  // Map of move numbers for stones
  const moveNumbersMap = useMemo(() => {
    const map = new Map<string, number>();
    moves.forEach((m) => {
      map.set(`${m.x},${m.y}`, m.moveNumber);
    });
    return map;
  }, [moves]);

  // Last move
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

  // ================= Replay Archive State =================
  const [selectedRecord, setSelectedRecord] = useState<GameRecord | null>(null);
  const [replayStep, setReplayStep] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute board state for replaying a record
  const replayBoard = useMemo(() => {
    if (!selectedRecord) return createEmptyBoard(19);
    const b = createEmptyBoard(selectedRecord.boardSize);
    for (let i = 0; i < replayStep && i < selectedRecord.moves.length; i++) {
      const m = selectedRecord.moves[i];
      playMove(b, { x: m.x, y: m.y }, m.color);
    }
    return b;
  }, [selectedRecord, replayStep]);

  const replayMoveMap = useMemo(() => {
    if (!selectedRecord) return new Map<string, number>();
    const map = new Map<string, number>();
    for (let i = 0; i < replayStep && i < selectedRecord.moves.length; i++) {
      const m = selectedRecord.moves[i];
      map.set(`${m.x},${m.y}`, m.moveNumber);
    }
    return map;
  }, [selectedRecord, replayStep]);

  const handleDownloadSgf = (record: GameRecord) => {
    const content = record.sgfContent || generateSgf(record.moves, record.boardSize, record.blackPlayer, record.whitePlayer);
    const blob = new Blob([content], { type: 'application/x-go-sgf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kifu-${record.id}.sgf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSgf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        try {
          const parsed = parseSgf(text);
          const newRecord: GameRecord = {
            id: `game-imported-${Date.now()}`,
            title: `匯入棋譜 (${parsed.blackPlayer} vs ${parsed.whitePlayer})`,
            date: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }),
            boardSize: parsed.boardSize,
            blackPlayer: parsed.blackPlayer,
            whitePlayer: parsed.whitePlayer,
            komi: parsed.komi,
            handicap: 0,
            moves: parsed.moves,
            sgfContent: text,
          };
          saveGameRecord(newRecord);
          setSelectedRecord(newRecord);
          setReplayStep(parsed.moves.length);
          setSubTab('records');
          soundManager.playSuccess();
        } catch {
          alert('解析 SGF 失敗，請確認檔案格式是否正確。');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Sub Tabs: 對弈 (Play) vs 歷史棋譜 (Kifu Archive) */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('play')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              subTab === 'play'
                ? 'bg-amber-600 text-stone-950 shadow-md shadow-amber-600/30'
                : 'bg-stone-800/80 text-stone-300 hover:bg-stone-800'
            }`}
          >
            <Swords className="w-4 h-4" /> 實戰對弈
          </button>
          <button
            onClick={() => setSubTab('records')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              subTab === 'records'
                ? 'bg-amber-600 text-stone-950 shadow-md shadow-amber-600/30'
                : 'bg-stone-800/80 text-stone-300 hover:bg-stone-800'
            }`}
          >
            <BookOpen className="w-4 h-4" /> 歷史棋譜庫 ({activeUser.savedGames.length})
          </button>
        </div>

        {subTab === 'records' && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportSgf}
              accept=".sgf"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 border border-stone-700 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" /> 匯入 SGF 棋譜
            </button>
          </div>
        )}
      </div>

      {/* ================= Mode 1: Play Match ================= */}
      {subTab === 'play' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Board Column */}
          <div className="lg:col-span-8 flex flex-col items-center justify-center bg-stone-900 border border-stone-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative">
            {/* Header info */}
            <div className="w-full flex items-center justify-between mb-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-950 ring-1 ring-stone-600" />
                  <span className="text-stone-300 font-medium">黑方提子: {prisoners.black}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-100 ring-1 ring-stone-400" />
                  <span className="text-stone-300 font-medium">白方提子: {prisoners.white}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMoveNumbers(!showMoveNumbers)}
                  className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
                    showMoveNumbers ? 'bg-amber-600 text-stone-950 font-bold' : 'bg-stone-800 text-stone-300'
                  }`}
                >
                  <Hash className="w-3 h-3" /> 手數標記
                </button>
              </div>
            </div>

            {/* Board */}
            <GoBoard
              board={board}
              boardSize={boardSize}
              onPointClick={handleBoardClick}
              hoverColor={!isGameOver ? currentTurn : null}
              lastMove={lastMove ? { x: lastMove.x, y: lastMove.y } : null}
              markers={territoryMarkers}
              showMoveNumbers={showMoveNumbers}
              moveNumbersMap={moveNumbersMap}
              interactive={!isGameOver}
              className="max-w-full"
            />

            {/* Status / Alert Bar */}
            {statusMessage && (
              <div className="mt-4 w-full p-2.5 rounded-xl bg-stone-800/80 border border-stone-700/60 text-center text-xs text-amber-300 font-medium">
                {statusMessage}
              </div>
            )}
          </div>

          {/* Right Game Controls Column */}
          <div className="lg:col-span-4 space-y-4">
            {/* Game Setup & Turn Card */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-stone-100 flex items-center gap-2">
                  <Swords className="w-5 h-5 text-amber-400" /> 對弈控制台
                </h3>
                <span className="text-xs text-stone-400 font-mono">
                  目前手數: {moves.length} 手
                </span>
              </div>

              {/* Turn indicator */}
              <div className="p-3.5 rounded-xl bg-stone-800/70 border border-stone-700 flex items-center justify-between">
                <span className="text-xs text-stone-400">當前行棋方</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3.5 h-3.5 rounded-full ${
                      currentTurn === 'black' ? 'bg-stone-950 ring-2 ring-amber-500' : 'bg-stone-100 ring-2 ring-amber-500'
                    }`}
                  />
                  <span className="font-bold text-sm text-stone-100">
                    {currentTurn === 'black' ? '黑方 (先手)' : '白方 (後手)'}
                  </span>
                </div>
              </div>

              {/* Match configurations */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400">棋盤路數</span>
                  <div className="flex gap-1.5">
                    {[9, 13, 19].map((sz) => (
                      <button
                        key={sz}
                        disabled={moves.length > 0}
                        onClick={() => startNewGame(sz)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                          boardSize === sz
                            ? 'bg-amber-600 text-stone-950'
                            : 'bg-stone-800 text-stone-400 hover:text-stone-200 disabled:opacity-50'
                        }`}
                      >
                        {sz}x{sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400">對戰模式</span>
                  <div className="flex gap-1.5">
                    <button
                      disabled={moves.length > 0}
                      onClick={() => setGameMode('bot')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        gameMode === 'bot'
                          ? 'bg-amber-600 text-stone-950 font-bold'
                          : 'bg-stone-800 text-stone-400 hover:text-stone-200 disabled:opacity-50'
                      }`}
                    >
                      AI 對弈
                    </button>
                    <button
                      disabled={moves.length > 0}
                      onClick={() => setGameMode('pvp')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        gameMode === 'pvp'
                          ? 'bg-amber-600 text-stone-950 font-bold'
                          : 'bg-stone-800 text-stone-400 hover:text-stone-200 disabled:opacity-50'
                      }`}
                    >
                      雙人本機
                    </button>
                  </div>
                </div>

                {gameMode === 'bot' && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-400">AI 棋力</span>
                    <select
                      value={botDifficulty}
                      onChange={(e) => setBotDifficulty(e.target.value as BotDifficulty)}
                      className="bg-stone-800 border border-stone-700 text-stone-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
                    >
                      <option value="beginner">啟蒙難度 (18k)</option>
                      <option value="intermediate">普通段級 (8k)</option>
                      <option value="advanced">業餘有段 (1D)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Actions during match */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-stone-800">
                <button
                  disabled={isGameOver}
                  onClick={() => handlePass()}
                  className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <SkipForward className="w-3.5 h-3.5" /> 停一手 (Pass)
                </button>

                <button
                  disabled={isGameOver}
                  onClick={() => handleResign()}
                  className="py-2.5 px-3 rounded-xl bg-red-950/60 hover:bg-red-900/80 disabled:opacity-40 text-red-300 border border-red-800/60 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" /> 認輸投子
                </button>

                <button
                  onClick={() => startNewGame()}
                  className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors col-span-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> 重新開局
                </button>
              </div>
            </div>

            {/* Match Territory & Final Result Summary */}
            {isGameOver && (
              <div className="bg-stone-900 border border-amber-500/50 rounded-2xl p-6 shadow-xl space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Trophy className="w-4 h-4" /> 對局終局結算
                </div>
                <div className="text-2xl font-black text-amber-300">
                  {gameResult}
                </div>
                <p className="text-xs text-stone-400">
                  棋譜已自動儲存至當前棋手「{activeUser.name}」的歷史棋譜庫中，可切換至分頁隨時復盤或下載 SGF。
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= Mode 2: Kifu Records Archive & Replay ================= */}
      {subTab === 'records' && (
        <div className="space-y-6">
          {activeUser.savedGames.length === 0 ? (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-12 text-center text-stone-400 space-y-3">
              <BookOpen className="w-12 h-12 mx-auto text-stone-600" />
              <h3 className="text-base font-bold text-stone-200">尚無儲存的對局棋譜</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                在實戰對弈分頁完成對局，或點選上方「匯入 SGF 棋譜」按鈕載入對局記錄。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Replayer Board */}
              <div className="lg:col-span-7 flex flex-col items-center justify-center bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-xl">
                {selectedRecord ? (
                  <>
                    <div className="w-full flex items-center justify-between mb-3 text-xs text-stone-400">
                      <div className="font-semibold text-stone-200 truncate max-w-xs">
                        {selectedRecord.title}
                      </div>
                      <div className="font-mono text-amber-400">
                        進度: {replayStep} / {selectedRecord.moves.length} 手
                      </div>
                    </div>

                    <GoBoard
                      board={replayBoard}
                      boardSize={selectedRecord.boardSize}
                      lastMove={
                        replayStep > 0 && selectedRecord.moves[replayStep - 1]
                          ? { x: selectedRecord.moves[replayStep - 1].x, y: selectedRecord.moves[replayStep - 1].y }
                          : null
                      }
                      showMoveNumbers={true}
                      moveNumbersMap={replayMoveMap}
                      interactive={false}
                      className="max-w-full"
                    />

                    {/* Step navigation bar */}
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => setReplayStep(0)}
                        className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors"
                        title="第一手"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setReplayStep((s) => Math.max(0, s - 1))}
                        className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors"
                        title="上一手"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setReplayStep((s) => Math.min(selectedRecord.moves.length, s + 1))}
                        className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors"
                        title="下一手"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setReplayStep(selectedRecord.moves.length)}
                        className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors"
                        title="最後一手"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadSgf(selectedRecord)}
                        className="ml-4 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> 下載 SGF 棋譜檔
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-24 text-center text-stone-500 text-sm">
                    請從右側點選欲回放的棋譜
                  </div>
                )}
              </div>

              {/* Right: Saved Games List */}
              <div className="lg:col-span-5 bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    已存棋譜列表
                  </h3>
                  <span className="text-xs text-stone-400 font-mono">
                    共 {activeUser.savedGames.length} 局
                  </span>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {activeUser.savedGames.map((rec) => {
                    const isCurrent = selectedRecord?.id === rec.id;
                    return (
                      <div
                        key={rec.id}
                        onClick={() => {
                          setSelectedRecord(rec);
                          setReplayStep(rec.moves.length);
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isCurrent
                            ? 'bg-stone-800 border-amber-500/80 ring-1 ring-amber-500/50'
                            : 'bg-stone-850 hover:bg-stone-800/80 border-stone-800 text-stone-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-stone-100 truncate">
                            {rec.title}
                          </div>
                          <div className="text-xs text-stone-400 flex items-center gap-2 mt-1">
                            <span>{rec.date}</span>
                            <span>•</span>
                            <span>{rec.moves.length} 手</span>
                            {rec.winner && (
                              <>
                                <span>•</span>
                                <span className="text-amber-400 font-semibold">
                                  {rec.winner === 'black' ? '黑勝' : '白勝'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadSgf(rec);
                            }}
                            className="p-1.5 rounded-lg bg-stone-700/60 hover:bg-stone-700 text-stone-300 hover:text-amber-300 transition-colors"
                            title="下載 SGF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('確定要刪除這盤棋譜紀錄嗎？')) {
                                deleteGameRecord(rec.id);
                                if (selectedRecord?.id === rec.id) {
                                  setSelectedRecord(null);
                                }
                              }
                            }}
                            className="p-1.5 rounded-lg bg-stone-700/60 hover:bg-red-950 text-stone-400 hover:text-red-400 transition-colors"
                            title="刪除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
