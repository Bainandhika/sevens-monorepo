import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  Bot,
  Hourglass,
  LogOut,
  Users,
  Lock,
  Zap,
  BookOpen,
  Volume2,
  VolumeX,
  Play,
  KeyRound,
} from 'lucide-react';
import clsx from 'clsx';
import { useGameStore, getInitials } from '../store/useGameStore';
import { AppShell } from '../components/layout/AppShell';
import { BrutalToast } from '../components/ui/BrutalToast';
import { RulesModal } from '../components/modals/RulesModal';

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

const TACTICAL_BOT_NAMES = ['Agresif9', 'Cermat8', 'Taktik7', 'Pilar06'] as const;

interface BotSeatItemProps {
  name: string;
}

const BotSeatItem: React.FC<BotSeatItemProps> = ({ name }) => (
  <div className="w-full bg-[#E1E7FF] rounded-xl border-[2.5px] border-black shadow-[3px_3px_0px_#000000] p-3 flex items-center justify-between gap-3 select-none">
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-12 h-12 rounded-lg bg-[#283044] text-[#FFD000] border-2 border-black flex items-center justify-center font-display font-black shadow-[2px_2px_0px_#000000] shrink-0">
        <Bot className="w-6 h-6 text-[#FFD000]" aria-hidden="true" />
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-display font-black text-base text-black truncate">{name}</span>
          <span className="px-1.5 py-0.5 bg-[#283044] text-[#FFD000] text-[10px] font-display font-black border border-black rounded shadow-[1px_1px_0px_#000000]">
            BOT
          </span>
        </div>
      </div>
    </div>
    <div className="px-2.5 py-1.5 bg-[#283044] text-white font-display font-black text-xs uppercase rounded-lg border-2 border-black shrink-0 flex items-center gap-1 shadow-[1px_1px_0px_#000000]">
      <Zap className="w-3.5 h-3.5 text-[#10B981] fill-[#10B981]" aria-hidden="true" />
      <span>AUTO SIAP</span>
    </div>
  </div>
);

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
  const canToggleSelfReady = isCurrentUser && !player.isHost;

  return (
    <div className="w-full bg-white rounded-xl border-[3px] border-black shadow-[3px_3px_0px_#000000] p-3 flex items-center justify-between gap-3 select-none">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 rounded-lg bg-[#DAE2FD] text-black border-2 border-black flex items-center justify-center font-display font-black text-lg shadow-[2px_2px_0px_#000000] shrink-0">
          {player.initials || getInitials(player.name)}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-base text-black truncate max-w-[130px]">
              {player.name}
            </span>
            {isCurrentUser && (
              <span className="px-1.5 py-0.5 bg-white text-black text-[10px] font-display font-black border border-black rounded shadow-[1px_1px_0px_#000000]">
                ANDA
              </span>
            )}
          </div>
        </div>
      </div>

      {canToggleSelfReady ? (
        player.isReady ? (
          <button
            type="button"
            onClick={onToggleReady}
            aria-pressed={true}
            title="Klik untuk membatalkan status siap"
            className="px-3 py-1.5 bg-[#10B981] hover:bg-[#0ea572] text-black font-display font-black text-xs uppercase rounded-lg border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none shrink-0 flex items-center gap-1 cursor-pointer transition-all"
          >
            <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
            <span>SIAP</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleReady}
            aria-pressed={false}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FFE600] border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none text-xs font-display font-black uppercase tracking-wide text-black cursor-pointer hover:bg-[#ffe033] animate-pulse transition-all"
          >
            <Check className="w-4 h-4 text-black stroke-[3]" aria-hidden="true" />
            <span>TEKAN SIAP</span>
          </button>
        )
      ) : player.isReady ? (
        <div className="px-3 py-1.5 bg-[#10B981] text-black font-display font-black text-xs uppercase rounded-lg border-2 border-black shadow-[2px_2px_0px_#000000] shrink-0 flex items-center gap-1">
          <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
          <span>SIAP</span>
        </div>
      ) : (
        <div className="px-2.5 py-1.5 bg-[#FFD000] text-black font-display font-black text-xs uppercase rounded-lg border-2 border-black shadow-[2px_2px_0px_#000000] shrink-0 flex items-center gap-1">
          <Hourglass className="w-3.5 h-3.5 text-black" aria-hidden="true" />
          <span>BELUM SIAP</span>
        </div>
      )}
    </div>
  );
};

