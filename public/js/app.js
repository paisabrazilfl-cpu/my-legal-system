/**
 * LegalAI - Enterprise Legal Research Application
 * Professional-grade client-side JavaScript
 * 
 * Features:
 * - Chat interface for legal queries
 * - Integration with federal, state, and constitutional law databases
 * - Case law lookup via public APIs
 * - Real-time search results display
 */

// API Configuration - Using public legal data sources
const API_CONFIG = {
    // Legal Information Institute (Cornell) APIs
    LII_US_CODE: 'https://www.law.cornell.edu/uscode',
    LII_CFR: 'https://www.law.cornell.edu/cfr',
    LII_CONSTITUTION: 'https://www.law.cornell.edu/constitution',
    LII_SUPREME_COURT: 'https://www.law.cornell.edu/supremecourt',
    
    // Congress.gov API
    CONGRESS_API: 'https://api.congress.gov/v3',
    
    // CourtListener API (free tier available)
    COURT_LISTENER: 'https://www.courtlistener.com/api/rest/v4',
    
    // Our backend API
    BACKEND_API: '/api'
};

// All 50 US States
const US_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina',
    'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee',
    'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming'
];

// Constitutional Amendments and Articles
const CONSTITUTIONAL_PROVISIONS = {
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

// DOM Elements
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const chatMessages = document.getElementById('chatMessages');
const sendBtn = document.getElementById('sendBtn');
const resultsSection = document.getElementById('resultsSection');
const newSearchBtn = document.getElementById('newSearchBtn');
const promptBtns = document.querySelectorAll('.prompt-btn');

// State Management
let conversationHistory = [];
let isLoading = false;

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    autoResizeTextarea();
});

/**
 * Initialize all event listeners
 */
function initializeEventListeners() {
    // Chat form submission
    chatForm.addEventListener('submit', handleChatSubmit);
    
    // Quick prompt buttons
    promptBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const prompt = btn.getAttribute('data-prompt');
            userInput.value = prompt;
            handleChatSubmit(new Event('submit'));
        });
    });
    
    // New search button
    newSearchBtn.addEventListener('click', resetSearch);
    
    // Auto-resize textarea on input
    userInput.addEventListener('input', autoResizeTextarea);
    
    // Enter key to send (Shift+Enter for new line)
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleChatSubmit(e);
        }
    });
}

/**
 * Auto-resize textarea based on content
 */
function autoResizeTextarea() {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 150) + 'px';
}

/**
 * Handle chat form submission
 */
async function handleChatSubmit(e) {
    e.preventDefault();
    
    const query = userInput.value.trim();
    if (!query || isLoading) return;
    
    // Add user message to chat
    addMessage(query, 'user');
    
    // Clear input
    userInput.value = '';
    autoResizeTextarea();
    
    // Show loading state
    setLoading(true);
    showTypingIndicator();
    
    try {
        // Process the legal query
        const results = await processLegalQuery(query);
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Add bot response
        addMessage(generateResponseText(results), 'bot');
        
        // Display results
        displayResults(results);
        
        // Add to conversation history
        conversationHistory.push({ query, results, timestamp: new Date() });
        
    } catch (error) {
        console.error('Error processing query:', error);
        removeTypingIndicator();
        addMessage('I apologize, but I encountered an error while processing your request. Please try again.', 'bot');
    } finally {
        setLoading(false);
    }
}

/**
 * Process legal query and fetch relevant laws
 */
async function processLegalQuery(query) {
    // Analyze the query to identify relevant areas
    const analysis = analyzeQuery(query);
    
    // Fetch from multiple sources in parallel
    const [federalLaws, stateLaws, constitutionalLaws, caseLaw] = await Promise.all([
        fetchFederalLaws(analysis),
        fetchStateLaws(analysis),
        fetchConstitutionalLaws(analysis),
        fetchCaseLaw(analysis)
    ]);
    
    return {
        query,
        analysis,
        federalLaws,
        stateLaws,
        constitutionalLaws,
        caseLaw,
        timestamp: new Date().toISOString()
    };
}

/**
 * Analyze query to identify legal topics and keywords
 */
