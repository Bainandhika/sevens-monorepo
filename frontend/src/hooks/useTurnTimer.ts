/**
 * @deprecated Fitur penunjuk waktu giliran dan logika timeout telah dihapus (Safe Feature Deprecation).
 */
export function useTurnTimer() {
  return {
    timeLeft: 0,
    isUrgent: false,
    resetTimer: () => {},
  };
}

export default useTurnTimer;
