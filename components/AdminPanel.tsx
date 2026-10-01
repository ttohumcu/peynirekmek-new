import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, X, Loader2, Wand2, Upload, Download, RotateCcw, Save, Edit3, LogOut, LogIn } from 'lucide-react';
import { AppConfig, ButtonConfig } from '../types';
import { generateButtonStyle } from '../services/geminiService';
import { downloadConfigJSON, importConfigJSON } from '../services/fileService';
import { auth, signInWithGoogle, logout } from '../services/firebaseService';
import { onAuthStateChanged, User } from 'firebase/auth';

interface Props {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
  onClose: () => void;
  onResetToPublished: () => void;
}

const AdminPanel: React.FC<Props> = ({ 
  config, 
  setConfig, 
  onClose,
  onResetToPublished
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newBtn, setNewBtn] = useState({ name: '', url: '', description: '', category: 'Other' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBtnForm, setEditBtnForm] = useState<Partial<ButtonConfig>>({});
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
      try {
          await signInWithGoogle();
      } catch (error: any) {
          console.error("Login failed", error);
          if (error?.code === 'auth/unauthorized-domain') {
              alert(`Login failed: Unauthorized domain.\n\nPlease go to Firebase Console -> Authentication -> Settings -> Authorized domains and add this domain:\n${window.location.hostname}`);
          } else {
              alert(`Login failed: ${error?.message || 'Unknown error'}`);
          }
      }
  };

  const handleLogout = async () => {
      await logout();
  };

  const handleGenerateAndAdd = async () => {
    if (!newBtn.name || !newBtn.url || !newBtn.description) return;

    setIsGenerating(true);
    try {
      const style = await generateButtonStyle(newBtn.description);
      const newButtonConfig: ButtonConfig = {
        id: crypto.randomUUID(),
        name: newBtn.name,
        url: newBtn.url,
        description: newBtn.description,
        className: style.className,
        iconName: style.icon,
        category: newBtn.category || 'Other'
      };

      setConfig({
        ...config,
        buttons: [...config.buttons, newButtonConfig]
      });
      setNewBtn({ name: '', url: '', description: '', category: 'Other' });
      setIsAdding(false);
    } catch (e) {
      alert("Failed to generate button style. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateStyle = async () => {
    if(!editBtnForm.description) return;
    setIsGenerating(true);
    try {
      const style = await generateButtonStyle(editBtnForm.description);
      setEditBtnForm({
          ...editBtnForm,
          className: style.className,
          iconName: style.icon
      });
    } catch(e) {
       alert("Failed to generate style");
    } finally {
       setIsGenerating(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this button?')) {
      setConfig({
        ...config,
        buttons: config.buttons.filter(b => b.id !== id)
      });
    }
  };

  const handleEditClick = (btn: ButtonConfig) => {
      setEditingId(btn.id);
      setEditBtnForm(btn);
  };

  const handleSaveEdit = () => {
      if(!editingId || !editBtnForm.name || !editBtnForm.url) return;
      setConfig({
          ...config,
          buttons: config.buttons.map(b => b.id === editingId ? { ...b, ...editBtnForm } as ButtonConfig : b)
      });
      setEditingId(null);
      setEditBtnForm({});
  };

  const handleExport = () => {
    downloadConfigJSON(config);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const importedConfig = await importConfigJSON(file);
      setConfig(importedConfig);
    } catch (err) {
      alert("Failed to import file. " + err);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (isAuthLoading) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <Loader2 className="animate-spin text-purple-500" size={32} />
        </div>
      );
  }

  if (!user) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-sm rounded-xl shadow-2xl p-6 relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-4">Admin Access Required</h2>
              <p className="text-slate-400 mb-6 text-sm">Please sign in to manage the portal.</p>
              <button 
                onClick={handleLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogIn size={18} /> Sign in with Google
              </button>
            </div>
          </div>
        </div>
      );
  }

  if (user.email !== 'ttohumcu@gmail.com') {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-sm rounded-xl shadow-2xl p-6 relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-4">Unauthorized</h2>
              <p className="text-slate-400 mb-6 text-sm">You ({user.email}) do not have permission to manage this site.</p>
              <button 
                onClick={handleLogout}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 rounded-t-xl shrink-0">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wand2 className="text-purple-400" />
            Admin Panel
          </h2>
          <div className="flex items-center gap-4">
              <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 text-sm flex items-center gap-1 transition-colors cursor-pointer">
                  <LogOut size={16} /> Logout
              </button>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          
          <div className="mb-6 grid grid-cols-2 gap-4">
             {/* Import/Export */}
             <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/50">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Configuration</h3>
                <div className="flex gap-2">
                   <button onClick={handleExport} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs py-2 px-2 rounded-lg flex items-center justify-center gap-1 border border-slate-600 cursor-pointer">
                      <Download size={14} /> Download
                   </button>
                   <button onClick={handleImportClick} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs py-2 px-2 rounded-lg flex items-center justify-center gap-1 border border-slate-600 cursor-pointer">
                      <Upload size={14} /> Upload
                   </button>
                   <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
                </div>
             </div>

             {/* Revert */}
             <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/50">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reset</h3>
                <button onClick={onResetToPublished} className="w-full cursor-pointer bg-slate-700 hover:bg-red-900/50 hover:text-red-200 text-slate-300 text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 border border-slate-600 transition-colors">
                   <RotateCcw size={14} /> Reset to Defaults
                </button>
             </div>
          </div>

          <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Site Title</label>
              <input 
                  type="text" 
                  value={config.siteTitle || ''}
                  onChange={e => setConfig({...config, siteTitle: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="E.g., My Awesome Portal"
              />
          </div>

          {/* List of current buttons */}
          <div className="space-y-4 mb-8">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Buttons</h3>
            {config.buttons.length === 0 && (
              <p className="text-slate-500 italic">No buttons created yet.</p>
            )}
            {config.buttons.map(btn => (
              editingId === btn.id ? (
                  <div key={'edit-'+btn.id} className="bg-slate-700/30 p-4 rounded-xl border border-blue-500/50">
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Name</label>
                            <input 
                                type="text" 
                                value={editBtnForm.name || ''}
                                onChange={e => setEditBtnForm({...editBtnForm, name: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                           <div>
                                <label className="block text-xs text-slate-400 mb-1">URL</label>
                                <input 
                                    type="url" 
                                    value={editBtnForm.url || ''}
                                    onChange={e => setEditBtnForm({...editBtnForm, url: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm"
                                />
                           </div>
                           <div>
                                <label className="block text-xs text-slate-400 mb-1">Category</label>
                                <input 
                                    type="text" 
                                    value={editBtnForm.category || ''}
                                    onChange={e => setEditBtnForm({...editBtnForm, category: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm"
                                />
                           </div>
                        </div>
                        <div>
                           <label className="block text-xs text-slate-400 mb-1">Visual Description (optional)</label>
                           <textarea
                                value={editBtnForm.description || ''}
                                onChange={e => setEditBtnForm({...editBtnForm, description: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm h-16 resize-none"
                                placeholder="Describe the style for AI"
                           />
                        </div>
                        <div className="flex gap-2 pt-2 justify-end">
                            <button 
                                onClick={handleRegenerateStyle}
                                disabled={isGenerating || !editBtnForm.description}
                                className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1 px-3 py-1 bg-purple-900/30 rounded"
                            >
                                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} Regenerate Style
                            </button>
                            <div className="flex-1"></div>
                            <button onClick={() => setEditingId(null)} className="px-3 text-slate-400 hover:text-white text-sm cursor-pointer">Cancel</button>
                            <button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded flex items-center gap-1 text-sm cursor-pointer">
                                <Save size={14} /> Save
                            </button>
                        </div>
                    </div>
                  </div>
              ) : (
                <div key={btn.id} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-400 border border-slate-600 shrink-0">
                        {btn.category || 'Other'}
                    </div>
                    <div className="truncate">
                        <p className="font-medium text-white truncate">{btn.name}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[200px]">{btn.url}</p>
                    </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button 
                            onClick={() => handleEditClick(btn)}
                            className="text-slate-400 hover:text-blue-300 p-2 hover:bg-blue-400/10 rounded-lg transition-colors cursor-pointer"
                        >
                            <Edit3 size={18} />
                        </button>
                        <button 
                            onClick={() => handleDelete(btn.id)}
                            className="text-red-400 hover:text-red-300 p-2 hover:bg-red-400/10 rounded-lg transition-colors cursor-pointer"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
              )
            ))}
          </div>

          {/* Add New Button Form */}
          {isAdding ? (
            <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600 animate-fade-in">
              <h3 className="text-white font-semibold mb-4">Create New Button</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Button Name</label>
                  <input 
                    type="text" 
                    value={newBtn.name}
                    onChange={e => setNewBtn({...newBtn, name: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="e.g., My Portfolio"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="block text-xs text-slate-400 mb-1">Destination URL</label>
                    <input 
                        type="url" 
                        value={newBtn.url}
                        onChange={e => setNewBtn({...newBtn, url: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="https://..."
                    />
                    </div>
                    <div>
                    <label className="block text-xs text-slate-400 mb-1">Category</label>
                    <input 
                        type="text" 
                        value={newBtn.category}
                        onChange={e => setNewBtn({...newBtn, category: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="e.g., Social, Games"
                    />
                    </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Visual Description (AI Powered)</label>
                  <textarea 
                    value={newBtn.description}
                    onChange={e => setNewBtn({...newBtn, description: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none h-24 resize-none"
                    placeholder="Describe how the button should look. E.g., 'A neon green glowing button with a cyberpunk vibe'..."
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button 
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 text-slate-300 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleGenerateAndAdd}
                    disabled={isGenerating || !newBtn.name || !newBtn.url}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                    Generate & Add
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full py-3 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus size={20} />
              Add New Button
            </button>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminPanel;