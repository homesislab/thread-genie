import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Trash2, ArrowLeft } from 'lucide-react';

export default function DeleteDataPage() {
    return (
        <div className="min-h-screen bg-[#020617] py-16 px-4">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-300" />
                    </Link>
                    <h1 className="text-3xl font-bold">Data Deletion Instructions</h1>
                </div>

                <div className="glass border border-white/10 rounded-3xl p-8 space-y-6">
                    <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                        <div className="w-12 h-12 bg-red-500/10 flex items-center justify-center rounded-xl">
                            <ShieldAlert className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Your Data, Your Control</h2>
                            <p className="text-slate-400 text-sm">How to remove your data from Thread Genie</p>
                        </div>
                    </div>

                    <div className="space-y-4 text-slate-300">
                        <p>
                            Thread Genie respects your privacy. If you have connected your Facebook or Google account to our application and wish to completely remove your data, you can do so easily by following these steps:
                        </p>

                        <h3 className="text-lg font-medium text-white mt-6">Method 1: Disconnect via Application Settings (Recommended)</h3>
                        <ol className="list-decimal pl-5 space-y-2 text-slate-400">
                            <li>Log in to your <strong>Thread Genie</strong> account.</li>
                            <li>Navigate to the <Link href="/accounts" className="text-violet-400 hover:text-violet-300">Channels</Link> page.</li>
                            <li>Find the connected Facebook Page or YouTube Channel you want to remove.</li>
                            <li>Click the <strong>Trash/Disconnect</strong> button next to the account name.</li>
                            <li>Confirm the action. This will immediately delete the access tokens and metadata associated with that channel from our servers.</li>
                        </ol>

                        <h3 className="text-lg font-medium text-white mt-6">Method 2: Remove Access via Facebook</h3>
                        <p>If you prefer to remove access directly from Facebook, you can do so from your Facebook Settings:</p>
                        <ol className="list-decimal pl-5 space-y-2 text-slate-400">
                            <li>Go to your Facebook Account <strong>Settings & Privacy</strong> &gt; <strong>Settings</strong>.</li>
                            <li>Look for <strong>Apps and Websites</strong>.</li>
                            <li>Find <strong>Thread Genie</strong> in the list of active apps.</li>
                            <li>Click <strong>Remove</strong> to revoke our access to your data.</li>
                        </ol>

                        <h3 className="text-lg font-medium text-white mt-6">Complete Account Deletion</h3>
                        <p>
                            If you wish to completely delete your Thread Genie account and all associated data (including drafts, scheduled posts, and connected channels), please contact our support team at <strong>admin@example.com</strong> (or your configured admin email) with the subject "Account Deletion Request". We will process your request within 48 hours.
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 mt-8 flex items-start gap-4">
                        <Trash2 className="w-6 h-6 text-slate-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-400 leading-relaxed">
                            <strong>Note:</strong> Deleting your data or revoking access means Thread Genie will no longer be able to publish content on your behalf. Any currently scheduled posts will fail to publish.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
