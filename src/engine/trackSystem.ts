import {
  CandyType,
  TrackCellConfig,
  SwitchCellConfig,
  BoardLayout,
  TrackBoostState,
  Position,
  TrackDirection,
  Candy,
} from '@/types';
import { BOARD_LAYOUT } from '@/data/config';

interface TrackNode {
  row: number;
  col: number;
  type: 'track' | 'switch';
  direction: TrackDirection;
  targetCandyType: CandyType;
}

export function getCellType(
  row: number,
  col: number,
  switches: SwitchCellConfig[]
): 'normal' | 'track' | 'switch' {
  if (switches.some(s => s.row === row && s.col === col)) {
    return 'switch';
  }
  if (BOARD_LAYOUT.tracks.some(t => t.row === row && t.col === col)) {
    return 'track';
  }
  return 'normal';
}

export function getTrackAt(
  row: number,
  col: number
): TrackCellConfig | undefined {
  return BOARD_LAYOUT.tracks.find(t => t.row === row && t.col === col);
}

export function getSwitchAt(
  row: number,
  col: number,
  switches: SwitchCellConfig[]
): SwitchCellConfig | undefined {
  return switches.find(s => s.row === row && s.col === col);
}

export function getCurrentSwitchTarget(
  sw: SwitchCellConfig
): CandyType {
  return sw.targetCandyTypes[sw.currentDirectionIndex % sw.targetCandyTypes.length];
}

export function getCurrentSwitchDirection(
  sw: SwitchCellConfig
): TrackDirection {
  return sw.directions[sw.currentDirectionIndex % sw.directions.length];
}

export function getNodeAt(
  row: number,
  col: number,
  switches: SwitchCellConfig[]
): TrackNode | null {
  const track = getTrackAt(row, col);
  if (track) {
    return {
      row: track.row,
      col: track.col,
      type: 'track',
      direction: track.direction,
      targetCandyType: track.targetCandyType,
    };
  }

  const sw = getSwitchAt(row, col, switches);
  if (sw) {
    return {
      row: sw.row,
      col: sw.col,
      type: 'switch',
      direction: getCurrentSwitchDirection(sw),
      targetCandyType: getCurrentSwitchTarget(sw),
    };
  }

  return null;
}

function getNextPosition(row: number, col: number, direction: TrackDirection): Position | null {
  switch (direction) {
    case 'up':
      return row > 0 ? { row: row - 1, col } : null;
    case 'down':
      return row < 7 ? { row: row + 1, col } : null;
    case 'left':
      return col > 0 ? { row, col: col - 1 } : null;
    case 'right':
      return col < 7 ? { row, col: col + 1 } : null;
  }
}

export function followTrackChain(
  startRow: number,
  startCol: number,
  switches: SwitchCellConfig[],
  visited: Set<string> = new Set()
): { finalTarget: CandyType | null; chainPositions: Position[] } {
  const key = `${startRow},${startCol}`;
  if (visited.has(key)) {
    return { finalTarget: null, chainPositions: [] };
  }
  visited.add(key);

  const node = getNodeAt(startRow, startCol, switches);
  if (!node) {
    return { finalTarget: null, chainPositions: [] };
  }

  const chainPositions: Position[] = [{ row: startRow, col: startCol }];
  const nextPos = getNextPosition(startRow, startCol, node.direction);

  if (!nextPos) {
    return { finalTarget: node.targetCandyType, chainPositions };
  }

  const nextNode = getNodeAt(nextPos.row, nextPos.col, switches);
  if (!nextNode) {
    return { finalTarget: node.targetCandyType, chainPositions };
  }

  const result = followTrackChain(nextPos.row, nextPos.col, switches, visited);
  chainPositions.push(...result.chainPositions);

  return {
    finalTarget: result.finalTarget || node.targetCandyType,
    chainPositions,
  };
}

export function toggleSwitchesAfterCombo(
  switches: SwitchCellConfig[],
  comboThreshold: number = 2
): SwitchCellConfig[] {
  return switches.map(sw => ({
    ...sw,
    currentDirectionIndex:
      (sw.currentDirectionIndex + 1) % sw.targetCandyTypes.length,
  }));
}

