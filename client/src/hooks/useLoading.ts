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
    let delayTimer: NodeJS.Timeout;
    let minTimeTimer: NodeJS.Timeout;

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
      // Se não está carregando, limpar timers
      clearTimeout(delayTimer);
      
      // Se o tempo mínimo foi atingido, esconder imediatamente
      if (isMinTimeReached) {
        setShowLoading(false);
        setIsMinTimeReached(false);
      } else {
        // Se não, aguardar o tempo mínimo
        setTimeout(() => {
          setShowLoading(false);
          setIsMinTimeReached(false);
        }, minLoadingTime - delay);
      }
    }

    return () => {
      clearTimeout(delayTimer);
      clearTimeout(minTimeTimer);
    };
  }, [isLoading, delay, minLoadingTime, isMinTimeReached]);

  return showLoading;
};

export default useLoading;