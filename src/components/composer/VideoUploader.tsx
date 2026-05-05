"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Video, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface VideoUploaderProps {
    onUploaded: (url: string, filename: string) => void;
    onClear?: () => void;
    currentUrl?: string;
}

export function VideoUploader({ onUploaded, onClear, currentUrl }: VideoUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(
        currentUrl ? { url: currentUrl, name: currentUrl.split('/').pop() || 'video' } : null
    );

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setError('');
        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post('/api/upload/media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => {
                    if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
                },
            });

            const { url, filename } = res.data;
            setUploadedFile({ url, name: filename });
            onUploaded(url, filename);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Upload gagal. Coba lagi.');
        } finally {
            setUploading(false);
        }
    }, [onUploaded]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/*': ['.mp4', '.mov', '.webm', '.avi', '.mkv'] },
        maxFiles: 1,
        disabled: uploading,
    });

    const handleClear = () => {
        setUploadedFile(null);
        setProgress(0);
        setError('');
        onClear?.();
    };

    if (uploadedFile) {
        return (
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/30">
                <video
                    src={uploadedFile.url}
                    controls
                    className="w-full max-h-56 object-contain bg-black"
                />
                <div className="absolute top-2 right-2">
                    <button
                        onClick={handleClear}
                        className="w-8 h-8 rounded-full bg-black/70 border border-white/20 flex items-center justify-center hover:bg-red-500/80 transition-colors"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>
                <div className="px-4 py-2 flex items-center gap-2 bg-black/40">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <p className="text-xs text-slate-300 truncate">{uploadedFile.name}</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div
                {...getRootProps()}
                className={`
                    relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer
                    flex flex-col items-center justify-center gap-3 p-8 text-center min-h-[180px]
                    ${isDragActive
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-white/15 bg-white/[0.02] hover:border-violet-500/50 hover:bg-violet-500/5'
                    }
                    ${uploading ? 'pointer-events-none' : ''}
                `}
            >
                <input {...getInputProps()} />

                {uploading ? (
                    <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                        <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
                        <p className="text-sm text-slate-300">Uploading video... {progress}%</p>
                        <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                                className="h-2 rounded-full transition-all duration-300"
                                style={{
                                    width: `${progress}%`,
                                    background: 'linear-gradient(90deg, #7c3aed, #ec4899)',
                                }}
                            />
                        </div>
                    </div>
                ) : isDragActive ? (
                    <>
                        <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center">
                            <Upload className="w-7 h-7 text-violet-400" />
                        </div>
                        <p className="text-violet-400 font-medium">Drop video di sini!</p>
                    </>
                ) : (
                    <>
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                            <Video className="w-7 h-7 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-200">Drag & drop video</p>
                            <p className="text-xs text-slate-500 mt-1">atau klik untuk pilih file</p>
                            <p className="text-xs text-slate-600 mt-2">MP4, MOV, WEBM, AVI, MKV — Max 500MB</p>
                        </div>
                    </>
                )}
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
