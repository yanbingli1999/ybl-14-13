import useGameStore from '@/store/useGameStore';
import CandyCell from './CandyCell';
import { BOARD_SIZE } from '@/types';
import { BOARD_LAYOUT } from '@/data/config';

export default function GameBoard() {
  const { board, selectedCandy, selectCandy, isAnimating, gamePhase, switchStates, trackBoosts, activeTrackChains } = useGameStore();

  const handleCellClick = (row: number, col: number) => {
    if (isAnimating || gamePhase !== 'playing') return;
    selectCandy({ row, col });
  };

  const getCellInfo = (row: number, col: number) => {
    const track = BOARD_LAYOUT.tracks.find(t => t.row === row && t.col === col);
    if (track) {
      return { cellType: 'track' as const, trackDirection: track.direction, trackTarget: track.targetCandyType };
    }

    const sw = switchStates.find(s => s.row === row && s.col === col);
    if (sw) {
      return { cellType: 'switch' as const, switchState: sw };
    }

    return { cellType: 'normal' as const };
  };

  const getBoostForCell = (row: number, col: number) => {
    return trackBoosts.find(b => b.key === `${row},${col}`);
  };

  const isInActiveChain = (row: number, col: number) => {
    return activeTrackChains.some(chain =>
      chain.some(pos => pos.row === row && pos.col === col)
    );
  };

  const getChainColor = (row: number, col: number): string | null => {
    for (const chain of activeTrackChains) {
      const pos = chain.find(p => p.row === row && p.col === col);
      if (pos) {
        const firstPos = chain[0];
        const track = BOARD_LAYOUT.tracks.find(t => t.row === firstPos.row && t.col === firstPos.col);
        const sw = switchStates.find(s => s.row === firstPos.row && s.col === firstPos.col);
        if (track) {
          const colors: Record<string, string> = {
            strawberry: '#FF6B9D',
            lemon: '#FFD93D',
            mint: '#6BCB77',
            blueberry: '#4D96FF',
            grape: '#9B59B6',
          };
          return colors[track.targetCandyType] || '#FFD93D';
        }
        if (sw) {
          const target = sw.targetCandyTypes[sw.currentDirectionIndex % sw.targetCandyTypes.length];
          const colors: Record<string, string> = {
            strawberry: '#FF6B9D',
            lemon: '#FFD93D',
            mint: '#6BCB77',
            blueberry: '#4D96FF',
            grape: '#9B59B6',
          };
          return colors[target] || '#FF9F43';
        }
      }
    }
    return null;
  };

  return (
    <div className="relative">
      <div
        className="grid gap-1 sm:gap-1.5 p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-xl relative overflow-hidden"
        style={{
          gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
          boxShadow: '0 10px 40px rgba(139, 69, 19, 0.3), inset 0 2px 4px rgba(255,255,255,0.5)',
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((candy, colIndex) => {
            const cellInfo = getCellInfo(rowIndex, colIndex);
            const boostState = getBoostForCell(rowIndex, colIndex);
            const inChain = isInActiveChain(rowIndex, colIndex);
            const chainColor = getChainColor(rowIndex, colIndex);

            return (
              <div
                key={candy?.id || `empty-${rowIndex}-${colIndex}`}
                className="relative"
                style={{
                  zIndex: inChain ? 2 : 1,
                }}
              >
                {inChain && chainColor && (
                  <div
                    className="absolute inset-0 rounded-xl animate-track-chain-glow pointer-events-none z-[1]"
                    style={{
                      boxShadow: `0 0 16px ${chainColor}, 0 0 32px ${chainColor}88, inset 0 0 12px ${chainColor}44`,
                      border: `2px solid ${chainColor}`,
                    }}
                  />
                )}
                <CandyCell
                  candy={candy}
                  row={rowIndex}
                  col={colIndex}
                  isSelected={
                    selectedCandy?.row === rowIndex && selectedCandy?.col === colIndex
                  }
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  cellType={cellInfo.cellType}
                  trackDirection={'trackDirection' in cellInfo ? cellInfo.trackDirection : undefined}
                  trackTarget={'trackTarget' in cellInfo ? cellInfo.trackTarget : undefined}
                  switchState={'switchState' in cellInfo ? cellInfo.switchState : undefined}
                  boostState={boostState}
                  inChain={inChain}
                  chainColor={chainColor || undefined}
                />
              </div>
            );
          })
        )}
      </div>

      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-amber-600 shadow-lg border-4 border-amber-200" />
      <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-amber-600 shadow-lg border-4 border-amber-200" />
      <div className="absolute -bottom-3 -left-3 w-8 h-8 rounded-full bg-amber-600 shadow-lg border-4 border-amber-200" />
      <div className="absolute -bottom-3 -right-3 w-8 h-8 rounded-full bg-amber-600 shadow-lg border-4 border-amber-200" />
    </div>
  );
}