/**
 * Screen 2: Online Waiting Room Screen (Ruang Tunggu MABAR Neo-Brutalism)
 * Strictly adheres to DESIGN.md 4.2 and Google Stitch ruang_tunggu_mabar_7_an_tactical:
 * (1) Fixed Header h-16 bg-[#10B981] border-b-[3px] border-black with back button & Audio Toggle.
 * (2) Room ID Banner: #FFD000 banner with nested white box showing ROOM ID, #XXXXXX, and SALIN button.
 * (3) 2-Column Telemetry Bar: '{readyHumanCount}/{humanPlayersCount} PEMAIN SIAP' and '🔒 BOT: HARD'.
 * (4) 4-Seat List:
 *     - Slot 1: Host human (avatar bg-[#FFD000], HOST badge, SIAP chip).
 *     - Slots 2..4: Human guests (with interactive TEKAN SIAP / SIAP toggle for current user) or tactical Hard Bot slots (Agresif9, Cermat8, Taktik7).
 * (5) Footer: 'MULAI PERMAINAN' / 'MENUNGGU SEMUA SIAP' + 'ATURAN' and 'BUBARKAN MEJA' / 'KELUAR'.
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
    activeModal,
    setModal,
    audioEnabled,
    toggleAudio,
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
  const humanPlayers = useMemo(() => rawPlayers.filter((p) => !p.isBot), [rawPlayers]);

  // Fallback demo preview only when roomState has not been populated yet (standalone preview)
  const isDefaultPreview = rawPlayers.length === 0;

  // Resolve Host (Slot 1)
  const hostPlayer: HumanSeatData = useMemo(() => {
    if (isDefaultPreview) {
      return {
        id: playerId || 'host_user',
        name: playerName || 'Sekop07',
        initials: getInitials(playerName || 'Sekop07'),
        isHost: true,
        isReady: true,
      };
    }
    return humanPlayers.find((p) => p.isHost) || humanPlayers[0] || {
      id: playerId || 'host_user',
      name: playerName || 'Sekop07',
      initials: getInitials(playerName || 'Sekop07'),
      isHost: true,
      isReady: true,
    };
  }, [isDefaultPreview, humanPlayers, playerId, playerName]);

  const isCurrentUserHost = hostPlayer.id === playerId;

  // Build Seats 2..4 cleanly without duplicating bot names across 1..4 human players
  const remainingSeats = useMemo(() => {
    if (isDefaultPreview) {
      return [
        {
          kind: 'human' as const,
          player: {
            id: 'guest_wajik',
            name: 'Wajik99',
            initials: 'W9',
            isHost: false,
            isReady: false,
          },
        },
        { kind: 'bot' as const, name: 'Cermat8' },
        { kind: 'bot' as const, name: 'Taktik7' },
      ];
    }

    const otherHumans = humanPlayers.filter((p) => p.id !== hostPlayer.id);
    const existingBots = rawPlayers.filter((p) => p.isBot);
    const usedNames = new Set<string>([
      ...humanPlayers.map((p) => p.name),
      ...existingBots.map((b) => b.name),
    ]);

    const seats: Array<
      | { kind: 'human'; player: HumanSeatData }
      | { kind: 'bot'; name: string }
    > = [];

    for (const human of otherHumans.slice(0, 3)) {
      seats.push({ kind: 'human', player: human });
    }

    for (const bot of existingBots) {
      if (seats.length >= 3) break;
      seats.push({ kind: 'bot', name: bot.name });
    }

    for (const botName of TACTICAL_BOT_NAMES) {
      if (seats.length >= 3) break;
      if (!usedNames.has(botName)) {
        usedNames.add(botName);
        seats.push({ kind: 'bot', name: botName });
      }
    }

    return seats;
  }, [isDefaultPreview, humanPlayers, hostPlayer.id, rawPlayers]);

  // Calculate readiness count
  const presentHumans = useMemo(() => {
    if (isDefaultPreview) {
      const previewGuest = remainingSeats.find((s) => s.kind === 'human');
      return previewGuest && previewGuest.kind === 'human'
        ? [hostPlayer, previewGuest.player]
        : [hostPlayer];
    }
    return humanPlayers;
  }, [isDefaultPreview, hostPlayer, humanPlayers, remainingSeats]);

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
    showToast('📋', `Kode #${displayRoomCode} disalin ke papan klip!`);
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
      {/* (1) Fixed Header Mint Green */}
      <header className="fixed top-0 inset-x-0 z-40 bg-[#10B981] border-b-[3px] border-black pt-safe">
        <div className="h-16 max-w-md mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              aria-label="Kembali ke Menu"
              onClick={onLeaveRoom}
              className="w-11 h-11 bg-white text-black flex items-center justify-center rounded-lg shadow-[2px_2px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] transition-all border-2 border-black cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-black stroke-[2.5]" aria-hidden="true" />
            </button>
            <h1 className="font-display font-black text-xl uppercase tracking-wide text-black truncate select-none">
              RUANG TUNGGU
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Pengaturan Suara"
              onClick={toggleAudio}
              className="w-11 h-11 bg-white text-black flex items-center justify-center rounded-lg shadow-[2px_2px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] transition-all border-2 border-black cursor-pointer"
              title={audioEnabled ? 'Matikan Suara' : 'Aktifkan Suara'}
            >
              {audioEnabled ? (
                <Volume2 className="w-5 h-5 text-black stroke-2" aria-hidden="true" />
              ) : (
                <VolumeX className="w-5 h-5 text-black stroke-2" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-col relative w-full pt-20 pb-8 px-4 flex-grow max-w-md mx-auto">
        <div className="flex flex-col w-full gap-4">
          {/* (2) Room Code Banner */}
          <section className="w-full bg-[#FFD000] text-black rounded-xl border-[3px] border-black shadow-[4px_4px_0px_#000000] p-4 relative overflow-hidden select-none">
            <div
              className="absolute -right-5 -bottom-5 w-24 h-24 bg-black/10 rounded-full pointer-events-none flex items-center justify-center"
              aria-hidden="true"
            >
              <KeyRound className="w-12 h-12 text-black/20" />
            </div>
            <div className="relative z-10 w-full flex items-center justify-between gap-3 bg-white p-3.5 rounded-lg border-[2.5px] border-black shadow-[3px_3px_0px_#000000]">
              <div className="flex flex-col justify-center min-w-0">
                <span className="font-display text-[11px] text-black/70 font-bold leading-none mb-1 uppercase tracking-wider">
                  ROOM ID
                </span>
                <span
                  id="roomCodeText"
                  className="font-display font-black text-2xl sm:text-3xl tracking-widest text-black select-all leading-none font-mono"
                >
                  #{displayRoomCode}
                </span>
              </div>
              <button
                type="button"
                id="btnCopyCode"
                aria-label="Salin Kode Meja"
                onClick={handleCopyRoomCode}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-black font-display font-black text-xs uppercase border-2 border-black rounded-lg shadow-[2px_2px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] transition-all hover:bg-[#FFD000] shrink-0 cursor-pointer"
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-black stroke-[3]" aria-hidden="true" />
                ) : (
                  <Copy className="w-4 h-4 text-black stroke-[2.5]" aria-hidden="true" />
                )}
                <span>{isCopied ? 'TERSALIN' : 'SALIN'}</span>
              </button>
            </div>
          </section>

          {/* (3) 2-Column Telemetry Bar */}
          <div className="w-full flex items-center justify-between gap-2.5 select-none">
            {/* Readiness Badge */}
            <div className="flex-1 bg-white border-[2.5px] border-black rounded-xl p-2.5 shadow-[3px_3px_0px_#000000] flex items-center gap-2 min-w-0">
              <Users className="w-5 h-5 text-[#10B981] stroke-[2.5] shrink-0" aria-hidden="true" />
              <span className="font-display font-black text-xs sm:text-sm text-black truncate uppercase tracking-wide">
                {readyHumanCount}/{humanPlayersCount} PEMAIN SIAP
              </span>
            </div>

            {/* Tactical Bot Mode Badge */}
            <button
              type="button"
              onClick={handleBotDifficultyClick}
              className="bg-[#283044] text-white border-[2.5px] border-black rounded-xl p-2.5 shadow-[3px_3px_0px_#000000] flex items-center gap-2 cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] transition-all shrink-0"
              title="Tingkat Kesulitan Bot Terkunci Hard"
            >
              <Bot className="w-5 h-5 text-[#FFD000]" aria-hidden="true" />
              <span className="font-display font-black text-xs sm:text-sm text-[#FFD000] flex items-center gap-1 uppercase tracking-wide">
                <Lock className="w-3.5 h-3.5 text-[#FFD000] stroke-[2.5]" aria-hidden="true" />
                BOT: HARD
              </span>
            </button>
          </div>

          {/* (4) 4 Player Seats List */}
          <section className="flex flex-col gap-3" aria-label="Daftar Kursi Pemain">
            {/* Slot 1: Host Seat */}
            <div className="w-full bg-white rounded-xl border-[3px] border-black shadow-[3px_3px_0px_#000000] p-3 flex items-center justify-between gap-3 select-none">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-[#FFD000] text-black border-2 border-black flex items-center justify-center font-display font-black text-lg shadow-[2px_2px_0px_#000000] shrink-0">
                  {hostPlayer.initials || getInitials(hostPlayer.name)}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-black text-base text-black truncate max-w-[130px]">
                      {hostPlayer.name} {isCurrentUserHost ? '(Anda)' : ''}
                    </span>
                    <span className="px-1.5 py-0.5 bg-[#FFD000] text-black text-[10px] font-display font-black border-[1.5px] border-black rounded shadow-[1px_1px_0px_#000000] shrink-0">
                      HOST
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-[#10B981] text-black font-display font-black text-xs uppercase rounded-lg border-2 border-black shadow-[2px_2px_0px_#000000] shrink-0 flex items-center gap-1">
                <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                <span>SIAP</span>
              </div>
            </div>

            {/* Slots 2..4: Guests or Tactical Hard Bot Placeholders */}
            {remainingSeats.map((seat, idx) =>
              seat.kind === 'human' ? (
                <HumanPlayerSeatItem
                  key={seat.player.id}
                  player={seat.player}
                  isCurrentUser={seat.player.id === playerId}
                  onToggleReady={onToggleReady}
                />
              ) : (
                <BotSeatItem key={`bot-slot-${idx}-${seat.name}`} name={seat.name} />
              )
            )}
          </section>

          {/* (5) Area Kontrol & Aksi Footer */}
          <div className="w-full pt-2 flex flex-col gap-3">
            {/* Primary Action Button: MULAI PERMAINAN / MENUNGGU SEMUA SIAP */}
            <button
              id="btnStartMatch"
              type="button"
              disabled={!canStartMatch}
              aria-disabled={!canStartMatch}
              onClick={handleStartGame}
              className={clsx(
                'w-full py-4 px-4 font-display font-black text-base uppercase tracking-wider rounded-xl border-[3px] border-black transition-all flex items-center justify-center gap-2 select-none',
                canStartMatch
                  ? 'bg-[#10B981] text-black shadow-[4px_4px_0px_#000000] hover:bg-[#00c57c] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] cursor-pointer'
                  : 'bg-[#EAEDFF] text-[#64748b] opacity-60 shadow-[2px_2px_0px_#000000] cursor-not-allowed'
              )}
            >
              {canStartMatch ? (
                <>
                  <Play className="w-5 h-5 text-black fill-black" aria-hidden="true" />
                  <span>MULAI PERMAINAN</span>
                </>
              ) : (
                <>
                  <Hourglass className="w-5 h-5 text-[#64748b]" aria-hidden="true" />
                  <span>MENUNGGU SEMUA SIAP</span>
                </>
              )}
            </button>

            {/* Secondary Navigation Actions: ATURAN & BUBARKAN MEJA / KELUAR */}
            <div className="grid grid-cols-2 gap-3">
              {/* Panduan Aturan 7-an */}
              <button
                type="button"
                onClick={() => setModal('rules')}
                className="w-full py-2.5 px-2 bg-white text-black font-display font-black text-xs uppercase rounded-lg border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-black" aria-hidden="true" />
                <span>ATURAN</span>
              </button>

              {/* BUBARKAN MEJA / KELUAR */}
              <button
                type="button"
                onClick={onLeaveRoom}
                className="w-full py-2.5 px-2 bg-[#FFDAD6] text-[#93000A] font-display font-black text-xs uppercase rounded-lg border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-[#93000A]" aria-hidden="true" />
                <span>{isCurrentUserHost ? 'BUBARKAN MEJA' : 'KELUAR'}</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Rules Modal when ATURAN is opened */}
      <RulesModal
        isOpen={activeModal === 'rules'}
        onClose={() => setModal('none')}
      />

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

export default WaitingRoomScreen;
