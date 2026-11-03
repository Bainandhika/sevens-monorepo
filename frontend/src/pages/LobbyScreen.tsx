import React, { useState } from 'react';
import {
  Dices,
  Bot,
  Users,
  Play,
  PlusCircle,
  ArrowRight,
  LogIn,
  Spade,
  User as UserIcon,
} from 'lucide-react';
import { useGameStore, getInitials } from '../store/useGameStore';
import { BotDifficulty } from '../types/game';
import { AppShell } from '../components/layout/AppShell';
import { BottomNav } from '../components/layout/BottomNav';
import { BrutalBadge } from '../components/ui/BrutalBadge';
import { RulesModal } from '../components/modals/RulesModal';
import { BrutalToast } from '../components/ui/BrutalToast';

export interface LobbyScreenProps {
  onCreateOnlineRoom: () => void;
  onJoinOnlineRoom: (roomCode: string) => void;
}

/**
 * Screen 1: Main Lobby Screen (Lobi Utama Neo-Brutalism)
 * Adheres strictly to PRD Bab 6 Layar 1 and Google Stitch Screen 0221fbfd1989462bb4e2c90f69a13336:
 * - Top Bar fixed h-16 bg-[#F5F2EB] border-b-[2.5px] border-black
 * - Hero Banner kuning #FFE600 border-[2.5px] border-black dengan badge 'TACTICAL!' dan kartu miring '7♠'
 * - Section Nickname Profil Guest: avatar inisial 2 huruf, input maks 7 karakter, tombol dadu acak #00E599
 * - Section Versus AI (Offline): segmented selector 3 kolom (Easy, Medium, Hard), tombol 'MULAI' #00E599
 * - Section MABAR (Online): tombol 'BUAT ROOM BARU', divider 'ATAU GABUNG MEJA', input kode 6 karakter + tombol 'GABUNG' #FFE600
 * - Fixed BottomNav dengan tab Lobi dan Aturan, serta RulesModal interaktif
 */