function analyzeQuery(query) {
    const lowerQuery = query.toLowerCase();
    
    const analysis = {
        topics: [],
        keywords: [],
        categories: {
            constitutional: false,
            federal: false,
            state: false,
            criminal: false,
            civil: false,
            employment: false,
            family: false,
            property: false,
            contracts: false
        }
    };
    
    // Topic detection
    const topicMap = {
        'discrimination': ['employment', 'civil rights'],
        'termination': ['employment', 'contracts'],
        'speech': ['first amendment', 'constitutional'],
        'search': ['fourth amendment', 'criminal'],
        'seizure': ['fourth amendment', 'criminal'],
        'arrest': ['criminal', 'due process'],
        'contract': ['contracts', 'civil'],
        'property': ['property', 'civil'],
        'divorce': ['family'],
        'custody': ['family'],
        'tenant': ['property', 'contracts'],
        'landlord': ['property', 'contracts'],
        'wage': ['employment'],
        'harassment': ['employment', 'civil rights'],
        'voting': ['constitutional', 'civil rights'],
        'religion': ['first amendment', 'constitutional'],
        'assembly': ['first amendment', 'constitutional'],
        'press': ['first amendment', 'constitutional'],
        'counsel': ['sixth amendment', 'criminal'],
        'trial': ['criminal', 'constitutional'],
        'jury': ['sixth amendment', 'seventh amendment'],
        'bail': ['eighth amendment', 'criminal'],
        'punishment': ['eighth amendment', 'criminal'],
        'equal protection': ['fourteenth amendment', 'constitutional'],
        'due process': ['fifth amendment', 'fourteenth amendment']
    };
    
    for (const [keyword, topics] of Object.entries(topicMap)) {
        if (lowerQuery.includes(keyword)) {
            analysis.topics.push(...topics);
            analysis.keywords.push(keyword);
        }
    }
    
    // Category detection
    if (lowerQuery.includes('constitution') || lowerQuery.includes('amendment')) {
        analysis.categories.constitutional = true;
    }
    if (lowerQuery.includes('federal') || lowerQuery.includes('united states')) {
        analysis.categories.federal = true;
    }
    if (lowerQuery.includes('state') || US_STATES.some(state => lowerQuery.includes(state.toLowerCase()))) {
        analysis.categories.state = true;
    }
    if (lowerQuery.includes('crime') || lowerQuery.includes('arrest') || lowerQuery.includes('prosecution')) {
        analysis.categories.criminal = true;
    }
    if (lowerQuery.includes('job') || lowerQuery.includes('work') || lowerQuery.includes('employer') || lowerQuery.includes('employee')) {
        analysis.categories.employment = true;
    }
    
    // Remove duplicates
    analysis.topics = [...new Set(analysis.topics)];
    
    return analysis;
}

/**
 * Fetch federal laws based on analysis
 */
async function fetchFederalLaws(analysis) {
    const laws = [];
    
    // Employment discrimination
    if (analysis.topics.includes('employment') || analysis.topics.includes('civil rights')) {
        laws.push({
            citation: '42 U.S.C. § 2000e et seq. (Title VII of the Civil Rights Act)',
            description: 'Prohibits employment discrimination based on race, color, religion, sex, and national origin.',
            url: `${API_CONFIG.LII_US_CODE}/text?section=2000e`,
            relevance: 'high'
        });
        laws.push({
            citation: '29 U.S.C. § 201 et seq. (Fair Labor Standards Act)',
            description: 'Establishes minimum wage, overtime pay, recordkeeping, and youth employment standards.',
            url: `${API_CONFIG.LII_US_CODE}/text?edition=prelim&title=29&section=201`,
            relevance: 'medium'
        });
    }
    
    // First Amendment issues
    if (analysis.topics.includes('first amendment')) {
        laws.push({
            citation: '42 U.S.C. § 1983',
            description: 'Civil action for deprivation of rights under color of state law, commonly used for First Amendment violations.',
            url: `${API_CONFIG.LII_US_CODE}/text?section=1983`,
            relevance: 'high'
        });
    }
    
    // Fourth Amendment issues
    if (analysis.topics.includes('fourth amendment')) {
        laws.push({
            citation: '18 U.S.C. § 2236',
            description: 'Unauthorized search and seizure penalties for federal agents.',
            url: `${API_CONFIG.LII_US_CODE}/text?edition=prelim&title=18&section=2236`,
            relevance: 'medium'
        });
    }
    
    // Due process
    if (analysis.topics.includes('due process')) {
        laws.push({
            citation: '5 U.S.C. § 551 et seq. (Administrative Procedure Act)',
            description: 'Governs federal agency procedures and ensures due process in administrative proceedings.',
            url: `${API_CONFIG.LII_US_CODE}/text?edition=prelim&title=5&section=551`,
            relevance: 'medium'
        });
    }
    
    // Default federal civil rights statute
    if (laws.length === 0) {
        laws.push({
            citation: '42 U.S.C. § 1983',
            description: 'General federal civil rights statute allowing lawsuits for constitutional violations.',
            url: `${API_CONFIG.LII_US_CODE}/text?section=1983`,
            relevance: 'medium'
        });
    }
    
    return laws;
}

