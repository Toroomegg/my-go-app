import { Point, PointState, StoneColor, MoveRecord } from '../types/go';

export type BoardMatrix = PointState[][];

export function createEmptyBoard(size: number): BoardMatrix {
  return Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));
}

export function cloneBoard(board: BoardMatrix): BoardMatrix {
  return board.map((row) => [...row]);
}

export function getAdjacentPoints(p: Point, size: number): Point[] {
  const neighbors: Point[] = [];
  if (p.x > 0) neighbors.push({ x: p.x - 1, y: p.y });
  if (p.x < size - 1) neighbors.push({ x: p.x + 1, y: p.y });
  if (p.y > 0) neighbors.push({ x: p.x, y: p.y - 1 });
  if (p.y < size - 1) neighbors.push({ x: p.x, y: p.y + 1 });
  return neighbors;
}

// Find all connected stones of the same color, plus their collective liberties
export function getGroup(
  board: BoardMatrix,
  start: Point
): { stones: Point[]; liberties: Point[]; color: StoneColor } | null {
  const size = board.length;
  const color = board[start.y][start.x];
  if (!color) return null;

  const visitedStones = new Set<string>();
  const visitedLiberties = new Set<string>();
  const stones: Point[] = [];
  const liberties: Point[] = [];

  const queue: Point[] = [start];
  visitedStones.add(`${start.x},${start.y}`);

  while (queue.length > 0) {
    const current = queue.shift()!;
    stones.push(current);

    const neighbors = getAdjacentPoints(current, size);
    for (const n of neighbors) {
      const neighborColor = board[n.y][n.x];
      const key = `${n.x},${n.y}`;
      if (neighborColor === null) {
        if (!visitedLiberties.has(key)) {
          visitedLiberties.add(key);
          liberties.push(n);
        }
      } else if (neighborColor === color) {
        if (!visitedStones.has(key)) {
          visitedStones.add(key);
          queue.push(n);
        }
      }
    }
  }

  return { stones, liberties, color };
}

export interface PlayResult {
  valid: boolean;
  reason?: string;
  captured: Point[];
  newBoard?: BoardMatrix;
  newKoPoint?: Point | null;
}

// Attempt to place a stone on board
export function playMove(
  board: BoardMatrix,
  point: Point,
  color: StoneColor,
  koPoint: Point | null = null
): PlayResult {
  const size = board.length;
  if (point.x < 0 || point.x >= size || point.y < 0 || point.y >= size) {
    return { valid: false, reason: '座標超出棋盤範圍', captured: [] };
  }

  if (board[point.y][point.x] !== null) {
    return { valid: false, reason: '該交叉點已有棋子', captured: [] };
  }

  // Ko rule check
  if (koPoint && koPoint.x === point.x && koPoint.y === point.y) {
    return { valid: false, reason: '同形再現（打劫禁手）', captured: [] };
  }

  const nextBoard = cloneBoard(board);
  nextBoard[point.y][point.x] = color;

  const opponentColor: StoneColor = color === 'black' ? 'white' : 'black';
  const neighbors = getAdjacentPoints(point, size);
  const captured: Point[] = [];

  // Check adjacent opponent groups for capture
  const checkedGroups = new Set<string>();
  for (const n of neighbors) {
    if (nextBoard[n.y][n.x] === opponentColor) {
      const key = `${n.x},${n.y}`;
      if (!checkedGroups.has(key)) {
        const group = getGroup(nextBoard, n);
        if (group) {
          group.stones.forEach((s) => checkedGroups.add(`${s.x},${s.y}`));
          if (group.liberties.length === 0) {
            // Group has no liberties! Capture them!
            captured.push(...group.stones);
          }
        }
      }
    }
  }

  // Remove captured stones from nextBoard
  for (const c of captured) {
    nextBoard[c.y][c.x] = null;
  }

  // Check suicide rule on own group
  const ownGroup = getGroup(nextBoard, point);
  if (!ownGroup || ownGroup.liberties.length === 0) {
    // Suicide!
    return { valid: false, reason: '自殺禁著點（無氣且未提子）', captured: [] };
  }

  // Check if a single stone was captured and the placing stone has exactly 1 liberty => Ko situation
  let newKoPoint: Point | null = null;
  if (captured.length === 1 && ownGroup.stones.length === 1 && ownGroup.liberties.length === 1) {
    newKoPoint = captured[0];
  }

  return {
    valid: true,
    captured,
    newBoard: nextBoard,
    newKoPoint,
  };
}

// Convert coordinates like (3, 3) to Go notation "D16" on a 19x19 board
export function pointToCoordinate(p: Point, size: number): string {
  // Columns: A B C D E F G H J K L M N O P Q R S T (I is traditionally omitted in Go)
  const cols = ['A','B','C','D','E','F','G','H','J','K','L','M','N','O','P','Q','R','S','T'];
  const colLetter = cols[p.x] || String.fromCharCode(65 + p.x);
  const rowNumber = size - p.y;
  return `${colLetter}${rowNumber}`;
}

