"use client";

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  MessageSquare,
  Repeat,
  Heart,
  Share,
  Loader2,
  Calendar,
  Twitter,
  Facebook,
  CheckCircle2,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useSession, signIn } from 'next-auth/react';
import ScheduleModal from '@/components/ScheduleModal';

export default function Home() {
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("Professional");
  const [length, setLength] = useState("Medium (5-10 tweets)");
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [thread, setThread] = useState<string[]>([
    "Unlocking the Future of Content Creation with AI: How Thread Genie streamlines your Twitter presence and boosts engagement. 🧵✨ #AI #SocialMedia",
    "1/ Thread Genie uses advanced NLP to understand your topic and generate compelling, well-structured threads that capture attention."
  ]);

  useEffect(() => {
    if (session) {
      fetchAccounts();
    }
  }, [session]);

  const fetchAccounts = async () => {
    try {
      const res = await axios.get('/api/accounts');
      setAccounts(res.data.accounts);
      // Default select first account
      if (res.data.accounts.length > 0) {
        setSelectedAccounts([res.data.accounts[0].id]);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    try {
      const response = await axios.post('/api/generate', { prompt, tone, length });
      if (response.data.thread) {
        setThread(response.data.thread);
      }
    } catch (error: any) {
      console.error("Failed to generate thread:", error);
      const errorMsg = error.response?.data?.error || "Failed to generate thread.";
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePost = async () => {
    if (!session) {
      signIn();
      return;
    }
    if (thread.length === 0 || selectedAccounts.length === 0) {
      alert("Please generate a thread and select at least one account.");
      return;
    }

    setIsPosting(true);
    try {
      const response = await axios.post('/api/post', {
        thread,
        accountIds: selectedAccounts
      });
      if (response.data.success) {
        alert("Thread posted successfully to selected accounts! 🚀");
      } else {
        const errorMsg = response.data.errors?.map((e: any) => e.error).join(", ") || "Failed to post thread.";
        alert(`Posting failed: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error("Failed to post thread:", error);
      alert(error.response?.data?.error || "Failed to post thread.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleSchedule = async (scheduledAt: Date) => {
    if (!session) {
      signIn();
      return;
    }
    if (selectedAccounts.length === 0) {
      alert("Please select at least one account.");
      return;
    }

    setIsScheduling(true);
    try {
      const response = await axios.post('/api/schedule', {
        thread,
        scheduledAt,
        accountIds: selectedAccounts
      });
      if (response.data.success) {
        alert("Thread scheduled successfully! 🗓️");
        setIsModalOpen(false);
      }
    } catch (error: any) {
      console.error("Failed to schedule thread:", error);
      alert(error.response?.data?.error || "Failed to schedule thread.");
    } finally {
      setIsScheduling(false);
    }
  };

  const toggleAccount = (id: string) => {
    setSelectedAccounts(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Create Your <span className="text-gradient">Thread</span>
        </h1>
        <p className="text-slate-400">Transform your ideas into viral threads for multiple platforms.</p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Area */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl relative group">
            <label className="block text-sm font-medium text-slate-400 mb-2">AI Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What is your thread about? (e.g., 10 rules for writing better code)"
              className="w-full h-48 bg-transparent border-none focus:ring-0 text-lg text-white placeholder:text-slate-600 resize-none"
            />
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-slate-500">Press Cmd+Enter to generate</span>
              <button
                onClick={handleGenerate}
                disabled={isLoading || !prompt}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold shadow-lg shadow-violet-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isLoading ? "Generating..." : "Generate Thread"}
              </button>
            </div>
          </div>

          {/* Target Accounts Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-400">Target Accounts</label>
              <Link href="/accounts" className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
                <Settings className="w-3 h-3" />
                Manage
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {accounts.length === 0 && session && (
                <div className="space-y-3">
                  <div className="text-sm text-slate-500 italic p-4 glass-card rounded-xl border-dashed border-white/5 text-center">
                    No accounts connected yet.
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => signIn('twitter')}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs hover:bg-white/10 transition-all font-medium"
                    >
                      <Twitter className="w-3.5 h-3.5" />
                      Connect X
                    </button>
                    <button
                      onClick={() => signIn('facebook')}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs hover:bg-white/10 transition-all font-medium"
                    >
                      <Facebook className="w-3.5 h-3.5" />
                      Connect Meta
                    </button>
                  </div>
                </div>
              )}
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => toggleAccount(account.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${selectedAccounts.includes(account.id)
                    ? "bg-violet-600/10 border-violet-500/30 text-white"
                    : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-slate-800">
                      <img src={account.user.image || `https://ui-avatars.com/api/?name=${account.user.name}`} alt="" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">{account.user.name || "Connected User"}</div>
                      <div className="text-[10px] uppercase opacity-60 flex items-center gap-1">
                        {account.provider === 'twitter' ? <Twitter className="w-2.5 h-2.5" /> : <Facebook className="w-2.5 h-2.5" />}
                        {account.provider}
                      </div>
                    </div>
                  </div>
                  {selectedAccounts.includes(account.id) && (
                    <CheckCircle2 className="w-4 h-4 text-violet-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4 rounded-xl border border-white/5">
              <span className="text-xs text-slate-500 block mb-1">Tone of Voice</span>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="bg-transparent text-sm text-white border-none focus:ring-0 w-full cursor-pointer appearance-none"
              >
                <option className="bg-slate-900">Professional</option>
                <option className="bg-slate-900">Casual</option>
                <option className="bg-slate-900">Educational</option>
                <option className="bg-slate-900">Controversial</option>
              </select>
            </div>
            <div className="glass-card p-4 rounded-xl border border-white/5">
              <span className="text-xs text-slate-500 block mb-1">Thread Length</span>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="bg-transparent text-sm text-white border-none focus:ring-0 w-full cursor-pointer appearance-none"
              >
                <option className="bg-slate-900">Short (3-5 tweets)</option>
                <option className="bg-slate-900">Medium (5-10 tweets)</option>
                <option className="bg-slate-900">Long (10+ tweets)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Thread Preview</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={thread.length === 0 || isPosting || isScheduling}
                className="flex items-center gap-2 p-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-all disabled:opacity-30 active:scale-95 border border-white/5"
              >
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Schedule</span>
              </button>
              <button
                onClick={handlePost}
                disabled={thread.length === 0 || isPosting || isScheduling}
                className="flex items-center gap-2 p-2 px-4 rounded-lg bg-violet-600/20 border border-violet-500/30 hover:bg-violet-600/30 text-white transition-all disabled:opacity-30 active:scale-95"
              >
                {isPosting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-violet-400" />
                )}
                <span className="text-sm font-medium">
                  {!session ? "Connect Account" : (isPosting ? "Posting..." : "Post Now")}
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-4 relative min-h-[400px]">
            {thread.length > 1 && (
              <div className="absolute left-[27px] top-12 bottom-12 w-0.5 bg-slate-800" />
            )}

            <AnimatePresence mode="popLayout">
              {thread.map((tweet, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 relative z-10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500" />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-white text-sm">Thread Genie</span>
                        <Sparkles className="w-3 h-3 text-violet-400 fill-current" />
                      </div>
                      <span className="text-xs text-slate-500">@ThreadGenieAI · Just now</span>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-slate-200">
                    {tweet}
                  </p>

                  <div className="flex items-center justify-between pt-2 text-slate-500">
                    <button className="flex items-center gap-1.5 hover:text-violet-400 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-xs">0</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-green-400 transition-colors">
                      <Repeat className="w-4 h-4" />
                      <span className="text-xs">0</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-rose-400 transition-colors">
                      <Heart className="w-4 h-4" />
                      <span className="text-xs">0</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-sky-400 transition-colors">
                      <Share className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && thread.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-20 space-y-4 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p>Generating your viral thread...</p>
              </div>
            )}

            {!isLoading && thread.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-20 space-y-4 text-slate-600 border-2 border-dashed border-white/5 rounded-2xl">
                <MessageSquare className="w-12 h-12" />
                <p>Your generated thread will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <ScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSchedule={handleSchedule}
        isLoading={isScheduling}
      />
    </div>
  );
}
