import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useUser } from '@clerk/clerk-react';
import api, { challengesApi } from '../../services/api';
import { Users, AlertTriangle, Code, Trophy, Activity, Eye } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000';

const AdminMonitor = () => {
    const { id } = useParams();
    const [challenge, setChallenge] = useState(null);
    const [participants, setParticipants] = useState({}); // { userId: { code, violations, status } }
    const [leaderboard, setLeaderboard] = useState([]);
    const [socket, setSocket] = useState(null); // Define socket state

    // Auth check
    const { user, isLoaded, isSignedIn } = useUser();
    const navigate = useNavigate();

    const [debugInfo, setDebugInfo] = useState(null);

    useEffect(() => {
        // Double check admin status via API
        const checkAccess = async () => {
            try {
                console.log("🔍 AdminMonitor checking access...");
                const userRes = await api.get('/auth/me');
                console.log("👤 AdminMonitor User:", userRes.data);
                setDebugInfo(userRes.data);

                const user = userRes.data.user;

                // Strict Admin Check
                if (!user || (user.role !== 'admin' && !user.isAdmin)) {
                    console.warn("🚫 Access Denied: User is not admin", user);
                    // Redirect unauthorized users
                    alert("Access Denied: Admin privileges required.");
                    navigate('/dashboard');
                } else {
                    console.log("✅ Access Granted: Loading Challenge");
                    loadChallenge();
                    connectSocket();
                }

            } catch (e) {
                console.error("❌ Access Check Failed:", e);
                setDebugInfo({ error: e.message });
                // navigate('/dashboard'); // Optional: redirect on error
            }
        };
        checkAccess();

        return () => {
            if (socket) socket.disconnect();
        };
    }, [id]);

    const connectSocket = () => {
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.emit('join_challenge', { challengeId: id, userId: 'admin-monitor', username: 'Admin' });
        newSocket.emit('admin_join', { challengeId: id });

        // Handle initial participants list
        newSocket.on('init_participants', (list) => {
            const map = {};
            list.forEach(p => map[p.userId] = p);
            setParticipants(prev => ({ ...prev, ...map }));
        });

        newSocket.on('participant_update', (data) => {
            setParticipants(prev => ({
                ...prev,
                [data.userId]: { ...prev[data.userId], ...data, ...data.participant } // Merge properly
            }));
        });

        newSocket.on('violation_alert', (data) => {
            setParticipants(prev => ({
                ...prev,
                [data.userId]: { ...prev[data.userId], violations: data.count }
            }));
        });

        newSocket.on('new_submission', (data) => {
            updateLeaderboard(data.userId, data.score);
        });
    };

    const loadChallenge = async () => {
        try {
            const [chalRes, subRes] = await Promise.all([
                challengesApi.getById(id),
                challengesApi.getSubmissions(id)
            ]);

            setChallenge(chalRes.data);
            setLeaderboard(subRes.data);
        } catch (error) {
            console.error("Failed to load challenge data", error);
        }
    };

    const updateLeaderboard = (userId, score) => {
        setLeaderboard(prev => {
            const existing = prev.find(p => p.userId === userId);
            if (existing) {
                return prev.map(p => p.userId === userId ? { ...p, score } : p).sort((a, b) => b.score - a.score);
            }
            return [...prev, { userId, score }].sort((a, b) => b.score - a.score);
        });
    };

    if (!challenge) return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            <header className="mb-8 flex justify-between items-center border-b border-gray-800 pb-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Eye className="text-blue-500" /> Monitor: {challenge.title}
                    </h1>
                    <div className="text-gray-400 text-sm mt-1 flex gap-4">
                        <span className="flex items-center gap-1"><Users size={14} /> {Object.keys(participants).length} Active</span>
                        <span className="flex items-center gap-1"><Activity size={14} /> Status: <span className="text-green-400 uppercase">{challenge.status}</span></span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Participants Grid */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Code size={20} className="text-purple-400" /> Live Sessions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(participants).map(([uid, data]) => (
                            <div key={uid} className={`bg-gray-900 rounded-xl p-4 border ${data.violations > 0 ? 'border-red-500/50' : 'border-gray-800'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-mono text-sm text-gray-300">{uid}</span>
                                    {data.violations > 0 && (
                                        <span className="flex items-center gap-1 text-red-400 text-xs bg-red-500/10 px-2 py-1 rounded">
                                            <AlertTriangle size={12} /> {data.violations} Violations
                                        </span>
                                    )}
                                </div>
                                <div className="h-32 bg-black rounded p-2 overflow-hidden text-xs font-mono text-gray-500 relative">
                                    {data.code || "// No code yet..."}
                                    <div className="absolute top-0 right-0 bg-blue-600/20 text-blue-400 text-[10px] px-1 rounded-bl">
                                        Live
                                    </div>
                                </div>
                            </div>
                        ))}
                        {Object.keys(participants).length === 0 && (
                            <div className="col-span-full py-10 text-center text-gray-500 bg-gray-900/30 rounded-xl border border-dashed border-gray-800">
                                Waiting for participants to join...
                            </div>
                        )}
                    </div>
                </div>

                {/* Leaderboard Panel */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 h-fit">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-yellow-500">
                        <Trophy size={20} /> Live Leaderboard
                    </h2>
                    <div className="space-y-3">
                        {leaderboard.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center">No submissions yet</p>
                        ) : (
                            leaderboard.map((entry, index) => (
                                <div key={entry.userId} className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-gray-800">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                            ${index === 0 ? 'bg-yellow-500 text-black' :
                                                index === 1 ? 'bg-gray-400 text-black' :
                                                    index === 2 ? 'bg-orange-700 text-white' : 'bg-gray-800 text-gray-400'}`}>
                                            {index + 1}
                                        </div>
                                        <span className="text-sm font-mono text-gray-300">{entry.userId.substring(0, 8)}...</span>
                                    </div>
                                    <span className="font-bold text-green-400">{entry.score.toFixed(1)}%</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminMonitor;