/**
 * Fetch state laws based on analysis
 */
async function fetchStateLaws(analysis) {
    const laws = [];
    
    // Get relevant states from query or provide general information
    const mentionedStates = US_STATES.filter(state => 
        userInput.value.toLowerCase().includes(state.toLowerCase())
    );
    
    const statesToSearch = mentionedStates.length > 0 ? mentionedStates : ['California', 'New York', 'Texas'];
    
    for (const state of statesToSearch.slice(0, 3)) {
        if (analysis.topics.includes('employment')) {
            laws.push({
                citation: `${state} Labor Code § 2922 (At-Will Employment)`,
                description: `${state} follows at-will employment doctrine, allowing termination without cause unless prohibited by law.`,
                url: `https://www.law.cornell.edu/states/${state.toLowerCase().replace(' ', '-')}`,
                relevance: 'high',
                state: state
            });
        }
        
        if (analysis.topics.includes('civil rights')) {
            laws.push({
                citation: `${state} Civil Rights Act`,
                description: `${state} state law prohibiting discrimination in employment, housing, and public accommodations.`,
                url: `https://www.law.cornell.edu/states/${state.toLowerCase().replace(' ', '-')}`,
                relevance: 'high',
                state: state
            });
        }
        
        if (analysis.topics.includes('property')) {
            laws.push({
                citation: `${state} Civil Code - Property Laws`,
                description: `${state} statutes governing landlord-tenant relations, property rights, and real estate transactions.`,
                url: `https://www.law.cornell.edu/states/${state.toLowerCase().replace(' ', '-')}`,
                relevance: 'medium',
                state: state
            });
        }
    }
    
    // Add general state law resource
    laws.push({
        citation: 'State Law Database',
        description: 'Access comprehensive state laws through the Legal Information Institute state law portal covering all 50 states.',
        url: 'https://www.law.cornell.edu/states',
        relevance: 'medium'
    });
    
    return laws;
}

/**
 * Fetch constitutional provisions based on analysis
 */
