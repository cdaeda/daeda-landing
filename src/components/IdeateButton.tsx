import { Lightbulb } from 'lucide-react';

interface IdeateButtonProps {
  onClick: () => void;
  variant?: 'default' | 'floating' | 'inline';
  className?: string;
}

export function IdeateButton({ onClick, variant = 'default', className = '' }: IdeateButtonProps) {
  if (variant === 'floating') {
    return (
      <button
        onClick={onClick}
        className={`fixed bottom-6 right-6 z-[90] group ${className}`}
      >
        <div className="bg-[#F6B047] text-[#0B0F1C] px-5 py-3 rounded-full font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2">
          <Lightbulb size={18} strokeWidth={2.5} />
          <span>Let's Ideate!</span>
          <span className="text-lg">💡</span>
        </div>
      </button>
    );
  }

  if (variant === 'inline') {
    return (
      <button
        onClick={onClick}
        className={`group bg-gradient-to-r from-[#F6B047] to-[#F6B047]/80 text-[#0B0F1C] px-6 py-3 rounded-full font-semibold text-sm hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2 ${className}`}
      >
        <Lightbulb size={16} strokeWidth={2.5} className="group-hover:animate-pulse" />
        <span>Let's Ideate!</span>
        <span>💡</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`group bg-[#F6B047] text-[#0B0F1C] px-6 py-3 rounded-full font-semibold text-sm hover:bg-[#F6B047]/90 transition-all hover:scale-105 shadow-lg flex items-center gap-2 ${className}`}
    >
      <Lightbulb size={16} strokeWidth={2.5} className="group-hover:animate-pulse" />
      <span>Let's Ideate!</span>
      <span>💡</span>
    </button>
  );
}

export function IdeateIcon({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed top-6 right-6 z-[110] group"
      title="Let's Ideate!"
    >
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-[#F6B047] rounded-full blur-md opacity-50 group-hover:opacity-80 transition-opacity animate-pulse" />
        
        {/* Icon container */}
        <div className="relative w-12 h-12 bg-[#0B0F1C]/90 backdrop-blur-sm border border-[#F6B047]/50 rounded-full flex items-center justify-center hover:border-[#F6B047] hover:scale-110 transition-all duration-300 shadow-lg">
          <Lightbulb 
            size={22} 
            className="text-[#F6B047] group-hover:text-white transition-colors" 
            strokeWidth={2}
          />
        </div>
        
        {/* Notification dot */}
        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#F6B047] rounded-full border-2 border-[#0B0F1C]" />
      </div>
    </button>
  );
}

export function IdeateBadge({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2 bg-[#0B0F1C]/80 backdrop-blur-sm border border-[#F6B047]/30 hover:border-[#F6B047] rounded-full pl-3 pr-4 py-2 transition-all hover:scale-105"
    >
      <div className="relative">
        <Lightbulb size={16} className="text-[#F6B047]" strokeWidth={2.5} />
        <div className="absolute inset-0 bg-[#F6B047] rounded-full blur-sm opacity-0 group-hover:opacity-50 transition-opacity" />
      </div>
      <span className="text-white text-sm font-medium">Let's Ideate!</span>
      <span className="text-sm">💡</span>
    </button>
  );
}
