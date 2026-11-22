import { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw, Undo2, Volume2, VolumeX, ArrowRight } from 'lucide-react';
import { GameBoard } from './components/GameBoard';
import { MatchSidebar } from './components/MatchSidebar';
import { ScoreStrip } from './components/ScoreStrip';
import {
  AIDifficulty,
  CellValue,
  GameMode,
  MoveRecord,
  Player,
  RoundHistoryItem,
  RuleVariant,
  ScoreBoard,
  SeriesFormat,
  StarterRule,
} from './types/game';
import {
  applyMoveToState,
  checkWinner,
  chooseAIMove,
  getCellCoordinate,
  getNextVanishingCell,
  isBoardFull,
} from './utils/gameLogic';
import { playDrawSound, playMoveSound, playWinSound } from './utils/sound';

interface Snapshot {
  board: CellValue[];
  queues: Record<Player, number[]>;
  currentTurn: Player;
  moveLog: MoveRecord[];
}

const INITIAL_BOARD: CellValue[] = Array(9).fill(null);
const INITIAL_QUEUES: Record<Player, number[]> = { X: [], O: [] };

export default function App() {
  // Match Configuration
  const [gameMode, setGameMode] = useState<GameMode>('local');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('unbeatable');
  const [ruleVariant, setRuleVariant] = useState<RuleVariant>('classic');
  const [seriesFormat, setSeriesFormat] = useState<SeriesFormat>(0);
  const [starterRule, setStarterRule] = useState<StarterRule>('alternate');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showCoordinates, setShowCoordinates] = useState<boolean>(true);

  // Players & Series Score
  const [playerNames, setPlayerNames] = useState<Record<Player, string>>({
    X: 'Player 1',
    O: 'Player 2',
  });
  const [scores, setScores] = useState<ScoreBoard>({ X: 0, O: 0, draws: 0 });
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [roundStarter, setRoundStarter] = useState<Player>('X');
  const [roundHistory, setRoundHistory] = useState<RoundHistoryItem[]>([]);

  // Active Board State
  const [board, setBoard] = useState<CellValue[]>(INITIAL_BOARD);
  const [queues, setQueues] = useState<Record<Player, number[]>>(INITIAL_QUEUES);
  const [currentTurn, setCurrentTurn] = useState<Player>('X');
  const [moveLog, setMoveLog] = useState<MoveRecord[]>([]);
  const [undoStack, setUndoStack] = useState<Snapshot[]>([]);
  const [roundResultRecorded, setRoundResultRecorded] = useState<boolean>(false);

  const aiTimeoutRef = useRef<number | null>(null);

  const winInfo = checkWinner(board);
  const isDraw = !winInfo && ruleVariant === 'classic' && isBoardFull(board);
  const isRoundOver = Boolean(winInfo || isDraw);

  const targetWins = seriesFormat === 0 ? null : Math.ceil(seriesFormat / 2);
  const seriesWinner: Player | null =
    targetWins !== null
      ? scores.X >= targetWins
        ? 'X'
        : scores.O >= targetWins
          ? 'O'
          : null
      : null;

  const isAITurn = gameMode === 'ai' && currentTurn === 'O' && !isRoundOver;

  const getPlayerLabel = useCallback(
    (p: Player) => {
      if (gameMode === 'ai' && p === 'O') return 'Computer';
      return playerNames[p];
    },
    [gameMode, playerNames]
  );

  const clearAITimer = useCallback(() => {
    if (aiTimeoutRef.current !== null) {
      window.clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
  }, []);

  const executeMove = useCallback(
    (index: number) => {
      if (board[index] !== null || isRoundOver) return;

      const snapshot: Snapshot = {
        board: [...board],
        queues: { X: [...queues.X], O: [...queues.O] },
        currentTurn,
        moveLog: [...moveLog],
      };

      const { nextBoard, nextQueues, removedCellIndex } = applyMoveToState(
        board,
        queues,
        index,
        currentTurn,
        ruleVariant
      );

      const nextWin = checkWinner(nextBoard);
      const nextDraw =
        !nextWin && ruleVariant === 'classic' && isBoardFull(nextBoard);

      setUndoStack((prev) => [...prev, snapshot]);
      setBoard(nextBoard);
      setQueues(nextQueues);
      setMoveLog((prev) => [
        ...prev,
        {
          moveNumber: prev.length + 1,
          player: currentTurn,
          cellIndex: index,
          coordinate: getCellCoordinate(index),
          removedCellIndex,
        },
      ]);

      if (nextWin) {
        playWinSound(soundEnabled);
        if (!roundResultRecorded) {
          setRoundResultRecorded(true);
          setScores((prev) => ({
            ...prev,
            [nextWin.winner]: prev[nextWin.winner] + 1,
          }));
          setRoundHistory((prev) => [
            {
              roundNumber,
              winner: nextWin.winner,
              starter: roundStarter,
              movesCount: moveLog.length + 1,
              variant: ruleVariant,
            },
            ...prev,
          ]);
        }
      } else if (nextDraw) {
        playDrawSound(soundEnabled);
        if (!roundResultRecorded) {
          setRoundResultRecorded(true);
          setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
          setRoundHistory((prev) => [
            {
              roundNumber,
              winner: 'DRAW',
              starter: roundStarter,
              movesCount: moveLog.length + 1,
              variant: ruleVariant,
            },
            ...prev,
          ]);
        }
      } else {
        playMoveSound(currentTurn, soundEnabled);
        setCurrentTurn(currentTurn === 'X' ? 'O' : 'X');
      }
    },
    [
      board,
      currentTurn,
      isRoundOver,
      moveLog,
      queues,
      roundNumber,
      roundResultRecorded,
      roundStarter,
      ruleVariant,
      soundEnabled,
    ]
  );

  // Computer opponent turn effect
  useEffect(() => {
    if (!isAITurn) return;

    aiTimeoutRef.current = window.setTimeout(() => {
      const aiCell = chooseAIMove(board, queues, 'O', aiDifficulty, ruleVariant);
      if (aiCell !== -1) {
        executeMove(aiCell);
      }
    }, 420);

    return () => {
      clearAITimer();
    };
  }, [aiDifficulty, board, clearAITimer, executeMove, isAITurn, queues, ruleVariant]);

  const startNextRound = useCallback(
    (forceStarter?: Player) => {
      clearAITimer();
      const nextStarter: Player =
        forceStarter ??
        (starterRule === 'always-x'
          ? 'X'
          : roundStarter === 'X'
            ? 'O'
            : 'X');

      setBoard(INITIAL_BOARD);
      setQueues({ X: [], O: [] });
      setMoveLog([]);
      setUndoStack([]);
      setRoundResultRecorded(false);
      setRoundNumber((prev) => prev + 1);
      setRoundStarter(nextStarter);
      setCurrentTurn(nextStarter);
    },
    [clearAITimer, roundStarter, starterRule]
  );

  const restartCurrentRound = useCallback(() => {
    clearAITimer();
    setBoard(INITIAL_BOARD);
    setQueues({ X: [], O: [] });
    setMoveLog([]);
    setUndoStack([]);
    setRoundResultRecorded(false);
    setCurrentTurn(roundStarter);
  }, [clearAITimer, roundStarter]);

  const resetFullMatch = useCallback(
    (overrideStarter?: Player) => {
      clearAITimer();
      const starter = overrideStarter ?? 'X';
      setScores({ X: 0, O: 0, draws: 0 });
      setRoundNumber(1);
      setRoundStarter(starter);
      setCurrentTurn(starter);
      setRoundHistory([]);
      setBoard(INITIAL_BOARD);
      setQueues({ X: [], O: [] });
      setMoveLog([]);
      setUndoStack([]);
      setRoundResultRecorded(false);
    },
    [clearAITimer]
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0 || isRoundOver || isAITurn) return;
    clearAITimer();

    // In vs Computer mode, step back past both AI and human moves when possible
    const stepsBack =
      gameMode === 'ai' && undoStack.length >= 2 && currentTurn === 'X' ? 2 : 1;
    const targetIndex = undoStack.length - stepsBack;
    const target = undoStack[targetIndex];
    if (!target) return;

    setBoard(target.board);
    setQueues(target.queues);
    setCurrentTurn(target.currentTurn);
    setMoveLog(target.moveLog);
    setUndoStack(undoStack.slice(0, targetIndex));
  }, [clearAITimer, currentTurn, gameMode, isAITurn, isRoundOver, undoStack]);

  // Mode / Rule changes cleanly reset the active round or match as appropriate
  const handleModeChange = (mode: GameMode) => {
    if (mode === gameMode) return;
    setGameMode(mode);
    resetFullMatch('X');
  };

  const handleVariantChange = (variant: RuleVariant) => {
    if (variant === ruleVariant) return;
    setRuleVariant(variant);
    restartCurrentRound();
  };

  const handleSeriesChange = (fmt: SeriesFormat) => {
    if (fmt === seriesFormat) return;
    setSeriesFormat(fmt);
    resetFullMatch('X');
  };

  const handleStarterRuleChange = (rule: StarterRule) => {
    setStarterRule(rule);
    if (rule === 'always-x' && moveLog.length === 0 && !isRoundOver) {
      setRoundStarter('X');
      setCurrentTurn('X');
    }
  };

  // Keyboard shortcuts (1-9 for squares, R for next round)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key >= '1' && e.key <= '9') {
        if (!isAITurn && !isRoundOver) {
          executeMove(Number(e.key) - 1);
        }
      } else if (e.key.toLowerCase() === 'r' && isRoundOver && !seriesWinner) {
        startNextRound();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [executeMove, isAITurn, isRoundOver, seriesWinner, startNextRound]);

  const vanishingCellIndex = getNextVanishingCell(queues, currentTurn, ruleVariant);
  const lastMoveIndex =
    moveLog.length > 0 ? moveLog[moveLog.length - 1].cellIndex : null;

  const roundStatusHeadline = seriesWinner
    ? `${getPlayerLabel(seriesWinner)} wins the Best of ${seriesFormat} series`
    : winInfo
      ? `${getPlayerLabel(winInfo.winner)} (${winInfo.winner}) wins Round ${roundNumber}`
      : isDraw
        ? `Round ${roundNumber} ended in a draw`
        : isAITurn
          ? 'Computer is thinking…'
          : `${getPlayerLabel(currentTurn)}'s turn (${currentTurn})`;

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F4F6] text-slate-900">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 py-4">
          <a
            href="#arena"
            className="font-display text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Tic-Tac-Toe
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a
              href="#arena"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Game Board
            </a>
            <a
              href="#rules"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Match Setup
            </a>
            <a
              href="#history"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Round Log
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => resetFullMatch('X')}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            >
              Reset Match
            </button>
          </div>
        </div>
      </header>

      {/* Main Tabletop Workspace */}
      <main
        id="arena"
        className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)] gap-8 items-start">
          {/* Primary Arena Column */}
          <div className="space-y-5">
            {/* Compact Header & Unboxed Metadata */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{gameMode === 'local' ? 'Local Multiplayer' : 'Solo vs Computer'}</span>
                  <span aria-hidden="true">·</span>
                  <span>{ruleVariant === 'classic' ? 'Classic 3×3' : 'Bolt (Max 3 Marks)'}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">Round {roundNumber}</span>
                  {seriesFormat !== 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Best of {seriesFormat}</span>
                    </>
                  )}
                </div>
                <h1
                  aria-live="polite"
                  className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance"
                >
                  {roundStatusHeadline}
                </h1>
              </div>

              {isRoundOver && (
                <button
                  type="button"
                  onClick={() =>
                    seriesWinner ? resetFullMatch('X') : startNextRound()
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                >
                  <span>{seriesWinner ? 'Play New Series' : 'Next Round'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 3-Column Scoreboard */}
            <ScoreStrip
              scores={scores}
              playerNames={playerNames}
              onUpdateName={(player, name) =>
                setPlayerNames((prev) => ({ ...prev, [player]: name }))
              }
              currentTurn={currentTurn}
              isRoundOver={isRoundOver}
              winner={winInfo ? winInfo.winner : isDraw ? 'DRAW' : null}
              gameMode={gameMode}
              seriesFormat={seriesFormat}
              targetWins={targetWins}
            />

            {/* 3x3 Board */}
            <div className="pt-1">
              <GameBoard
                board={board}
                currentTurn={currentTurn}
                winInfo={winInfo}
                isDraw={isDraw}
                disabled={isAITurn}
                vanishingCellIndex={vanishingCellIndex}
                lastMoveIndex={lastMoveIndex}
                showCoordinates={showCoordinates}
                onCellClick={(idx) => {
                  if (!isAITurn) {
                    executeMove(idx);
                  }
                }}
              />
            </div>

            {/* Action Toolbar */}
            <div className="mx-auto max-w-[440px] flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={undoStack.length === 0 || isRoundOver || isAITurn}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Undo Move</span>
                </button>

                <button
                  type="button"
                  onClick={restartCurrentRound}
                  disabled={moveLog.length === 0 && !isRoundOver}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart Round</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSoundEnabled((prev) => !prev)}
                aria-pressed={soundEnabled}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Sound On</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                    <span>Sound Off</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Match Configuration & History Column */}
          <MatchSidebar
            gameMode={gameMode}
            onChangeGameMode={handleModeChange}
            aiDifficulty={aiDifficulty}
            onChangeAIDifficulty={setAiDifficulty}
            ruleVariant={ruleVariant}
            onChangeRuleVariant={handleVariantChange}
            seriesFormat={seriesFormat}
            onChangeSeriesFormat={handleSeriesChange}
            starterRule={starterRule}
            onChangeStarterRule={handleStarterRuleChange}
            showCoordinates={showCoordinates}
            onToggleCoordinates={() => setShowCoordinates((prev) => !prev)}
            moveLog={moveLog}
            roundHistory={roundHistory}
            playerNames={playerNames}
          />
        </div>
      </main>
    </div>
  );
}
