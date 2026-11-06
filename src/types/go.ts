export type StoneColor = 'black' | 'white';
export type PointState = StoneColor | null;

export interface Point {
  x: number; // 0-indexed column
  y: number; // 0-indexed row
}

export interface MoveRecord {
  x: number;
  y: number;
  color: StoneColor;
  captured?: Point[];
  moveNumber: number;
  comment?: string;
}

export interface VariationNode {
  x: number;
  y: number;
  color: StoneColor;
  response?: VariationNode; // AI auto-response
  branches?: VariationNode[]; // Alternate player moves or AI branches
  isCorrect?: boolean;
  message?: string;
}

export type ProblemCategory = 'life' | 'kill' | 'seki' | 'ko' | 'tesuji';

export interface TsumegoProblem {
  id: string;
  title: string;
  level: string; // e.g. "15k", "8k", "3k", "1D", "3D", "5D"
  ratingPoints: number; // e.g. 500 (15k) to 2500 (5D)
  category: ProblemCategory;
  boardSize: number; // 9, 13, 19
  cropBounds?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  initialStones: {
    black: Point[];
    white: Point[];
  };
  playerColor: StoneColor;
  description: string;
  hint: string;
  solutionTree: VariationNode[];
  commentary?: string;
  source?: string;
}

export interface AssessmentQuestion {
  id: string;
  title: string;
  category: 'tsumego' | 'tesuji' | 'endgame' | 'strategy' | 'shape';
  difficulty: string; // e.g., "10k", "5k", "1k", "2D", "4D"
  targetDanPoints: number;
  questionText: string;
  boardSize: number;
  cropBounds?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  initialStones: {
    black: Point[];
    white: Point[];
  };
  playerColor: StoneColor;
  options: {
    id: string;
    label: string; // e.g. "A (3, 3)", "B (4, 2)"
    point?: Point;
    explanation: string;
    isCorrect: boolean;
    partialScore?: number; // 0 to 1
  }[];
}

export interface AssessmentResult {
  id: string;
  date: string;
  rank: string; // e.g. "2段 (2 Dan)", "3級 (3 Kyu)"
  eloRating: number;
  totalScore: number;
  maxScore: number;
  radarScores: {
    tsumego: number;   // 0-100
    tesuji: number;    // 0-100
    endgame: number;   // 0-100
    strategy: number;  // 0-100
    shape: number;     // 0-100
  };
  evaluationText: string;
  suggestedFocus: string[];
}

export interface GameRecord {
  id: string;
  title: string;
  date: string;
  boardSize: number;
  blackPlayer: string;
  whitePlayer: string;
  komi: number;
  handicap: number;
  winner?: 'black' | 'white' | 'draw';
  winReason?: 'resign' | 'score' | 'time';
  scoreDifference?: number;
  moves: MoveRecord[];
  sgfContent?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  createdAt: string;
  currentRank: string; // e.g., "5級", "1段"
  eloRating: number;
  solvedProblemIds: string[];
  failedProblemIds: string[];
  starredProblemIds: string[];
  assessmentHistory: AssessmentResult[];
  savedGames: GameRecord[];
  customProblems: TsumegoProblem[];
}
