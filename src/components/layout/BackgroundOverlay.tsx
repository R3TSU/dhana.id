import React from 'react';

interface BackgroundOverlayProps {
  imagePath?: string;
  children?: React.ReactNode;
}

export default function BackgroundOverlay({ 
  imagePath = 'https://dev-dhana-id.creatorcenter.id/bg.webp',
  children 
}: BackgroundOverlayProps) {
  return (
    <>
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url('${imagePath}')`,
          backgroundBlendMode: "overlay",
        }}
      >
        <div className="absolute inset-0 bg-dark-blue/80 backdrop-blur-sm"></div>
      </div>
      {children}
    </>
  );
}
