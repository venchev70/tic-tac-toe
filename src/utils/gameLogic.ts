import { AIDifficulty, CellValue, Player, RuleVariant, WinInfo } from '../types/game';

export const WIN_LINES: [number, number, number][] = [
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row
  [0, 3, 6], // Left column
  [1, 4, 7], // Middle column
  [2, 5, 8], // Right column
  [0, 4, 8], // Main diagonal
  [2, 4, 6], // Anti-diagonal
];

const COORDINATES = ['A1', 'B1', 'C1', 'A2', 'B2', 'C2', 'A3', 'B3', 'C3'] as const;

export function getCellCoordinate(index: number): string {
  return COORDINATES[index] ?? `#${index + 1}`;
}

export function checkWinner(board: CellValue[]): WinInfo | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return {
        winner: board[a] as Player,
        line,
      };
    }
  }
  return null;
}

export function isBoardFull(board: CellValue[]): boolean {
  return board.every((cell) => cell !== null);
}

/**
 * Computes the next board and player piece queues after placing `player` at `index`.
 * In 'bolt' variant, each player can hold at most 3 pieces on the board; placing a 4th
 * removes their oldest piece first.
 */
export function applyMoveToState(
  board: CellValue[],
  queues: Record<Player, number[]>,
  index: number,
  player: Player,
  variant: RuleVariant
): {
  nextBoard: CellValue[];
  nextQueues: Record<Player, number[]>;
  removedCellIndex: number | null;
} {
  const nextBoard = [...board];
  const nextQueues: Record<Player, number[]> = {
    X: [...queues.X],
    O: [...queues.O],
  };

  let removedCellIndex: number | null = null;

  if (variant === 'bolt' && nextQueues[player].length >= 3) {
    const oldest = nextQueues[player].shift();
    if (oldest !== undefined) {
      nextBoard[oldest] = null;
      removedCellIndex = oldest;
    }
  }

  nextBoard[index] = player;
  nextQueues[player].push(index);

  return { nextBoard, nextQueues, removedCellIndex };
}

/**
 * Returns the cell index that will vanish on `player`'s next move in Bolt mode, or null.
 */
export function getNextVanishingCell(
  queues: Record<Player, number[]>,
  player: Player,
  variant: RuleVariant
): number | null {
  if (variant !== 'bolt') return null;
  if (queues[player].length >= 3) {
    return queues[player][0] ?? null;
  }
  return null;
}

/**
 * Computes the line coordinates (in SVG 0..300 space) for drawing a clean winning strike-through.
 */
export function getWinLineCoords(line: [number, number, number]): {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
} {
  const center = (idx: number) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    return {
      x: col * 100 + 50,
      y: row * 100 + 50,
    };
  };

  const start = center(line[0]);
  const end = center(line[2]);

  // Extend slightly past cell centers for crisp visual balance
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy) || 1;
  const extend = 26;

  return {
    x1: start.x - (dx / len) * extend,
    y1: start.y - (dy / len) * extend,
    x2: end.x + (dx / len) * extend,
    y2: end.y + (dy / len) * extend,
  };
}

/**
 * Computer move selection for optional vs-Computer mode.
 * Supports both Classic and Bolt variants.
 */
export function chooseAIMove(
  board: CellValue[],
  queues: Record<Player, number[]>,
  aiPlayer: Player,
  difficulty: AIDifficulty,
  variant: RuleVariant
): number {
  const emptyCells = board
    .map((val, idx) => (val === null ? idx : -1))
    .filter((idx) => idx !== -1);

  if (emptyCells.length === 0) return -1;

  if (difficulty === 'easy') {
    // 35% chance to take an immediate winning move, otherwise random open square
    if (Math.random() < 0.35) {
      for (const idx of emptyCells) {
        const { nextBoard } = applyMoveToState(board, queues, idx, aiPlayer, variant);
        if (checkWinner(nextBoard)?.winner === aiPlayer) return idx;
      }
    }
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  const humanPlayer: Player = aiPlayer === 'X' ? 'O' : 'X';

  // Depth-limited minimax (classic reaches full depth 9; bolt uses depth 6 with heuristic)
  const maxDepth = variant === 'classic' ? 9 : 6;

  function minimax(
    currBoard: CellValue[],
    currQueues: Record<Player, number[]>,
    isMaximizing: boolean,
    depth: number,
    alpha: number,
    beta: number
  ): number {
    const win = checkWinner(currBoard);
    if (win) {
      return win.winner === aiPlayer ? 100 - depth : depth - 100;
    }
    if (variant === 'classic' && isBoardFull(currBoard)) {
      return 0;
    }
    if (depth >= maxDepth) {
      return 0;
    }

    const available = currBoard
      .map((val, idx) => (val === null ? idx : -1))
      .filter((idx) => idx !== -1);

    if (isMaximizing) {
      let best = -Infinity;
      for (const idx of available) {
        const { nextBoard, nextQueues } = applyMoveToState(
          currBoard,
          currQueues,
          idx,
          aiPlayer,
          variant
        );
        const score = minimax(nextBoard, nextQueues, false, depth + 1, alpha, beta);
        best = Math.max(best, score);
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const idx of available) {
        const { nextBoard, nextQueues } = applyMoveToState(
          currBoard,
          currQueues,
          idx,
          humanPlayer,
          variant
        );
        const score = minimax(nextBoard, nextQueues, true, depth + 1, alpha, beta);
        best = Math.min(best, score);
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  let bestScore = -Infinity;
  let bestMoves: number[] = [];

  for (const idx of emptyCells) {
    const { nextBoard, nextQueues } = applyMoveToState(board, queues, idx, aiPlayer, variant);
    const score = minimax(nextBoard, nextQueues, false, 0, -Infinity, Infinity);
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [idx];
    } else if (score === bestScore) {
      bestMoves.push(idx);
    }
  }

  // Prefer center if tied on opening move for natural play
  if (bestMoves.includes(4) && emptyCells.length >= 8) {
    return 4;
  }
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}