// Convert SGF coordinate (e.g. "pd") to Point (x, y)
export function sgfCoordToPoint(sgf: string): Point | null {
  if (!sgf || sgf.length < 2) return null;
  const x = sgf.charCodeAt(0) - 97;
  const y = sgf.charCodeAt(1) - 97;
  return { x, y };
}

// Convert Point to SGF coordinate (e.g. {x: 15, y: 3} -> "pd")
export function pointToSgfCoord(p: Point): string {
  return String.fromCharCode(97 + p.x) + String.fromCharCode(97 + p.y);
}

// Generate SGF file content from a played game
export function generateSgf(
  moves: MoveRecord[],
  boardSize: number = 19,
  blackPlayer: string = 'Black',
  whitePlayer: string = 'White',
  result: string = 'B+R',
  komi: number = 6.5
): string {
  const dateStr = new Date().toISOString().slice(0, 10);
  let sgf = `(;GM[1]FF[4]CA[UTF-8]AP[YiDaoGo:1.0]SZ[${boardSize}]KM[${komi}]RU[Japanese]PW[${whitePlayer}]PB[${blackPlayer}]DT[${dateStr}]RE[${result}]`;

  for (const m of moves) {
    const colTag = m.color === 'black' ? 'B' : 'W';
    const coord = pointToSgfCoord(m);
    sgf += `;${colTag}[${coord}]`;
  }

  sgf += ')';
  return sgf;
}

// Simple SGF parser to extract moves and board size
export function parseSgf(sgfContent: string): {
  boardSize: number;
  blackPlayer: string;
  whitePlayer: string;
  komi: number;
  moves: MoveRecord[];
} {
  const sizeMatch = sgfContent.match(/SZ\[(\d+)\]/);
  const boardSize = sizeMatch ? parseInt(sizeMatch[1], 10) : 19;

  const pbMatch = sgfContent.match(/PB\[([^\]]*)\]/);
  const pwMatch = sgfContent.match(/PW\[([^\]]*)\]/);
  const kmMatch = sgfContent.match(/KM\[([^\]]*)\]/);

  const blackPlayer = pbMatch ? pbMatch[1] : '黑棋';
  const whitePlayer = pwMatch ? pwMatch[1] : '白棋';
  const komi = kmMatch ? parseFloat(kmMatch[1]) : 6.5;

  const moveRegex = /;([BW])\[([a-z]{0,2})\]/gi;
  const moves: MoveRecord[] = [];
  let match: RegExpExecArray | null;
  let moveNumber = 1;

  while ((match = moveRegex.exec(sgfContent)) !== null) {
    const color: StoneColor = match[1].toUpperCase() === 'B' ? 'black' : 'white';
    const coordStr = match[2];
    if (coordStr.length === 2) {
      const p = sgfCoordToPoint(coordStr);
      if (p && p.x < boardSize && p.y < boardSize) {
        moves.push({
          x: p.x,
          y: p.y,
          color,
          moveNumber: moveNumber++,
        });
      }
    }
  }

  return { boardSize, blackPlayer, whitePlayer, komi, moves };
}

// Estimate territory score using territory flood-fill
export function estimateTerritory(board: BoardMatrix): {
  blackTerritory: Point[];
  whiteTerritory: Point[];
  dame: Point[]; // neutral points
  blackStonesCount: number;
  whiteStonesCount: number;
} {
  const size = board.length;
  const visited = new Set<string>();
  const blackTerritory: Point[] = [];
  const whiteTerritory: Point[] = [];
  const dame: Point[] = [];
  let blackStonesCount = 0;
  let whiteStonesCount = 0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board[y][x] === 'black') blackStonesCount++;
      if (board[y][x] === 'white') whiteStonesCount++;
    }
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board[y][x] !== null || visited.has(`${x},${y}`)) continue;

      // Flood fill empty region
      const region: Point[] = [];
      const touchingColors = new Set<StoneColor>();
      const queue: Point[] = [{ x, y }];
      visited.add(`${x},${y}`);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        region.push(curr);

        const neighbors = getAdjacentPoints(curr, size);
        for (const n of neighbors) {
          const color = board[n.y][n.x];
          if (color !== null) {
            touchingColors.add(color);
          } else {
            const key = `${n.x},${n.y}`;
            if (!visited.has(key)) {
              visited.add(key);
              queue.push(n);
            }
          }
        }
      }

      if (touchingColors.size === 1) {
        if (touchingColors.has('black')) {
          blackTerritory.push(...region);
        } else if (touchingColors.has('white')) {
          whiteTerritory.push(...region);
        }
      } else {
        dame.push(...region);
      }
    }
  }

  return { blackTerritory, whiteTerritory, dame, blackStonesCount, whiteStonesCount };
}
