import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Send, Image as ImageIcon, Sparkles, Loader2, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/UserContext';
import { ensureBucketExists } from '../services/storageService';

interface NewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: any;
}

export const NewPostModal: React.FC<NewPostModalProps> = ({ isOpen, onClose, t }) => {
  const { userData } = useUser();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userData?.id) return;

    setIsUploading(true);
    setError('');
    try {
      await ensureBucketExists('post-images');
      const fileExt = file.name.split('.').pop();
      const filePath = `${userData.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);

      setImageUrl(urlData.publicUrl);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError('Erro no upload: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim() && !imageUrl) return;
    if (!userData?.id) return;

    setIsSaving(true);
    try {
      const { error: saveError } = await supabase
        .from('posts')
        .insert([{
          user_id: userData.id,
          content: content,
          caption: content, // Backward compatibility
          image_url: imageUrl || null,
          likes_count: 0,
          comments_count: 0
        }]);

      if (saveError) throw saveError;

      setContent('');
      setImageUrl('');
      onClose();
    } catch (err: any) {
      console.error('Save error:', err);
      setError('Erro ao salvar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />
          
          <motion.div 
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            className="relative w-full max-w-xl bg-zenit-surface-1 rounded-t-[3rem] sm:rounded-[4rem] border-t sm:border border-zenit-border-primary overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
          >
            <div className="w-12 h-1.5 bg-zenit-border-primary rounded-full mx-auto my-4 opacity-20" />
            
            <header className="px-8 pb-4 flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-black uppercase tracking-tighter text-white italic leading-none">Nova <span className="text-zenit-accent font-black">Transmissão</span></h3>
                <p className="text-[9px] text-zenit-text-tertiary font-bold uppercase tracking-[0.4em] mt-1">Sincronização Nexus</p>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 rounded-xl bg-zenit-surface-2 flex items-center justify-center text-zenit-text-tertiary hover:text-zenit-text-primary transition-all border border-zenit-border-primary"
              >
                <X size={18} />
              </button>
            </header>

            <div className="p-8 space-y-8 overflow-y-auto scrollbar-hide flex-1">
              {/* Media Preview Area */}
              <div className="relative aspect-video rounded-[2.5rem] bg-zenit-surface-2 border border-zenit-border-primary border-dashed flex flex-col items-center justify-center overflow-hidden group">
                {imageUrl ? (
                  <>
                    <img src={imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button 
                      onClick={() => setImageUrl('')}
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-zenit-border-primary flex items-center justify-center text-white"
                    >
                      <X size={20} />
                    </button>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center space-y-4 group">
                    <div className="w-16 h-16 rounded-3xl bg-zenit-accent/10 flex items-center justify-center text-zenit-accent group-hover:scale-110 transition-transform shadow-lg border border-zenit-accent/20">
                      {isUploading ? <Loader2 size={32} className="animate-spin" /> : <Camera size={32} />}
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zenit-text-primary">Anexar Captura</p>
                      <p className="text-[8px] text-zenit-text-tertiary uppercase tracking-widest mt-1">Hardware Visual Sugerido</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
                  </label>
                )}
              </div>

              {/* Caption Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.4em]">Legenda do Protocolo</label>
                  <Sparkles size={12} className="text-zenit-accent animate-pulse" />
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Descreva seu progresso neural..."
                  className="w-full bg-zenit-surface-2 rounded-[2rem] p-6 text-sm text-zenit-text-primary focus:outline-none border border-zenit-border-primary focus:border-zenit-accent/30 transition-all min-h-[120px] resize-none"
                />
              </div>

              {/* Optional Link */}
              <div className="space-y-3">
                <label className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.4em] ml-2">Neural Link (Opcional)</label>
                <div className="relative">
                  <LinkIcon size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-zenit-accent opacity-40" />
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="URL de imagem externa..."
                    className="w-full bg-zenit-surface-2 rounded-full pl-14 pr-8 py-5 text-sm text-zenit-text-primary focus:outline-none border border-zenit-border-primary"
                  />
                </div>
              </div>

              {error && (
                <p className="text-[10px] text-zenit-accent font-bold uppercase text-center tracking-widest">{error}</p>
              )}
            </div>

            <div className="p-8 pb-10 bg-zenit-surface-2/50 border-t border-zenit-border-primary">
              <button
                onClick={handleSave}
                disabled={isSaving || isUploading || (!content.trim() && !imageUrl)}
                className="w-full py-6 rounded-full bg-gradient-to-r from-zenit-accent to-zenit-crimson text-white text-[12px] font-bold uppercase tracking-[0.5em] flex items-center justify-center space-x-4 shadow-[0_0_40px_var(--accent-glow)] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                <span>Transmitir no Nexus</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
