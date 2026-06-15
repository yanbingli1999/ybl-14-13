import { Candy, TrackDirection, SwitchCellConfig, TrackBoostState } from '@/types';
import { CANDY_CONFIG } from '@/data/config';
import { cn } from '@/lib/utils';

interface CandyCellProps {
  candy: Candy | null;
  isSelected: boolean;
  onClick: () => void;
  row: number;
  col: number;
  cellType: 'normal' | 'track' | 'switch';
  trackDirection?: TrackDirection;
  trackTarget?: string;
  switchState?: SwitchCellConfig;
  boostState?: TrackBoostState;
  inChain?: boolean;
  chainColor?: string;
}

const DIRECTION_ARROWS: Record<TrackDirection, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
};

const DIRECTION_ROTATION: Record<TrackDirection, number> = {
  right: 0,
  down: 90,
  left: 180,
  up: 270,
};

export default function CandyCell({
  candy,
  isSelected,
  onClick,
  cellType,
  trackDirection,
  trackTarget,
  switchState,
  boostState,
  inChain = false,
  chainColor,
}: CandyCellProps) {
  const currentSwitchDir =
    switchState
      ? switchState.directions[switchState.currentDirectionIndex % switchState.directions.length]
      : undefined;
  const currentSwitchTarget =
    switchState
      ? switchState.targetCandyTypes[switchState.currentDirectionIndex % switchState.targetCandyTypes.length]
      : undefined;

  const direction = cellType === 'track' ? trackDirection : currentSwitchDir;
  const targetCandyType = cellType === 'track' ? trackTarget : currentSwitchTarget;
  const targetConfig = targetCandyType ? CANDY_CONFIG[targetCandyType as keyof typeof CANDY_CONFIG] : null;
  const isBoosted = boostState?.active ?? false;
  const boostCount = boostState?.count || 0;

  const baseBgColor = targetConfig?.color || '#FF9F43';

  if (!candy) {
    return (
      <div className="w-12 h-12 sm:w-14 sm:h-14 relative">
        {cellType !== 'normal' && (
          <div
            className={cn(
              'absolute inset-0 rounded-xl transition-all duration-300',
              isBoosted && 'animate-track-boost',
              inChain && 'animate-track-pulse'
            )}
            style={{
              background: `repeating-linear-gradient(${DIRECTION_ROTATION[direction!]}deg, ${baseBgColor}33, ${baseBgColor}33 4px, transparent 4px, transparent 8px)`,
              border: cellType === 'switch'
                ? `2px dashed ${baseBgColor}`
                : `2px solid ${baseBgColor}88`,
              opacity: 0.4,
            }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `rotate(${DIRECTION_ROTATION[direction!]}deg)`,
              }}
            >
              <span className="text-2xl opacity-30">➤</span>
            </div>
          </div>
        )}

        {cellType === 'switch' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div
              className="text-xs font-bold px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${baseBgColor}33`,
                color: baseBgColor,
                border: `1px solid ${baseBgColor}88`,
              }}
            >
              🔀
            </div>
          </div>
        )}

        {isBoosted && (
          <div className="absolute -top-2 -right-2 z-20 animate-bounce">
            <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg border border-yellow-200">
              <span className="text-xs">⚡</span>
            </div>
          </div>
        )}

        {boostCount > 0 && !isBoosted && (
          <div className="absolute -top-1 -right-1 z-20">
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow"
              style={{ backgroundColor: baseBgColor }}
            >
              {boostCount}
            </div>
          </div>
        )}
      </div>
    );
  }

  const config = CANDY_CONFIG[candy.type];
  const isSpecial = candy.isSpecial;

  return (
    <div className="relative w-12 h-12 sm:w-14 sm:h-14">
      {cellType !== 'normal' && (
        <div
          className={cn(
            'absolute inset-0 rounded-xl z-0 transition-all duration-300',
            isBoosted && 'animate-track-boost',
            inChain && 'animate-track-pulse'
          )}
          style={{
            background: `repeating-linear-gradient(${DIRECTION_ROTATION[direction!]}deg, ${baseBgColor}44, ${baseBgColor}44 4px, transparent 4px, transparent 8px)`,
            border: cellType === 'switch'
              ? `2px dashed ${baseBgColor}`
              : `2px solid ${baseBgColor}aa`,
            boxShadow: isBoosted
              ? `0 0 12px ${baseBgColor}, 0 0 24px ${baseBgColor}66, inset 0 0 8px ${baseBgColor}44`
              : inChain && chainColor
                ? `0 0 8px ${chainColor}aa`
                : undefined,
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20"
            style={{
              transform: `rotate(${DIRECTION_ROTATION[direction!]}deg)`,
            }}
          >
            <span className="text-xl">➤</span>
          </div>
        </div>
      )}

      {cellType !== 'normal' && (
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            top: 2,
            right: 2,
          }}
        >
          <div
            className={cn(
              'flex items-center gap-0.5 px-1 py-0.5 rounded-md text-[9px] font-bold',
              'backdrop-blur-sm'
            )}
            style={{
              backgroundColor: `${baseBgColor}55`,
              color: baseBgColor,
              border: `1px solid ${baseBgColor}88`,
              textShadow: '0 0 2px rgba(255,255,255,0.5)',
            }}
          >
            {cellType === 'switch' ? '🔀' : DIRECTION_ARROWS[direction!]}
            <span className="text-[8px]">{targetConfig?.emoji || '📦'}</span>
          </div>
        </div>
      )}

      {cellType === 'switch' && switchState && (
        <div
          className="absolute z-20 pointer-events-none flex gap-0.5"
          style={{
            bottom: 2,
            left: 2,
          }}
        >
          {switchState.directions.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-all duration-300'
              )}
              style={{
                backgroundColor: idx === switchState.currentDirectionIndex % switchState.directions.length
                  ? baseBgColor
                  : `${baseBgColor}44`,
                boxShadow: idx === switchState.currentDirectionIndex % switchState.directions.length
                  ? `0 0 4px ${baseBgColor}`
                  : undefined,
              }}
            />
          ))}
        </div>
      )}

      {isBoosted && (
        <>
          <div className="absolute -top-2 -right-2 z-30 animate-bounce">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center shadow-lg border-2 border-yellow-100">
              <span className="text-sm">⚡</span>
            </div>
          </div>
          <div
            className="absolute inset-0 rounded-xl z-[2] pointer-events-none animate-boost-shine overflow-hidden"
            style={{
              background: `linear-gradient(${DIRECTION_ROTATION[direction!]}deg, transparent 0%, ${baseBgColor}44 50%, transparent 100%)`,
            }}
          />
        </>
      )}

      {boostCount > 0 && !isBoosted && (
        <div className="absolute -top-1 -right-1 z-30">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg border border-white"
            style={{
              background: `linear-gradient(135deg, ${baseBgColor}, ${baseBgColor}cc)`,
            }}
          >
            {boostCount}x
          </div>
        </div>
      )}

      {targetCandyType && cellType !== 'normal' && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1 rounded-b-lg z-[3] pointer-events-none"
          style={{
            backgroundColor: baseBgColor,
            opacity: 0.6,
            boxShadow: `0 -1px 4px ${baseBgColor}`,
          }}
        />
      )}

      <button
        onClick={onClick}
        className={cn(
          'relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-2xl sm:text-3xl z-[5]',
          'transition-all duration-200 transform',
          'hover:scale-110 active:scale-95',
          'shadow-md hover:shadow-lg',
          isSelected && 'ring-4 ring-white ring-opacity-80 scale-110 z-10',
          candy.isMatched && 'animate-candy-explode',
          candy.isFalling && 'animate-bounce-fast',
          isSpecial && 'animate-special-spin'
        )}
        style={{
          background:
            isSpecial && candy.specialType === 'rainbow'
              ? 'linear-gradient(135deg, #FF6B9D, #FFD93D, #6BCB77, #4D96FF, #9B59B6)'
              : isSpecial && candy.specialType === 'bomb'
                ? 'radial-gradient(circle, #FF4757 0%, #c0392b 100%)'
                : `linear-gradient(135deg, ${config.color}, ${config.color}dd)`,
          boxShadow: isSelected
            ? `0 0 20px ${config.color}, 0 4px 6px rgba(0,0,0,0.2)`
            : isSpecial
              ? `0 0 16px ${config.color}, 0 4px 8px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.4)`
              : `0 4px 6px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3)`,
        }}
      >
        <span className="drop-shadow-md transition-transform duration-200">{config.emoji}</span>

        {isSpecial && (
          <div className="absolute inset-0 rounded-xl pointer-events-none animate-special-glow" />
        )}
      </button>
    </div>
  );
}