export function resolveTrackRouting(
  matchedPositions: Position[],
  board: (Candy | null)[][],
  switches: SwitchCellConfig[]
): {
  extraLoading: Record<CandyType, number>;
  matchedOnTracks: Position[];
  trackChains: Position[][];
} {
  const extraLoading: Record<string, number> = {};
  const matchedOnTracks: Position[] = [];
  const trackChains: Position[][] = [];
  const processedPositions = new Set<string>();

  for (const pos of matchedPositions) {
    const posKey = `${pos.row},${pos.col}`;
    const candy = board[pos.row]?.[pos.col];

    if (!candy || candy.isSpecial) continue;

    const { chainPositions, finalTarget } = followTrackChain(pos.row, pos.col, switches);

    if (chainPositions.length === 0) continue;

    let candyCounted = false;

    for (const chainPos of chainPositions) {
      const chainKey = `${chainPos.row},${chainPos.col}`;

      if (chainKey === posKey) {
        if (!processedPositions.has(posKey)) {
          matchedOnTracks.push(pos);
          processedPositions.add(posKey);

          if (finalTarget) {
            const loadMultiplier = chainPositions.length;
            extraLoading[finalTarget] = (extraLoading[finalTarget] || 0) + loadMultiplier;
            candyCounted = true;
          }
        }
      }
    }

    if (!candyCounted) {
      const node = getNodeAt(pos.row, pos.col, switches);
      if (node && !processedPositions.has(posKey)) {
        matchedOnTracks.push(pos);
        processedPositions.add(posKey);
        extraLoading[node.targetCandyType] = (extraLoading[node.targetCandyType] || 0) + 1;
      }
    }

    if (chainPositions.length > 1) {
      trackChains.push(chainPositions);
    }
  }

  return {
    extraLoading: extraLoading as Record<CandyType, number>,
    matchedOnTracks,
    trackChains,
  };
}

export function updateTrackBoosts(
  prevBoosts: TrackBoostState[],
  matchedOnTracks: Position[],
  board: (Candy | null)[][],
  switches: SwitchCellConfig[]
): TrackBoostState[] {
  const newBoosts: TrackBoostState[] = [];
  const processedKeys = new Set<string>();

  const trackTypeMap = new Map<string, CandyType>();
  for (const pos of matchedOnTracks) {
    const candy = board[pos.row]?.[pos.col];
    if (candy && !candy.isSpecial) {
      trackTypeMap.set(`${pos.row},${pos.col}`, candy.type);
    }
  }

  for (const pos of matchedOnTracks) {
    const key = `${pos.row},${pos.col}`;
    processedKeys.add(key);

    const currentType = trackTypeMap.get(key);
    const prevBoost = prevBoosts.find(b => b.key === key);
    const prevCount = prevBoost?.count || 0;
    const prevActive = prevBoost?.active || false;

    const node = getNodeAt(pos.row, pos.col, switches);
    if (!node || !currentType) continue;

    let consecutiveCount = 1;

    if (prevBoost && prevCount > 0 && !prevActive) {
      const nextPos = getNextPosition(pos.row, pos.col, node.direction);
      if (nextPos) {
        const nextKey = `${nextPos.row},${nextPos.col}`;
        const nextType = trackTypeMap.get(nextKey);
        const prevNextBoost = prevBoosts.find(b => b.key === nextKey);
        const prevNextCount = prevNextBoost?.count || 0;

        if (nextType === currentType || prevNextCount > 0) {
          consecutiveCount = prevCount + 1;
        }
      } else {
        consecutiveCount = prevCount + 1;
      }
    } else if (prevBoost && prevCount > 0) {
      consecutiveCount = prevCount + 1;
    }

    const isActive = consecutiveCount >= 3;

    newBoosts.push({
      key,
      count: consecutiveCount,
      active: isActive,
    });
  }

  for (const prev of prevBoosts) {
    if (!processedKeys.has(prev.key)) {
      if (prev.active) {
        newBoosts.push({
          key: prev.key,
          count: Math.max(0, prev.count - 2),
          active: prev.count - 2 >= 3,
        });
      } else if (prev.count > 0) {
        newBoosts.push({
          key: prev.key,
          count: prev.count - 1,
          active: false,
        });
      }
    }
  }

  return newBoosts;
}

export function calculateBoostBonus(
  boosts: TrackBoostState[]
): number {
  return boosts.filter(b => b.active).length * 2;
}

export function getBoostMultiplier(boosts: TrackBoostState[], row: number, col: number): number {
  const boost = boosts.find(b => b.key === `${row},${col}`);
  if (!boost || !boost.active) return 1;
  return 2;
}

export function initSwitchStates(): SwitchCellConfig[] {
  return BOARD_LAYOUT.switches.map(sw => ({ ...sw, currentDirectionIndex: 0 }));
}

export function buildTrackNetworkMap(
  switches: SwitchCellConfig[]
): Map<string, Position[]> {
  const networkMap = new Map<string, Position[]>();

  for (const track of BOARD_LAYOUT.tracks) {
    const key = `${track.row},${track.col}`;
    const { chainPositions } = followTrackChain(track.row, track.col, switches);
    networkMap.set(key, chainPositions);
  }

  for (const sw of switches) {
    const key = `${sw.row},${sw.col}`;
    const { chainPositions } = followTrackChain(sw.row, sw.col, switches);
    networkMap.set(key, chainPositions);
  }

  return networkMap;
}
