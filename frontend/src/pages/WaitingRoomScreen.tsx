import React, { useState } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  Star,
  CheckCircle2,
  Bot,
  Hourglass,
  PlayCircle,
  SlidersHorizontal,
  LogOut,
  UserPlus,
} from 'lucide-react';
import clsx from 'clsx';
import { useGameStore, getInitials } from '../store/useGameStore';
import { AppShell } from '../components/layout/AppShell';
import { BrutalButton } from '../components/ui/BrutalButton';
import { BrutalBadge } from '../components/ui/BrutalBadge';
import { BrutalToast } from '../components/ui/BrutalToast';

export interface WaitingRoomScreenProps {
  onToggleReady: () => void;
  onStartOnlineMatch: () => void;
  onLeaveRoom: () => void;
}

interface HumanSeatData {
  id: string;
  name: string;
  initials?: string;
  isReady?: boolean;
  avatarColor?: string;
  isHost?: boolean;
  isBot?: boolean;
}

/**
 * Screen 2: Online Waiting Room Screen (Ruang Tunggu Neo-Brutalism)
 * Strictly adheres to PRD Bab 6 Layar 2 and Google Stitch Screen 5aef7e8c4063466f817324d9e13b2615:
 * (1) Fixed Header h-16 bg-[#F4F0EA] border-b-[2.5px] border-black dengan tombol kembali w-11 h-11 dan judul 'Ruang Tunggu'.
 * (2) Kartu Kode Room: bg-white border-[3px] border-black rounded-xl p-4, 'KODE ROOM: XXXXXX', tombol kuning 'SALIN' -> 'TERSALIN' + toast.
 * (3) Daftar 4 Kursi:
 *     - Slot 1: Host (card putih solid border-[3px] border-black, avatar inisial w-[50px] h-[50px], badge kuning HOST, chip hijau SIAP).
 *     - Slot 2: Tamu Manusia (card putih solid border-[3px] border-black, chip hijau SIAP atau tombol TEKAN SIAP).
 *     - Slot 3 & 4: Kursi cadangan bot (card krem bg-[#F4F0EA] border-[3px] border-dashed border-black, icon robot, label Kursi 3/4, badge hitam BOT HARD, chip Menunggu).
 * (4) Dock Bawah:
 *     - Tombol utama hijau 'MULAI PERMAINAN (N PEMAIN SIAP)' (hanya aktif bagi Host jika >= 2 pemain manusia siap).
 *     - Tombol 'ATUR BOT: HARD' (terkunci, memunculkan toast keterangan).
 *     - Tombol 'KELUAR RUANGAN' (teks merah #FF4D4D).
 */
