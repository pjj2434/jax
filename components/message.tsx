'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface MessageBannerData {
  message: string;
  isActive: boolean;
  backgroundColor: string;
  textColor: string;
  showCloseButton: boolean;
}

interface MessageBannerProps {
  data: MessageBannerData;
}

export function MessageBanner({ data }: MessageBannerProps) {
  const [isVisible, setIsVisible] = useState(false); // start hidden to delay render
  const [isScrolled, setIsScrolled] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // Delay visibility to avoid iOS status bar color issue
  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), 150); // ~150ms delay
    return () => clearTimeout(timeout);
  }, []);

  // Set banner height as CSS variable
  useEffect(() => {
    if (bannerRef.current && isVisible) {
      const height = bannerRef.current.offsetHeight;
      document.documentElement.style.setProperty('--banner-height', `${height}px`);
    }
  }, [isVisible]);

  // Adjust banner on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          if (bannerRef.current) {
            const height = bannerRef.current.offsetHeight;
            const shouldHide = currentScrollY > 50;

            document.documentElement.style.setProperty(
              '--banner-height',
              shouldHide ? '0px' : `${height}px`
            );

            setIsScrolled(shouldHide);
          }

          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });

        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle close button
  const handleClose = () => {
    setIsVisible(false);
    if (bannerRef.current) {
      document.documentElement.style.setProperty('--banner-height', '0px');
    }
  };

  // If not active in DB or closed manually, render nothing
  if (!data.isActive || !isVisible) {
    return null;
  }

  return (
    <div className="bg-white">
      <div
        ref={bannerRef}
        className="relative py-2 px-4 text-center w-full transition-all duration-300"
        style={{
          backgroundColor: isScrolled ? 'white' : data.backgroundColor,
          color: data.textColor,
          opacity: isScrolled ? 0 : 1,
          visibility: isScrolled ? 'hidden' : 'visible',
          transform: `translateY(${isScrolled ? '-100%' : '0'})`,
          height: isScrolled ? 0 : 'auto',
          position: 'relative',
          zIndex: 50,
        }}
      >
        <div className="relative">
          <p>{data.message}</p>

          {data.showCloseButton && (
            <button
              onClick={handleClose}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-black/10"
              aria-label="Close banner"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
