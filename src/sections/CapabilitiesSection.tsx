import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Brain, Rocket, Cloud, X, ChevronRight } from 'lucide-react';
import { siteConfig } from '../content.config';
import { SCROLL_MOTION_QUERY } from '../lib/utils';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '../components/ui/drawer';

gsap.registerPlugin(ScrollTrigger);

const iconMap: Record<
  string,
  React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
> = {
  Brain,
  Rocket,
  Cloud,
};

interface CapabilitiesSectionProps {
  className?: string;
}

const CapabilitiesSection = ({ className = '' }: CapabilitiesSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(SCROLL_MOTION_QUERY, () => {
      const cards = cardsRef.current?.querySelectorAll('.capability-card');

      // Entrance plays while the section scrolls into view, so content is
      // fully visible by the time it reaches the top
      const enterTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 85%',
          end: 'top 5%',
          scrub: 0.5,
        },
      });

      enterTl.fromTo(
        cityRef.current,
        { y: 60, opacity: 0.5 },
        { y: 0, opacity: 1, ease: 'power2.out' },
        0
      );
      enterTl.fromTo(
        headlineRef.current,
        { x: -50, opacity: 0.6 },
        { x: 0, opacity: 1, ease: 'power2.out' },
        0.05
      );
      cards?.forEach((card, i) => {
        enterTl.fromTo(
          card,
          { x: 60, y: 30, opacity: 0.5 },
          { x: 0, y: 0, opacity: 1, ease: 'power2.out' },
          0.08 + i * 0.05
        );
      });

      // Not pinned, so one scroll moves on to the next section; fade out as it leaves
      const exitTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.5,
        },
      });

      exitTl.fromTo(
        cityRef.current,
        { y: 0, opacity: 1 },
        { y: -30, opacity: 0.5, ease: 'power2.in', immediateRender: false },
        0
      );
      exitTl.fromTo(
        headlineRef.current,
        { x: 0, opacity: 1 },
        { x: -25, opacity: 0.5, ease: 'power2.in', immediateRender: false },
        0
      );
      cards?.forEach((card) => {
        exitTl.fromTo(
          card,
          { x: 0, y: 0, opacity: 1 },
          { x: 25, opacity: 0.5, ease: 'power2.in', immediateRender: false },
          0
        );
      });
    }, sectionRef);

    return () => mm.revert();
  }, []);

  const { capabilities } = siteConfig;

  return (
    <>
      <section
        ref={sectionRef}
        id="capabilities"
        className={`relative w-full h-screen h-[100svh] overflow-hidden ${className}`}
      >
        {/* City platform */}
        <div
          ref={cityRef}
          className="absolute left-1/2 bottom-[-10%] -translate-x-1/2 w-[85vw] max-w-[1100px] opacity-100"
          style={{
            mixBlendMode: 'screen',
            maskImage:
              'radial-gradient(ellipse 85% 60% at 50% 70%, black 50%, transparent 90%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 85% 60% at 50% 70%, black 50%, transparent 90%)',
          }}
        >
          <img
            src="/city-platform.png"
            alt=""
            className="w-full h-auto object-contain"
            style={{
              filter:
                'drop-shadow(0 0 20px rgba(255, 255, 255, 0.5)) brightness(1.2)',
            }}
          />
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-start gap-4 sm:gap-6 px-5 pt-24 pb-4 sm:pt-28 sm:px-[8%] lg:flex-row lg:items-center lg:justify-start lg:gap-0 lg:px-[10%] lg:py-0">
          {/* Headline */}
          <div ref={headlineRef} className="max-w-[480px] opacity-100">
            <h2 className="text-[clamp(26px,4.5vw,60px)] font-light text-white mb-2 sm:mb-3 lg:mb-6 leading-tight drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)]">
              {capabilities.headline}
            </h2>
            <p className="text-white/90 text-[clamp(14px,1.3vw,19px)] leading-relaxed mb-2 sm:mb-3 lg:mb-6 drop-shadow-[0_1px_10px_rgba(0,0,0,0.8)]">
              {capabilities.description}
            </p>
            <button
              onClick={() => setDrawerOpen(true)}
              className="group text-[#F6B047] text-sm font-medium flex items-center gap-2 hover:gap-3 transition-all"
            >
              {capabilities.exploreCta}
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Cards: stacked below headline on mobile, staggered column on the right on desktop */}
          <div
            ref={cardsRef}
            className="flex flex-col gap-2.5 sm:gap-3 w-full max-w-[480px] lg:absolute lg:right-[8%] lg:top-1/2 lg:-translate-y-1/2 lg:gap-4 lg:w-auto lg:max-w-none"
          >
            {capabilities.cards.map((cap, i) => {
              const IconComponent = iconMap[cap.icon];
              return (
                <div
                  key={cap.title}
                  className={`capability-card bg-black/60 border border-white/15 backdrop-blur-md rounded-2xl px-4 py-3 sm:p-4 lg:p-6 w-full lg:w-[260px] opacity-100 [-webkit-tap-highlight-color:transparent] ${
                    i === 1 ? 'lg:ml-10' : i === 2 ? 'lg:ml-5' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 mb-1 sm:mb-1.5 lg:block lg:mb-2">
                    {IconComponent && (
                      <IconComponent
                        size={22}
                        className="text-[#F6B047] shrink-0 lg:mb-4"
                        strokeWidth={1.5}
                      />
                    )}
                    <h3 className="text-white font-medium text-base leading-snug lg:text-lg">
                      {cap.title}
                    </h3>
                  </div>
                  <p className="text-white/80 text-[13px] sm:text-sm leading-snug sm:leading-relaxed [@media(max-height:600px)]:hidden">
                    {cap.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Drawer */}
      <Drawer 
        open={drawerOpen} 
        onOpenChange={setDrawerOpen} 
        direction="right"
      >
        <DrawerContent className="bg-[#0B0F1C]/95 backdrop-blur-xl border-l border-white/20 shadow-[0_0_60px_rgba(0,0,0,0.5)] mt-[76px] h-[calc(100vh-76px)]">
          {/* Glass edge highlight */}
          <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent" />
          
          {/* Arrow navigation to close - positioned on the left edge */}
          <DrawerClose className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-[200] group">
            <div className="bg-[#0B0F1C]/80 backdrop-blur-sm shadow-xl rounded-full p-2 border border-white/30 hover:bg-[#0B0F1C] hover:scale-110 transition-all duration-300">
              <ChevronRight 
                size={20} 
                className="text-white group-hover:translate-x-0.5 transition-transform" 
                strokeWidth={2.5}
              />
            </div>
          </DrawerClose>
          
          <div className="flex flex-col h-full max-h-full">
            <DrawerHeader className="pb-4 pt-5 flex-shrink-0">
              <div className="flex items-center justify-between">
                <DrawerTitle className="text-white text-lg font-semibold tracking-tight">
                  {capabilities.drawerTitle}
                </DrawerTitle>
                <DrawerClose className="text-white/50 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10 -mr-2">
                  <X size={18} strokeWidth={2} />
                </DrawerClose>
              </div>
            </DrawerHeader>

            <div className="flex-1 overflow-y-auto px-4 pb-5">
              <div className="space-y-3">
                {capabilities.cards.map((card, index) => {
                  const IconComponent = iconMap[card.icon];
                  return (
                    <div 
                      key={card.title} 
                      className="group/card bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-3 border border-white/20 shadow-sm hover:shadow-md hover:border-[#F6B047]/40 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {/* Compact icon container */}
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#F6B047]/20 to-[#F6B047]/5 border border-[#F6B047]/20 flex items-center justify-center flex-shrink-0 group-hover/card:from-[#F6B047]/30 group-hover/card:to-[#F6B047]/10 transition-all">
                          {IconComponent && (
                            <IconComponent
                              size={18}
                              className="text-[#F6B047]"
                              strokeWidth={2}
                            />
                          )}
                        </div>
                        <h3 className="text-white font-semibold text-sm flex-1 leading-tight">
                          {card.title}
                        </h3>
                        <span className="text-[10px] font-bold text-[#F6B047]/60">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>

                      {/* Bullet list - aligned left under icon */}
                      <ul className="space-y-1 pl-12">
                        {card.details?.map((detail, idx) => (
                          <li
                            key={idx}
                            className="text-white/70 text-xs flex items-start gap-2"
                          >
                            <span className="w-1 h-1 rounded-full bg-[#F6B047]/70 mt-1.5 flex-shrink-0" />
                            <span className="leading-relaxed">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default CapabilitiesSection;