export const WaitingRoomScreen: React.FC<WaitingRoomScreenProps> = ({
  onToggleReady,
  onStartOnlineMatch,
  onLeaveRoom,
}) => {
  const {
    roomState,
    playerId,
    playerName,
    roomCodeInput,
    showToast,
    toast,
  } = useGameStore();

  const [isCopied, setIsCopied] = useState(false);

  // Active room code fallback chain
  const displayRoomCode = (
    roomState?.id ||
    roomCodeInput ||
    '7X9K2A'
  ).toUpperCase();

  // Extract human players from room state
  const rawPlayers = roomState?.players || [];
  const humanPlayers = rawPlayers.filter((p) => !p.isBot);

  // Fallback demo players matching Stitch Screen 5aef7e8c4063466f817324d9e13b2615
  const isDefaultPreview = humanPlayers.length === 0;

  // Resolve Host (Slot 1)
  const hostPlayer: HumanSeatData = isDefaultPreview
    ? {
        id: playerId || 'host_user',
        name: playerName || 'Sekop07',
        initials: getInitials(playerName || 'Sekop07'),
        isHost: true,
        isReady: true,
      }
    : (humanPlayers.find((p) => p.isHost) || humanPlayers[0]);

  const isCurrentUserHost = hostPlayer.id === playerId;

  // Resolve Guest (Slot 2)
  const guestPlayer: HumanSeatData | null = isDefaultPreview
    ? {
        id: 'guest_elena',
        name: 'Elena_F',
        initials: 'EF',
        isHost: false,
        isReady: true,
      }
    : (humanPlayers.find((p) => p.id !== hostPlayer.id) || null);

  // Resolve additional humans for Slots 3 & 4 if room has > 2 human players
  const otherHumans = isDefaultPreview
    ? []
    : humanPlayers.filter((p) => p.id !== hostPlayer.id && p.id !== guestPlayer?.id);

  const slot3Player: HumanSeatData | null = otherHumans[0] || null;
  const slot4Player: HumanSeatData | null = otherHumans[1] || null;

  // Calculate readiness count
  const presentHumans = isDefaultPreview
    ? [hostPlayer, guestPlayer].filter(Boolean) as HumanSeatData[]
    : humanPlayers;

  const humanPlayersCount = presentHumans.length;
  const readyHumanCount = presentHumans.filter((p) => p.isReady).length;

  // Game start permission: Host only, and minimum 2 human players ready
  const canStartMatch = isCurrentUserHost && readyHumanCount >= 2;

  // Copy room code to clipboard
  const handleCopyRoomCode = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(displayRoomCode);
      }
    } catch {
      // Fallback if clipboard API is restricted
    }
    setIsCopied(true);
    showToast('📋', `Kode ${displayRoomCode} disalin ke papan klip!`);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  // Handle start button click
  const handleStartGame = () => {
    if (canStartMatch) {
      showToast('🚀', 'Memulai pembagian kartu 7-an...');
      onStartOnlineMatch();
    } else if (!isCurrentUserHost) {
      showToast('⚠️', 'Hanya Host yang dapat memulai permainan');
    } else {
      showToast('⚠️', 'Membutuhkan minimal 2 pemain yang sudah siap');
    }
  };

  // Handle locked bot difficulty click
  const handleBotDifficultyClick = () => {
    showToast('🔒', 'Tingkat kesulitan bot terkunci ke mode Hard');
  };

  return (
    <AppShell variant="cream">
      {/* (1) Fixed Top Bar Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#F4F0EA] border-b-[2.5px] border-black pt-safe">
        <div className="w-full max-w-md mx-auto h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Kembali"
              onClick={onLeaveRoom}
              className="w-11 h-11 flex items-center justify-center rounded-lg bg-white border-[2.5px] border-black shadow-[3.5px_3.5px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] text-black transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-black stroke-[2.5]" aria-hidden="true" />
            </button>
            <h1 className="font-display font-black text-2xl tracking-tight text-black select-none">
              Ruang Tunggu
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-col relative w-full pt-20 pb-8 px-4 flex-grow max-w-md mx-auto">
        <div className="flex flex-col w-full gap-5">
          {/* (2) Neo-Brutalism Room Code Card */}
          <section className="relative w-full rounded-xl bg-white border-[3px] border-black p-4 shadow-[3.5px_3.5px_0px_#000000] overflow-hidden select-none">
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="flex flex-col min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#6E6B65]">
                    Kode Room:
                  </span>
                  <span
                    id="roomCodeText"
                    className="text-2xl font-black text-black tracking-widest font-mono"
                  >
                    {displayRoomCode}
                  </span>
                </div>
              </div>

              <BrutalButton
                variant="yellow"
                size="sm"
                onClick={handleCopyRoomCode}
                leftIcon={
                  isCopied ? (
                    <Check className="w-4 h-4 text-black stroke-[3]" aria-hidden="true" />
                  ) : (
                    <Copy className="w-4 h-4 text-black stroke-[2.5]" aria-hidden="true" />
                  )
                }
                className="!px-3.5 !py-2 text-xs font-extrabold uppercase tracking-wide shrink-0"
              >
                {isCopied ? 'Tersalin' : 'Salin'}
              </BrutalButton>
            </div>
          </section>

          {/* (3) Player Seats Table Overview (4 Slots) */}
          <section className="flex flex-col gap-3">
            {/* Section Heading */}
            <div className="flex items-center justify-between px-1 select-none">
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-lg text-black">
                  Pemain
                </span>
                <span className="text-xs font-bold text-black/60 bg-black/5 px-2 py-0.5 rounded border border-black/20">
                  {humanPlayersCount}/4
                </span>
              </div>
              <span className="text-xs font-semibold text-[#6E6B65]">
                Membutuhkan min. 2 pemain
              </span>
            </div>

            {/* Slot 1: Host Seat */}
            <div className="relative w-full rounded-xl bg-white border-[3px] border-black p-3.5 flex items-center justify-between shadow-[2px_2px_0px_#000000] transition-all select-none">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Avatar Ring with Host Star Badge */}
                <div className="relative flex-shrink-0">
                  <div className="w-[50px] h-[50px] rounded-full bg-[#FFE600] border-2 border-black flex items-center justify-center font-display font-black text-xl text-black select-none">
                    {hostPlayer.initials || getInitials(hostPlayer.name)}
                  </div>
                  <div
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FFE600] border border-black flex items-center justify-center"
                    title="Room Host"
                  >
                    <Star className="w-3 h-3 text-black fill-black" aria-hidden="true" />
                  </div>
                </div>

                {/* Host Info */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base text-black truncate max-w-[130px]">
                      {hostPlayer.name}
                    </span>
                    <BrutalBadge variant="yellow">HOST</BrutalBadge>
                    {hostPlayer.id === playerId && (
                      <span className="text-[10px] font-bold text-[#6E6B65] uppercase">
                        (Anda)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Host Status Chip: Always Ready */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4EDE93] border-2 border-black flex-shrink-0 text-black shadow-[1px_1px_0px_#000000]">
                <CheckCircle2 className="w-4 h-4 text-black stroke-[2.5]" aria-hidden="true" />
                <span className="text-xs font-black uppercase tracking-wide">
                  Siap
                </span>
              </div>
            </div>

            {/* Slot 2: Connected Human Guest */}
            {guestPlayer ? (
              <div className="relative w-full rounded-xl bg-white border-[3px] border-black p-3.5 flex items-center justify-between shadow-[2px_2px_0px_#000000] transition-all select-none">
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Guest Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-[50px] h-[50px] rounded-full bg-[#4EDE93] border-2 border-black flex items-center justify-center font-display font-black text-lg text-black select-none">
                      {guestPlayer.initials || getInitials(guestPlayer.name)}
                    </div>
                    <div
                      className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#4EDE93] border-2 border-black"
                      title="Online"
                    />
                  </div>

                  {/* Guest Info */}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base text-black truncate max-w-[130px]">
                        {guestPlayer.name}
                      </span>
                      {guestPlayer.id === playerId && (
                        <BrutalBadge variant="white">ANDA</BrutalBadge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Guest Ready State: Chip or 'Tekan Siap' Button */}
                {guestPlayer.isReady ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4EDE93] border-2 border-black flex-shrink-0 text-black shadow-[1px_1px_0px_#000000]">
                    <CheckCircle2 className="w-4 h-4 text-black stroke-[2.5]" aria-hidden="true" />
                    <span className="text-xs font-black uppercase tracking-wide">
                      Siap
                    </span>
                  </div>
                ) : guestPlayer.id === playerId ? (
                  <button
                    type="button"
                    onClick={onToggleReady}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFE600] border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none text-xs font-black uppercase tracking-wide text-black cursor-pointer hover:bg-[#ffe033] animate-pulse"
                  >
                    <CheckCircle2 className="w-4 h-4 text-black stroke-[2.5]" aria-hidden="true" />
                    <span>Tekan Siap</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border-2 border-black flex-shrink-0 text-black">
                    <Hourglass className="w-3.5 h-3.5 text-black" aria-hidden="true" />
                    <span className="text-[11px] font-bold uppercase text-black">
                      Menunggu
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Waiting for Guest Slot 2 */
              <div className="relative w-full rounded-xl bg-[#F4F0EA] border-[3px] border-dashed border-black p-3.5 flex items-center justify-between select-none">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-[50px] h-[50px] rounded-full bg-white border-2 border-black flex items-center justify-center text-black flex-shrink-0 shadow-sm">
                    <UserPlus className="w-5 h-5 text-black" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-black">Kursi 2</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#FFE600] border border-black text-black text-[10px] font-black uppercase tracking-wider">
                        MENUNGGU TAMU
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border-2 border-black flex-shrink-0 text-black">
                  <Hourglass className="w-3.5 h-3.5 text-black animate-spin" aria-hidden="true" />
                  <span className="text-[11px] font-bold uppercase text-black">
                    Menunggu
                  </span>
                </div>
              </div>
            )}

            {/* Slot 3: Kursi 3 (Empty Seat / Bot Hard Reserve) */}
            {slot3Player && !slot3Player.isBot ? (
              <HumanPlayerSeatItem
                player={slot3Player}
                isCurrentUser={slot3Player.id === playerId}
                onToggleReady={onToggleReady}
              />
            ) : (
              <div className="relative w-full rounded-xl bg-[#F4F0EA] border-[3px] border-dashed border-black p-3.5 flex items-center justify-between select-none">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-[50px] h-[50px] rounded-full bg-white border-2 border-black flex items-center justify-center text-black flex-shrink-0 shadow-sm">
                    <Bot className="w-6 h-6 text-black" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-black">Kursi 3</span>
                      <span className="px-1.5 py-0.5 rounded bg-black text-white text-[10px] font-black uppercase tracking-wider">
                        BOT HARD
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border-2 border-black flex-shrink-0 text-black">
                  <Hourglass className="w-3.5 h-3.5 text-black" aria-hidden="true" />
                  <span className="text-[11px] font-bold uppercase text-black">
                    Menunggu
                  </span>
                </div>
              </div>
            )}

            {/* Slot 4: Kursi 4 (Empty Seat / Bot Hard Reserve) */}
            {slot4Player && !slot4Player.isBot ? (
              <HumanPlayerSeatItem
                player={slot4Player}
                isCurrentUser={slot4Player.id === playerId}
                onToggleReady={onToggleReady}
              />
            ) : (
              <div className="relative w-full rounded-xl bg-[#F4F0EA] border-[3px] border-dashed border-black p-3.5 flex items-center justify-between select-none">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-[50px] h-[50px] rounded-full bg-white border-2 border-black flex items-center justify-center text-black flex-shrink-0 shadow-sm">
                    <Bot className="w-6 h-6 text-black" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-black">Kursi 4</span>
                      <span className="px-1.5 py-0.5 rounded bg-black text-white text-[10px] font-black uppercase tracking-wider">
                        BOT HARD
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border-2 border-black flex-shrink-0 text-black">
                  <Hourglass className="w-3.5 h-3.5 text-black" aria-hidden="true" />
                  <span className="text-[11px] font-bold uppercase text-black">
                    Menunggu
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* (4) Bottom Tactical Dock */}
          <div className="flex flex-col gap-3 mt-4 pt-2">
            {/* Primary Action Button: MULAI PERMAINAN (N PEMAIN SIAP) */}
            <button
              id="startGameBtn"
              type="button"
              aria-disabled={!canStartMatch}
              onClick={handleStartGame}
              className={clsx(
                'w-full py-4 px-4 rounded-xl border-[3px] border-black font-display font-black text-base flex items-center justify-center gap-2 transition-all select-none',
                canStartMatch
                  ? 'bg-[#4EDE93] text-black shadow-[5px_5px_0px_#000000] hover:bg-[#3ecb82] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] cursor-pointer'
                  : 'bg-slate-300 text-slate-600 opacity-60 shadow-none cursor-not-allowed'
              )}
            >
              <PlayCircle className="w-5 h-5 text-black fill-black shrink-0" aria-hidden="true" />
              <span className="uppercase tracking-wider">
                Mulai Permainan ({readyHumanCount} Pemain Siap)
              </span>
            </button>

            {/* Secondary Action Controls */}
            <div className="flex items-center gap-3">
              {/* Button: ATUR BOT: HARD (Terkunci) */}
              <BrutalButton
                variant="white"
                size="md"
                onClick={handleBotDifficultyClick}
                leftIcon={<SlidersHorizontal className="w-4 h-4 text-black shrink-0" aria-hidden="true" />}
                className="flex-1 !py-3 !px-3 hover:!bg-[#FFE600] font-extrabold text-xs uppercase tracking-wider"
              >
                Atur Bot: Hard
              </BrutalButton>

              {/* Button: KELUAR RUANGAN */}
              <BrutalButton
                variant="white"
                size="md"
                onClick={onLeaveRoom}
                leftIcon={<LogOut className="w-4 h-4 text-[#FF4D4D] shrink-0" aria-hidden="true" />}
                className="flex-1 !py-3 !px-3 !text-[#FF4D4D] hover:!bg-red-50 font-extrabold text-xs uppercase tracking-wider"
              >
                Keluar Ruangan
              </BrutalButton>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Bottom Toast Notification */}
      <BrutalToast
        visible={toast.visible}
        icon={toast.icon}
        message={toast.message}
        position="bottom"
        variant="yellow"
      />
    </AppShell>
  );
};

/**
 * Sub-component for rendering Human Seat in Slots 3 or 4 when populated by humans
 */
interface HumanPlayerSeatItemProps {
  player: HumanSeatData;
  isCurrentUser: boolean;
  onToggleReady: () => void;
}

const HumanPlayerSeatItem: React.FC<HumanPlayerSeatItemProps> = ({
  player,
  isCurrentUser,
  onToggleReady,
}) => {
  return (
    <div className="relative w-full rounded-xl bg-white border-[3px] border-black p-3.5 flex items-center justify-between shadow-[2px_2px_0px_#000000] transition-all select-none">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="relative flex-shrink-0">
          <div className="w-[50px] h-[50px] rounded-full bg-[#4EDE93] border-2 border-black flex items-center justify-center font-display font-black text-lg text-black select-none">
            {player.initials || getInitials(player.name)}
          </div>
          <div
            className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#4EDE93] border-2 border-black"
            title="Online"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-black text-base text-black truncate max-w-[130px]">
              {player.name}
            </span>
            {isCurrentUser && <BrutalBadge variant="white">ANDA</BrutalBadge>}
          </div>
        </div>
      </div>

      {player.isReady ? (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4EDE93] border-2 border-black flex-shrink-0 text-black shadow-[1px_1px_0px_#000000]">
          <CheckCircle2 className="w-4 h-4 text-black stroke-[2.5]" aria-hidden="true" />
          <span className="text-xs font-black uppercase tracking-wide">
            Siap
          </span>
        </div>
      ) : isCurrentUser ? (
        <button
          type="button"
          onClick={onToggleReady}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFE600] border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none text-xs font-black uppercase tracking-wide text-black cursor-pointer hover:bg-[#ffe033] animate-pulse"
        >
          <CheckCircle2 className="w-4 h-4 text-black stroke-[2.5]" aria-hidden="true" />
          <span>Tekan Siap</span>
        </button>
      ) : (
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border-2 border-black flex-shrink-0 text-black">
          <Hourglass className="w-3.5 h-3.5 text-black" aria-hidden="true" />
          <span className="text-[11px] font-bold uppercase text-black">
            Menunggu
          </span>
        </div>
      )}
    </div>
  );
};

export default WaitingRoomScreen;
