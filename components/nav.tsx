// components/ui/navbar.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Menu, X } from "lucide-react";

interface NavItem {
  label: string;
  sectionId: string;
}

// Update navigation items to use section IDs
const navItems: NavItem[] = [
  { label: "Home", sectionId: "hero" },
  { label: "Events", sectionId: "events" },
  { label: "Schedule", sectionId: "schedule" }, // This will be a link, not a section
  { label: "About", sectionId: "about" },
  { label: "contact", sectionId: "contact" },
  // Add more sections as needed
];

interface NavbarProps {
  hasActiveEvents?: boolean;
}

export function Navbar({ hasActiveEvents = true }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  // Improved scroll handler with debounce
  const handleScroll = useCallback(() => {
    // Update navbar background 
    const isScrolled = window.scrollY > 10;
    if (isScrolled !== scrolled) {
      setScrolled(isScrolled);
    }

    // Update active section based on scroll position
    const sections = navItems.map(item => item.sectionId);
    
    // Find the section that's most in view
    let maxVisibleSection = "";
    let maxVisiblePercentage = 0;
    
    for (const section of sections) {
      const element = document.getElementById(section);
      if (element) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Calculate how much of the section is visible
        const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
        const sectionHeight = rect.height;
        const visiblePercentage = visibleHeight / sectionHeight;
        
        if (visiblePercentage > maxVisiblePercentage) {
          maxVisiblePercentage = visiblePercentage;
          maxVisibleSection = section;
        }
      }
    }
    
    if (maxVisibleSection && maxVisibleSection !== activeSection) {
      setActiveSection(maxVisibleSection);
    }
  }, [scrolled, activeSection]);

  // Set up scroll listener
  useEffect(() => {
    // Initial check
    handleScroll();
    
    // Add scroll event listener with throttling
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null; // Fixed type
    
    const throttledScroll = () => {
      if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
          handleScroll();
          scrollTimeout = null;
        }, 100);
      }
    };
    
    window.addEventListener("scroll", throttledScroll);
    return () => {
      window.removeEventListener("scroll", throttledScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [handleScroll]);

  // Improved smooth scroll to section with offset for navbar
  const scrollToSection = (sectionId: string) => {
    setIsOpen(false); // Close mobile menu
    const element = document.getElementById(sectionId);
    if (element) {
      // Get navbar height for offset
      const navbar = document.querySelector("nav");
      const navbarHeight = navbar ? navbar.offsetHeight : 0;
      
      // Calculate position
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
      
      // Smooth scroll
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  // Animation variants with proper typing
  const menuVariants: Variants = {
    closed: {
      opacity: 0,
      x: "100%",
      transition: {
        duration: 0.3,
        ease: "easeInOut" as const,
      },
    },
    open: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut" as const,
      },
    },
  };

  // Animation variants for menu items
  const itemVariants: Variants = {
    closed: { opacity: 0, y: 20 },
    open: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.1 + i * 0.1,
        duration: 0.3,
      },
    }),
  };

  return (
    <>
     {/* Main Navbar */}
<nav
  className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
    scrolled ? "bg-black/80 backdrop-blur-md shadow-md" : "bg-transparent"
  }`}
>
  <div className="container mx-auto px-4 py-4">
    <div className="flex justify-between items-center">
      {/* Logo - Always visible */}
      <div 
        className="flex items-center cursor-pointer" 
        onClick={() => scrollToSection("hero")}
      >
        <Image
          src="/logo.png" // Replace with your logo path
          alt="Logo"
          width={120}
          height={40}
          className="h-8 w-auto"
        />
      </div>
      
      {/* Desktop Navigation - Centered */}
      <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-8">
          {navItems
            .filter(item => item.sectionId !== "events" || hasActiveEvents)
            .map((item) => (
            item.sectionId === "schedule" ? (
              <Link
                key={item.label}
                href="/schedule"
                className="text-white hover:text-white/80 transition-colors font-medium px-2 py-1"
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                onClick={() => scrollToSection(item.sectionId)}
                className={`text-white hover:text-white/80 transition-colors font-medium px-2 py-1 ${
                  activeSection === item.sectionId 
                    ? "border-b-2 border-primary text-primary" 
                    : ""
                }`}
              >
                {item.label}
              </button>
            )
          ))}
        </div>
      </div>
      
      {/* Hamburger Menu Button - Only visible on mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden text-white p-2 focus:outline-none"
        aria-label="Toggle menu"
      >
        <Menu className="h-6 w-6" />
      </button>
    </div>
  </div>
</nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="fixed inset-0 bg-black z-50 flex flex-col md:hidden" // Hide on desktop
          >
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              {/* Logo in Menu */}
              <div 
                className="flex items-center cursor-pointer" 
                onClick={() => {
                  scrollToSection("hero");
                  setIsOpen(false);
                }}
              >
                <Image
                  src="/logo.png" // Replace with your logo path
                  alt="Logo"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                />
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="text-white p-2 focus:outline-none"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex flex-col items-center justify-center flex-1 space-y-8">
              {navItems
                .filter(item => item.sectionId !== "events" || hasActiveEvents)
                .map((item, i) => (
                <motion.div
                  key={item.label}
                  custom={i}
                  variants={itemVariants}
                >
                  {item.sectionId === "schedule" ? (
                    <Link
                      href="/schedule"
                      className="text-white text-2xl font-medium hover:text-primary transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      onClick={() => scrollToSection(item.sectionId)}
                      className={`text-white text-2xl font-medium hover:text-primary transition-colors ${
                        activeSection === item.sectionId ? "text-primary" : ""
                      }`}
                    >
                      {item.label}
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
