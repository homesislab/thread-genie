"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import {
    Settings,
    Save,
    Loader2,
    Key,
    Bot,
    CheckCircle,
    Eye,
    EyeOff
} from 'lucide-react';
import axios from 'axios';
import { redirect } from 'next/navigation';

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [provider, setProvider] = useState('GEMINI');
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState('');
    const [imageModel, setImageModel] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const TEXT_MODELS = {
        GEMINI: [
            { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Preview)' },
            { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Preview)' },
            { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Stable)' },
            { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Stable)' },
            { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
        ],
        OPENAI: [
            { id: 'gpt-4o', name: 'GPT-4o' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
            { id: 'o1', name: 'OpenAI o1' },
            { id: 'o3-mini', name: 'OpenAI o3-mini' },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        ]
    };

    const IMAGE_MODELS = {
        GEMINI: [
            { id: 'gemini-3-pro-image-preview', name: 'Nano Banana Pro (Gemini 3)' },
            { id: 'gemini-2.5-flash-image', name: 'Nano Banana Flash (Legacy)' },
            { id: 'gemini-2.0-flash-exp-image-generation', name: 'Gemini 2.0 Image (Exp)' },
        ],
        OPENAI: [
            { id: 'dall-e-3', name: 'DALL-E 3 (HD)' },
            { id: 'dall-e-2', name: 'DALL-E 2 (Standard)' },
        ]
    };

    useEffect(() => {
        if (status === "unauthenticated") redirect('/login');
    }, [status]);

    useEffect(() => {
        if (session) {
            fetchSettings();
        }
    }, [session]);

    const fetchSettings = async () => {
        try {
            const res = await axios.get('/api/settings/ai');
            const data = res.data.settings;
            if (data) {
                setProvider(data.provider || 'GEMINI');
                setApiKey(data.apiKey || '');
                setModel(data.model || '');
                setImageModel(data.imageModel || '');
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMessage('');

        try {
            await axios.post('/api/settings/ai', {
                provider,
                apiKey,
                model,
                imageModel
            });
            setSuccessMessage('Settings saved successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (status === "loading" || loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-6 pb-20">
            <div>
                <h1 className="text-3xl font-bold mb-2">Settings</h1>
                <p className="text-slate-400">Configure your AI preferences and API keys</p>
            </div>

            <div className="glass border border-white/10 rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                    <Bot className="w-6 h-6 text-violet-400" />
                    <h2 className="text-xl font-semibold">AI Configuration</h2>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">AI Provider</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setProvider('GEMINI');
                                    setModel('gemini-1.5-flash');
                                    setImageModel('gemini-2.5-flash-image');
                                }}
                                className={`p-4 rounded-xl border transition-all text-left ${provider === 'GEMINI'
                                    ? 'bg-violet-500/20 border-violet-500 text-white'
                                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                    }`}
                            >
                                <div className="font-semibold mb-1">Google Gemini</div>
                                <div className="text-xs opacity-70">Fast, reliable, and cost-effective</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setProvider('OPENAI');
                                    setModel('gpt-4o');
                                    setImageModel('dall-e-3');
                                }}
                                className={`p-4 rounded-xl border transition-all text-left ${provider === 'OPENAI'
                                    ? 'bg-violet-500/20 border-violet-500 text-white'
                                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                    }`}
                            >
                                <div className="font-semibold mb-1">OpenAI GPT-4</div>
                                <div className="text-xs opacity-70">Industry standard for quality</div>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 flex items-center justify-between">
                            <span>API Key</span>
                            <a
                                href={provider === 'GEMINI' ? "https://aistudio.google.com/app/apikey" : "https://platform.openai.com/api-keys"}
                                target="_blank"
                                rel="noreferrer"
                                className="text-violet-400 hover:text-violet-300 text-xs"
                            >
                                Get {provider === 'GEMINI' ? 'Gemini' : 'OpenAI'} API Key
                            </a>
                        </label>
                        <div className="relative">
                            <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type={showKey ? "text" : "password"}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder={`Enter your ${provider === 'GEMINI' ? 'Gemini' : 'OpenAI'} API Key`}
                                className="w-full pl-10 pr-10 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-1 focus:ring-violet-500 outline-none text-sm font-mono"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500">
                            Your API key is stored securely and used only for your requests.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Text Generation Model</label>
                            <select
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-1 focus:ring-violet-500 outline-none text-sm appearance-none cursor-pointer"
                            >
                                {(TEXT_MODELS as any)[provider].map((m: any) => (
                                    <option key={m.id} value={m.id} className="bg-slate-900">{m.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Image Generation Model</label>
                            <select
                                value={imageModel}
                                onChange={(e) => setImageModel(e.target.value)}
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-1 focus:ring-violet-500 outline-none text-sm appearance-none cursor-pointer"
                            >
                                {(IMAGE_MODELS as any)[provider].map((m: any) => (
                                    <option key={m.id} value={m.id} className="bg-slate-900">{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center gap-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Configuration
                        </button>

                        {successMessage && (
                            <div className="flex items-center gap-2 text-green-400 text-sm animate-in fade-in slide-in-from-left-2">
                                <CheckCircle className="w-4 h-4" />
                                {successMessage}
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
