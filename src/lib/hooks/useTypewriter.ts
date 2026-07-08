import { useState, useEffect } from 'react';

export function useTypewriter(text: string, speed = 75, loopDelay = 3000) {
  const [displayed, setDisplayed] = useState('');
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      setDisplayed('');
      setTyping(true);
      let i = 0;

      const tick = () => {
        if (cancelled) return;
        i++;
        setDisplayed(text.slice(0, i));
        if (i < text.length) {
          setTimeout(tick, speed);
        } else {
          setTyping(false);
          setTimeout(run, loopDelay);
        }
      };

      setTimeout(tick, speed);
    };

    run();
    return () => { cancelled = true; };
  }, [text]);

  return { displayed, typing };
}
