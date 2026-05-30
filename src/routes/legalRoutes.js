const express = require('express');
const router = express.Router();
const legalResearchService = require('../services/legalResearchService');
const { body, validationResult } = require('express-validator');

/**
 * POST /api/legal/research
 * Process a legal research query and return relevant laws
 */
router.post('/research',
    body('query')
        .trim()
        .notEmpty()
        .withMessage('Query is required')
        .isLength({ min: 10, max: 2000 })
        .withMessage('Query must be between 10 and 2000 characters'),
    async (req, res) => {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { query } = req.body;

            // Process the legal research query
            const results = await legalResearchService.processQuery(query);

            // Return comprehensive results
            res.json(results);

        } catch (error) {
            console.error('Legal research API error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process legal research query',
                error: error.message
            });
        }
    }
);

/**
 * GET /api/legal/analyze
 * Analyze a query without fetching full results (for preview)
 */
router.get('/analyze',
    async (req, res) => {
        try {
            const { q } = req.query;

            if (!q || q.length < 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Query parameter "q" must be at least 5 characters'
                });
            }

            const analysis = legalResearchService.analyzeQuery(q);

            res.json({
                success: true,
                analysis,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Legal analysis API error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to analyze query',
                error: error.message
            });
        }
    }
);

/**
 * GET /api/legal/states
 * Get list of all US states
 */
router.get('/states', async (req, res) => {
    try {
        const states = [
            { name: 'Alabama', code: 'AL' },
            { name: 'Alaska', code: 'AK' },
            { name: 'Arizona', code: 'AZ' },
            { name: 'Arkansas', code: 'AR' },
            { name: 'California', code: 'CA' },
            { name: 'Colorado', code: 'CO' },
            { name: 'Connecticut', code: 'CT' },
            { name: 'Delaware', code: 'DE' },
            { name: 'Florida', code: 'FL' },
            { name: 'Georgia', code: 'GA' },
            { name: 'Hawaii', code: 'HI' },
            { name: 'Idaho', code: 'ID' },
            { name: 'Illinois', code: 'IL' },
            { name: 'Indiana', code: 'IN' },
            { name: 'Iowa', code: 'IA' },
            { name: 'Kansas', code: 'KS' },
            { name: 'Kentucky', code: 'KY' },
            { name: 'Louisiana', code: 'LA' },
            { name: 'Maine', code: 'ME' },
            { name: 'Maryland', code: 'MD' },
            { name: 'Massachusetts', code: 'MA' },
            { name: 'Michigan', code: 'MI' },
            { name: 'Minnesota', code: 'MN' },
            { name: 'Mississippi', code: 'MS' },
            { name: 'Missouri', code: 'MO' },
            { name: 'Montana', code: 'MT' },
            { name: 'Nebraska', code: 'NE' },
            { name: 'Nevada', code: 'NV' },
            { name: 'New Hampshire', code: 'NH' },
            { name: 'New Jersey', code: 'NJ' },
            { name: 'New Mexico', code: 'NM' },
            { name: 'New York', code: 'NY' },
            { name: 'North Carolina', code: 'NC' },
            { name: 'North Dakota', code: 'ND' },
            { name: 'Ohio', code: 'OH' },
            { name: 'Oklahoma', code: 'OK' },
            { name: 'Oregon', code: 'OR' },
            { name: 'Pennsylvania', code: 'PA' },
            { name: 'Rhode Island', code: 'RI' },
            { name: 'South Carolina', code: 'SC' },
            { name: 'South Dakota', code: 'SD' },
            { name: 'Tennessee', code: 'TN' },
            { name: 'Texas', code: 'TX' },
            { name: 'Utah', code: 'UT' },
            { name: 'Vermont', code: 'VT' },
            { name: 'Virginia', code: 'VA' },
            { name: 'Washington', code: 'WA' },
            { name: 'West Virginia', code: 'WV' },
            { name: 'Wisconsin', code: 'WI' },
            { name: 'Wyoming', code: 'WY' }
        ];

        res.json({
            success: true,
            count: states.length,
            data: states
        });

    } catch (error) {
        console.error('States API error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch states',
            error: error.message
        });
    }
});

/**
 * GET /api/legal/constitutional-provisions
 * Get list of constitutional amendments and articles
 */
router.get('/constitutional-provisions', async (req, res) => {
    try {
        const provisions = {
            articles: [
                { id: 'article-1', name: 'Article I', description: 'Legislative Branch' },
                { id: 'article-2', name: 'Article II', description: 'Executive Branch' },
                { id: 'article-3', name: 'Article III', description: 'Judicial Branch' },
                { id: 'article-4', name: 'Article IV', description: 'States Relations' },
                { id: 'article-5', name: 'Article V', description: 'Amendment Process' },
                { id: 'article-6', name: 'Article VI', description: 'Supremacy Clause' },
                { id: 'article-7', name: 'Article VII', description: 'Ratification' }
            ],
            amendments: [
                { id: 'amendment-1', name: 'First Amendment', description: 'Freedom of Speech, Religion, Press, Assembly, Petition' },
                { id: 'amendment-2', name: 'Second Amendment', description: 'Right to Bear Arms' },
                { id: 'amendment-3', name: 'Third Amendment', description: 'Quartering of Soldiers' },
                { id: 'amendment-4', name: 'Fourth Amendment', description: 'Search and Seizure' },
                { id: 'amendment-5', name: 'Fifth Amendment', description: 'Due Process, Double Jeopardy, Self-Incrimination' },
                { id: 'amendment-6', name: 'Sixth Amendment', description: 'Right to Counsel, Speedy Trial' },
                { id: 'amendment-7', name: 'Seventh Amendment', description: 'Jury Trial in Civil Cases' },
                { id: 'amendment-8', name: 'Eighth Amendment', description: 'Cruel and Unusual Punishment' },
                { id: 'amendment-9', name: 'Ninth Amendment', description: 'Unenumerated Rights' },
                { id: 'amendment-10', name: 'Tenth Amendment', description: 'States Rights' },
                { id: 'amendment-13', name: 'Thirteenth Amendment', description: 'Abolition of Slavery' },
                { id: 'amendment-14', name: 'Fourteenth Amendment', description: 'Equal Protection, Due Process' },
                { id: 'amendment-15', name: 'Fifteenth Amendment', description: 'Voting Rights (Race)' },
                { id: 'amendment-19', name: 'Nineteenth Amendment', description: 'Women Suffrage' },
                { id: 'amendment-24', name: 'Twenty-Fourth Amendment', description: 'Poll Tax Prohibition' },
                { id: 'amendment-26', name: 'Twenty-Sixth Amendment', description: 'Voting Age (18)' }
            ]
        };

        res.json({
            success: true,
            data: provisions
        });

    } catch (error) {
        console.error('Constitutional provisions API error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch constitutional provisions',
            error: error.message
        });
    }
});

module.exports = router;
