"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, X, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface ImageUploaderProps {
    onUploaded: (url: string) => void;
    onClear?: () => void;
    currentUrl?: string;
    label?: string;
}

export function ImageUploader({ onUploaded, onClear, currentUrl, label }: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState<string | null>(currentUrl || null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setError('');
        setUploading(true);

        // Show local preview immediately
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post('/api/upload/media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onUploaded(res.data.url);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Upload gagal.');
            setPreview(null);
        } finally {
            setUploading(false);
        }
    }, [onUploaded]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
        maxFiles: 1,
        disabled: uploading,
    });

    const handleClear = () => {
        setPreview(null);
        setError('');
        onClear?.();
    };

    if (preview) {
        return (
            <div className="relative rounded-2xl overflow-hidden border border-white/10">
                <img src={preview} alt="Preview" className="w-full max-h-56 object-cover" />
                <div className="absolute top-2 right-2">
                    <button
                        onClick={handleClear}
                        className="w-8 h-8 rounded-full bg-black/70 border border-white/20 flex items-center justify-center hover:bg-red-500/80 transition-colors"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>
                {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div>
            <div
                {...getRootProps()}
                className={`
                    rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer
                    flex flex-col items-center justify-center gap-3 p-6 text-center min-h-[140px]
                    ${isDragActive
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-white/15 bg-white/[0.02] hover:border-violet-500/50 hover:bg-violet-500/5'
                    }
                `}
            >
                <input {...getInputProps()} />
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                    {isDragActive ? (
                        <Upload className="w-6 h-6 text-violet-400" />
                    ) : (
                        <ImageIcon className="w-6 h-6 text-slate-400" />
                    )}
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-200">{label || 'Upload Gambar'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">JPG, PNG, GIF, WEBP — Max 10MB</p>
                </div>
            </div>
            {error && (
                <div className="mt-2 flex items-center gap-2 text-red-400 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {error}
                </div>
            )}
        </div>
    );
}
