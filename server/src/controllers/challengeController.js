const { collections, admin } = require('../config/firebase');
const { executeCode } = require('../utils/codeExecution');
const { getIO } = require('../socket/socketManager');

// Create a new challenge
const createChallenge = async (req, res) => {
    try {
        const { title, description, type, difficulty, durationMinutes, testCases, mcqQuestions, scheduledStart } = req.body;
        console.log("📝 Received Create Challenge Request:", { title, type });
        console.log("👤 User from req:", req.auth || req.user);
        const userId = req.auth ? req.auth.userId : req.user ? req.user.uid : null;

        if (!userId) throw new Error("User ID missing from request");

        const challengeData = {
            title,
            description,
            type, // 'CODE' or 'MCQ'
            difficulty,
            durationMinutes,
            status: 'DRAFT',
            createdBy: userId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            // Only add relevant fields based on type
            ...(type === 'CODE' ? { testCases } : {}),
            ...(type === 'MCQ' ? { mcqQuestions } : {}),
            scheduledStart: scheduledStart ? new Date(scheduledStart) : null
        };

        const docRef = await collections.challenges().add(challengeData);
        res.status(201).json({ id: docRef.id, ...challengeData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all challenges
const getChallenges = async (req, res) => {
    try {
        const snapshot = await collections.challenges().orderBy('createdAt', 'desc').get();
        const challenges = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(challenges);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Single Challenge
const getChallengeById = async (req, res) => {
    try {
        const doc = await collections.challenges().doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Challenge not found' });
        }
        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Start a challenge (Admin only)
const startChallenge = async (req, res) => {
    try {
        const { id } = req.params;
        const now = admin.firestore.Timestamp.now();

        await collections.challenges().doc(id).update({
            status: 'LIVE',
            startedAt: now,
            isPaused: false
        });

        // Notify all participants via Socket
        getIO().to(`challenge_${id}`).emit('challenge_status', { status: 'LIVE', startedAt: now });

        res.status(200).json({ message: 'Challenge started' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const pauseChallenge = async (req, res) => {
    try {
        const { id } = req.params;
        // Logic for pause: we might need to track accumulated paused time to adjust timer
        // For simple V1: just set status PAUSED.
        await collections.challenges().doc(id).update({ status: 'PAUSED', isPaused: true });
        getIO().to(`challenge_${id}`).emit('challenge_status', { status: 'PAUSED' });
        res.status(200).json({ message: 'Challenge paused' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const resumeChallenge = async (req, res) => {
    try {
        const { id } = req.params;
        await collections.challenges().doc(id).update({ status: 'LIVE', isPaused: false });
        getIO().to(`challenge_${id}`).emit('challenge_status', { status: 'LIVE' });
        res.status(200).json({ message: 'Challenge resumed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const stopChallenge = async (req, res) => {
    try {
        const { id } = req.params;
        await collections.challenges().doc(id).update({ status: 'ENDED' });
        getIO().to(`challenge_${id}`).emit('challenge_status', { status: 'ENDED' });
        res.status(200).json({ message: 'Challenge ended' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteChallenge = async (req, res) => {
    try {
        const { id } = req.params;
        await collections.challenges().doc(id).delete();
        // Optionally delete subcollections (requires recursive delete in firebase admin)
        res.status(200).json({ message: 'Challenge deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Submit Solution (for CODE challenges)
// Submit Solution (for CODE and MCQ challenges)
const submitSolution = async (req, res) => {
    try {
        const { challengeId, code, language, answers } = req.body; // 'answers' for MCQ: { qIndex: selectedIndex }
        console.log("📝 Submission Recieved:", { challengeId, hasCode: !!code, hasAnswers: !!answers });

        const userId = req.auth ? req.auth.userId : req.user ? req.user.uid : null;
        if (!userId) throw new Error("User ID missing");

        const challengeDoc = await collections.challenges().doc(challengeId).get();
        if (!challengeDoc.exists) return res.status(404).json({ error: 'Challenge not found' });

        const challengeAndData = challengeDoc.data();
        let score = 0;
        let results = [];
        let status = 'ATTEMPTED';

        // --- CODE CHALLENGE LOGIC ---
        if (challengeAndData.type === 'CODE') {
            if (!code || !language) return res.status(400).json({ error: 'Code and Language required' });

            const testCases = challengeAndData.testCases || [];
            if (testCases.length === 0) {
                // No test cases, maybe manual review? For now 100%
                score = 100;
            } else {
                let passedCount = 0;
                // Run against test cases
                for (const testCase of testCases) {
                    try {
                        const { stdout } = await executeCode(language, code, testCase.input);
                        const passed = stdout.trim() === testCase.output.trim();
                        if (passed) passedCount++;

                        results.push({
                            input: testCase.input,
                            expected: testCase.output,
                            actual: stdout.trim(),
                            passed,
                            hidden: testCase.hidden
                        });
                    } catch (execErr) {
                        results.push({
                            input: testCase.input,
                            expected: testCase.output,
                            actual: execErr.message,
                            passed: false,
                            hidden: testCase.hidden
                        });
                    }
                }
                score = (passedCount / testCases.length) * 100;
            }
        }
        // --- MCQ CHALLENGE LOGIC ---
        else if (challengeAndData.type === 'MCQ') {
            if (!answers) return res.status(400).json({ error: 'Answers required for MCQ' });

            const questions = challengeAndData.mcqQuestions || [];
            let correctCount = 0;

            questions.forEach((q, index) => {
                const userSelected = answers[index];
                const isCorrect = userSelected === q.correctIndex; // Assuming correctIndex is stored in DB

                if (isCorrect) correctCount++;

                results.push({
                    questionIndex: index,
                    correct: isCorrect,
                    // Don't send back correct answer strictly unless ended? 
                    // For now sending success status
                });
            });

            score = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;
        } else {
            return res.status(400).json({ error: 'Invalid submission type' });
        }

        status = score === 100 ? 'COMPLETED' : 'ATTEMPTED';

        // Save Submission
        const submission = {
            challengeId,
            userId,
            code: code || null,
            language: language || null,
            answers: answers || null,
            score,
            results,
            status,
            submittedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await collections.challenges().doc(challengeId).collection('submissions').add(submission);

        // Real-time Leaderboard update
        getIO().to(`challenge_${challengeId}_admin`).emit('new_submission', { userId, score });

        res.status(200).json({ score, results: results.filter(r => !r.hidden) });

    } catch (error) {
        console.error("Submission Error:", error);
        res.status(500).json({ error: error.message });
    }
};

const getSubmissions = async (req, res) => {
    try {
        const { id } = req.params;
        const snapshot = await collections.challenges().doc(id).collection('submissions').orderBy('score', 'desc').get();
        const submissions = snapshot.docs.map(doc => doc.data());

        // Aggregate highest score per user for leaderboard
        const leaderboard = {};
        submissions.forEach(sub => {
            if (!leaderboard[sub.userId] || sub.score > leaderboard[sub.userId].score) {
                leaderboard[sub.userId] = sub;
            }
        });

        res.status(200).json(Object.values(leaderboard).sort((a, b) => b.score - a.score));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createChallenge,
    getChallenges,
    getChallengeById,
    startChallenge,
    pauseChallenge,
    resumeChallenge,
    stopChallenge,
    deleteChallenge,
    submitSolution,
    getSubmissions
};
