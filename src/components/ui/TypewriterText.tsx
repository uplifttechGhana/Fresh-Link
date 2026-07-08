import { useTypewriter } from '../../lib/hooks/useTypewriter';

interface Props {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'span';
  className?: string;
  speed?: number;
  loopDelay?: number;
  cursorColor?: string;
}

export function TypewriterText({
  text,
  as: Tag = 'h3',
  className = '',
  speed = 75,
  loopDelay = 3000,
  cursorColor = 'bg-ink',
}: Props) {
  const { displayed, typing } = useTypewriter(text, speed, loopDelay);

  return (
    <Tag className={className}>
      {displayed}
      {typing && (
        <span
          className={`inline-block w-[2px] h-[1em] ${cursorColor} ml-[2px] align-middle animate-pulse`}
        />
      )}
    </Tag>
  );
}
