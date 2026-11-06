import { Point, StoneColor } from '../types/go';
import { BoardMatrix, playMove, getGroup, getAdjacentPoints } from './goRules';

export type BotDifficulty = 'beginner' | 'novice' | 'intermediate' | 'advanced' | 'master';

export interface BotProfileInfo {
  id: BotDifficulty;
  name: string;
  rank: string;
  description: string;
  avatar: string;
}

export const BOT_PROFILES: Record<BotDifficulty, BotProfileInfo> = {
  beginner: {
    id: 'beginner',
    name: '棋童小弈',
    rank: '18級 (18k)',
    description: '剛接觸圍棋，行棋隨性，適合初學熱身與掌握基本提子吃子規則。',
    avatar: '🧒',
  },
  novice: {
    id: 'novice',
    name: '弈院學徒',
    rank: '10級 (10k)',
    description: '具備基本死活與防斷意識，會保護叫吃弱子，偶爾會露出破綻。',
    avatar: '🧑‍🎓',
  },
  intermediate: {
    id: 'intermediate',
    name: '業餘高手',
    rank: '5級 (5k)',
    description: '善於搶佔三路四路實地大場、二子頭必扳，行棋具備敏銳攻擊性。',
    avatar: '🥋',
  },
  advanced: {
    id: 'advanced',
    name: '弈道院長',
    rank: '業餘 1段 (1D)',
    description: '棋風穩健厚實，熟知基本定式、虛枷與手筋，具備深度的局部死活計算。',
    avatar: '🧓',
  },
  master: {
    id: 'master',
    name: '玄玄名士',
    rank: '業餘 3段+ (3D+)',
    description: '大局觀卓越，攻守平衡兼備深遠算路，善於借勁整形、圍空與搶佔先手急所。',
    avatar: '🧙‍♂️',
  },
};

// Calculate standard handicap stones for 9x9, 13x13, 19x19
export function getHandicapStones(boardSize: number, count: number): Point[] {
  if (count <= 0) return [];

  if (boardSize === 19) {
    const points: Record<number, Point[]> = {
      2: [{ x: 3, y: 15 }, { x: 15, y: 3 }],
      3: [{ x: 3, y: 15 }, { x: 15, y: 3 }, { x: 15, y: 15 }],
      4: [{ x: 3, y: 3 }, { x: 15, y: 3 }, { x: 3, y: 15 }, { x: 15, y: 15 }],
      5: [{ x: 3, y: 3 }, { x: 15, y: 3 }, { x: 3, y: 15 }, { x: 15, y: 15 }, { x: 9, y: 9 }],
      6: [{ x: 3, y: 3 }, { x: 15, y: 3 }, { x: 3, y: 15 }, { x: 15, y: 15 }, { x: 3, y: 9 }, { x: 15, y: 9 }],
      7: [{ x: 3, y: 3 }, { x: 15, y: 3 }, { x: 3, y: 15 }, { x: 15, y: 15 }, { x: 3, y: 9 }, { x: 15, y: 9 }, { x: 9, y: 9 }],
      8: [{ x: 3, y: 3 }, { x: 15, y: 3 }, { x: 3, y: 15 }, { x: 15, y: 15 }, { x: 3, y: 9 }, { x: 15, y: 9 }, { x: 9, y: 3 }, { x: 9, y: 15 }],
      9: [{ x: 3, y: 3 }, { x: 15, y: 3 }, { x: 3, y: 15 }, { x: 15, y: 15 }, { x: 3, y: 9 }, { x: 15, y: 9 }, { x: 9, y: 3 }, { x: 9, y: 15 }, { x: 9, y: 9 }],
    };
    return points[count] || points[4] || [];
  } else if (boardSize === 13) {
    const points: Record<number, Point[]> = {
      2: [{ x: 3, y: 9 }, { x: 9, y: 3 }],
      3: [{ x: 3, y: 9 }, { x: 9, y: 3 }, { x: 9, y: 9 }],
      4: [{ x: 3, y: 3 }, { x: 9, y: 3 }, { x: 3, y: 9 }, { x: 9, y: 9 }],
      5: [{ x: 3, y: 3 }, { x: 9, y: 3 }, { x: 3, y: 9 }, { x: 9, y: 9 }, { x: 6, y: 6 }],
    };
    return points[count] || points[4] || [];
  } else if (boardSize === 9) {
    const points: Record<number, Point[]> = {
      2: [{ x: 2, y: 6 }, { x: 6, y: 2 }],
      3: [{ x: 2, y: 6 }, { x: 6, y: 2 }, { x: 6, y: 6 }],
      4: [{ x: 2, y: 2 }, { x: 6, y: 2 }, { x: 2, y: 6 }, { x: 6, y: 6 }],
      5: [{ x: 2, y: 2 }, { x: 6, y: 2 }, { x: 2, y: 6 }, { x: 6, y: 6 }, { x: 4, y: 4 }],
    };
    return points[count] || points[4] || [];
  }

  return [];
}

