import React, { useState } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import paymentApi from '../services/paymentApi';

const FEATURES = [
    { name: 'Projects Tracked', free: '3 Projects', pro: '15 Projects', enterprise: 'Unlimited' },
    { name: 'AI Chat Messages', free: '25 / day', pro: '200 / day', enterprise: 'Unlimited' },
    { name: 'AI Code Reviews', free: '3 / day', pro: '20 / day', enterprise: 'Unlimited' },
    { name: 'AI Project Progress Analysis', free: '2 / day', pro: '15 / day', enterprise: 'Unlimited' },
    { name: 'AI Productivity Insights', free: '3 / day', pro: '30 / day', enterprise: 'Unlimited' },
    { name: 'PDF Growth Reports', free: '1 / month', pro: 'Unlimited', enterprise: 'Unlimited' },
    { name: 'README Generation', free: '1 / day', pro: '10 / day', enterprise: 'Unlimited' },
    { name: 'Resume AI Summary', free: '❌ Basic', pro: '✅ AI Powered', enterprise: '✅ AI Powered' },
    { name: 'Showcase Posts', free: '2 Posts', pro: 'Unlimited', enterprise: 'Unlimited' },
    { name: 'Learning Logs', free: '50 / month', pro: 'Unlimited', enterprise: 'Unlimited' },
];

const Pricing = () => {
    const { tier, isPro } = useSubscription();
    const [loading, setLoading] = useState(false);

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const data = await paymentApi.createCheckoutSession({
                countryCode: 'IN', // Default to INR, server auto-detects or falls back to USD
            });
            if (data?.data?.checkoutUrl) {
                window.location.href = data.data.checkoutUrl;
            }
        } catch (error) {
            console.error('Failed to initiate checkout:', error);
            alert('Failed to launch Stripe checkout. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleManageBilling = async () => {
        setLoading(true);
        try {
            const data = await paymentApi.createPortalSession();
            if (data?.data?.portalUrl) {
                window.location.href = data.data.portalUrl;
            }
        } catch (error) {
            console.error('Failed to launch portal:', error);
            alert('Failed to launch customer portal.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-purple-300 bg-purple-950/60 border border-purple-800/50 rounded-full mb-4">
                        <span>✨ Simple, Scalable Pricing</span>
                    </span>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
                        Supercharge Your Technical Growth
                    </h1>
                    <p className="max-w-2xl mx-auto text-base text-slate-400">
                        Choose the tier that fits your development workflow. Upgrade anytime for unlimited AI intelligence, PDF reports, and codebase analysis.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    {/* FREE TIER */}
                    <div className="relative p-8 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-xl flex flex-col justify-between hover:border-slate-700 transition-all">
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-white">Starter (Free)</h3>
                                {tier === 'free' && (
                                    <span className="px-2.5 py-1 text-xs font-semibold text-slate-300 bg-slate-800 rounded-full">
                                        Current Plan
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 mb-6">Perfect for individual developers getting started with consistent tracking.</p>
                            <div className="flex items-baseline mb-6">
                                <span className="text-4xl font-extrabold text-white">₹0</span>
                                <span className="text-xs text-slate-400 ml-2">/ forever free</span>
                            </div>
                            <ul className="space-y-3 text-xs text-slate-300 mb-8">
                                <li className="flex items-center gap-2">✓ 3 Projects Tracked</li>
                                <li className="flex items-center gap-2">✓ 25 AI Messages / day</li>
                                <li className="flex items-center gap-2">✓ 1 Monthly PDF Report</li>
                                <li className="flex items-center gap-2">✓ 3 AI Code Reviews / day</li>
                            </ul>
                        </div>
                        <button
                            disabled
                            className="w-full py-3 px-4 text-xs font-semibold text-slate-400 bg-slate-800/50 border border-slate-700/50 rounded-xl cursor-default"
                        >
                            {tier === 'free' ? 'Your Active Plan' : 'Free Tier'}
                        </button>
                    </div>

                    {/* PRO TIER (RECOMMENDED) */}
                    <div className="relative p-8 bg-gradient-to-b from-purple-950/40 via-slate-900/80 to-slate-900 border-2 border-purple-500/80 rounded-3xl backdrop-blur-xl flex flex-col justify-between shadow-2xl shadow-purple-950/50 transform hover:-translate-y-1 transition-all">
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 text-[11px] font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full shadow-md">
                            RECOMMENDED
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-4 mt-2">
                                <h3 className="text-xl font-bold text-white">DevTrack Pro</h3>
                                {isPro && (
                                    <span className="px-2.5 py-1 text-xs font-semibold text-purple-300 bg-purple-950 border border-purple-800 rounded-full">
                                        Active Plan
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-300 mb-6">Designed for ambitious engineers shipping projects and proving consistency.</p>
                            <div className="flex items-baseline mb-1">
                                <span className="text-4xl font-extrabold text-white">₹199</span>
                                <span className="text-xs text-slate-400 ml-1.5">/ month</span>
                            </div>
                            <span className="text-[11px] text-purple-400 font-medium block mb-6">
                                International pricing: $5 / month
                            </span>
                            <ul className="space-y-3 text-xs text-slate-200 mb-8">
                                <li className="flex items-center gap-2">✨ 15 Projects Tracked</li>
                                <li className="flex items-center gap-2">✨ 200 AI Messages / day</li>
                                <li className="flex items-center gap-2">✨ Unlimited PDF Reports</li>
                                <li className="flex items-center gap-2">✨ 20 AI Code Reviews / day</li>
                                <li className="flex items-center gap-2">✨ AI Powered Resume Summary</li>
                            </ul>
                        </div>
                        {isPro ? (
                            <button
                                onClick={handleManageBilling}
                                disabled={loading}
                                className="w-full py-3 px-4 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700"
                            >
                                Manage Subscription (Stripe)
                            </button>
                        ) : (
                            <button
                                onClick={handleUpgrade}
                                disabled={loading}
                                className="w-full py-3 px-4 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-600/30 transition-all transform hover:scale-[1.02]"
                            >
                                {loading ? 'Processing...' : 'Upgrade to Pro →'}
                            </button>
                        )}
                    </div>

                    {/* ENTERPRISE (PLACEHOLDER) */}
                    <div className="relative p-8 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-xl flex flex-col justify-between hover:border-slate-700 transition-all opacity-90">
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-white">Enterprise</h3>
                                <span className="px-2.5 py-1 text-xs font-semibold text-amber-300 bg-amber-950/60 border border-amber-800/50 rounded-full">
                                    Coming Soon
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mb-6">For engineering teams, bootcamp cohorts, and organization workspaces.</p>
                            <div className="flex items-baseline mb-6">
                                <span className="text-3xl font-extrabold text-white">Custom</span>
                            </div>
                            <ul className="space-y-3 text-xs text-slate-400 mb-8">
                                <li className="flex items-center gap-2">✓ Unlimited Everything</li>
                                <li className="flex items-center gap-2">✓ Team Workspace & Peer Reviews</li>
                                <li className="flex items-center gap-2">✓ Dedicated Support & SLA</li>
                            </ul>
                        </div>
                        <button
                            disabled
                            className="w-full py-3 px-4 text-xs font-semibold text-slate-500 bg-slate-800/40 border border-slate-800 rounded-xl cursor-not-allowed"
                        >
                            Contact Sales
                        </button>
                    </div>
                </div>

                {/* Feature Comparison Table */}
                <div className="max-w-4xl mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl p-6">
                    <h2 className="text-lg font-bold text-white mb-6">Detailed Feature Comparison</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                                    <th className="py-3 px-4">Feature</th>
                                    <th className="py-3 px-4">Free Tier</th>
                                    <th className="py-3 px-4 text-purple-400">Pro Tier</th>
                                    <th className="py-3 px-4 text-slate-500">Enterprise</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-slate-300">
                                {FEATURES.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="py-3 px-4 font-medium text-slate-200">{item.name}</td>
                                        <td className="py-3 px-4 text-slate-400">{item.free}</td>
                                        <td className="py-3 px-4 font-semibold text-purple-300">{item.pro}</td>
                                        <td className="py-3 px-4 text-slate-500">{item.enterprise}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
