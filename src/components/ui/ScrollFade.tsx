import { useEffect, useRef, useState } from 'react';

interface ScrollFadeProps {
  children: React.ReactNode;
  className?: string;
  offset?: number;
}

export function ScrollFade({ children, className = '', offset = 0 }: ScrollFadeProps) {
  const [opacity, setOpacity] = useState(1);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      
      const element = ref.current;
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + window.scrollY;
      const scrollPosition = window.scrollY + window.innerHeight;
      const distanceFromTop = elementTop - scrollPosition;
      
      // Calculate opacity based on scroll position
      const newOpacity = 1 - Math.max(0, Math.min(1, (window.scrollY - elementTop + offset) / 200));
      setOpacity(Math.max(0, Math.min(1, newOpacity)));
    };

    // Initial check
    handleScroll();
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [offset]);

  return (
    <div 
      ref={ref} 
      className={className}
      style={{ 
        opacity,
        transition: 'opacity 0.3s ease-out',
        willChange: 'opacity'
      }}
    >
      {children}
    </div>
  );
}
