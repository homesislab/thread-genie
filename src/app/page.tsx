"use client";

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { Sparkles, Send, MessageSquare, Repeat, Heart, Share, Loader2, Calendar, Twitter, Facebook, CheckCircle2, Settings, ImageIcon, X, Grid, Video, Zap, Plus, Youtube, BarChart3, Clapperboard, CalendarDays, TrendingUp, FileText } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useSession, signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import ScheduleModal from '@/components/ScheduleModal';
import AnalyticsStats from '@/components/AnalyticsStats';

const PLATFORM_ICONS: any = { twitter: Twitter, facebook: Facebook, youtube: Youtube };

function HomeContent() {
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("Professional");
  const [length, setLength] = useState("Medium (5-10 tweets)");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generateImage, setGenerateImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [thread, setThread] = useState<any[]>([
    { text: "Unlocking the Future of Content Creation with AI: How Thread Genie streamlines your social presence and boosts engagement. 🧵✨ #AI #SocialMedia", imageUrl: null },
    { text: "1/ Thread Genie uses advanced AI to understand your topic and generate compelling, well-structured threads that capture attention.", imageUrl: null }
  ]);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isFetchingGallery, setIsFetchingGallery] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [selectionTarget, setSelectionTarget] = useState<number | 'global' | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const searchParams = useSearchParams();

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('video/')) { alert('Please select a valid video file.'); return; }
    setIsUploadingVideo(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post('/api/upload/video', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) { setGeneratedImageUrl(res.data.url); setIsVideo(true); }
    } catch (err: any) { alert(err.response?.data?.error || 'Failed to upload video'); }
    finally { setIsUploadingVideo(false); }
  };

  const fetchGallery = async () => {
    setIsFetchingGallery(true);
    try { const res = await axios.get('/api/gallery'); setGalleryImages(res.data.images || []); }
    catch { console.error('Failed to fetch gallery'); } finally { setIsFetchingGallery(false); }
  };

  useEffect(() => {
    if (session) {
      fetchAccounts(); fetchGallery();
      const reuseId = searchParams.get('id');
      if (reuseId) loadThreadForReuse(reuseId);
    }
  }, [session, searchParams]);

  const loadThreadForReuse = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/threads');
      const found = res.data.threads.find((t: any) => t.id === id);
      if (found) { setThread(JSON.parse(found.content)); setGeneratedImageUrl(found.imageUrl); setCurrentThreadId(found.id); setPrompt("Reusing previous thread..."); }
    } catch { console.error('Failed to load thread'); } finally { setIsLoading(false); }
  };

  const fetchAccounts = async () => {
    try {
      const res = await axios.get('/api/channels');
      setAccounts(res.data.channels || []);
      if (res.data.channels?.length > 0) setSelectedAccounts([res.data.channels[0].id]);
    } catch { console.error('Failed to fetch channels'); }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true); setGeneratedImageUrl(null);
    try {
      const res = await axios.post('/api/generate', { prompt, tone, length });
      if (res.data.thread) {
        setThread(res.data.thread);
        if (res.data.threadId) setCurrentThreadId(res.data.threadId);
        if (generateImage) handleGenerateImage(prompt, res.data.threadId);
      }
    } catch (err: any) { alert(err.response?.data?.error || "Failed to generate thread."); }
    finally { setIsLoading(false); }
  };

  const handleGenerateImage = async (imagePrompt: string, threadId?: string) => {
    setIsGeneratingImage(true);
    try {
      const res = await axios.post('/api/generate/image', { prompt: imagePrompt, threadId: threadId || currentThreadId });
      if (res.data.imageUrl) setGeneratedImageUrl(res.data.imageUrl);
    } catch { } finally { setIsGeneratingImage(false); }
  };

  const handlePost = async () => {
    if (!session) { signIn(); return; }
    if (thread.length === 0 || selectedAccounts.length === 0) { alert("Please generate a thread and select at least one account."); return; }
    setIsPosting(true);
    try {
      const res = await axios.post('/api/posts', { title: thread[0]?.text?.split('\n')[0] || prompt, thread, channelIds: selectedAccounts, mediaUrl: generatedImageUrl || undefined, mediaType: isVideo ? 'video' : (generatedImageUrl ? 'image' : 'text'), publishNow: true });
      if (res.data.success) alert("Thread posted successfully! 🚀");
      else alert("Posting failed. Check System Logs.");
    } catch (err: any) { alert(err.response?.data?.error || "Failed to post thread."); }
    finally { setIsPosting(false); }
  };

  const handleSchedule = async (scheduledAt: Date) => {
    if (!session) { signIn(); return; }
    if (selectedAccounts.length === 0) { alert("Please select at least one account."); return; }
    setIsScheduling(true);
    try {
      const res = await axios.post('/api/posts', { title: thread[0]?.text?.split('\n')[0] || prompt, thread, scheduledAt, channelIds: selectedAccounts, mediaUrl: generatedImageUrl || undefined, mediaType: isVideo ? 'video' : (generatedImageUrl ? 'image' : 'text'), publishNow: false });
      if (res.data.success) { alert("Thread scheduled! 🗓️"); setIsModalOpen(false); }
    } catch (err: any) { alert(err.response?.data?.error || "Failed to schedule thread."); }
    finally { setIsScheduling(false); }
  };

  const toggleAccount = (id: string) => setSelectedAccounts(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 fade-in-up">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)' }}>
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Outfit,sans-serif' }}>
                Thread<span className="text-gradient">Genie</span>
              </h1>
              <p className="text-xs text-slate-500">Omni-Channel Publisher</p>
            </div>
          </div>
          {/* Quick nav */}
          <div className="flex items-center gap-2">
            <Link href="/composer" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)' }}>
              <Zap className="w-3.5 h-3.5" />New Post
            </Link>
            <Link href="/calendar" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 bg-white/5 hover:bg-white/10 border border-white/8 transition-all">
              <CalendarDays className="w-3.5 h-3.5" />Calendar
            </Link>
            <Link href="/clip-library" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 bg-white/5 hover:bg-white/10 border border-white/8 transition-all">
              <Clapperboard className="w-3.5 h-3.5" />Clips
            </Link>
          </div>
        </div>
      </div>

      {/* Analytics Stats */}
      <AnalyticsStats />

      {/* Thread Composer */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-lg font-bold text-slate-200">🧵 Thread Composer</h2>
          <span className="text-xs text-slate-600 border border-white/8 rounded-full px-2 py-0.5">AI powered</span>
        </div>
        <p className="text-sm text-slate-500">Transform your ideas into viral content across all platforms</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* LEFT: Composer */}
        <div className="space-y-4">
          {/* AI Prompt */}
          <div className="glass-card rounded-2xl p-5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3 block">AI Prompt</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
              placeholder="What's your thread about? (e.g., 10 habits of highly successful people)"
              className="w-full h-36 bg-transparent border-none focus:ring-0 text-sm text-slate-200 placeholder:text-slate-700 resize-none leading-relaxed"
            />
            {/* Toolbar */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <div className="flex items-center gap-2">
                <button onClick={() => setGenerateImage(!generateImage)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${generateImage ? 'bg-violet-500/15 border border-violet-500/30 text-violet-300' : 'bg-white/5 border border-white/5 text-slate-500 hover:text-slate-300'}`}>
                  <ImageIcon className="w-3.5 h-3.5" />Image
                </button>
                <button onClick={() => { fetchGallery(); setIsGalleryOpen(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/5 text-slate-500 hover:text-slate-300 transition-all">
                  <Grid className="w-3.5 h-3.5" />Gallery
                </button>
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/5 text-slate-500 hover:text-slate-300 transition-all cursor-pointer">
                  {isUploadingVideo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
                  {isUploadingVideo ? 'Uploading…' : 'Video'}
                  <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} disabled={isUploadingVideo} />
                </label>
              </div>
              <button onClick={handleGenerate} disabled={isLoading || !prompt}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 4px 20px -4px rgba(124,58,237,0.5),0 1px 0 rgba(255,255,255,0.1) inset' }}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isLoading ? 'Generating…' : 'Generate'}
              </button>
            </div>
          </div>

          {/* Options row */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Tone of Voice', value: tone, onChange: setTone, options: ['Professional', 'Casual', 'Educational', 'Controversial', 'Humorous'] },
              { label: 'Thread Length', value: length, onChange: setLength, options: ['Short (3-5 tweets)', 'Medium (5-10 tweets)', 'Long (10+ tweets)'] }
            ].map(({ label, value, onChange, options }) => (
              <div key={label} className="glass-card rounded-xl px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">{label}</p>
                <select value={value} onChange={e => onChange(e.target.value)}
                  className="bg-transparent text-sm text-slate-200 border-none focus:ring-0 w-full cursor-pointer appearance-none font-medium">
                  {options.map(o => <option key={o} className="bg-slate-900">{o}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* Target Accounts */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Target Accounts</p>
              <Link href="/accounts" className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                <Settings className="w-3 h-3" />Manage
              </Link>
            </div>
            {accounts.length === 0 && session ? (
              <div className="text-center py-6">
                <p className="text-sm text-slate-600 mb-3">No accounts connected yet</p>
                <div className="flex gap-2 justify-center">
                  <button onClick={() => signIn('twitter')} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-white text-xs hover:bg-white/10 transition-all">
                    <Twitter className="w-3.5 h-3.5" />X (Twitter)
                  </button>
                  <button onClick={() => signIn('facebook')} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-white text-xs hover:bg-white/10 transition-all">
                    <Facebook className="w-3.5 h-3.5" />Facebook
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {accounts.map(account => {
                  const PIcon = PLATFORM_ICONS[account.provider] || Twitter;
                  const selected = selectedAccounts.includes(account.id);
                  return (
                    <button key={account.id} onClick={() => toggleAccount(account.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${selected ? 'bg-violet-500/10 border-violet-500/25 glow-ring' : 'bg-white/3 border-white/5 hover:bg-white/6 hover:border-white/10'}`}>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={account.avatarUrl || `https://ui-avatars.com/api/?name=${account.displayName}&background=7c3aed&color=fff`} className="w-8 h-8 rounded-full" alt="" />
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#0a0d12' }}>
                            <PIcon className="w-2.5 h-2.5 text-violet-400" />
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-slate-200">{account.displayName || 'Connected'}</p>
                          <p className="text-[10px] text-slate-600 capitalize">{account.provider}</p>
                        </div>
                      </div>
                      {selected && <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Preview */}
        <div className="space-y-4">
          {/* Preview Header */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-300">Thread Preview</p>
            <div className="flex gap-2">
              <button onClick={() => setIsModalOpen(true)} disabled={thread.length === 0 || isPosting}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white border border-white/8 hover:border-white/15 bg-white/3 hover:bg-white/6 transition-all disabled:opacity-30">
                <Calendar className="w-3.5 h-3.5" />Schedule
              </button>
              <button onClick={handlePost} disabled={thread.length === 0 || isPosting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-40 hover:-translate-y-0.5 active:translate-y-0"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 4px 16px -4px rgba(124,58,237,0.45),0 1px 0 rgba(255,255,255,0.1) inset' }}>
                {isPosting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {isPosting ? 'Posting…' : 'Post Now'}
              </button>
            </div>
          </div>

          {/* Tweet Cards */}
          <div className="space-y-3 relative">
            {thread.length > 1 && (
              <div className="absolute left-[19px] top-14 bottom-14 w-px thread-connector" />
            )}

            {isGeneratingImage && (
              <div className="aspect-video rounded-2xl flex items-center justify-center glass-card shimmer">
                <div className="text-center text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-500" />
                  <p className="text-xs">Generating image…</p>
                </div>
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {thread.map((tweet, index) => (
                <motion.div key={index}
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ delay: index * 0.06, duration: 0.3 }}
                  className="tweet-card rounded-2xl p-4 relative z-10">
                  {/* Author */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-9 h-9 rounded-full flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)' }} />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-white">Thread Genie</span>
                        <Sparkles className="w-3 h-3 text-violet-400 fill-current" />
                      </div>
                      <span className="text-[10px] text-slate-600">@ThreadGenieAI · Just now</span>
                    </div>
                    {index === 0 && thread.length > 1 && (
                      <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400">1/{thread.length}</span>
                    )}
                  </div>

                  {/* Text */}
                  <p className="text-sm leading-relaxed text-slate-300 mb-3">
                    {typeof tweet === 'string' ? tweet : tweet.text}
                  </p>

                  {/* Media */}
                  {(tweet.imageUrl || (index === 0 && generatedImageUrl)) && (
                    <div className="relative group rounded-xl overflow-hidden border border-white/8 mb-3">
                      {isVideo && index === 0
                        ? <video src={generatedImageUrl!} controls className="w-full aspect-video bg-black" />
                        : <img src={tweet.imageUrl || generatedImageUrl!} alt="" className="w-full aspect-video object-cover" />
                      }
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={() => {
                          const t = [...thread];
                          if (typeof t[index] === 'string') t[index] = { text: t[index], imageUrl: null };
                          t[index].imageUrl = null;
                          if (index === 0) { setGeneratedImageUrl(null); setIsVideo(false); }
                          setThread(t);
                        }} className="p-2 rounded-full bg-red-600/90 backdrop-blur text-white"><X size={12} /></button>
                        {!(isVideo && index === 0) && (
                          <button onClick={() => { setSelectionTarget(index); fetchGallery(); setIsGalleryOpen(true); }}
                            className="p-2 rounded-full bg-violet-600/90 backdrop-blur text-white"><Repeat size={12} /></button>
                        )}
                      </div>
                    </div>
                  )}

                  {!(tweet.imageUrl || (index === 0 && generatedImageUrl)) && !isGeneratingImage && (
                    <button onClick={() => { setSelectionTarget(index); fetchGallery(); setIsGalleryOpen(true); }}
                      className="w-full py-3 rounded-xl border border-dashed border-white/8 hover:border-violet-500/30 hover:bg-violet-500/5 text-slate-600 hover:text-violet-400 flex items-center justify-center gap-2 transition-all mb-3 text-xs">
                      <Plus size={14} />Add Image
                    </button>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 text-slate-600">
                    {[{ icon: MessageSquare, color: 'hover:text-violet-400' }, { icon: Repeat, color: 'hover:text-emerald-400' }, { icon: Heart, color: 'hover:text-rose-400' }, { icon: Share, color: 'hover:text-sky-400' }]
                      .map(({ icon: Icon, color }, i) => (
                        <button key={i} className={`flex items-center gap-1 transition-colors ${color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {i < 3 && <span className="text-[10px]">0</span>}
                        </button>
                      ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && thread.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-slate-600">
                <div className="relative mb-4">
                  <div className="w-12 h-12 rounded-full border-t-2 border-violet-500 animate-spin" />
                  <Sparkles className="w-5 h-5 absolute inset-0 m-auto text-violet-500/60" />
                </div>
                <p className="text-sm">Generating your viral thread…</p>
              </div>
            )}

            {!isLoading && thread.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-white/5 rounded-2xl text-slate-700">
                <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">Your generated thread will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ScheduleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSchedule={handleSchedule} isLoading={isScheduling} />

      {/* Gallery Modal */}
      <AnimatePresence>
        {isGalleryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsGalleryOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-3xl max-h-[80vh] glass rounded-3xl border border-white/10 overflow-hidden flex flex-col shadow-2xl">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Media Gallery</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Select a previously generated image or video</p>
                </div>
                <button onClick={() => setIsGalleryOpen(false)} className="p-2 rounded-xl hover:bg-white/8 text-slate-400 transition-all"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {isFetchingGallery && <div className="col-span-full py-16 flex flex-col items-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin mb-2" /><p className="text-sm">Loading…</p></div>}
                {!isFetchingGallery && galleryImages.length === 0 && (
                  <div className="col-span-full py-16 flex flex-col items-center text-slate-600">
                    <ImageIcon className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-sm">No images yet</p>
                  </div>
                )}
                {galleryImages.map(img => (
                  <button key={img.id} onClick={async () => {
                    if (typeof selectionTarget === 'number') {
                      const t = [...thread]; t[selectionTarget].imageUrl = img.url; setThread(t);
                      if (selectionTarget === 0) setIsVideo(img.type === 'video'); // update video state if it's the first tweet
                      if (currentThreadId) await axios.post('/api/threads/update', { id: currentThreadId, content: JSON.stringify(t) }).catch(() => {});
                    } else {
                      setGeneratedImageUrl(img.url);
                      setIsVideo(img.type === 'video');
                      if (currentThreadId) await axios.post('/api/threads/update', { id: currentThreadId, imageUrl: img.url }).catch(() => {});
                    }
                    setIsGalleryOpen(false); setSelectionTarget(null);
                  }} className="relative aspect-square rounded-xl overflow-hidden group border border-white/5 hover:border-violet-500/40 transition-all active:scale-95 bg-black/50">
                    {img.type === 'video' ? (
                      <video src={img.url} className="w-full h-full object-cover transition-transform group-hover:scale-105" muted loop autoPlay playsInline />
                    ) : (
                      <img src={img.url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs font-bold text-white bg-violet-600/80 px-3 py-1 rounded-full backdrop-blur">Select</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen text-slate-500"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <HomeContent />
    </Suspense>
  );
}
