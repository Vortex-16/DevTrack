import React, { useEffect, useState } from 'react';
import { challengesApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Play, Clock, Code, FileQuestion, Trophy, Users } from 'lucide-react';

const ChallengeLobby = () => {
    const { isLoaded, isSignedIn } = useUser();
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            loadChallenges();
        }
    }, [isLoaded, isSignedIn]);

    const loadChallenges = async () => {
        try {
            const response = await challengesApi.getAll();
            // Filter only LIVE or SCHEDULED or COMPLETED
            // Hide DRAFTs from normal users
            const visible = response.data.filter(c => c.status !== 'DRAFT');
            setChallenges(visible);
        } catch (error) {
            console.error("Failed to load challenges", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 text-white min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                        Competition Lobby
                    </h1>
                    <p className="text-gray-400 mt-2">Join live coding battles and testing your skills</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-400">Loading competitions...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {challenges.length === 0 ? (
                        <div className="col-span-full text-center py-20 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
                            <Trophy size={48} className="mx-auto text-gray-600 mb-4" />
                            <p className="text-gray-400">No active competitions right now. Check back later!</p>
                        </div>
                    ) : (
                        challenges.map(challenge => (
                            <div key={challenge.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm hover:border-gray-500 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-50">
                                    {challenge.type === 'CODE' ? <Code size={64} className="text-gray-700 transform rotate-12" /> : <FileQuestion size={64} className="text-gray-700 transform rotate-12" />}
                                </div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${challenge.status === 'LIVE' ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse' :
                                            challenge.status === 'SCHEDULED' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' :
                                                'bg-gray-700 border-gray-600 text-gray-300'
                                            }`}>
                                            {challenge.status}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{challenge.title}</h3>

                                    <div className="space-y-2 mb-6">
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Clock size={14} className="text-gray-500" />
                                            <span>Duration: {challenge.durationMinutes} mins</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Trophy size={14} className={`
                                                ${challenge.difficulty === 'Hard' ? 'text-red-500' :
                                                    challenge.difficulty === 'Medium' ? 'text-yellow-500' : 'text-green-500'}
                                            `} />
                                            <span className={
                                                challenge.difficulty === 'Hard' ? 'text-red-400' :
                                                    challenge.difficulty === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                                            }>{challenge.difficulty}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => navigate(`/competition/${challenge.id}`)}
                                        disabled={challenge.status !== 'LIVE'}
                                        className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${challenge.status === 'LIVE'
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/40 hover:scale-[1.02]'
                                            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {challenge.status === 'LIVE' ? (
                                            <> <Play size={18} fill="currentColor" /> Join Now </>
                                        ) : (
                                            <> <Users size={18} /> {challenge.status === 'COMPLETED' ? 'Ended' : 'Coming Soon'} </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default ChallengeLobby;