// Go Bot move selector with multi-level tactical heuristics
export function getBotMove(
  board: BoardMatrix,
  botColor: StoneColor,
  difficulty: BotDifficulty = 'intermediate',
  koPoint: Point | null = null
): Point | null {
  const size = board.length;
  const opponentColor: StoneColor = botColor === 'black' ? 'white' : 'black';

  let totalStonesOnBoard = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] !== null) totalStonesOnBoard++;
    }
  }

  const candidateMoves: { point: Point; score: number }[] = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board[y][x] !== null) continue;
      const pt: Point = { x, y };

      const result = playMove(board, pt, botColor, koPoint);
      if (!result.valid || !result.newBoard) continue;

      let score = 10; // base score

      // 1. Check captures (Huge reward)
      if (result.captured.length > 0) {
        score += 100 * result.captured.length;
      }

      // 2. Check liberties after playing
      const myNewGroup = getGroup(result.newBoard, pt);
      if (myNewGroup) {
        if (myNewGroup.liberties.length === 1 && result.captured.length === 0) {
          // Self-atari trap! Heavily penalize
          score -= (difficulty === 'beginner' ? 80 : 250);
        } else if (myNewGroup.liberties.length === 2) {
          score += 10;
        } else if (myNewGroup.liberties.length >= 3) {
          score += 25;
        }
      }

      // 3. Position value (Corners and side stars early in opening)
      const distFromEdgeX = Math.min(x, size - 1 - x);
      const distFromEdgeY = Math.min(y, size - 1 - y);
      const edgeDist = Math.min(distFromEdgeX, distFromEdgeY);

      if (totalStonesOnBoard < size * 1.5) {
        // Opening phase
        if (edgeDist === 0) {
          // Avoid 1st line in opening
          score -= 40;
        } else if (edgeDist === 1) {
          // 2nd line generally low value early
          score -= 20;
        } else if (edgeDist === 2 || edgeDist === 3) {
          // 3rd & 4th line (Golden territory and influence)
          score += 45;

          // Corner star points (3,3), (3,15), (15,3), (15,15) on 19x19 or (2,2)/(6,6) on 9x9
          if (distFromEdgeX === 3 && distFromEdgeY === 3) score += 30;
          if (distFromEdgeX === 2 && distFromEdgeY === 3) score += 25; // 3-4 point (komoku)
          if (distFromEdgeX === 3 && distFromEdgeY === 2) score += 25;
        }
      } else {
        // Midgame and endgame
        if (edgeDist === 0) {
          // 1st line can be endgame hane/connect
          score += 15;
        }
      }

      // 4. Combat & connection analysis
      const neighbors = getAdjacentPoints(pt, size);
      let adjacentFriendlies = 0;
      let adjacentEnemies = 0;

      for (const n of neighbors) {
        if (board[n.y][n.x] === botColor) adjacentFriendlies++;
        if (board[n.y][n.x] === opponentColor) adjacentEnemies++;
      }

      if (adjacentEnemies > 0) score += 22 * adjacentEnemies;
      if (adjacentFriendlies > 0) score += 18 * adjacentFriendlies;

      // 5. Saving friendly stones in atari
      for (const n of neighbors) {
        if (board[n.y][n.x] === botColor) {
          const grp = getGroup(board, n);
          if (grp && grp.liberties.length === 1) {
            if (myNewGroup && myNewGroup.liberties.length >= 2) {
              score += 150;
            }
          }
        }
      }

      // 6. Attacking opponent stones in atari
      for (const n of neighbors) {
        if (board[n.y][n.x] === opponentColor) {
          const oppGrp = getGroup(board, n);
          if (oppGrp && oppGrp.liberties.length === 1) {
            score += 160;
          } else if (oppGrp && oppGrp.liberties.length === 2) {
            score += 40; // Putting pressure
          }
        }
      }

      // 7. Advanced: Tiger's mouth and Hane shapes
      if (difficulty === 'advanced' || difficulty === 'master') {
        if (adjacentFriendlies >= 2) {
          score += 35; // Connecting shape / tiger mouth
        }
        // Avoid filling one's own single eye
        let friendlyNeighborsCount = 0;
        for (const n of neighbors) {
          if (board[n.y][n.x] === botColor) friendlyNeighborsCount++;
        }
        if (friendlyNeighborsCount === neighbors.length && result.captured.length === 0) {
          // Likely an eye point! Do not fill own eye!
          score -= 300;
        }
      }

      // Random jitter based on difficulty
      if (difficulty === 'beginner') {
        score += (Math.random() - 0.5) * 120;
      } else if (difficulty === 'novice') {
        score += (Math.random() - 0.5) * 60;
      } else if (difficulty === 'intermediate') {
        score += (Math.random() - 0.5) * 25;
      } else if (difficulty === 'advanced') {
        score += (Math.random() - 0.5) * 10;
      } else {
        score += (Math.random() - 0.5) * 4;
      }

      candidateMoves.push({ point: pt, score });
    }
  }

  if (candidateMoves.length === 0) return null;

  candidateMoves.sort((a, b) => b.score - a.score);

  // If beginner, occasionally pick slightly sub-optimal
  if (difficulty === 'beginner' && candidateMoves.length > 3 && Math.random() < 0.45) {
    const pick = Math.floor(Math.random() * Math.min(5, candidateMoves.length));
    return candidateMoves[pick].point;
  }
  if (difficulty === 'novice' && candidateMoves.length > 2 && Math.random() < 0.25) {
    const pick = Math.floor(Math.random() * Math.min(3, candidateMoves.length));
    return candidateMoves[pick].point;
  }

  return candidateMoves[0].point;
}
