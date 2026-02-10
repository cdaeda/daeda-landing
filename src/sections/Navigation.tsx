import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { siteConfig } from '../content.config';

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { company, navigation } = siteConfig;
  const navItems = navigation.items;

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
          isScrolled
            ? 'bg-[#0B0F1C]/80 backdrop-blur-md py-4'
            : 'bg-transparent py-6'
        }`}
      >
        <div className="w-full px-6 lg:px-12 flex items-center justify-between">
          {/* Logo */}
          <a
            href="#"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <img 
              src="/logo-small.svg" 
              alt="Daeda Group" 
              className="h-8 w-8"
            />
            <span className="text-[#F4F6FB] font-semibold text-lg tracking-tight hidden sm:inline">
              {company.name}
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => scrollToSection(item.href)}
                className="text-[#A9B3C7] hover:text-[#F4F6FB] text-sm font-medium transition-colors"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => scrollToSection('#contact')}
              className="bg-[#F6B047] text-[#0B0F1C] px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#F6B047]/90 transition-colors"
            >
              {navigation.cta}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-[#F4F6FB]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-[99] bg-[#0B0F1C]/95 backdrop-blur-lg transition-all duration-300 md:hidden ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => scrollToSection(item.href)}
              className="text-[#F4F6FB] text-2xl font-medium hover:text-[#F6B047] transition-colors"
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => scrollToSection('#contact')}
            className="bg-[#F6B047] text-[#0B0F1C] px-8 py-3 rounded-full text-lg font-semibold mt-4"
          >
            {navigation.cta}
          </button>
        </div>
      </div>
    </>
  );
};

export default Navigation;
