import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Settings } from 'lucide-react';
import { AppConfig, ButtonConfig } from './types';
import { loadConfig, saveToLocalStorage } from './services/fileService';
import DynamicButton from './components/DynamicButton';
import AdminPanel from './components/AdminPanel';

function App() {
  const [config, setConfig] = useState<AppConfig>({ siteTitle: '', buttons: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Initialize Data
  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      const loadedConfig = await loadConfig();
      setConfig(loadedConfig);
      setIsLoading(false);
    };
    fetchConfig();
  }, []);

  // Group buttons by category
  const categories = useMemo(() => {
    const grouped: Record<string, ButtonConfig[]> = {};
    config.buttons.forEach(btn => {
      const cat = btn.category || 'Other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(btn);
    });
    return grouped;
  }, [config.buttons]);

  // Define display order
  const displayOrderConfig = config.buttons.reduce((acc, btn) => {
      if (btn.category && !acc.includes(btn.category)) {
          acc.push(btn.category);
      }
      return acc;
  }, ['Games', 'Tesla', 'Drones', 'Wildlife']);
  
  const displayOrder = Array.from(new Set(displayOrderConfig));

  // Add any categories found in data but not in the defined order to the end
  const distinctCategories = Object.keys(categories);
  const finalOrder = [...displayOrder];
  distinctCategories.forEach(c => {
    if (!finalOrder.includes(c) && c !== 'Other') {
      finalOrder.push(c);
    }
  });
  if (categories['Other']) finalOrder.push('Other');

  // Sync config changes back to local storage
  const handleConfigChange = (newConfig: AppConfig) => {
    setConfig(newConfig);
    saveToLocalStorage(newConfig);
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="animate-spin text-purple-500" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      
      {/* Background Ambient Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[100px]"></div>
      </div>

      <main className="w-full max-w-2xl flex flex-col items-center gap-8 animate-fade-in pt-8 pb-16">
        
        {/* Optional Title Display */}
        {config.siteTitle && (
            <h1 className="text-3xl font-bold text-white mb-2">{config.siteTitle}</h1>
        )}

        {/* Categories Grid */}
        <div className="w-full space-y-10">
          {finalOrder.map(catName => {
            const buttons = categories[catName];
            if (!buttons || buttons.length === 0) return null;

            return (
              <div key={catName} className="w-full">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700/50 pb-2 mb-6 ml-1">
                  {catName}
                </h2>
                <div className="space-y-4">
                  {buttons.map(btn => (
                    <DynamicButton key={btn.id} config={btn} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* Footer */}
      <footer className="mb-8 text-center flex flex-col items-center gap-4 relative z-10 w-full">
        <div className="text-slate-600 text-xs">
          © 2026 PeynirEkmek.com
        </div>
        <button 
          onClick={() => setIsAdminOpen(true)}
          className="text-slate-700 hover:text-slate-400 p-2 transition-colors rounded-full hover:bg-slate-800/50"
          title="Open Admin Panel"
        >
          <Settings size={16} />
        </button>
      </footer>

      {isAdminOpen && (
        <AdminPanel 
          config={config} 
          setConfig={handleConfigChange} 
          onClose={() => setIsAdminOpen(false)} 
          onResetToPublished={async () => {
             // Let's clear localStorage and reload default
             localStorage.removeItem('site_config');
             const loadedConfig = await loadConfig();
             setConfig(loadedConfig);
          }}
        />
      )}
    </div>
  );
}

export default App;