import React, { useState } from 'react';
import {
  Dices,
  Bot,
  Users,
  Play,
  PlusCircle,
  ArrowRight,
  LogIn,
  User as UserIcon,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useGameStore, getInitials } from '../store/useGameStore';
import { BotDifficulty, ServerHealthStatus } from '../types/game';
import { AppShell } from '../components/layout/AppShell';
import { BottomNav } from '../components/layout/BottomNav';
import { BrutalBadge } from '../components/ui/BrutalBadge';
import { RulesModal } from '../components/modals/RulesModal';
import { BrutalToast } from '../components/ui/BrutalToast';

export interface LobbyScreenProps {
  onCreateOnlineRoom: () => void;
  onJoinOnlineRoom: (roomCode: string) => void;
}

const SERVER_HEALTH_UI: Record<
  ServerHealthStatus,
  { label: string; dotClass: string; pingClass: string | null; title: string }
> = {
  ready: {
    label: 'Server Siap',
    dotClass: 'bg-[#00D084] shadow-[0_0_6px_#00D084]',
    pingClass: 'bg-[#00D084] opacity-75',
    title: 'Server multiplayer aktif dan siap digunakan',
  },
  waking: {
    label: 'Waking...',
    dotClass: 'bg-[#FFE600] animate-pulse',
    pingClass: 'bg-[#FFE600] opacity-90',
    title: 'Menyiapkan server multiplayer (~20 detik)',
  },
  offline: {
    label: 'Offline',
    dotClass: 'bg-[#FF4343]',
    pingClass: null,
    title: 'Perangkat offline atau server tidak terjangkau (Mode AI tetap aktif)',
  },
};

/**
 * Screen 1: Main Lobby Screen (Lobi Utama Neo-Brutalism)
 * Adheres strictly to DESIGN.md 4.1 and Google Stitch lobi_utama_7_an_tactical:
 * - Top Bar fixed h-16 bg-[#00D084] border-b-[3px] border-black with Server Health pill & Audio Toggle
 * - Hero Banner mint #00D084 border-[3px] border-black shadow-[4px_4px_0px_#000000]
 * - Guest Profile Card: 48px circular initial avatar, strict ^[a-zA-Z0-9]{1,7}$ input, #00D084 dice button
 * - Versus AI (Offline): 3-col difficulty selector (Easy/Medium/Hard) + full-width mint MULAI CTA
 * - MABAR (Online): Canary Yellow BUAT ROOM BARU button, divider, 6-char room code input + GABUNG CTA
 * - Fixed BottomNav ('MENU' & 'ATURAN') + RulesModal + BrutalToast
 */
