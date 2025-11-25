import Link from 'next/link';

interface MinimalHeaderProps {
  onLogoClick?: () => void;
}

export function MinimalHeader({ onLogoClick }: MinimalHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 md:px-12 bg-white/80 backdrop-blur-sm border-b border-neutral-100/50">
      <div 
        onClick={onLogoClick}
        className="cursor-pointer"
      >
        {onLogoClick ? (
          <span className="text-2xl font-serif italic font-bold tracking-tighter text-black">
            Forge
          </span>
        ) : (
          <Link href="/" className="text-2xl font-serif italic font-bold tracking-tighter text-black">
            Forge
          </Link>
        )}
      </div>
      
      <nav className="flex items-center gap-4">
        <button className="text-sm font-medium text-neutral-500 hover:text-black transition-colors">
          Sign In
        </button>
      </nav>
    </header>
  );
}
