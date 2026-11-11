import React from 'react';
import clsx from 'clsx';
import { Player } from '../../types/game';

export interface PlayerBadgeProps {
  player: Player;
  isCurrentTurn: boolean;
  isMe?: boolean;
  align?: 'left' | 'right';
  className?: string;
}

/**
 * Helper to safely extract 2-character uppercase initials
 */
function getPlayerInitials(player: Player): string {
  if (player.initials && player.initials.trim().length > 0) {
    return player.initials.trim().slice(0, 2).toUpperCase();
  }
  const cleanName = (player.name || '').trim();
  if (!cleanName) return '??';
  const parts = cleanName.split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleanName.slice(0, 2).toUpperCase();
}

/**
 * Player Telemetry Seat Pod Component
 * Spec & Tactical Privacy (PRD Bab 6 Layar 3):
 * - DILARANG menampilkan jumlah sisa kartu tangan maupun isi kartu tutup milik lawan!
 * - Lawan hanya menampilkan:
 *   1. Avatar bulat (w-8 h-8 rounded-full border-2 border-black font-black text-xs dengan 2 karakter inisial nama)
 *   2. Titik status koneksi (bg-[#00D084] jika online, bg-slate-400 jika bot/offline)
 *   3. Nama pemain (text-[11px] font-black text-black) + Dark BOT tag jika bot
 *   4. Badge giliran aktif (pinging dot kuning)
 *   5. Badge rekor kumulatif 'Kalah: Nx' & Badge Eksklusif RT/RW (#8B0000)
 */
export const PlayerBadge: React.FC<PlayerBadgeProps> = ({
  player,
  isCurrentTurn,
  isMe = false,
  align = 'left',
  className,
}) => {
  const initials = getPlayerInitials(player);
  const isOnline = Boolean(player.isConnected && !player.isBot);
  const lossesCount = player.lossesCount ?? 0;
  const isRightAligned = align === 'right';

  return (
    <div
      role="group"
      aria-label={`Pemain ${player.name}${isCurrentTurn ? ' (Giliran aktif)' : ''}`}
      className={clsx(
        'relative inline-flex items-center gap-2 px-2 py-1.5 rounded-xl border-2 border-black select-none transition-all duration-200 shadow-[2px_2px_0px_#000000]',
        isCurrentTurn ? 'bg-[#FFFDE6] ring-2 ring-[#FFE600]' : 'bg-white',
        isRightAligned ? 'flex-row-reverse text-right' : 'flex-row text-left',
        className
      )}
    >
      {/* Avatar Bulat dengan Titik Status Koneksi */}
      <div className="relative shrink-0">
        <div
          className="w-8 h-8 rounded-full border-2 border-black font-black text-xs flex items-center justify-center text-black shadow-[1px_1px_0px_#000000]"
          style={{ backgroundColor: player.avatarColor || '#FFE600' }}
          aria-hidden="true"
        >
          {initials}
        </div>

        {/* Titik Status Koneksi: bg-[#00D084] online, bg-slate-400 bot/offline */}
        <span
          className={clsx(
            'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-[1.5px] border-black shrink-0',
            isOnline ? 'bg-[#00D084]' : 'bg-slate-400'
          )}
          title={isOnline ? 'Online' : player.isBot ? 'Bot' : 'Offline'}
          aria-label={isOnline ? 'Online' : player.isBot ? 'Bot' : 'Offline'}
        />
      </div>

      {/* Info Pemain: Nama, Status Giliran, Rekor Kalah, dan Status RT/RW */}
      <div
        className={clsx(
          'flex flex-col justify-center min-w-0',
          isRightAligned ? 'items-end' : 'items-start'
        )}
      >
        {/* Baris 1: Nama Pemain + BOT Tag + Pinging Dot Giliran */}
        <div
          className={clsx(
            'flex items-center gap-1.5 max-w-full',
            isRightAligned ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          <span
            className="text-[11px] font-black text-black truncate max-w-[85px] leading-tight"
            title={player.name}
          >
            {player.name}
            {isMe && (
              <span className="text-[9px] text-black/60 font-bold ml-0.5">
                (Anda)
              </span>
            )}
          </span>

          {/* Dark BOT tag for bot players */}
          {player.isBot && (
            <span className="bg-[#121212] text-white text-[7px] px-1 py-0.5 rounded font-display font-bold uppercase shrink-0">
              BOT
            </span>
          )}

          {/* Badge Giliran Aktif: Pinging dot kuning */}
          {isCurrentTurn && (
            <span
              className="relative flex h-2 w-2 shrink-0"
              title="Giliran Aktif"
              aria-label="Giliran Aktif"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFE600] opacity-80" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFE600] border border-black" />
            </span>
          )}
        </div>

        {/* Baris 2: Badge Rekor Kumulatif 'Kalah: Nx' & Status Eksklusif RT/RW */}
        <div
          className={clsx(
            'mt-0.5 flex items-center gap-1',
            isRightAligned ? 'justify-end' : 'justify-start'
          )}
        >
          <span
            className={clsx(
              'px-1.5 py-0.5 rounded-lg border-2 border-black font-black text-[10px] leading-none inline-flex items-center justify-center select-none shadow-[1px_1px_0px_#000000]',
              lossesCount > 0
                ? 'bg-[#FF4343] text-white'
                : 'bg-[#F5F0EA] text-black'
            )}
            title={`Rekor Kalah: ${lossesCount} kali`}
          >
            Kalah: {lossesCount}x
          </span>

          {(player.statusRtRw === 'RT' || player.statusRtRw === 'RW') && (
            <span
              className="bg-[#8b0000] text-white border-[1.5px] border-black rounded px-1 py-0.5 text-[8px] font-display font-black uppercase leading-none shadow-[1px_1px_0px_#000000]"
              title={
                player.statusRtRw === 'RW'
                  ? 'RW: 6x Kalah Beruntun'
                  : 'RT: 3x Kalah Beruntun'
              }
            >
              {player.statusRtRw}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerBadge;