export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  onCreateOnlineRoom,
  onJoinOnlineRoom,
}) => {
  const {
    playerName,
    setPlayerName,
    randomizePlayerName,
    offlineDifficulty,
    setOfflineDifficulty,
    roomCodeInput,
    setRoomCodeInput,
    serverHealth,
    startOfflineGame,
    activeModal,
    setModal,
    showToast,
    toast,
    audioEnabled,
    toggleAudio,
  } = useGameStore();

  const [isRolling, setIsRolling] = useState(false);

  // Handle dice randomizer animation & name update
  const handleRandomize = () => {
    setIsRolling(true);
    randomizePlayerName();
    setTimeout(() => {
      setIsRolling(false);
    }, 350);
  };

  // Handle online room joining
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = roomCodeInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (sanitized.length !== 6) {
      showToast('⚠️', 'Kode room harus terdiri dari 6 karakter!');
      return;
    }
    onJoinOnlineRoom(sanitized);
  };

  const currentInitials = getInitials(playerName || 'Sekop07');
  const healthUi = SERVER_HEALTH_UI[serverHealth] || SERVER_HEALTH_UI.ready;

  return (
    <AppShell variant="cream">
      {/* (1) Fixed Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#00D084] border-b-[3px] border-black pt-safe" data-purpose="lobby-header">
        <div className="w-full max-w-md mx-auto h-16 px-4 flex items-center justify-between gap-2">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* 4-suit '7' card badge */}
            <div className="w-11 h-11 bg-white border-2 border-black rounded-lg relative flex items-center justify-center shadow-[2px_2px_0px_#000000] shrink-0 select-none overflow-hidden">
              <span className="absolute top-0.5 left-1 text-[9px] leading-none text-black font-black">♠</span>
              <span className="absolute top-0.5 right-1 text-[9px] leading-none text-[#FF4343] font-black">♥</span>
              <span className="font-display font-black text-2xl text-black leading-none pt-0.5">7</span>
              <span className="absolute bottom-0.5 left-1 text-[9px] leading-none text-black font-black">♣</span>
              <span className="absolute bottom-0.5 right-1 text-[9px] leading-none text-[#FF4343] font-black">♦</span>
            </div>
            <h1 className="font-display font-black text-2xl tracking-wider text-black uppercase select-none truncate">
              MENU
            </h1>
          </div>

          {/* Right Server Health Pill & Audio Toggle Button */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              role="status"
              aria-live="polite"
              title={healthUi.title}
              data-testid="server-health-pill"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_#000000] select-none"
            >
              <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
                {healthUi.pingClass && (
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full ${healthUi.pingClass}`}
                  />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 border border-black ${healthUi.dotClass}`}
                />
              </span>
              <span className="font-display font-black text-[10px] uppercase tracking-wide text-black leading-none whitespace-nowrap">
                {healthUi.label}
              </span>
            </div>

            <button
              type="button"
              id="audio-toggle-btn"
              onClick={toggleAudio}
              aria-label="Toggle Suara"
              title={audioEnabled ? 'Matikan Suara' : 'Aktifkan Suara'}
              className="w-11 h-11 bg-white border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#000000] cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] hover:bg-neutral-100 transition shrink-0"
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
      <main className="w-full px-4 pt-20 pb-24 space-y-4 flex-1 flex flex-col justify-start">
        {/* (2) Hero Banner Mint Green */}
        <section
          className="relative overflow-hidden rounded-2xl bg-[#00D084] border-[3px] border-black p-4 shadow-[4px_4px_0px_#000000]"
          data-purpose="banner-tactical"
        >
          <div className="pr-20">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-display font-black text-[38px] leading-[42px] tracking-[-0.03em] text-black">
                7-an
              </h2>
            </div>
            <div className="inline-block border-2 border-black rounded-lg px-2.5 py-0.5 shadow-[2px_2px_0px_#000000] bg-white">
              <p className="text-xs font-display font-black text-black tracking-tight select-none">
                Tentukan tujuanmu!
              </p>
            </div>
          </div>

          {/* Decorative Card "7" with 4 suits */}
          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 rotate-3 hover:rotate-0 transition-transform cursor-pointer select-none"
            data-purpose="decorative-card"
          >
            <div className="w-16 h-16 bg-white border-[2.5px] border-black rounded-2xl relative flex items-center justify-center shadow-[3px_3px_0px_#000000] select-none overflow-hidden">
              <span className="absolute top-1 left-1.5 text-xs leading-none text-black font-black">♠</span>
              <span className="absolute top-1 right-1.5 text-xs leading-none text-[#FF4343] font-black">♥</span>
              <span className="font-display font-black text-3xl text-black leading-none pt-0.5">7</span>
              <span className="absolute bottom-1 left-1.5 text-xs leading-none text-black font-black">♣</span>
              <span className="absolute bottom-1 right-1.5 text-xs leading-none text-[#FF4343] font-black">♦</span>
            </div>
          </div>
        </section>

        {/* (3) Section Nickname Form Profil Guest */}
        <section
          aria-labelledby="section-guest-profile"
          className="rounded-2xl bg-white border-[2.5px] border-black p-4 space-y-3 shadow-[4px_4px_0px_#000000]"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 select-none">
              <UserIcon className="w-5 h-5 text-black" aria-hidden="true" />
              <label
                id="section-guest-profile"
                htmlFor="guest-nickname-input"
                className="font-display font-extrabold text-sm uppercase tracking-wider text-black cursor-pointer"
              >
                Nickname
              </label>
            </div>
            <BrutalBadge variant="cream">Guest ID</BrutalBadge>
          </div>

          {/* Avatar Preview, Input, and Dice Action */}
          <div className="flex items-center gap-2.5">
            {/* Automatic Initial Avatar */}
            <div
              title={`Avatar Inisial: ${currentInitials}`}
              className="w-12 h-12 rounded-full bg-[#FFE600] border-2 border-black flex items-center justify-center font-display font-black text-lg text-black shrink-0 shadow-[2px_2px_0px_#000000] select-none"
            >
              {currentInitials}
            </div>

            {/* 7-Char Alphanumeric Nickname Input */}
            <div className="relative flex-1">
              <input
                id="guest-nickname-input"
                type="text"
                maxLength={7}
                pattern="[a-zA-Z0-9]{1,7}"
                autoComplete="off"
                spellCheck={false}
                placeholder="Nama pemain..."
                value={playerName}
                onChange={(e) =>
                  setPlayerName(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 7))
                }
                className="w-full py-2.5 px-3 rounded-xl bg-[#F5F2EB] border-2 border-black text-black font-display font-bold text-base focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000000] placeholder:text-black/40 transition-all"
              />
            </div>

            {/* Green Random Dice Button */}
            <button
              type="button"
              id="btn-dice-random"
              onClick={handleRandomize}
              aria-label="Acak nama guest"
              title="Acak nama pemain"
              className="w-12 h-12 rounded-xl bg-[#00D084] border-2 border-black text-black shadow-[2px_2px_0px_#000000] hover:bg-[#00b874] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] flex items-center justify-center transition-all select-none shrink-0 cursor-pointer"
            >
              <Dices
                className={`w-6 h-6 text-black transition-transform duration-300 ${
                  isRolling ? 'rotate-180 scale-110' : ''
                }`}
                aria-hidden="true"
              />
            </button>
          </div>
        </section>

        {/* (4) Section Versus AI (Offline) */}
        <section
          aria-labelledby="section-versus-ai"
          className="rounded-2xl bg-white border-[2.5px] border-black p-4 space-y-3.5 shadow-[4px_4px_0px_#000000]"
        >
          {/* Section Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 select-none">
              <div className="w-8 h-8 rounded-lg bg-[#00D084] border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0px_#000000]">
                <Bot className="w-5 h-5 text-black" aria-hidden="true" />
              </div>
              <h2
                id="section-versus-ai"
                className="font-display font-black text-xl text-black uppercase tracking-tight"
              >
                Versus AI
              </h2>
            </div>
            <BrutalBadge variant="mint">OFFLINE</BrutalBadge>
          </div>

          {/* Segmented Difficulty Selector 3 Kolom */}
          <div className="space-y-1.5">
            <div
              role="radiogroup"
              aria-label="Pilih Tingkat Kesulitan Bot"
              className="grid grid-cols-3 gap-2 p-1.5 rounded-xl bg-[#F5F2EB] border-2 border-black"
            >
              {(['easy', 'medium', 'hard'] as const).map((diff: BotDifficulty) => {
                const isActive = offlineDifficulty === diff;
                const label = diff.charAt(0).toUpperCase() + diff.slice(1);
                return (
                  <button
                    key={diff}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => setOfflineDifficulty(diff)}
                    className={`py-2 px-1 rounded-lg font-display text-xs uppercase flex items-center justify-center gap-1.5 transition-all select-none cursor-pointer ${
                      isActive
                        ? 'bg-[#FFE600] border-2 border-black shadow-[2px_2px_0px_#000000] font-black text-black active:translate-x-[1px] active:translate-y-[1px]'
                        : 'border-2 border-transparent text-black/70 font-bold hover:text-black hover:bg-black/5'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full border border-black ${
                        isActive ? 'bg-black' : 'bg-transparent border-black/40'
                      }`}
                      aria-hidden="true"
                    />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Launch Offline Match Button */}
          <button
            type="button"
            id="btn-start-offline"
            onClick={startOfflineGame}
            className="w-full py-3.5 px-4 rounded-xl bg-[#00D084] text-black border-[3px] border-black shadow-[4px_4px_0px_#000000] hover:bg-[#00b874] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] font-display font-black text-base uppercase tracking-wider transition-all flex items-center justify-center gap-2 select-none cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" aria-hidden="true" />
            <span>MULAI</span>
          </button>
        </section>

        {/* (5) Section MABAR (Online) */}
        <section
          aria-labelledby="section-mabar-online"
          className="rounded-2xl bg-white border-[2.5px] border-black p-4 space-y-3.5 shadow-[4px_4px_0px_#000000]"
        >
          {/* Section Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 select-none">
              <div className="w-8 h-8 rounded-lg bg-[#FFE600] border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0px_#000000]">
                <Users className="w-5 h-5 text-black" aria-hidden="true" />
              </div>
              <h2
                id="section-mabar-online"
                className="font-display font-black text-xl text-black uppercase tracking-tight"
              >
                MABAR
              </h2>
            </div>
            <BrutalBadge variant="yellow">ONLINE</BrutalBadge>
          </div>

          {/* Create Online Room Action Button */}
          <button
            type="button"
            id="btn-create-room"
            onClick={onCreateOnlineRoom}
            className="w-full py-3 px-4 rounded-xl bg-[#FFE600] text-black border-[2.5px] border-black shadow-[3px_3px_0px_#000000] hover:bg-[#ebd300] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] font-display font-black text-sm uppercase tracking-wide transition-all flex items-center justify-between select-none cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-black" aria-hidden="true" />
              <span>BUAT ROOM BARU</span>
            </div>
            <ArrowRight className="w-5 h-5 text-black" aria-hidden="true" />
          </button>

          {/* Divider Decorative Row */}
          <div className="flex items-center gap-3 py-0.5 select-none" aria-hidden="true">
            <div className="flex-1 h-[2px] bg-black" />
            <span className="font-display font-black text-[11px] text-black tracking-widest uppercase">
              ATAU GABUNG MEJA
            </span>
            <div className="flex-1 h-[2px] bg-black" />
          </div>

          {/* 6-Character Room Code Join Form */}
          <form onSubmit={handleJoinRoom} className="space-y-1.5">
            <label
              htmlFor="room-code-input"
              className="font-display font-bold text-xs text-black uppercase tracking-wider block select-none"
            >
              Kode Room 6 Karakter
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="room-code-input"
                  type="text"
                  maxLength={6}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="CONTOH: 7KOP9A"
                  value={roomCodeInput}
                  onChange={(e) =>
                    setRoomCodeInput(
                      e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
                    )
                  }
                  className="w-full py-2.5 px-3 rounded-xl bg-[#F5F2EB] border-2 border-black text-black placeholder:text-black/40 font-display font-black text-base tracking-widest uppercase focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000000] transition-all"
                />
              </div>

              <button
                type="submit"
                id="btn-join-room"
                disabled={roomCodeInput.trim().length !== 6}
                className="h-[46px] px-4 rounded-xl bg-[#FFE600] text-black border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-[#ebd300] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] font-display font-black text-sm uppercase transition-all flex items-center gap-1.5 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <span>GABUNG</span>
                <LogIn className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </form>
        </section>
      </main>

      {/* (6) Bottom Navigation & Global Rules Modal */}
      <BottomNav
        activeTab={activeModal === 'rules' ? 'rules' : 'lobby'}
        onSelectLobby={() => setModal('none')}
        onOpenRules={() => setModal('rules')}
      />

      {/* Rules Modal for Aturan Tab */}
      <RulesModal
        isOpen={activeModal === 'rules'}
        onClose={() => setModal('none')}
      />

      {/* Global Tactical Floating Toast */}
      <BrutalToast
        visible={toast.visible}
        icon={toast.icon}
        message={toast.message}
        position="top"
      />
    </AppShell>
  );
};

export default LobbyScreen;
