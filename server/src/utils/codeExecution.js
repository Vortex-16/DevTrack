const axios = require('axios');

const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

/**
 * Execute code safely using Piston API
 * @param {string} language - language (python, javascript, c++, java)
 * @param {string} sourceCode - code to execute
 * @param {string} input - stdin input
 * @returns {Promise<{stdout: string, stderr: string, output: string}>}
 */
const executeCode = async (language, sourceCode, input = "") => {
    try {
        // Map common language names to Piston versions/names if needed
        const langMap = {
            'python': { language: 'python', version: '3.10.0' },
            'javascript': { language: 'javascript', version: '18.15.0' },
            'cpp': { language: 'c++', version: '10.2.0' },
            'java': { language: 'java', version: '15.0.2' },
            'c': { language: 'c', version: '10.2.0' }
        };

        const config = langMap[language.toLowerCase()] || { language: language.toLowerCase(), version: '*' };

        const response = await axios.post(PISTON_API_URL, {
            language: config.language,
            version: config.version,
            files: [
                {
                    content: sourceCode
                }
            ],
            stdin: input
        });

        const { run } = response.data;
        return {
            stdout: run.stdout,
            stderr: run.stderr,
            output: run.output,
            exitCode: run.code
        };

    } catch (error) {
        console.error('Code Execution Failed:', error.message);
        throw new Error('Code execution failed due to server error.');
    }
};

module.exports = { executeCode };
