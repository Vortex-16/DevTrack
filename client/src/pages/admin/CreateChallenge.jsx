import React, { useState } from 'react';
import { challengesApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, Trash, Code, FileText } from 'lucide-react';

const CreateChallenge = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'CODE', // CODE or MCQ
        difficulty: 'Medium',
        durationMinutes: 60,
        testCases: [{ input: '', output: '', hidden: false }],
        mcqQuestions: [{ question: '', options: ['', '', '', ''], correctIndex: 0 }]
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Test Case Handlers
    const addTestCase = () => {
        setFormData({
            ...formData,
            testCases: [...formData.testCases, { input: '', output: '', hidden: false }]
        });
    };

    const updateTestCase = (index, field, value) => {
        const newCases = [...formData.testCases];
        newCases[index][field] = value;
        setFormData({ ...formData, testCases: newCases });
    };

    const removeTestCase = (index) => {
        const newCases = formData.testCases.filter((_, i) => i !== index);
        setFormData({ ...formData, testCases: newCases });
    };

    // MCQ Handlers
    const addMcqQuestion = () => {
        setFormData({
            ...formData,
            mcqQuestions: [...formData.mcqQuestions, { question: '', options: ['', '', '', ''], correctIndex: 0 }]
        });
    };

    const updateMcqQuestion = (index, field, value) => {
        const newQuestions = [...formData.mcqQuestions];
        newQuestions[index][field] = value;
        setFormData({ ...formData, mcqQuestions: newQuestions });
    };

    const updateMcqOption = (qIndex, oIndex, value) => {
        const newQuestions = [...formData.mcqQuestions];
        newQuestions[qIndex].options[oIndex] = value;
        setFormData({ ...formData, mcqQuestions: newQuestions });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await challengesApi.create(formData);
            navigate('/admin/dashboard');
        } catch (error) {
            alert('Failed to create challenge: ' + error.message);
        }
    };

    return (
        <div className="p-8 text-white min-h-screen max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Create New Challenge</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-400">Title</label>
                        <input
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-400">Duration (Minutes)</label>
                        <input
                            name="durationMinutes"
                            type="number"
                            value={formData.durationMinutes}
                            onChange={handleChange}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-400">Type</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-blue-500"
                        >
                            <option value="CODE">Coding Challenge</option>
                            <option value="MCQ">Multiple Choice</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-400">Difficulty</label>
                        <select
                            name="difficulty"
                            value={formData.difficulty}
                            onChange={handleChange}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-blue-500"
                        >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">Description (Markdown)</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 h-32 focus:outline-none focus:border-blue-500 font-mono"
                        required
                    />
                </div>

                {/* DYNAMIC SECTION BASED ON TYPE */}
                {formData.type === 'CODE' ? (
                    <div className="space-y-4 border-t border-gray-700 pt-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-semibold flex items-center gap-2"><Code size={20} /> Test Cases</h3>
                            <button type="button" onClick={addTestCase} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm">
                                <Plus size={16} /> Add Case
                            </button>
                        </div>
                        {formData.testCases.map((tc, idx) => (
                            <div key={idx} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-3 relative group">
                                <button type="button" onClick={() => removeTestCase(idx)} className="absolute top-2 right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash size={16} />
                                </button>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        placeholder="Input"
                                        value={tc.input}
                                        onChange={(e) => updateTestCase(idx, 'input', e.target.value)}
                                        className="bg-gray-900 border border-gray-700 rounded p-2 text-sm font-mono"
                                    />
                                    <input
                                        placeholder="Expected Output"
                                        value={tc.output}
                                        onChange={(e) => updateTestCase(idx, 'output', e.target.value)}
                                        className="bg-gray-900 border border-gray-700 rounded p-2 text-sm font-mono"
                                    />
                                </div>
                                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={tc.hidden}
                                        onChange={(e) => updateTestCase(idx, 'hidden', e.target.checked)}
                                        className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                                    />
                                    Hidden Test Case
                                </label>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4 border-t border-gray-700 pt-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-semibold flex items-center gap-2"><FileText size={20} /> Questions</h3>
                            <button type="button" onClick={addMcqQuestion} className="text-purple-400 hover:text-purple-300 flex items-center gap-1 text-sm">
                                <Plus size={16} /> Add Question
                            </button>
                        </div>
                        {formData.mcqQuestions.map((q, idx) => (
                            <div key={idx} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-3">
                                <input
                                    placeholder="Question Text"
                                    value={q.question}
                                    onChange={(e) => updateMcqQuestion(idx, 'question', e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 font-medium"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    {q.options.map((opt, oIdx) => (
                                        <div key={oIdx} className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name={`correct-${idx}`}
                                                checked={q.correctIndex === oIdx}
                                                onChange={() => updateMcqQuestion(idx, 'correctIndex', oIdx)}
                                            />
                                            <input
                                                placeholder={`Option ${oIdx + 1}`}
                                                value={opt}
                                                onChange={(e) => updateMcqOption(idx, oIdx, e.target.value)}
                                                className="flex-1 bg-gray-900 border border-gray-700 rounded p-2 text-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="pt-6">
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2"
                    >
                        <Save size={20} />
                        Create Challenge
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateChallenge;
