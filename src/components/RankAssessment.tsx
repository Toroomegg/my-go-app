import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Award, CheckCircle2, ChevronRight, RotateCcw, ShieldAlert, Sparkles, TrendingUp, BarChart3, Clock, HelpCircle, Check, X } from 'lucide-react';
import { ASSESSMENT_QUESTIONS } from '../data/assessmentData';
import { AssessmentQuestion, AssessmentResult } from '../types/go';
import { createEmptyBoard, BoardMatrix } from '../engine/goRules';
import { GoBoard, BoardMarker } from './GoBoard';
import { useUser } from '../context/UserContext';
import { soundManager } from '../utils/sound';

interface Props {
  onGoToTsumego?: () => void;
}

export const RankAssessment: React.FC<Props> = ({ onGoToTsumego }) => {
  const { activeUser, recordAssessmentResult } = useUser();

  const [testState, setTestState] = useState<'intro' | 'testing' | 'result'>('intro');
  const [questionCountMode, setQuestionCountMode] = useState<number>(10); // 5 or 10
  const [activeQuestions, setActiveQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, string>>(new Map());
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);

  const startTest = (count: number) => {
    setQuestionCountMode(count);
    const shuffled = [...ASSESSMENT_QUESTIONS].slice(0, count);
    setActiveQuestions(shuffled);
    setCurrentIndex(0);
    setSelectedAnswers(new Map());
    setShowExplanation(false);
    setTestState('testing');
    soundManager.playStoneClick();
  };

  const currentQ = activeQuestions[currentIndex];

  // Prepare board for current question
  const currentBoard: BoardMatrix = React.useMemo(() => {
    if (!currentQ) return createEmptyBoard(9);
    const b = createEmptyBoard(currentQ.boardSize || 9);
    currentQ.initialStones.black.forEach((p) => {
      if (b[p.y] && b[p.y][p.x] !== undefined) b[p.y][p.x] = 'black';
    });
    currentQ.initialStones.white.forEach((p) => {
      if (b[p.y] && b[p.y][p.x] !== undefined) b[p.y][p.x] = 'white';
    });
    return b;
  }, [currentQ]);

  // Markers for board options
  const boardMarkers: BoardMarker[] = React.useMemo(() => {
    if (!currentQ) return [];
    const markers: BoardMarker[] = [];
    currentQ.options.forEach((opt) => {
      if (opt.point) {
        markers.push({
          point: opt.point,
          label: opt.id,
          type: 'letter',
          color: '#3b82f6',
        });
      }
    });
    return markers;
  }, [currentQ]);

  const handleSelectOption = (optionId: string) => {
    if (showExplanation) return;
    const newAnswers = new Map(selectedAnswers);
    newAnswers.set(currentIndex, optionId);
    setSelectedAnswers(newAnswers);
    setShowExplanation(true);

    const isCorrect = currentQ.options.find((o) => o.id === optionId)?.isCorrect;
    if (isCorrect) {
      soundManager.playSuccess();
    } else {
      soundManager.playFailure();
    }
  };

  const handleBoardClick = (point: { x: number; y: number }) => {
    if (showExplanation || !currentQ) return;
    const matchedOpt = currentQ.options.find(
      (o) => o.point && o.point.x === point.x && o.point.y === point.y
    );
    if (matchedOpt) {
      handleSelectOption(matchedOpt.id);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < activeQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
      setShowExplanation(false);
    } else {
      finishAssessment();
    }
  };

  const finishAssessment = () => {
    let totalScore = 0;
    const maxScore = activeQuestions.length * 100;

    const categoryScores: Record<string, { correct: number; total: number }> = {
      tsumego: { correct: 0, total: 0 },
      tesuji: { correct: 0, total: 0 },
      endgame: { correct: 0, total: 0 },
      strategy: { correct: 0, total: 0 },
      shape: { correct: 0, total: 0 },
    };

    activeQuestions.forEach((q, idx) => {
      const selectedId = selectedAnswers.get(idx);
      const opt = q.options.find((o) => o.id === selectedId);
      const isCorrect = opt?.isCorrect || false;

      categoryScores[q.category].total += 1;
      if (isCorrect) {
        totalScore += 100;
        categoryScores[q.category].correct += 1;
      }
    });

    const percent = Math.round((totalScore / maxScore) * 100);

    // Calculate Rank
    let rank = '15級 (15k)';
    let eloRating = 600;

    if (percent >= 90) {
      rank = '業餘 3段 (3 Dan)';
      eloRating = 2100;
    } else if (percent >= 80) {
      rank = '業餘 2段 (2 Dan)';
      eloRating = 1950;
    } else if (percent >= 70) {
      rank = '業餘 1段 (1 Dan)';
      eloRating = 1800;
    } else if (percent >= 60) {
      rank = '業餘 2級 (2 Kyu)';
      eloRating = 1550;
    } else if (percent >= 50) {
      rank = '業餘 5級 (5 Kyu)';
      eloRating = 1300;
    } else if (percent >= 35) {
      rank = '業餘 8級 (8 Kyu)';
      eloRating = 1050;
    } else if (percent >= 20) {
      rank = '業餘 12級 (12 Kyu)';
      eloRating = 800;
    } else {
      rank = '啟蒙入門 (18 Kyu)';
      eloRating = 550;
    }

    const calcCategoryPercent = (cat: string) => {
      const item = categoryScores[cat];
      if (!item || item.total === 0) return 70;
      return Math.round((item.correct / item.total) * 100);
    };

    const radar = {
      tsumego: calcCategoryPercent('tsumego'),
      tesuji: calcCategoryPercent('tesuji'),
      endgame: calcCategoryPercent('endgame'),
      strategy: calcCategoryPercent('strategy'),
      shape: calcCategoryPercent('shape'),
    };

    const suggestions: string[] = [];
    if (radar.tsumego < 70) suggestions.push('加強角隅基本死活題（直三、丁四、刀把五等聚殺與做活要點）');
    if (radar.tesuji < 70) suggestions.push('研習實戰手筋題（倒撲、接不歸、枷吃、夾攻等戰術突破）');
    if (radar.endgame < 70) suggestions.push('強化官子目數計算，切記「先手官子優先，逆先手次之」');
    if (radar.strategy < 70) suggestions.push('培養大局觀：牢記「急所大於大場」，避免過早糾纏於局部細節');
    if (radar.shape < 70) suggestions.push('改善棋形敏感度，戒絕「空三角」等愚形，多走雙、虎口、跳等好形');

    if (suggestions.length === 0) {
      suggestions.push('全方位實力扎實！建議挑戰 3D 以上高段死活專題與名局打譜。');
    }

    const result: AssessmentResult = {
      id: `result-${Date.now()}`,
      date: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      rank,
      eloRating,
      totalScore,
      maxScore,
      radarScores: radar,
      evaluationText: `評測綜合得分率 ${percent}%。在本次鑑定中，展現了符合「${rank}」的弈棋思維與計算深度。`,
      suggestedFocus: suggestions,
    };

    setAssessmentResult(result);
    recordAssessmentResult(result);
    setTestState('result');

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'tsumego': return '死活辨析';
      case 'tesuji': return '戰術手筋';
      case 'endgame': return '官子計算';
      case 'strategy': return '大局戰略';
      case 'shape': return '棋形構造';
      default: return '綜合考題';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Intro Screen */}
      {testState === 'intro' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-10 shadow-xl text-stone-100">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-2">
              <Award className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-amber-200">
              圍棋實力段位官方鑑定測驗
            </h1>
            <p className="text-stone-300 text-base leading-relaxed">
              融合傳統棋院定段考核體系與現代圍棋計算維度，全方位檢驗你的「死活、手筋、官子、大局觀、棋形」五大核心能力。
            </p>
            <div className="inline-block bg-stone-800/80 px-4 py-2 rounded-lg border border-stone-700/60 text-sm text-stone-300">
              當前受測棋手：<span className="font-bold text-amber-400">{activeUser.name}</span>（現標定：{activeUser.currentRank}）
            </div>
          </div>

          {/* Test Modes Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8 max-w-3xl mx-auto">
            <div
              onClick={() => startTest(5)}
              className="group cursor-pointer bg-stone-800/60 hover:bg-stone-800 hover:border-amber-500/60 transition-all border border-stone-700/60 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    快速自測
                  </span>
                  <span className="text-stone-400 text-xs flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> 約 3~5 分鐘
                  </span>
                </div>
                <h3 className="text-xl font-bold text-stone-100 group-hover:text-amber-300 transition-colors">
                  精簡段位抽測（5 題）
                </h3>
                <p className="text-xs text-stone-400 leading-relaxed">
                  精選 5 題核心關鍵局面，快速給出當前棋力區間判定與弱點診斷。
                </p>
              </div>
              <button className="mt-5 w-full py-2.5 px-4 rounded-lg bg-stone-700 hover:bg-amber-600 text-stone-100 font-medium text-sm transition-colors flex items-center justify-center gap-2">
                開始 5 題測驗 <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div
              onClick={() => startTest(10)}
              className="group cursor-pointer bg-stone-800/60 hover:bg-stone-800 hover:border-amber-500/60 transition-all border border-stone-700/60 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    推薦正式鑑定
                  </span>
                  <span className="text-stone-400 text-xs flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> 約 8~12 分鐘
                  </span>
                </div>
                <h3 className="text-xl font-bold text-stone-100 group-hover:text-amber-300 transition-colors">
                  全方位段位大考（10 題）
                </h3>
                <p className="text-xs text-stone-400 leading-relaxed">
                  覆蓋入門至業餘高段題型，完整生成五維實力雷達、獲頒專屬段位證書。
                </p>
              </div>
              <button className="mt-5 w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-900 font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                開始 10 題正式鑑定 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Past history */}
          {activeUser.assessmentHistory.length > 0 && (
            <div className="mt-10 pt-8 border-t border-stone-800 max-w-3xl mx-auto">
              <h4 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" /> 此棋手歷史鑑定記錄
              </h4>
              <div className="space-y-2">
                {activeUser.assessmentHistory.slice(0, 3).map((hist) => (
                  <div
                    key={hist.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-stone-800/40 border border-stone-800 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300">
                        {hist.rank}
                      </span>
                      <span className="text-stone-300">積分: {hist.eloRating}</span>
                      <span className="text-stone-500 text-xs">{hist.date}</span>
                    </div>
                    <span className="text-stone-400 text-xs">
                      得分率: {Math.round((hist.totalScore / hist.maxScore) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Testing In Progress Screen */}
      {testState === 'testing' && currentQ && (
        <div className="space-y-4">
          {/* Top Progress bar */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-stone-400 font-mono">
                題目 {currentIndex + 1} / {activeQuestions.length}
              </span>
              <span className="px-2 py-0.5 text-xs rounded bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30">
                {getCategoryLabel(currentQ.category)}
              </span>
              <span className="px-2 py-0.5 text-xs rounded bg-stone-800 text-stone-300 font-mono">
                目標難度: {currentQ.difficulty}
              </span>
            </div>
            <div className="w-36 sm:w-48 bg-stone-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-500 h-2 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Main Question Area: Board + Options */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Board Column */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-xl">
              <div className="mb-3 text-xs text-stone-400 flex items-center gap-2">
                <span>提示：可直接點擊棋盤上的選項標記，或在右側點選答案</span>
              </div>
              <GoBoard
                board={currentBoard}
                boardSize={currentQ.boardSize}
                cropBounds={currentQ.cropBounds}
                markers={boardMarkers}
                interactive={!showExplanation}
                onPointClick={handleBoardClick}
                className="max-w-full"
              />
            </div>

            {/* Right Question & Options Column */}
            <div className="lg:col-span-5 bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div>
                <h3 className="text-lg font-bold text-stone-100 leading-snug">
                  {currentQ.title}
                </h3>
                <p className="text-sm text-stone-300 mt-2 leading-relaxed">
                  {currentQ.questionText}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options.map((opt) => {
                  const isSelected = selectedAnswers.get(currentIndex) === opt.id;
                  let btnStyle = 'bg-stone-800/80 hover:bg-stone-800 text-stone-200 border-stone-700/70';

                  if (showExplanation) {
                    if (opt.isCorrect) {
                      btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500';
                    } else if (isSelected && !opt.isCorrect) {
                      btnStyle = 'bg-red-950/80 border-red-500 text-red-200 ring-1 ring-red-500';
                    } else {
                      btnStyle = 'bg-stone-900/60 opacity-50 border-stone-800 text-stone-400';
                    }
                  } else if (isSelected) {
                    btnStyle = 'bg-amber-600/30 border-amber-500 text-amber-200 ring-1 ring-amber-500';
                  }

                  return (
                    <button
                      key={opt.id}
                      disabled={showExplanation}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all text-sm font-medium flex items-start gap-3 ${btnStyle}`}
                    >
                      <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs bg-stone-700/60">
                        {opt.id}
                      </span>
                      <div className="flex-1">
                        <div>{opt.label}</div>
                        {showExplanation && (
                          <div className="text-xs mt-2 pt-2 border-t border-stone-700/40 text-stone-300 font-normal">
                            {opt.explanation}
                          </div>
                        )}
                      </div>
                      {showExplanation && opt.isCorrect && (
                        <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      {showExplanation && isSelected && !opt.isCorrect && (
                        <X className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Next Step Button */}
              {showExplanation && (
                <div className="pt-2">
                  <button
                    onClick={handleNextQuestion}
                    className="w-full py-3 px-5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
                  >
                    {currentIndex + 1 < activeQuestions.length ? (
                      <>進入下一題 <ChevronRight className="w-4 h-4" /></>
                    ) : (
                      <>查看段位鑑定報告 <Award className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assessment Result & Certificate Screen */}
      {testState === 'result' && assessmentResult && (
        <div className="space-y-6">
          {/* Certificate Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-[#201c18] to-stone-950 border-2 border-amber-500/50 rounded-2xl p-6 sm:p-10 shadow-2xl">
            {/* Certificate Watermark and Stamp */}
            <div className="absolute right-6 top-6 sm:right-12 sm:top-12 border-4 border-red-600/80 rounded-xl p-3 text-red-600 font-serif font-black tracking-widest text-center rotate-12 opacity-85 select-none pointer-events-none">
              <div className="text-xs">弈道棋院</div>
              <div className="text-lg">段位評定</div>
              <div className="text-[10px]">准許認證</div>
            </div>

            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm tracking-widest uppercase">
                <Sparkles className="w-4 h-4" /> 棋力鑑定正式認證書
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-amber-100 tracking-tight mt-2">
                圍棋實力段位證書
              </h2>
              <p className="text-xs text-stone-400 font-mono mt-1">
                證書編號：YD-{Date.now().toString().slice(-8)} ｜ 發證日期：{assessmentResult.date}
              </p>

              <div className="mt-8 space-y-4">
                <p className="text-stone-300 text-sm leading-relaxed">
                  茲證明棋手 <span className="font-bold text-amber-300 text-base underline decoration-amber-500/50">{activeUser.name}</span> 參加本院主辦之圍棋段位專業鑑定測驗，經綜合評定死活、手筋、官子、大局觀與棋形維度：
                </p>

                <div className="inline-flex items-center gap-4 bg-stone-900/90 border border-amber-500/40 rounded-2xl px-6 py-4 shadow-inner">
                  <div>
                    <div className="text-xs text-stone-400 font-mono">鑑定段位 (Rank)</div>
                    <div className="text-3xl sm:text-4xl font-black text-amber-400 tracking-wide mt-1">
                      {assessmentResult.rank}
                    </div>
                  </div>
                  <div className="h-10 w-px bg-stone-700/60" />
                  <div>
                    <div className="text-xs text-stone-400 font-mono">對弈估分 (Elo)</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-stone-200 mt-1">
                      {assessmentResult.eloRating}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-stone-400 italic">
                  {assessmentResult.evaluationText}
                </p>
              </div>
            </div>
          </div>

          {/* 5-Dimension Skill Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dimensions Bar Chart */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                五維圍棋能力分析
              </h3>

              <div className="space-y-3 pt-2">
                {[
                  { key: 'tsumego', label: '死活計算', score: assessmentResult.radarScores.tsumego },
                  { key: 'tesuji', label: '戰術手筋', score: assessmentResult.radarScores.tesuji },
                  { key: 'endgame', label: '官子目數', score: assessmentResult.radarScores.endgame },
                  { key: 'strategy', label: '大局戰略', score: assessmentResult.radarScores.strategy },
                  { key: 'shape', label: '棋形敏銳', score: assessmentResult.radarScores.shape },
                ].map((item) => (
                  <div key={item.key} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-stone-300">{item.label}</span>
                      <span className="text-amber-400 font-mono">{item.score}%</span>
                    </div>
                    <div className="h-2 w-full bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions & Next Steps */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  個人化進階訓練指引
                </h3>
                <ul className="mt-3 space-y-2 text-xs text-stone-300">
                  {assessmentResult.suggestedFocus.map((sug, i) => (
                    <li key={i} className="flex items-start gap-2 bg-stone-800/40 p-2.5 rounded-lg border border-stone-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-stone-800">
                <button
                  onClick={() => setTestState('intro')}
                  className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> 重新測驗
                </button>
                {onGoToTsumego && (
                  <button
                    onClick={onGoToTsumego}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow"
                  >
                    前往匹配死活題練習 <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
