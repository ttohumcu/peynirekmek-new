import React, { Suspense, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { ButtonConfig } from '../types';

interface Props {
  config: ButtonConfig;
}

const DynamicButton: React.FC<Props> = ({ config }) => {
  
  // Dynamically resolve the icon component from Lucide
  const IconComponent = useMemo(() => {
    // Convert kebab-case (gemini output) to PascalCase (Lucide export)
    // e.g., 'arrow-right' -> 'ArrowRight'
    const pascalCaseName = config.iconName
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    
    // @ts-ignore - Accessing lucide exports dynamically
    const icon = LucideIcons[pascalCaseName] as React.ElementType;
    
    // Fallback if icon not found
    // @ts-ignore
    return icon || LucideIcons.Link;
  }, [config.iconName]);

  return (
    <a 
      href={config.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className={`${config.className} group relative overflow-hidden`}
      title={config.description}
    >
      <div className="relative z-10 flex items-center justify-center gap-2 w-full">
        {IconComponent && <IconComponent size={20} />}
        <span className="font-semibold">{config.name}</span>
      </div>
      {/* Hover effect shimmer overlay if not already in styles */}
      <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
    </a>
  );
};

export default DynamicButton;