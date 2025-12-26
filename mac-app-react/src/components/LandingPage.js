import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { AUTH_URL } from '../utils/auth';

function LandingPage({ onLoginClick }) {
  const { theme } = useTheme();
  const COLORS = theme.colors;
  const canvasRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const dotsRef = useRef([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleLogin = () => {
    // Start smooth transition animation
    setIsTransitioning(true);
    
    // Call the callback after a short delay for smooth transition
    setTimeout(() => {
      if (onLoginClick) {
        onLoginClick();
      }
    }, 400);
  };

  // Initialize dots
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Create dots
    const dotCount = 80;
    dotsRef.current = [];
    for (let i = 0; i < dotCount; i++) {
      dotsRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        baseX: Math.random() * canvas.width,
        baseY: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.5 + 0.2
      });
    }
  }, []);

  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animate dots
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const mouseX = mousePos.x;
      const mouseY = mousePos.y;
      
      // Calculate parallax offset based on mouse position
      const parallaxX = (mouseX - centerX) / centerX * 30;
      const parallaxY = (mouseY - centerY) / centerY * 30;

      dotsRef.current.forEach((dot, i) => {
        // Apply parallax effect - dots move in opposite direction of mouse
        const offsetX = parallaxX * (dot.speed * 0.3);
        const offsetY = parallaxY * (dot.speed * 0.3);
        
        // Add subtle floating animation
        const time = Date.now() * 0.001;
        const floatX = Math.sin(time * dot.speed + i) * 5;
        const floatY = Math.cos(time * dot.speed * 0.8 + i) * 5;
        
        const x = dot.baseX + offsetX + floatX;
        const y = dot.baseY + offsetY + floatY;
        
        // Draw dot
        ctx.beginPath();
        ctx.arc(x, y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${dot.opacity})`;
        ctx.fill();
        
        // Connect nearby dots with lines
        dotsRef.current.slice(i + 1).forEach((otherDot, j) => {
          const otherOffsetX = parallaxX * (otherDot.speed * 0.3);
          const otherOffsetY = parallaxY * (otherDot.speed * 0.3);
          const otherFloatX = Math.sin(time * otherDot.speed + (i + j + 1)) * 5;
          const otherFloatY = Math.cos(time * otherDot.speed * 0.8 + (i + j + 1)) * 5;
          const otherX = otherDot.baseX + otherOffsetX + otherFloatX;
          const otherY = otherDot.baseY + otherOffsetY + otherFloatY;
          
          const dx = x - otherX;
          const dy = y - otherY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(otherX, otherY);
            ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - distance / 150) * 0.1})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Recalculate base positions proportionally
      dotsRef.current.forEach(dot => {
        dot.baseX = (dot.baseX / canvas.width) * window.innerWidth;
        dot.baseY = (dot.baseY / canvas.height) * window.innerHeight;
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [mousePos]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.bgBase,
      padding: '40px',
      position: 'relative',
      overflow: 'hidden',
      opacity: isTransitioning ? 0 : 1,
      transform: isTransitioning ? 'scale(0.95)' : 'scale(1)',
      transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Interactive background canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />
      {/* Branding */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        zIndex: 1,
        marginBottom: '60px'
      }}>
        {/* App name */}
        <h1 style={{
          fontSize: '48px',
          fontWeight: '700',
          color: COLORS.textPrimary,
          margin: 0,
          letterSpacing: '-0.03em',
          textAlign: 'center'
        }}>
          Loom
        </h1>

        {/* Tagline */}
        <p style={{
          fontSize: '16px',
          color: COLORS.textMuted,
          margin: 0,
          textAlign: 'center',
          maxWidth: '400px',
          lineHeight: '1.6'
        }}>
          AI-powered code explanation tool. Understand your codebase with intelligent analysis.
        </p>
      </div>

      {/* Login button */}
      <button
        onClick={handleLogin}
        style={{
          padding: '14px 32px',
          fontSize: '15px',
          fontWeight: '600',
          color: COLORS.bgBase,
          backgroundColor: COLORS.accent,
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: `0 4px 16px ${COLORS.accent}30`,
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          letterSpacing: '-0.01em'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = `0 6px 24px ${COLORS.accent}40`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = `0 4px 16px ${COLORS.accent}30`;
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10 17 15 12 10 7"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
        Sign in to continue
      </button>

      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: '32px',
        fontSize: '12px',
        color: COLORS.textMuted,
        zIndex: 1
      }}>
        © 2024 Loom
      </div>
    </div>
  );
}

export default LandingPage;

