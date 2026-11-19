import React from 'react';
import { Player } from '../../types/game';

export interface RematchModalProps {
  isOpen: boolean;
  countdown: number;
  players: Player[];
  onCompleteCountdown: () => void;
  onCancel: () => void;
}

/**
 * @deprecated Alur rematch kini langsung mengarah ke ShuffleRitualScreen (Screen 5 / Screen 6).
 */
export const RematchModal: React.FC<RematchModalProps> = () => null;

export default RematchModal;