export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  onCreateOnlineRoom,
  onJoinOnlineRoom,
}) => {
  const {
    serverHealth,
    playerName,
    setPlayerName,
    randomizePlayerName,
    offlineDifficulty,
    setOfflineDifficulty,
    roomCodeInput,
    setRoomCodeInput,
    startOfflineGame,
    activeModal,
    setModal,
    showToast,
    toast,
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
    const sanitized = roomCodeInput.trim().toUpperCase();
    if (sanitized.length !== 6) {
      showToast('⚠️', 'Kode room harus terdiri dari 6 karakter!');
      return;
    }
    onJoinOnlineRoom(sanitized);
  };

  const currentInitials = getInitials(playerName || 'Sekop07');

  return (
    <AppShell variant="cream">
      {/* (1) Fixed Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#F5F2EB] border-b-[2.5px] border-black pt-safe">
        <div className="w-full max-w-md mx-auto h-16 px-4 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-[#FFE600] border-2 border-black flex items-center justify-center font-bold shadow-[2px_2px_0px_#000000] select-none">
              <Spade className="w-5 h-5 text-black fill-black" aria-hidden="true" />
            </div>
            <h1 className="font-display font-black text-2xl tracking-tight text-black uppercase select-none">
              LOBI
            </h1>
          </div>

          {/* Server Connection Status Badge */}
          <div className="flex items-center">
            {serverHealth === 'ready' ? (
              <BrutalBadge variant="white" pulseDotColor="green" title="Server Backend Aktif & Siap">
                Server Siap
              </BrutalBadge>
            ) : (
              <BrutalBadge variant="white" pulseDotColor="yellow" title="Silent Wake-Up Server Sedang Berjalan">
                Menyiapkan Server...
              </BrutalBadge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full px-4 pt-20 pb-24 space-y-4 flex-1 flex flex-col justify-start">
        {/* (2) Hero Banner Kuning */}
        <div className="relative overflow-hidden rounded-xl bg-[#FFE600] border-[2.5px] border-black p-4 shadow-[4px_4px_0px_#000000]">
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-0.5">
              <div className="flex items-baseline gap-2">
                <span className="font-display font-black text-4xl text-black tracking-tight uppercase leading-none select-none">
                  7-an
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white border-2 border-black text-[10px] font-display font-black uppercase tracking-wider shadow-[1px_1px_0px_#000000] select-none">
                  TACTICAL!
                </span>
              </div>
              <p className="font-sans font-bold text-sm text-black/85 select-none pt-1">
                Tentukan tujuanmu!
              </p>
            </div>

            {/* Angled Card Badge 7♠ */}
            <div
              className="w-11 h-11 rounded-lg bg-white border-2 border-black flex items-center justify-center rotate-3 shadow-[2px_2px_0px_#000000] select-none shrink-0"
              aria-label="Kartu 7 Sekop"
            >
              <span className="font-display font-black text-xl text-black">7♠</span>
            </div>
          </div>
        </div>

        {/* (3) Section Nickname Form Profil Guest */}
        <section
          aria-labelledby="section-guest-profile"
          className="rounded-xl bg-white border-[2.5px] border-black p-4 space-y-3 shadow-[4px_4px_0px_#000000]"
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
              className="w-12 h-12 rounded-xl bg-[#FFE600] border-2 border-black flex items-center justify-center font-display font-black text-lg text-black shrink-0 shadow-[2px_2px_0px_#000000] select-none"
            >
              {currentInitials}
            </div>

            {/* 7-Char Nickname Input */}
            <div className="relative flex-1">
              <input
                id="guest-nickname-input"
                type="text"
                maxLength={7}
                placeholder="Nama pemain..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
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
              className="w-12 h-12 rounded-xl bg-[#00E599] border-2 border-black text-black shadow-[2px_2px_0px_#000000] hover:bg-[#00cf87] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center transition-all select-none shrink-0"
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
          className="rounded-xl bg-white border-[2.5px] border-black p-4 space-y-3.5 shadow-[4px_4px_0px_#000000]"
        >
          {/* Section Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 select-none">
              <div className="w-8 h-8 rounded-lg bg-[#00E599] border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0px_#000000]">
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
                    className={`py-2 px-1 rounded-lg font-display text-xs uppercase flex items-center justify-center gap-1.5 transition-all select-none ${
                      isActive
                        ? 'bg-[#FFE600] border-2 border-black shadow-[2px_2px_0px_#000000] font-black text-black active:translate-x-0.5 active:translate-y-0.5'
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
            className="w-full py-3.5 px-4 rounded-xl bg-[#00E599] text-black border-[2.5px] border-black shadow-[4px_4px_0px_#000000] hover:bg-[#00cf87] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] font-display font-black text-base uppercase tracking-wider transition-all flex items-center justify-center gap-2 select-none"
          >
            <Play className="w-5 h-5 fill-current" aria-hidden="true" />
            <span>MULAI</span>
          </button>
        </section>

        {/* (5) Section MABAR (Online) */}
        <section
          aria-labelledby="section-mabar-online"
          className="rounded-xl bg-white border-[2.5px] border-black p-4 space-y-3.5 shadow-[4px_4px_0px_#000000]"
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
            className="w-full py-3 px-4 rounded-xl bg-[#F5F2EB] text-black border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-[#ebe5dc] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-display font-black text-sm uppercase tracking-wide transition-all flex items-center justify-between select-none"
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
                  placeholder="CONTOH: 7KOP9A"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#F5F2EB] border-2 border-black text-black placeholder:text-black/40 font-display font-black text-base tracking-widest uppercase focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000000] transition-all"
                />
              </div>

              <button
                type="submit"
                id="btn-join-room"
                disabled={roomCodeInput.trim().length !== 6}
                className="h-[46px] px-4 rounded-xl bg-[#FFE600] text-black border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-[#ebd300] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-display font-black text-sm uppercase transition-all flex items-center gap-1.5 select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
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