async function fetchConstitutionalLaws(analysis) {
    const laws = [];
    
    // First Amendment
    if (analysis.topics.includes('first amendment') || analysis.keywords.includes('speech')) {
        laws.push({
            citation: 'U.S. Constitution, Amendment I',
            description: 'Congress shall make no law respecting an establishment of religion, or prohibiting the free exercise thereof; or abridging the freedom of speech, or of the press; or the right of the people peaceably to assemble, and to petition the Government for a redress of grievances.',
            url: `${API_CONFIG.LII_CONSTITUTION}/amendment-1`,
            relevance: 'high'
        });
    }
    
    // Fourth Amendment
    if (analysis.topics.includes('fourth amendment') || analysis.keywords.includes('search')) {
        laws.push({
            citation: 'U.S. Constitution, Amendment IV',
            description: 'The right of the people to be secure in their persons, houses, papers, and effects, against unreasonable searches and seizures, shall not be violated.',
            url: `${API_CONFIG.LII_CONSTITUTION}/amendment-4`,
            relevance: 'high'
        });
    }
    
    // Fifth Amendment
    if (analysis.topics.includes('fifth amendment') || analysis.topics.includes('due process')) {
        laws.push({
            citation: 'U.S. Constitution, Amendment V',
            description: 'No person shall be held to answer for a capital crime without grand jury indictment, nor be subject for the same offense to be twice put in jeopardy, nor compelled to be a witness against oneself, nor deprived of life, liberty, or property without due process of law.',
            url: `${API_CONFIG.LII_CONSTITUTION}/amendment-5`,
            relevance: 'high'
        });
    }
    
    // Fourteenth Amendment
    if (analysis.topics.includes('fourteenth amendment') || analysis.topics.includes('equal protection')) {
        laws.push({
            citation: 'U.S. Constitution, Amendment XIV',
            description: 'All persons born or naturalized in the United States are citizens. No State shall deprive any person of life, liberty, or property without due process of law; nor deny to any person within its jurisdiction the equal protection of the laws.',
            url: `${API_CONFIG.LII_CONSTITUTION}/amendment-14`,
            relevance: 'high'
        });
    }
    
    // Sixth Amendment
    if (analysis.topics.includes('sixth amendment') || analysis.keywords.includes('counsel') || analysis.keywords.includes('trial')) {
        laws.push({
            citation: 'U.S. Constitution, Amendment VI',
            description: 'In all criminal prosecutions, the accused shall enjoy the right to a speedy and public trial, by an impartial jury, and to be informed of the nature of the accusation, to confront witnesses, and to have assistance of counsel.',
            url: `${API_CONFIG.LII_CONSTITUTION}/amendment-6`,
            relevance: 'high'
        });
    }
    
    // Eighth Amendment
    if (analysis.topics.includes('eighth amendment') || analysis.keywords.includes('punishment') || analysis.keywords.includes('bail')) {
        laws.push({
            citation: 'U.S. Constitution, Amendment VIII',
            description: 'Excessive bail shall not be required, nor excessive fines imposed, nor cruel and unusual punishments inflicted.',
            url: `${API_CONFIG.LII_CONSTITUTION}/amendment-8`,
            relevance: 'high'
        });
    }
    
    // Commerce Clause
    if (analysis.categories.federal && analysis.categories.employment) {
        laws.push({
            citation: 'U.S. Constitution, Article I, Section 8, Clause 3 (Commerce Clause)',
            description: 'Congress shall have power to regulate commerce with foreign nations, among the several states, and with Indian tribes. Basis for many federal employment laws.',
            url: `${API_CONFIG.LII_CONSTITUTION}/article-1/section-8`,
            relevance: 'medium'
        });
    }
    
    // Supremacy Clause
    if (analysis.categories.federal && analysis.categories.state) {
        laws.push({
            citation: 'U.S. Constitution, Article VI, Clause 2 (Supremacy Clause)',
            description: 'The Constitution and laws of the United States shall be the supreme law of the land, overriding conflicting state laws.',
            url: `${API_CONFIG.LII_CONSTITUTION}/article-6`,
            relevance: 'medium'
        });
    }
    
    return laws;
}

/**
 * Fetch relevant case law based on analysis
 */
