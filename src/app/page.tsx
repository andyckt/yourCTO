'use client'

import TextParticles from "@/components/text-particles";
import { useEffect, useState } from "react";

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Update on resize
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return (
    <div className="w-full h-screen overflow-hidden">
      <TextParticles 
        text={isMobile 
          ? ["Hey CEO", "It's your", "CTO"] 
          : ["Hey CEO", "It's your CTO"]
        } 
        scatteredColor={isMobile 
          ? ["#00DCFF", "#FF9900", "#FF9900"] 
          : ["#00DCFF", "#FF9900"]
        } 
        fontSize={isMobile ? 200 : 210}
        lineHeight={1.5}
      />
    </div>
  );
}
