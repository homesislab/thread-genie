"use client";

import React, { useState, useEffect } from 'react';
import {
    Image as ImageIcon,
    Trash2,
    Download,
    Share,
    Loader2,
    Plus,
    ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function GalleryPage() {
    const { data: session } = useSession();
    const [images, setImages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (session) {
            fetchImages();
        }
    }, [session]);

    const fetchImages = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get('/api/gallery');
            setImages(res.data.images || []);
        } catch (error) {
            console.error('Failed to fetch gallery:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert('File too large (max 10MB)');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await axios.post('/api/gallery/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await fetchImages();
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this image?')) return;

        try {
            await axios.delete('/api/gallery', { data: { id } });
            setImages(images.filter(img => img.id !== id));
            if (selectedImage?.id === id) setSelectedImage(null);
        } catch (error) {
            console.error('Failed to delete image:', error);
            alert('Failed to delete image');
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <ImageIcon className="text-violet-500" />
                        Your <span className="text-gradient">Gallery</span>
                    </h1>
                    <p className="text-slate-400">Manage and download your AI-generated masterpieces.</p>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUpload}
                    accept="image/*"
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isLoading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold transition-all shadow-lg shadow-violet-500/20 active:scale-95"
                >
                    {isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Plus className="w-5 h-5" />
                    )}
                    {isUploading ? 'Uploading...' : 'Upload Image'}
                </button>
            </header>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-40 space-y-4 text-slate-500">
                    <Loader2 className="w-12 h-12 animate-spin text-violet-500" />
                    <p className="text-lg">Curating your collection...</p>
                </div>
            ) : images.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 space-y-6 text-center glass-card rounded-3xl border-dashed border-white/5">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-slate-600" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white">No images yet</h3>
                        <p className="text-slate-400 max-w-xs mx-auto">Generate some threads with images to see your collection grow!</p>
                    </div>
                    <Link
                        href="/"
                        className="text-violet-400 font-medium hover:text-violet-300 transition-colors"
                    >
                        Start generating →
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {images.map((img, index) => (
                        <motion.div
                            key={img.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => setSelectedImage(img)}
                            className="group relative aspect-square rounded-2xl overflow-hidden glass-card border border-white/10 cursor-pointer hover:border-violet-500/50 transition-all shadow-xl"
                        >
                            <img
                                src={img.url}
                                alt={img.prompt || "Generated content"}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(img.url, '_blank');
                                            }}
                                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all"
                                            title="View Full Size"
                                        >
                                            <Share className="w-4 h-4" />
                                        </button>
                                        <a
                                            href={img.url}
                                            download={`thread-genie-${img.id}.png`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-all"
                                            title="Download"
                                        >
                                            <Download className="w-4 h-4" />
                                        </a>
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(img.id, e)}
                                        className="p-2 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white transition-all"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Lightbox / Detail Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedImage(null)}
                            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-5xl overflow-hidden glass-card rounded-3xl border border-white/10 shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
                        >
                            <div className="md:w-2/3 bg-black flex items-center justify-center relative overflow-hidden group">
                                <img
                                    src={selectedImage.url}
                                    alt={selectedImage.prompt}
                                    className="max-w-full max-h-full object-contain"
                                />
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute top-4 left-4 p-2 rounded-xl bg-black/40 hover:bg-black/60 text-white transition-all"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="md:w-1/3 p-8 flex flex-col justify-between space-y-8 bg-slate-900/50">
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Prompt</h3>
                                        <p className="text-slate-200 leading-relaxed italic">
                                            "{selectedImage.prompt || "No prompt available"}"
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Provider</h4>
                                            <div className="text-sm font-medium text-white flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-violet-500" />
                                                {selectedImage.provider || 'AI'}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Created</h4>
                                            <div className="text-sm font-medium text-white">
                                                {new Date(selectedImage.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <a
                                        href={selectedImage.url}
                                        download
                                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold flex items-center justify-center gap-3 shadow-lg shadow-violet-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        <Download className="w-5 h-5" />
                                        Download Image
                                    </a>
                                    <button
                                        onClick={(e) => handleDelete(selectedImage.id, e as any)}
                                        className="w-full py-3 rounded-2xl bg-rose-600/10 border border-rose-500/20 text-rose-400 font-medium hover:bg-rose-600 hover:text-white transition-all"
                                    >
                                        Delete from Gallery
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