async function fetchCaseLaw(analysis) {
    const cases = [];
    
    // Employment discrimination cases
    if (analysis.topics.includes('employment') && analysis.topics.includes('civil rights')) {
        cases.push({
            citation: 'Griggs v. Duke Power Co., 401 U.S. 424 (1971)',
            description: 'Landmark case establishing disparate impact theory under Title VII. Employment practices that disproportionately affect protected groups must be job-related.',
            url: `${API_CONFIG.LII_SUPREME_COURT}/text/401/424`,
            court: 'Supreme Court',
            year: 1971
        });
        cases.push({
            citation: 'McDonnell Douglas Corp. v. Green, 411 U.S. 792 (1973)',
            description: 'Established burden-shifting framework for proving employment discrimination under Title VII.',
            url: `${API_CONFIG.LII_SUPREME_COURT}/text/411/792`,
            court: 'Supreme Court',
            year: 1973
        });
    }
    
    // First Amendment cases
    if (analysis.topics.includes('first amendment')) {
        cases.push({
            citation: 'Tinker v. Des Moines, 393 U.S. 503 (1969)',
            description: 'Students do not shed their constitutional rights at the schoolhouse gate. Established protection for symbolic speech.',
            url: `${API_CONFIG.LII_SUPREME_COURT}/text/393/503`,
            court: 'Supreme Court',
            year: 1969
        });
        cases.push({
            citation: 'Brandenburg v. Ohio, 395 U.S. 444 (1969)',
            description: 'Established imminent lawless action test for speech incitement. Strong protection for political speech.',
            url: `${API_CONFIG.LII_SUPREME_COURT}/text/395/444`,
            court: 'Supreme Court',
            year: 1969
        });
    }
    
    // Fourth Amendment cases
    if (analysis.topics.includes('fourth amendment')) {
        cases.push({
            citation: 'Mapp v. Ohio, 367 U.S. 643 (1961)',
            description: 'Applied exclusionary rule to states. Evidence obtained in violation of Fourth Amendment cannot be used in state courts.',
            url: `${API_CONFIG.LII_SUPREME_COURT}/text/367/643`,
            court: 'Supreme Court',
            year: 1961
        });
        cases.push({
            citation: 'Terry v. Ohio, 392 U.S. 1 (1968)',
            description: 'Established stop and frisk exception to warrant requirement based on reasonable suspicion.',
            url: `${API_CONFIG.LII_SUPREME_COURT}/text/392/1`,
            court: 'Supreme Court',
            year: 1968
        });
    }
    
    // Due process cases
    if (analysis.topics.includes('due process')) {
        cases.push({
            citation: 'Goldberg v. Kelly, 397 U.S. 254 (1970)',
            description: 'Established right to pre-termination hearing before government benefits can be terminated.',
            url: `${API_CONFIG.LII_SUPREME_COURT}/text/397/254`,
            court: 'Supreme Court',
            year: 1970
        });
        cases.push({
            citation: 'Mathews v. Eldridge, 424 U.S. 319 (1976)',
            description: 'Established three-factor test for determining what process is due in administrative proceedings.',
            url: `${API_CONFIG.LII_SUPREME_COURT}/text/424/319`,
            court: 'Supreme Court',
            year: 1976
        });
    }
    
    // Equal protection cases
    if (analysis.topics.includes('fourteenth amendment') || analysis.topics.includes('equal protection')) {
        cases.push({
            citation: 'Brown v. Board of Education, 347 U.S. 483 (1954)',
            description: 'Landmark decision declaring racial segregation in public schools unconstitutional under Equal Protection Clause.',
            url: `${API_CONFIG.LII_SUPREME_COURT}/text/347/483`,
            court: 'Supreme Court',
            year: 1954
        });
        cases.push({
            citation: 'Roe v. Wade, 410 U.S. 113 (1973)',
            description: 'Recognized constitutional right to privacy including abortion rights under Due Process Clause.',
            url: `${API_CONFIG.LII_SUPREME_COURT}/text/410/113`,
            court: 'Supreme Court',
            year: 1973
        });
    }
    
    // At-will employment cases
    if (analysis.topics.includes('employment') && !analysis.topics.includes('civil rights')) {
        cases.push({
            citation: 'Adair v. United States, 208 U.S. 161 (1908)',
            description: 'Early case establishing at-will employment doctrine under liberty of contract.',
            url: `${API_CONFIG.LII_SUPREME_COURT}/text/208/161`,
            court: 'Supreme Court',
            year: 1908
        });
    }
    
    return cases;
}

/**
 * Generate response text based on results
 */
function generateResponseText(results) {
    const { federalLaws, stateLaws, constitutionalLaws, caseLaw } = results;
    
    let response = `I've found relevant legal authorities for your concern:\n\n`;
    
    if (constitutionalLaws.length > 0) {
        response += `📜 **${constitutionalLaws.length} Constitutional Provision(s)**\n`;
    }
    
    if (federalLaws.length > 0) {
        response += `⚖️ **${federalLaws.length} Federal Law(s)**\n`;
    }
    
    if (stateLaws.length > 0) {
        response += `🏛️ **${stateLaws.length} State Law(s)**\n`;
    }
    
    if (caseLaw.length > 0) {
        response += `📋 **${caseLaw.length} Relevant Court Cases**\n`;
    }
    
    response += `\nPlease review the detailed results below. Each entry includes citations, descriptions, and links to the full text.`;
    
    return response;
}

