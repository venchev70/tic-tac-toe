export type Player = 'X' | 'O';
export type CellValue = Player | null;
export type GameMode = 'local' | 'ai';
export type RuleVariant = 'classic' | 'bolt';
export type AIDifficulty = 'easy' | 'unbeatable';
export type StarterRule = 'alternate' | 'always-x' | 'loser-first';
export type SeriesFormat = 0 | 3 | 5; // 0 = Unlimited Free Play

export interface WinInfo {
  winner: Player;
  line: [number, number, number];
}

export interface MoveRecord {
  moveNumber: number;
  player: Player;
  cellIndex: number;
  coordinate: string;
  removedCellIndex: number | null;
}

export interface RoundHistoryItem {
  roundNumber: number;
  winner: Player | 'DRAW';
  starter: Player;
  movesCount: number;
  variant: RuleVariant;
}

export interface ScoreBoard {
  X: number;
  O: number;
  draws: number;
}
