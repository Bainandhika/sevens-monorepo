import React, { useState } from 'react';
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
} from 'lucide-react';
import clsx from 'clsx';
import { useGameStore, getInitials } from '../store/useGameStore';
import { AppShell } from '../components/layout/AppShell';
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

interface BotSeatItemProps {
  name: string;
}

const BotSeatItem: React.FC<BotSeatItemProps> = ({ name }) => (
  <div className="w-full bg-[#E1E7FF] rounded-xl border-[2.5px] border-black shadow-[3px_3px_0px_#000000] p-3 flex items-center justify-between gap-3 select-none">
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-12 h-12 rounded-lg bg-[#283044] text-[#ffd000] border-2 border-black flex items-center justify-center font-display font-black shadow-[2px_2px_0px_#000000] shrink-0">
        <Bot className="w-6 h-6 text-[#ffd000]" aria-hidden="true" />
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-display font-black text-base text-black truncate">{name}</span>
          <span className="px-1.5 py-0.5 bg-[#283044] text-[#ffd000] text-[10px] font-display font-black border border-black rounded shadow-[1px_1px_0px_#000000]">
            BOT
          </span>
        </div>
      </div>
    </div>
    <div className="px-2.5 py-1.5 bg-[#283044] text-white font-display font-black text-xs uppercase rounded-lg border-2 border-black shrink-0 flex items-center gap-1 shadow-[1px_1px_0px_#000000]">
      <Zap className="w-3.5 h-3.5 text-[#10b981] fill-[#10b981]" aria-hidden="true" />
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
  return (
    <div className="w-full bg-white rounded-xl border-[3px] border-black shadow-[3px_3px_0px_#000000] p-3 flex items-center justify-between gap-3 select-none">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 rounded-lg bg-[#dae2fc] text-black border-2 border-black flex items-center justify-center font-display font-black text-lg shadow-[2px_2px_0px_#000000] shrink-0">
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

      {player.isReady ? (
        <div className="px-3 py-1.5 bg-[#10b981] text-black font-display font-black text-xs uppercase rounded-lg border-2 border-black shadow-[2px_2px_0px_#000000] shrink-0 flex items-center gap-1">
          <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
          <span>SIAP</span>
        </div>
      ) : isCurrentUser ? (
        <button
          type="button"
          onClick={onToggleReady}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FFE600] border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none text-xs font-display font-black uppercase tracking-wide text-black cursor-pointer hover:bg-[#ffe033] animate-pulse"
        >
          <Check className="w-4 h-4 text-black stroke-[3]" aria-hidden="true" />
          <span>TEKAN SIAP</span>
        </button>
      ) : (
        <div className="px-2.5 py-1.5 bg-[#ffd000] text-black font-display font-black text-xs uppercase rounded-lg border-2 border-black shadow-[2px_2px_0px_#000000] shrink-0 flex items-center gap-1">
          <Hourglass className="w-3.5 h-3.5 text-black" aria-hidden="true" />
          <span>BELUM SIAP</span>
        </div>
      )}
    </div>
  );
};

/**
 * Screen 2: Online Waiting Room Screen (Ruang Tunggu MABAR Neo-Brutalism)
 * Strictly adheres to PRD Bab 6 Layar 2 and Google Stitch Screen 638b19f4934b477eac3810011a1061b4:
 * (1) Fixed Header h-16 bg-[#10b981] border-b-[2.5px] border-black dengan tombol kembali dan Audio Toggle.
 * (2) Banner Kode Room: Banner kuning (#ffd000) dengan nested white box berisi ROOM ID, #kode, dan tombol SALIN.
 * (3) Bar Telemetri 2-Kolom: '{readyHumanCount}/{humanCount} PEMAIN SIAP' dan '🔒 BOT: HARD'.
 * (4) Daftar 4 Kursi:
 *     - Slot 1: Host manusia (Sekop07, badge HOST, chip SIAP).
 *     - Slot 2: Tamu manusia / Bot Agresif9.
 *     - Slot 3 & 4: Slot bot bernama taktis (Cermat8, Taktik7) dengan badge BOT dan AUTO SIAP.
 * (5) Footer: Tombol utama 'MULAI PERMAINAN' / 'MENUNGGU SEMUA SIAP', serta baris sekunder tombol 'ATURAN' dan 'BUBARKAN MEJA' / 'KELUAR'.
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
  const humanPlayers = rawPlayers.filter((p) => !p.isBot);

  // Fallback demo players matching Stitch Screen 638b19f4934b477eac3810011a1061b4
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
        id: 'guest_wajik',
        name: 'Wajik99',
        initials: 'W9',
        isHost: false,
        isReady: false,
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
      <header className="fixed top-0 inset-x-0 z-40 bg-[#10b981] border-b-[2.5px] border-black pt-safe">
        <div className="h-16 max-w-md mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              aria-label="Kembali ke Menu"
              onClick={onLeaveRoom}
              className="w-11 h-11 bg-white text-black flex items-center justify-center rounded-lg shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all border-2 border-black cursor-pointer"
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
              className="w-11 h-11 bg-white text-black flex items-center justify-center rounded-lg shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all border-2 border-black cursor-pointer"
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
          <section className="w-full bg-[#ffd000] text-black rounded-xl border-[3px] border-black shadow-[4px_4px_0px_#000000] p-4 relative overflow-hidden select-none">
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
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-black font-display font-black text-xs uppercase border-2 border-black rounded-lg shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all hover:bg-[#ffd000] shrink-0 cursor-pointer"
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
            <div className="flex-1 bg-white border-[2.5px] border-black rounded-xl p-2.5 shadow-[3px_3px_0px_#000000] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#10b981] stroke-[2.5]" aria-hidden="true" />
              <span className="font-display font-black text-xs sm:text-sm text-black truncate uppercase tracking-wide">
                {readyHumanCount}/{humanPlayersCount} PEMAIN SIAP
              </span>
            </div>

            {/* Tactical Bot Mode Badge */}
            <div
              onClick={handleBotDifficultyClick}
              className="bg-[#283044] text-white border-[2.5px] border-black rounded-xl p-2.5 shadow-[3px_3px_0px_#000000] flex items-center gap-2 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
              title="Tingkat Kesulitan Bot Terkunci Hard"
            >
              <Bot className="w-5 h-5 text-[#ffd000]" aria-hidden="true" />
              <span className="font-display font-black text-xs sm:text-sm text-[#ffd000] flex items-center gap-1 uppercase tracking-wide">
                <Lock className="w-3.5 h-3.5 text-[#ffd000] stroke-[2.5]" aria-hidden="true" />
                BOT: HARD
              </span>
            </div>
          </div>

          {/* (4) 4 Player Seats List */}
          <section className="flex flex-col gap-3">
            {/* Slot 1: Host Seat */}
            <div className="w-full bg-white rounded-xl border-[3px] border-black shadow-[3px_3px_0px_#000000] p-3 flex items-center justify-between gap-3 select-none">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-[#ffd000] text-black border-2 border-black flex items-center justify-center font-display font-black text-lg shadow-[2px_2px_0px_#000000] shrink-0">
                  {hostPlayer.initials || getInitials(hostPlayer.name)}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-black text-base text-black truncate max-w-[130px]">
                      {hostPlayer.name} {isCurrentUserHost ? '(Anda)' : ''}
                    </span>
                    <span className="px-1.5 py-0.5 bg-[#ffd000] text-black text-[10px] font-display font-black border-[1.5px] border-black rounded shadow-[1px_1px_0px_#000000]">
                      HOST
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-[#10b981] text-black font-display font-black text-xs uppercase rounded-lg border-2 border-black shadow-[2px_2px_0px_#000000] shrink-0 flex items-center gap-1">
                <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                <span>SIAP</span>
              </div>
            </div>

            {/* Slot 2: Tamu / Bot Agresif9 */}
            {guestPlayer && !guestPlayer.isBot ? (
              <HumanPlayerSeatItem
                player={guestPlayer}
                isCurrentUser={guestPlayer.id === playerId}
                onToggleReady={onToggleReady}
              />
            ) : (
              <BotSeatItem name={guestPlayer?.name || 'Agresif9'} />
            )}

            {/* Slot 3: Tamu 2 / Bot Cermat8 */}
            {slot3Player && !slot3Player.isBot ? (
              <HumanPlayerSeatItem
                player={slot3Player}
                isCurrentUser={slot3Player.id === playerId}
                onToggleReady={onToggleReady}
              />
            ) : (
              <BotSeatItem name={slot3Player?.name || rawPlayers.find((p) => p.isBot)?.name || 'Cermat8'} />
            )}

            {/* Slot 4: Tamu 3 / Bot Taktik7 */}
            {slot4Player && !slot4Player.isBot ? (
              <HumanPlayerSeatItem
                player={slot4Player}
                isCurrentUser={slot4Player.id === playerId}
                onToggleReady={onToggleReady}
              />
            ) : (
              <BotSeatItem name={slot4Player?.name || rawPlayers.filter((p) => p.isBot)[1]?.name || 'Taktik7'} />
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
                  ? 'bg-[#10b981] text-black shadow-[4px_4px_0px_#000000] hover:bg-[#00c57c] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer'
                  : 'bg-[#eaedff] text-[#64748b] opacity-60 shadow-[2px_2px_0px_#000000] cursor-not-allowed'
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
                className="w-full py-2.5 px-2 bg-white text-black font-display font-black text-xs uppercase rounded-lg border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-black" aria-hidden="true" />
                <span>ATURAN</span>
              </button>

              {/* BUBARKAN MEJA / KELUAR */}
              <button
                type="button"
                onClick={onLeaveRoom}
                className="w-full py-2.5 px-2 bg-[#ffdad6] text-[#93000a] font-display font-black text-xs uppercase rounded-lg border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-[#93000a]" aria-hidden="true" />
                <span>{isCurrentUserHost ? 'BUBARKAN MEJA' : 'KELUAR'}</span>
              </button>
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

export default WaitingRoomScreen;