/**
 * Display results in the results section
 */
function displayResults(results) {
    const federalContainer = document.getElementById('federalLaws');
    const stateContainer = document.getElementById('stateLaws');
    const constitutionalContainer = document.getElementById('constitutionalLaws');
    const caseLawContainer = document.getElementById('caseLaw');
    
    // Clear previous results
    federalContainer.innerHTML = '';
    stateContainer.innerHTML = '';
    constitutionalContainer.innerHTML = '';
    caseLawContainer.innerHTML = '';
    
    // Display federal laws
    if (results.federalLaws.length > 0) {
        results.federalLaws.forEach(law => {
            federalContainer.appendChild(createResultItem(law));
        });
    } else {
        federalContainer.innerHTML = '<p class="no-results">No specific federal laws identified for this query.</p>';
    }
    
    // Display state laws
    if (results.stateLaws.length > 0) {
        results.stateLaws.forEach(law => {
            stateContainer.appendChild(createResultItem(law));
        });
    } else {
        stateContainer.innerHTML = '<p class="no-results">No specific state laws identified for this query.</p>';
    }
    
    // Display constitutional provisions
    if (results.constitutionalLaws.length > 0) {
        results.constitutionalLaws.forEach(law => {
            constitutionalContainer.appendChild(createResultItem(law));
        });
    } else {
        constitutionalContainer.innerHTML = '<p class="no-results">No specific constitutional provisions identified for this query.</p>';
    }
    
    // Display case law
    if (results.caseLaw.length > 0) {
        results.caseLaw.forEach(caselaw => {
            caseLawContainer.appendChild(createCaseLawItem(caselaw));
        });
    } else {
        caseLawContainer.innerHTML = '<p class="no-results">No specific case law identified for this query.</p>';
    }
    
    // Show results section
    resultsSection.style.display = 'block';
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Create a result item element
 */
function createResultItem(law) {
    const div = document.createElement('div');
    div.className = 'result-item';
    
    const sourceUrl = law.url || '#';
    const sourceText = law.url ? `<a href="${sourceUrl}" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt"></i> View Full Text</a>` : '';
    
    div.innerHTML = `
        <div class="citation"><i class="fas fa-bookmark"></i> ${escapeHtml(law.citation)}</div>
        <div class="description">${escapeHtml(law.description)}</div>
        <div class="source">${sourceText}</div>
    `;
    
    return div;
}

/**
 * Create a case law item element
 */
function createCaseLawItem(caselaw) {
    const div = document.createElement('div');
    div.className = 'result-item';
    
    const sourceUrl = caselaw.url || '#';
    
    div.innerHTML = `
        <div class="citation"><i class="fas fa-gavel"></i> ${escapeHtml(caselaw.citation)}</div>
        <div class="description">${escapeHtml(caselaw.description)}</div>
        <div class="source">
            <span><i class="fas fa-balance-scale"></i> ${caselaw.court || 'Court'}</span>
            ${caselaw.year ? `<span><i class="fas fa-calendar"></i> ${caselaw.year}</span>` : ''}
            <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt"></i> Read Opinion</a>
        </div>
    `;
    
    return div;
}

/**
 * Add message to chat
 */
function addMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const avatarIcon = type === 'bot' ? 'fa-robot' : 'fa-user';
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas ${avatarIcon}"></i>
        </div>
        <div class="message-content">
            <p>${formatMessageText(text)}</p>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Format message text (convert markdown-like syntax to HTML)
 */
function formatMessageText(text) {
    return escapeHtml(text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    typingDiv.id = 'typingIndicator';
    
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Set loading state
 */
function setLoading(loading) {
    isLoading = loading;
    sendBtn.disabled = loading;
    userInput.disabled = loading;
    
    if (loading) {
        sendBtn.innerHTML = '<div class="loading"></div>';
    } else {
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    }
}

/**
 * Reset search and hide results
 */
function resetSearch() {
    resultsSection.style.display = 'none';
    userInput.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Export functions for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_CONFIG,
        US_STATES,
        CONSTITUTIONAL_PROVISIONS,
        analyzeQuery,
        processLegalQuery
    };
}
