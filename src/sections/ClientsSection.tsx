import { useRef, useLayoutEffect, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { siteConfig } from '../content.config';

gsap.registerPlugin(ScrollTrigger);

interface ClientsSectionProps {
  className?: string;
}

const ClientsSection = ({ className = '' }: ClientsSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const row3Ref = useRef<HTMLDivElement>(null);
  const [baseVelocity, setBaseVelocity] = useState(0);

  const { clients } = siteConfig;
  const clientList = clients.clientList;

  // Split clients into three rows
  const rowSize = Math.ceil(clientList.length / 3);
  const row1Clients = clientList.slice(0, rowSize);
  const row2Clients = clientList.slice(rowSize, rowSize * 2);
  const row3Clients = clientList.slice(rowSize * 2);

  // Scroll-linked velocity tracking
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let rafId: number;
    let isActive = true;

    const updateVelocity = () => {
      if (!isActive) return;

      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      const targetVelocity = Math.abs(delta) * 0.3;
      setBaseVelocity((prev) => prev + (targetVelocity - prev) * 0.1);

      rafId = requestAnimationFrame(updateVelocity);
    };

    rafId = requestAnimationFrame(updateVelocity);

    return () => {
      isActive = false;
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Continuous animation for logo bands - always running
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Row 1 - moves left continuously
      gsap.to(row1Ref.current, {
        x: '-50%',
        duration: 50,
        ease: 'none',
        repeat: -1,
      });

      // Row 2 - moves right continuously (start from -50% to create seamless loop)
      gsap.fromTo(
        row2Ref.current,
        { x: '-50%' },
        {
          x: '0%',
          duration: 55,
          ease: 'none',
          repeat: -1,
        }
      );

      // Row 3 - moves left continuously
      gsap.to(row3Ref.current, {
        x: '-50%',
        duration: 60,
        ease: 'none',
        repeat: -1,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Speed up animation based on scroll velocity
  useEffect(() => {
    if (row1Ref.current && row2Ref.current && row3Ref.current) {
      const speedMultiplier = 1 + baseVelocity * 1.5;
      gsap.to([row1Ref.current, row2Ref.current, row3Ref.current], {
        timeScale: speedMultiplier,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  }, [baseVelocity]);

  // Pin section and animate content
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=120%',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      // Headline entrance
      scrollTl.fromTo(
        headlineRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, ease: 'power2.out' },
        0
      );
      scrollTl.to(
        headlineRef.current,
        { y: -20, opacity: 0.5, ease: 'power2.in' },
        0.7
      );

      // Content (logo rows) entrance - always visible, just moves
      scrollTl.fromTo(
        contentRef.current,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, ease: 'power2.out' },
        0.05
      );
      scrollTl.to(
        contentRef.current,
        { y: -30, opacity: 0.5, ease: 'power2.in' },
        0.7
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  interface Client {
    name: string;
    logo: string | null;
  }

  const LogoItem = ({ client }: { client: Client }) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl px-8 py-6 flex items-center justify-center min-w-[220px] h-[160px] hover:border-[#F6B047]/40 transition-all backdrop-blur-sm">
      {client.logo ? (
        <img
          src={client.logo}
          alt={client.name}
          className="max-h-20 max-w-[160px] object-contain brightness-150 contrast-125"
        />
      ) : (
        <span className="text-white font-medium text-base tracking-wide whitespace-nowrap">
          {client.name}
        </span>
      )}
    </div>
  );

  return (
    <section
      ref={sectionRef}
      id="clients"
      className={`relative w-full h-screen overflow-hidden ${className}`}
    >
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center">
        {/* Headline */}
        <div ref={headlineRef} className="text-center mb-6 px-6">
          <h2 className="text-[clamp(48px,8vw,100px)] font-light text-white tracking-wider drop-shadow-lg uppercase">
            Experience
          </h2>
        </div>

        {/* Logo bands - take up most of the screen */}
        <div ref={contentRef} className="space-y-5 overflow-hidden py-4">
          {/* Row 1 - moves left */}
          <div className="relative overflow-visible">
            <div
              ref={row1Ref}
              className="flex gap-5 whitespace-nowrap"
              style={{ width: 'fit-content' }}
            >
              {[...row1Clients, ...row1Clients, ...row1Clients, ...row1Clients].map((client, i) => (
                <LogoItem key={`${client.name}-${i}`} client={client} />
              ))}
            </div>
          </div>

          {/* Row 2 - moves right */}
          <div className="relative overflow-visible">
            <div
              ref={row2Ref}
              className="flex gap-5 whitespace-nowrap"
              style={{ width: 'fit-content' }}
            >
              {[...row2Clients, ...row2Clients, ...row2Clients, ...row2Clients].map((client, i) => (
                <LogoItem key={`${client.name}-${i}`} client={client} />
              ))}
            </div>
          </div>

          {/* Row 3 - moves left */}
          <div className="relative overflow-visible">
            <div
              ref={row3Ref}
              className="flex gap-5 whitespace-nowrap"
              style={{ width: 'fit-content' }}
            >
              {[...row3Clients, ...row3Clients, ...row3Clients, ...row3Clients].map((client, i) => (
                <LogoItem key={`${client.name}-${i}`} client={client} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClientsSection;
