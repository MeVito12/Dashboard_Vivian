import { useState, useEffect } from 'react';

interface UseLoadingOptions {
  minLoadingTime?: number; // Tempo mínimo de loading em ms
  delay?: number; // Delay antes de mostrar o loading
}

export const useLoading = (
  isLoading: boolean,
  options: UseLoadingOptions = {}
) => {
  const { minLoadingTime = 500, delay = 200 } = options;
  const [showLoading, setShowLoading] = useState(false);
  const [isMinTimeReached, setIsMinTimeReached] = useState(false);

  useEffect(() => {
    let delayTimer: NodeJS.Timeout | undefined;
    let minTimeTimer: NodeJS.Timeout | undefined;

    if (isLoading) {
      // Delay antes de mostrar o loading
      delayTimer = setTimeout(() => {
        setShowLoading(true);
      }, delay);

      // Timer para tempo mínimo de loading
      minTimeTimer = setTimeout(() => {
        setIsMinTimeReached(true);
      }, minLoadingTime);
    } else {
      // Se não está carregando, limpar timers se existirem
      if (delayTimer) clearTimeout(delayTimer);

      // Se o tempo mínimo foi atingido, esconder imediatamente
      if (isMinTimeReached) {
        setShowLoading(false);
        setIsMinTimeReached(false);
      } else {
        // Se não, aguardar o tempo mínimo
        setTimeout(() => {
          setShowLoading(false);
          setIsMinTimeReached(false);
        }, Math.max(0, minLoadingTime - delay));
      }
    }

    return () => {
      if (delayTimer) clearTimeout(delayTimer);
      if (minTimeTimer) clearTimeout(minTimeTimer);
    };
  }, [isLoading, delay, minLoadingTime, isMinTimeReached]);

  return showLoading;
};

export default useLoading;