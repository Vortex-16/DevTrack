import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { useUser } from '@clerk/clerk-react';
import { challengesApi } from '../../services/api';
import { Terminal, Send, AlertTriangle, Maximize, Clock, FileQuestion, ChevronDown, CheckCircle } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000';

const LiveEnvironment = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useUser();

    const [challenge, setChallenge] = useState(null);
    const [code, setCode] = useState('// Write your solution here...');
    const [language, setLanguage] = useState('javascript');
    const [output, setOutput] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [socket, setSocket] = useState(null);

    // MCQ State
    const [mcqAnswers, setMcqAnswers] = useState({}); // { questionIndex: optionIndex }

    useEffect(() => {
        loadChallenge();

        if (user) {
            const newSocket = io(SOCKET_URL);
            setSocket(newSocket);

            newSocket.emit('join_challenge', { challengeId: id, userId: user.id, username: user.username || user.firstName });

            return () => newSocket.disconnect();
        }
    }, [id, user]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && socket && user) {
                socket.emit('violation', { challengeId: id, userId: user.id, type: 'tab_switch' });
                alert("Warning: Tab switching is monitored!");
            }
        };

        const preventCopy = (e) => {
            e.preventDefault();
            alert("Copy/Paste is disabled!");
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener('contextmenu', preventCopy);
        document.addEventListener('copy', preventCopy);
        document.addEventListener('paste', preventCopy);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener('contextmenu', preventCopy);
            document.removeEventListener('copy', preventCopy);
            document.removeEventListener('paste', preventCopy);
        };
    }, [id, socket, user]);

    // Timer Logic
    useEffect(() => {
        if (!challenge) return;

        // Calculate time left based on end time (simplified for now, ideally strictly synced with server)
        // For this demo, we'll just countdown duration if not provided strict start/end
        setTimeLeft(challenge.durationMinutes * 60);

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(); // Auto submit
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [challenge]);

    const loadChallenge = async () => {
        try {
            const res = await challengesApi.getById(id);
            setChallenge(res.data);
            if (res.data.type === 'CODE') {
                // Reset code if needed or load previous draft
            }
        } catch (error) {
            console.error("Failed to load challenge", error);
        }
    };

    const handleRun = async () => {
        // Only for Code challenges
        try {
            setOutput("Running...");
            const res = await challengesApi.submit({
                challengeId: id,
                code,
                language,
                isDryRun: true
            });
            setOutput(JSON.stringify(res.data.results, null, 2));
        } catch (error) {
            setOutput("Execution failed: " + error.message);
        }
    };

    const handleSubmit = async () => {
        try {
            const submissionData = challenge.type === 'CODE'
                ? { code, language }
                : { answers: mcqAnswers };

            if (!user) return; // Guard for auth

            const res = await challengesApi.submit({
                challengeId: id,
                ...submissionData,
                userId: user.id
            });

            if (socket) {
                socket.emit('submission', { challengeId: id, userId: user.id, score: res.data.score });
            }

            alert(`Submission Complete! Score: ${res.data.score}`);
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            alert("Submission failed!");
        }
    };

    const lastEmitTime = React.useRef(0);
    const debounceTimer = React.useRef(null);

    const handleCodeChange = (value) => {
        setCode(value);

        // Debounce socket updates (max once per 2 seconds) to scale for 100+ users
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        debounceTimer.current = setTimeout(() => {
            if (socket && user) {
                socket.emit('code_update', { challengeId: id, userId: user.id, code: value });
            }
        }, 2000);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullScreen(true);
        } else {
            document.exitFullscreen();
            setIsFullScreen(false);
        }
    };

    if (!challenge) return <div className="text-white p-10">Loading Environment...</div>;

    const languages = [
        { id: 'javascript', name: 'JavaScript' },
        { id: 'python', name: 'Python' },
        { id: 'cpp', name: 'C++' },
        { id: 'java', name: 'Java' }
    ];

    return (
        <div className="h-screen bg-gray-950 text-white flex flex-col font-sans">
            {/* Header */}
            <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur">
                <div className="flex items-center gap-4">
                    <h1 className="font-bold text-lg">{challenge.title}</h1>
                    <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-xs border border-blue-500/30">
                        {challenge.type}
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    <div className={`flex items-center gap-2 font-mono text-xl ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-gray-300'}`}>
                        <Clock size={20} />
                        {formatTime(timeLeft)}
                    </div>
                    <button onClick={toggleFullScreen} className="text-gray-400 hover:text-white transition-colors">
                        <Maximize size={20} />
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] flex items-center gap-2"
                    >
                        <Send size={18} /> Submit
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left Panel: Problem Statement */}
                <div className="w-1/3 border-r border-gray-800 bg-gray-900/30 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-700">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-purple-400">
                        <FileQuestion size={20} /> Problem Description
                    </h2>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                        <p className="whitespace-pre-wrap">{challenge.description}</p>
                    </div>

                    {challenge.type === 'CODE' && (
                        <div className="mt-8">
                            <h3 className="font-semibold text-gray-200 mb-3">Example Test Cases</h3>
                            {challenge.testCases?.slice(0, 2).map((test, i) => (
                                <div key={i} className="mb-4 bg-black/40 rounded-lg p-3 border border-gray-800">
                                    <div className="text-xs text-gray-500 mb-1">Input:</div>
                                    <code className="block bg-gray-900 p-2 rounded text-sm mb-2">{test.input}</code>
                                    <div className="text-xs text-gray-500 mb-1">Expected Output:</div>
                                    <code className="block bg-gray-900 p-2 rounded text-sm text-green-400">{test.output}</code>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Panel: Editor OR MCQ */}
                {challenge.type === 'CODE' ? (
                    <div className="w-2/3 flex flex-col bg-[#1e1e1e]">
                        {/* Toolbar */}
                        <div className="h-10 bg-[#252526] flex items-center justify-between px-4 border-b border-black">
                            <div className="flex items-center gap-2">
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                                >
                                    {languages.map(lang => (
                                        <option key={lang.id} value={lang.id}>{lang.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button onClick={handleRun} className="flex items-center gap-1 text-xs bg-blue-600/20 text-blue-400 px-3 py-1 rounded hover:bg-blue-600/30 transition-colors">
                                <Terminal size={12} /> Run Tests
                            </button>
                        </div>

                        <div className="flex-1 relative">
                            <Editor
                                height="100%"
                                language={language}
                                theme="vs-dark"
                                value={code}
                                onChange={handleCodeChange}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                }}
                            />
                        </div>

                        {/* Output Console */}
                        {output && (
                            <div className="h-1/3 border-t border-gray-800 bg-[#1e1e1e] p-4 overflow-y-auto font-mono text-sm">
                                <div className="text-gray-500 text-xs uppercase mb-2">Output Console</div>
                                <pre className="text-gray-300 whitespace-pre-wrap">{output}</pre>
                            </div>
                        )}
                    </div>
                ) : (
                    // MCQ Interface
                    <div className="w-2/3 p-8 overflow-y-auto bg-gray-900">
                        <div className="max-w-3xl mx-auto space-y-8">
                            {challenge.mcqQuestions?.map((q, qIndex) => (
                                <div key={qIndex} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="bg-blue-600/20 text-blue-400 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                                            {qIndex + 1}
                                        </div>
                                        <h3 className="text-lg font-medium pt-1">{q.question}</h3>
                                    </div>

                                    <div className="space-y-3 pl-12">
                                        {q.options.map((opt, optIndex) => (
                                            <div
                                                key={optIndex}
                                                onClick={() => setMcqAnswers(prev => ({ ...prev, [qIndex]: optIndex }))}
                                                className={`p-4 rounded-lg border cursor-pointer transition-all flex items-center justify-between group ${mcqAnswers[qIndex] === optIndex
                                                    ? 'bg-blue-600/20 border-blue-500 text-white'
                                                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600 hover:bg-gray-800'
                                                    }`}
                                            >
                                                <span className="flex items-center gap-3">
                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${mcqAnswers[qIndex] === optIndex ? 'border-blue-400' : 'border-gray-600 group-hover:border-gray-500'
                                                        }`}>
                                                        {mcqAnswers[qIndex] === optIndex && <div className="w-2 h-2 bg-blue-400 rounded-full" />}
                                                    </div>
                                                    {opt}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default LiveEnvironment;
