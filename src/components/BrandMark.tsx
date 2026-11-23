import Image from 'next/image';

interface BrandMarkProps {
  name: string;
  /** Second line under the name, e.g. "Car rental". Omit for a single line. */
  caption?: string;
  size?: number;
  /** Colour of the wordmark, for use on dark surfaces. */
  tone?: 'ink' | 'white';
  priority?: boolean;
}

/** The Seven Motors seal followed by the name in the interface face. */
export function BrandMark({ name, caption, size = 32, tone = 'ink', priority }: BrandMarkProps) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <Image
        src="/logo.jpg"
        alt=""
        width={size}
        height={size}
        priority={priority}
        className="shrink-0 rounded-full"
        style={{ width: size, height: size }}
      />
      <span className="min-w-0 leading-tight">
        <span className={`block truncate text-[15px] font-semibold ${tone === 'white' ? 'text-white' : 'text-ink'}`}>{name}</span>
        {caption && <span className={`block truncate text-xs ${tone === 'white' ? 'text-white/60' : 'text-muted'}`}>{caption}</span>}
      </span>
    </span>
  );
}
