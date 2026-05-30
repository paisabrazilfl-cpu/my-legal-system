/**
 * Legal Research Service
 * Enterprise-level service for querying federal, state, and constitutional laws
 * Integrates with public legal data APIs
 */

const axios = require('axios');

// Legal Data API Configuration
const LEGAL_APIS = {
    // Cornell Legal Information Institute
    LII_BASE: 'https://www.law.cornell.edu',
    LII_US_CODE: 'https://www.law.cornell.edu/uscode/text',
    LII_CFR: 'https://www.law.cornell.edu/cfr/text',
    LII_CONSTITUTION: 'https://www.law.cornell.edu/constitution',
    LII_SUPREME_COURT: 'https://www.law.cornell.edu/supremecourt/text',
    
    // Congress.gov API
    CONGRESS_API: 'https://api.congress.gov/v3',
    
    // CourtListener (Free Law Project)
    COURT_LISTENER: 'https://www.courtlistener.com/api/rest/v4',
    
    // State Laws Directory
    STATE_LAWS: 'https://www.law.cornell.edu/states'
};

// All 50 US States with codes
const US_STATES = [
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

class LegalResearchService {
    constructor() {
        this.requestTimeout = 10000; // 10 seconds
    }

    /**
     * Analyze user query to identify legal topics and categories
     */
    analyzeQuery(query) {
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
                contracts: false,
                immigration: false,
                bankruptcy: false,
                tax: false
            },
            mentionedStates: []
        };

        // Topic detection map
        const topicMap = {
            'discrimination': ['employment', 'civil rights'],
            'termination': ['employment', 'contracts'],
            'fired': ['employment'],
            'hired': ['employment'],
            'speech': ['first amendment', 'constitutional'],
            'religion': ['first amendment', 'constitutional'],
            'press': ['first amendment', 'constitutional'],
            'assembly': ['first amendment', 'constitutional'],
            'petition': ['first amendment', 'constitutional'],
            'search': ['fourth amendment', 'criminal'],
            'seizure': ['fourth amendment', 'criminal'],
            'warrant': ['fourth amendment', 'criminal'],
            'arrest': ['criminal', 'due process'],
            'contract': ['contracts', 'civil'],
            'agreement': ['contracts', 'civil'],
            'property': ['property', 'civil'],
            'real estate': ['property'],
            'landlord': ['property', 'contracts'],
            'tenant': ['property', 'contracts'],
            'eviction': ['property'],
            'divorce': ['family'],
            'custody': ['family'],
            'child support': ['family'],
            'alimony': ['family'],
            'wage': ['employment'],
            'salary': ['employment'],
            'overtime': ['employment'],
            'harassment': ['employment', 'civil rights'],
            'hostile work': ['employment', 'civil rights'],
            'voting': ['constitutional', 'civil rights'],
            'election': ['constitutional', 'civil rights'],
            'counsel': ['sixth amendment', 'criminal'],
            'lawyer': ['sixth amendment', 'criminal'],
            'attorney': ['sixth amendment', 'criminal'],
            'trial': ['criminal', 'constitutional'],
            'jury': ['sixth amendment', 'seventh amendment'],
            'bail': ['eighth amendment', 'criminal'],
            'punishment': ['eighth amendment', 'criminal'],
            'sentence': ['criminal', 'eighth amendment'],
            'equal protection': ['fourteenth amendment', 'constitutional'],
            'due process': ['fifth amendment', 'fourteenth amendment'],
            'self-incrimination': ['fifth amendment'],
            'double jeopardy': ['fifth amendment'],
            'grand jury': ['fifth amendment'],
            'cruel': ['eighth amendment'],
            'unusual punishment': ['eighth amendment'],
            'bear arms': ['second amendment'],
            'gun': ['second amendment'],
            'immigration': ['immigration', 'federal'],
            'deportation': ['immigration'],
            'visa': ['immigration'],
            'citizenship': ['immigration', 'constitutional'],
            'bankruptcy': ['bankruptcy', 'federal'],
            'tax': ['tax', 'federal'],
            'irs': ['tax']
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
        if (lowerQuery.includes('federal') || lowerQuery.includes('united states') || lowerQuery.includes('u.s.')) {
            analysis.categories.federal = true;
        }
        if (lowerQuery.includes('state')) {
            analysis.categories.state = true;
        }
        if (lowerQuery.includes('crime') || lowerQuery.includes('criminal') || lowerQuery.includes('prosecution')) {
            analysis.categories.criminal = true;
        }
        if (lowerQuery.includes('job') || lowerQuery.includes('work') || lowerQuery.includes('employer') || lowerQuery.includes('employee')) {
            analysis.categories.employment = true;
        }

        // Detect mentioned states
        US_STATES.forEach(state => {
            if (lowerQuery.includes(state.name.toLowerCase()) || lowerQuery.includes(state.code.toLowerCase())) {
                analysis.mentionedStates.push(state);
                analysis.categories.state = true;
            }
        });

        // Remove duplicates
        analysis.topics = [...new Set(analysis.topics)];
        analysis.keywords = [...new Set(analysis.keywords)];

        return analysis;
    }

    /**
     * Get relevant federal laws based on analysis
     */
    async getFederalLaws(analysis) {
        const laws = [];

        // Employment & Civil Rights
        if (analysis.topics.includes('employment') || analysis.topics.includes('civil rights')) {
            laws.push({
                citation: '42 U.S.C. § 2000e et seq. (Title VII of the Civil Rights Act of 1964)',
                description: 'Prohibits employment discrimination based on race, color, religion, sex, and national origin. Applies to employers with 15 or more employees.',
                url: `${LEGAL_APIS.LII_US_CODE}/2000e`,
                relevance: 'high',
                category: 'employment'
            });
            laws.push({
                citation: '29 U.S.C. § 201 et seq. (Fair Labor Standards Act - FLSA)',
                description: 'Establishes minimum wage, overtime pay eligibility, recordkeeping, and child labor standards affecting full-time and part-time workers.',
                url: `${LEGAL_APIS.LII_US_CODE}/201`,
                relevance: 'high',
                category: 'employment'
            });
            laws.push({
                citation: '42 U.S.C. § 12101 et seq. (Americans with Disabilities Act - ADA)',
                description: 'Prohibits discrimination against individuals with disabilities in all areas of public life, including jobs, schools, transportation, and public places.',
                url: `${LEGAL_APIS.LII_US_CODE}/12101`,
                relevance: 'medium',
                category: 'civil-rights'
            });
            laws.push({
                citation: '29 U.S.C. § 2601 et seq. (Family and Medical Leave Act - FMLA)',
                description: 'Entitles eligible employees to take unpaid, job-protected leave for specified family and medical reasons with continuation of group health insurance coverage.',
                url: `${LEGAL_APIS.LII_US_CODE}/2601`,
                relevance: 'medium',
                category: 'employment'
            });
        }

        // First Amendment
        if (analysis.topics.includes('first amendment')) {
            laws.push({
                citation: '42 U.S.C. § 1983 (Civil Rights Act of 1871)',
                description: 'Federal statute allowing individuals to sue state and local officials for deprivation of constitutional rights under color of state law.',
                url: `${LEGAL_APIS.LII_US_CODE}/1983`,
                relevance: 'high',
                category: 'civil-rights'
            });
            laws.push({
                citation: '5 U.S.C. § 2302 (Whistleblower Protection Act)',
                description: 'Protects federal employees who disclose information about violations of law, rule, or regulation, gross mismanagement, waste of funds, abuse of authority, or substantial danger to public health or safety.',
                url: `${LEGAL_APIS.LII_US_CODE}/2302`,
                relevance: 'medium',
                category: 'employment'
            });
        }

        // Fourth Amendment
        if (analysis.topics.includes('fourth amendment')) {
            laws.push({
                citation: '18 U.S.C. § 2236',
                description: 'Criminal penalties for unauthorized search and seizure by federal agents acting under color of law.',
                url: `${LEGAL_APIS.LII_US_CODE}/2236`,
                relevance: 'high',
                category: 'criminal'
            });
            laws.push({
                citation: '28 U.S.C. § 2680 (Federal Tort Claims Act exceptions)',
                description: 'Governs liability of federal government for torts committed by federal employees, with exceptions for certain law enforcement activities.',
                url: `${LEGAL_APIS.LII_US_CODE}/2680`,
                relevance: 'medium',
                category: 'civil'
            });
        }

        // Fifth Amendment / Due Process
        if (analysis.topics.includes('fifth amendment') || analysis.topics.includes('due process')) {
            laws.push({
                citation: '5 U.S.C. § 551 et seq. (Administrative Procedure Act - APA)',
                description: 'Governs federal agency procedures and ensures due process in administrative proceedings. Provides right to notice and hearing before adverse agency action.',
                url: `${LEGAL_APIS.LII_US_CODE}/551`,
                relevance: 'high',
                category: 'administrative'
            });
            laws.push({
                citation: '28 U.S.C. § 2241 et seq. (Habeas Corpus)',
                description: 'Provides writ of habeas corpus to challenge unlawful detention or imprisonment, implementing Fifth Amendment due process protections.',
                url: `${LEGAL_APIS.LII_US_CODE}/2241`,
                relevance: 'medium',
                category: 'criminal'
            });
        }

        // Fourteenth Amendment / Equal Protection
        if (analysis.topics.includes('fourteenth amendment') || analysis.topics.includes('equal protection')) {
            laws.push({
                citation: '42 U.S.C. § 1981',
                description: 'Guarantees all persons within the United States the same right to make and enforce contracts, sue, be parties, give evidence, and enjoy full and equal benefit of all laws.',
                url: `${LEGAL_APIS.LII_US_CODE}/1981`,
                relevance: 'high',
                category: 'civil-rights'
            });
            laws.push({
                citation: '42 U.S.C. § 1985',
                description: 'Prohibits conspiracies to deprive persons of equal protection of the laws or equal privileges and immunities under the laws.',
                url: `${LEGAL_APIS.LII_US_CODE}/1985`,
                relevance: 'medium',
                category: 'civil-rights'
            });
        }

        // Sixth Amendment
        if (analysis.topics.includes('sixth amendment')) {
            laws.push({
                citation: '18 U.S.C. § 3006A (Criminal Justice Act)',
                description: 'Provides for representation and payment of counsel for defendants unable to obtain counsel in federal criminal proceedings.',
                url: `${LEGAL_APIS.LII_US_CODE}/3006A`,
                relevance: 'high',
                category: 'criminal'
            });
            laws.push({
                citation: 'Speedy Trial Act, 18 U.S.C. § 3161 et seq.',
                description: 'Establishes time limits for completing various stages of a federal criminal prosecution to ensure speedy trial rights.',
                url: `${LEGAL_APIS.LII_US_CODE}/3161`,
                relevance: 'high',
                category: 'criminal'
            });
        }

        // Eighth Amendment
        if (analysis.topics.includes('eighth amendment')) {
            laws.push({
                citation: '18 U.S.C. § 3553 (Sentencing factors)',
                description: 'Sets forth factors to be considered in imposing sentence, including requirement that sentence be sufficient but not greater than necessary.',
                url: `${LEGAL_APIS.LII_US_CODE}/3553`,
                relevance: 'medium',
                category: 'criminal'
            });
        }

        // Immigration
        if (analysis.topics.includes('immigration')) {
            laws.push({
                citation: '8 U.S.C. § 1101 et seq. (Immigration and Nationality Act - INA)',
                description: 'Comprehensive federal law governing immigration, naturalization, deportation, and removal proceedings.',
                url: `${LEGAL_APIS.LII_US_CODE}/1101`,
                relevance: 'high',
                category: 'immigration'
            });
        }

        // Bankruptcy
        if (analysis.topics.includes('bankruptcy')) {
            laws.push({
                citation: '11 U.S.C. § 101 et seq. (Bankruptcy Code)',
                description: 'Federal law governing bankruptcy proceedings, including Chapter 7 liquidation, Chapter 11 reorganization, and Chapter 13 individual debt adjustment.',
                url: `${LEGAL_APIS.LII_US_CODE}/101`,
                relevance: 'high',
                category: 'bankruptcy'
            });
        }

        // Tax
        if (analysis.topics.includes('tax')) {
            laws.push({
                citation: '26 U.S.C. (Internal Revenue Code)',
                description: 'Comprehensive federal tax law covering income taxes, estate taxes, gift taxes, employment taxes, and procedural rules.',
                url: `${LEGAL_APIS.LII_US_CODE}`,
                relevance: 'high',
                category: 'tax'
            });
        }

        // Default federal civil rights statute
        if (laws.length === 0) {
            laws.push({
                citation: '42 U.S.C. § 1983',
                description: 'General federal civil rights statute allowing lawsuits for constitutional violations by persons acting under color of state law.',
                url: `${LEGAL_APIS.LII_US_CODE}/1983`,
                relevance: 'medium',
                category: 'civil-rights'
            });
            laws.push({
                citation: '28 U.S.C. § 1331 (Federal Question Jurisdiction)',
                description: 'Grants federal district courts jurisdiction over civil actions arising under the Constitution, laws, or treaties of the United States.',
                url: `${LEGAL_APIS.LII_US_CODE}/1331`,
                relevance: 'medium',
                category: 'procedure'
            });
        }

        return laws;
    }

    /**
     * Get relevant state laws based on analysis
     */
    async getStateLaws(analysis, query) {
        const laws = [];
        
        // Determine which states to include
        let statesToInclude = analysis.mentionedStates;
        if (statesToInclude.length === 0) {
            // Default to major states with comprehensive legal databases
            statesToInclude = [
                { name: 'California', code: 'CA' },
                { name: 'New York', code: 'NY' },
                { name: 'Texas', code: 'TX' },
                { name: 'Florida', code: 'FL' },
                { name: 'Illinois', code: 'IL' }
            ];
        }

        // Limit to top 5 states
        statesToInclude = statesToInclude.slice(0, 5);

        for (const state of statesToInclude) {
            const stateSlug = state.name.toLowerCase().replace(' ', '-');
            
            if (analysis.topics.includes('employment')) {
                laws.push({
                    citation: `${state.name} Labor Code`,
                    description: `${state.name} state laws governing employment relationships, wages, hours, working conditions, and worker protections. ${state.name} ${this.getEmploymentNote(state.code)}.`,
                    url: `${LEGAL_APIS.STATE_LAWS}/${stateSlug}/labor`,
                    relevance: 'high',
                    state: state.name,
                    category: 'employment'
                });
            }

            if (analysis.topics.includes('civil rights') || analysis.topics.includes('discrimination')) {
                laws.push({
                    citation: `${state.name} Civil Rights Act`,
                    description: `${state.name} state law prohibiting discrimination in employment, housing, education, and public accommodations based on protected characteristics.`,
                    url: `${LEGAL_APIS.STATE_LAWS}/${stateSlug}/civil-rights`,
                    relevance: 'high',
                    state: state.name,
                    category: 'civil-rights'
                });
            }

            if (analysis.topics.includes('property') || analysis.topics.includes('landlord') || analysis.topics.includes('tenant')) {
                laws.push({
                    citation: `${state.name} Civil Code - Property Laws`,
                    description: `${state.name} statutes governing landlord-tenant relationships, residential and commercial leases, evictions, security deposits, and property rights.`,
                    url: `${LEGAL_APIS.STATE_LAWS}/${stateSlug}/property`,
                    relevance: 'high',
                    state: state.name,
                    category: 'property'
                });
            }

            if (analysis.topics.includes('family')) {
                laws.push({
                    citation: `${state.name} Family Code`,
                    description: `${state.name} laws governing marriage, divorce, child custody, child support, spousal support, adoption, and domestic relations.`,
                    url: `${LEGAL_APIS.STATE_LAWS}/${stateSlug}/family`,
                    relevance: 'high',
                    state: state.name,
                    category: 'family'
                });
            }

            if (analysis.topics.includes('contracts')) {
                laws.push({
                    citation: `${state.name} Contract Law`,
                    description: `${state.name} common law and statutory provisions governing contract formation, interpretation, breach, and remedies.`,
                    url: `${LEGAL_APIS.STATE_LAWS}/${stateSlug}/contracts`,
                    relevance: 'medium',
                    state: state.name,
                    category: 'contracts'
                });
            }

            if (analysis.categories.criminal) {
                laws.push({
                    citation: `${state.name} Penal Code`,
                    description: `${state.name} criminal statutes defining offenses, penalties, and procedures for prosecution of crimes under state law.`,
                    url: `${LEGAL_APIS.STATE_LAWS}/${stateSlug}/penal`,
                    relevance: 'high',
                    state: state.name,
                    category: 'criminal'
                });
            }
        }

        // Add general state law resource
        laws.push({
            citation: 'State Law Database (All 50 States)',
            description: 'Comprehensive collection of state laws, regulations, and court decisions from all 50 U.S. states, accessible through the Legal Information Institute.',
            url: LEGAL_APIS.STATE_LAWS,
            relevance: 'medium',
            category: 'general'
        });

        return laws;
    }

    /**
     * Helper method for state-specific employment notes
     */
    getEmploymentNote(stateCode) {
        const notes = {
            'CA': 'is an at-will employment state with extensive worker protections including meal breaks, rest periods, and overtime requirements',
            'NY': 'follows at-will employment doctrine with strong anti-discrimination and wage protection laws',
            'TX': 'is an at-will employment state with no state income tax and business-friendly regulations',
            'FL': 'follows at-will employment with right-to-work laws prohibiting mandatory union membership',
            'IL': 'requires employers to provide paid sick leave and has strong wage protection laws'
        };
        return notes[stateCode] || 'follows applicable state and federal employment laws';
    }

    /**
     * Get relevant constitutional provisions based on analysis
     */
    async getConstitutionalLaws(analysis) {
        const laws = [];

        // First Amendment
        if (analysis.topics.includes('first amendment') || 
            analysis.keywords.includes('speech') || 
            analysis.keywords.includes('religion') ||
            analysis.keywords.includes('press') ||
            analysis.keywords.includes('assembly')) {
            laws.push({
                citation: 'U.S. Constitution, Amendment I (First Amendment)',
                description: 'Congress shall make no law respecting an establishment of religion, or prohibiting the free exercise thereof; or abridging the freedom of speech, or of the press; or the right of the people peaceably to assemble, and to petition the Government for a redress of grievances.',
                url: `${LEGAL_APIS.LII_CONSTITUTION}/amendment-1`,
                relevance: 'high',
                category: 'fundamental-rights'
            });
        }

        // Second Amendment
        if (analysis.keywords.includes('bear arms') || analysis.keywords.includes('gun')) {
            laws.push({
                citation: 'U.S. Constitution, Amendment II (Second Amendment)',
                description: 'A well regulated Militia, being necessary to the security of a free State, the right of the people to keep and bear Arms, shall not be infringed.',
                url: `${LEGAL_APIS.LII_CONSTITUTION}/amendment-2`,
                relevance: 'high',
                category: 'fundamental-rights'
            });
        }

        // Fourth Amendment
        if (analysis.topics.includes('fourth amendment') || 
            analysis.keywords.includes('search') || 
            analysis.keywords.includes('seizure') ||
            analysis.keywords.includes('warrant')) {
            laws.push({
                citation: 'U.S. Constitution, Amendment IV (Fourth Amendment)',
                description: 'The right of the people to be secure in their persons, houses, papers, and effects, against unreasonable searches and seizures, shall not be violated, and no Warrants shall issue, but upon probable cause, supported by Oath or affirmation, and particularly describing the place to be searched, and the persons or things to be seized.',
                url: `${LEGAL_APIS.LII_CONSTITUTION}/amendment-4`,
                relevance: 'high',
                category: 'criminal-procedure'
            });
        }

        // Fifth Amendment
        if (analysis.topics.includes('fifth amendment') || 
            analysis.keywords.includes('self-incrimination') ||
            analysis.keywords.includes('double jeopardy') ||
            analysis.keywords.includes('grand jury') ||
            analysis.topics.includes('due process')) {
            laws.push({
                citation: 'U.S. Constitution, Amendment V (Fifth Amendment)',
                description: 'No person shall be held to answer for a capital, or otherwise infamous crime, unless on a presentment or indictment of a Grand Jury, nor shall any person be subject for the same offense to be twice put in jeopardy of life or limb; nor shall be compelled in any criminal case to be a witness against himself, nor be deprived of life, liberty, or property, without due process of law; nor shall private property be taken for public use, without just compensation.',
                url: `${LEGAL_APIS.LII_CONSTITUTION}/amendment-5`,
                relevance: 'high',
                category: 'criminal-procedure'
            });
        }

        // Sixth Amendment
        if (analysis.topics.includes('sixth amendment') || 
            analysis.keywords.includes('counsel') ||
            analysis.keywords.includes('lawyer') ||
            analysis.keywords.includes('trial') ||
            analysis.keywords.includes('jury')) {
            laws.push({
                citation: 'U.S. Constitution, Amendment VI (Sixth Amendment)',
                description: 'In all criminal prosecutions, the accused shall enjoy the right to a speedy and public trial, by an impartial jury of the State and district wherein the crime shall have been committed, to be informed of the nature and cause of the accusation; to be confronted with the witnesses against him; to have compulsory process for obtaining witnesses in his favor, and to have the Assistance of Counsel for his defence.',
                url: `${LEGAL_APIS.LII_CONSTITUTION}/amendment-6`,
                relevance: 'high',
                category: 'criminal-procedure'
            });
        }

        // Eighth Amendment
        if (analysis.topics.includes('eighth amendment') || 
            analysis.keywords.includes('bail') ||
            analysis.keywords.includes('punishment') ||
            analysis.keywords.includes('cruel')) {
            laws.push({
                citation: 'U.S. Constitution, Amendment VIII (Eighth Amendment)',
                description: 'Excessive bail shall not be required, nor excessive fines imposed, nor cruel and unusual punishments inflicted.',
                url: `${LEGAL_APIS.LII_CONSTITUTION}/amendment-8`,
                relevance: 'high',
                category: 'criminal-procedure'
            });
        }

        // Fourteenth Amendment
        if (analysis.topics.includes('fourteenth amendment') || 
            analysis.topics.includes('equal protection') ||
            analysis.topics.includes('due process')) {
            laws.push({
                citation: 'U.S. Constitution, Amendment XIV (Fourteenth Amendment)',
                description: 'All persons born or naturalized in the United States, and subject to the jurisdiction thereof, are citizens of the United States and of the State wherein they reside. No State shall make or enforce any law which shall abridge the privileges or immunities of citizens of the United States; nor shall any State deprive any person of life, liberty, or property, without due process of law; nor deny to any person within its jurisdiction the equal protection of the laws.',
                url: `${LEGAL_APIS.LII_CONSTITUTION}/amendment-14`,
                relevance: 'high',
                category: 'fundamental-rights'
            });
        }

        // Commerce Clause
        if (analysis.categories.federal && (analysis.categories.employment || analysis.categories.civil)) {
            laws.push({
                citation: 'U.S. Constitution, Article I, Section 8, Clause 3 (Commerce Clause)',
                description: 'The Congress shall have Power To regulate Commerce with foreign Nations, and among the several States, and with the Indian Tribes. This clause provides the constitutional basis for most federal employment and civil rights legislation.',
                url: `${LEGAL_APIS.LII_CONSTITUTION}/article-1/section-8`,
                relevance: 'medium',
                category: 'federal-power'
            });
        }

        // Supremacy Clause
        if (analysis.categories.federal && analysis.categories.state) {
            laws.push({
                citation: 'U.S. Constitution, Article VI, Clause 2 (Supremacy Clause)',
                description: 'This Constitution, and the Laws of the United States which shall be made in Pursuance thereof; and all Treaties made, or which shall be made, under the Authority of the United States, shall be the supreme Law of the Land; and the Judges in every State shall be bound thereby, any Thing in the Constitution or Laws of any State to the Contrary notwithstanding.',
                url: `${LEGAL_APIS.LII_CONSTITUTION}/article-6`,
                relevance: 'medium',
                category: 'federalism'
            });
        }

        // Thirteenth Amendment
        if (analysis.keywords.includes('slavery') || analysis.topics.includes('civil rights')) {
            laws.push({
                citation: 'U.S. Constitution, Amendment XIII (Thirteenth Amendment)',
                description: 'Neither slavery nor involuntary servitude, except as a punishment for crime whereof the party shall have been duly convicted, shall exist within the United States, or any place subject to their jurisdiction.',
                url: `${LEGAL_APIS.LII_CONSTITUTION}/amendment-13`,
                relevance: 'medium',
                category: 'fundamental-rights'
            });
        }

        return laws;
    }

    /**
     * Get relevant case law based on analysis
     */
    async getCaseLaw(analysis) {
        const cases = [];

        // Employment Discrimination Cases
        if (analysis.topics.includes('employment') && analysis.topics.includes('civil rights')) {
            cases.push({
                citation: 'Griggs v. Duke Power Co., 401 U.S. 424 (1971)',
                description: 'Landmark Supreme Court decision establishing the disparate impact theory under Title VII. Employment practices that are facially neutral but disproportionately affect protected groups must be job-related and consistent with business necessity.',
                url: `${LEGAL_APIS.LII_SUPREME_COURT}/401/424`,
                court: 'U.S. Supreme Court',
                year: 1971,
                category: 'employment'
            });
            cases.push({
                citation: 'McDonnell Douglas Corp. v. Green, 411 U.S. 792 (1973)',
                description: 'Established the burden-shifting framework for proving employment discrimination under Title VII when direct evidence is unavailable.',
                url: `${LEGAL_APIS.LII_SUPREME_COURT}/411/792`,
                court: 'U.S. Supreme Court',
                year: 1973,
                category: 'employment'
            });
            cases.push({
                citation: 'Texas Dept. of Housing v. Inclusive Communities Project, 576 U.S. 519 (2015)',
                description: 'Confirmed that disparate impact claims are cognizable under the Fair Housing Act, extending Griggs principles to housing discrimination.',
                url: `${LEGAL_APIS.LII_SUPREME_COURT}/576/519`,
                court: 'U.S. Supreme Court',
                year: 2015,
                category: 'civil-rights'
            });
        }

        // First Amendment Cases
        if (analysis.topics.includes('first amendment')) {
            cases.push({
                citation: 'Tinker v. Des Moines Independent Community School District, 393 U.S. 503 (1969)',
                description: 'Students do not "shed their constitutional rights to freedom of speech or expression at the schoolhouse gate." Established protection for symbolic speech.',
                url: `${LEGAL_APIS.LII_SUPREME_COURT}/393/503`,
                court: 'U.S. Supreme Court',
                year: 1969,
                category: 'first-amendment'
            });
            cases.push({
                citation: 'Brandenburg v. Ohio, 395 U.S. 444 (1969)',
                description: 'Established the "imminent lawless action" test for speech incitement. Speech can only be prohibited if it is directed to inciting imminent lawless action and is likely to produce such action.',
                url: `${LEGAL_APIS.LII_SUPREME_COURT}/395/444`,
                court: 'U.S. Supreme Court',
                year: 1969,
                category: 'first-amendment'
            });
            cases.push({
                citation: 'Citizens United v. FEC, 558 U.S. 310 (2010)',
                description: 'Political spending is a form of protected speech under the First Amendment. Government cannot restrict independent political expenditures by corporations or unions.',
                url: `${LEGAL_APIS.LII_SUPREME_COURT}/558/310`,
                court: 'U.S. Supreme Court',
                year: 2010,
                category: 'first-amendment'
            });
        }

        // Fourth Amendment Cases
        if (analysis.topics.includes('fourth amendment')) {
            cases.push({
                citation: 'Mapp v. Ohio, 367 U.S. 643 (1961)',
                description: 'Applied the exclusionary rule to the states through the Fourteenth Amendment. Evidence obtained in violation of the Fourth Amendment cannot be used in state criminal prosecutions.',
                url: `${LEGAL_APIS.LII_SUPREME_COURT}/367/643`,
                court: 'U.S. Supreme Court',
                year: 1961,
                category: 'fourth-amendment'
            });
            cases.push({
                citation: 'Terry v. Ohio, 392 U.S. 1 (1968)',
                description: 'Established the "stop and frisk" exception to the warrant requirement. Police may briefly detain and pat down a person based on reasonable suspicion of criminal activity.',
                url: `${LEGAL_APIS.LII_SUPREME_COURT}/392/1`,
                court: 'U.S. Supreme Court',
                year: 1968,
                category: 'fourth-amendment'
            });
            cases.push({
                citation: 'Miranda v. Arizona, 384 U.S. 436 (1966)',
                description: 'Required police to inform suspects of their Fifth Amendment rights before custodial interrogation, including right to remain silent and right to counsel.',
                url: `${LEGAL_APIS.LII_SUPREME_COURT}/384/436`,
                court: 'U.S. Supreme Court',
                year: 1966,
                category: 'fifth-amendment'
            });
        }

        // Due Process Cases
        if (analysis.topics.includes('due process')) {
            cases.push({
                citation: 'Goldberg v. Kelly, 397 U.S. 254 (1970)',
                description: 'Established that recipients of welfare benefits have a property interest requiring a pre-termination evidentiary hearing before benefits can be discontinued.',
                url: `${LEGAL_APIS.LII_SUPREME_COURT}/397/254`,
                court: 'U.S. Supreme Court',
                year: 1970,
                category: 'due-process'
            });
            cases.push({
                citation: 'Mathews v. Eldridge, 424 U.S. 319 (1976)',
                description: 'Established the three-factor test for determining what process is due: (1) private interest affected, (2) risk of erroneous deprivation, and (3) government interest.',
                url: `${LEGAL_APIS.LII_SUPREME_COURT}/424/319`,
                court: 'U.S. Supreme Court',
                year: 1976,
                category: 'due-process'
            });
        }

        // Equal Protection Cases
        if (analysis.topics.includes('fourteenth amendment') || analysis.topics.includes('equal protection')) {
            cases.push({
                citation: 'Brown v. Board of Education of Topeka, 347 U.S. 483 (1954)',
                description: 'Landmark decision declaring racial segregation in public schools unconstitutional. "Separate educational facilities are inherently unequal" under the Equal Protection Clause.',
                url: `${LEGAL_APIS.LII_SUPREME_COURT}/347/483`,
                court: 'U.S. Supreme Court',
                year: 1954,
                category: 'equal-protection'
            });
            cases.push({
                citation: 'Roe v. Wade, 410 U.S. 113 (1973)',
                description: 'Recognized a constitutional right to privacy encompassing a woman\'s decision to have an abortion, grounded in the Due Process Clause of the Fourteenth Amendment.',
                url: `${LEGAL_APIS.LII_SUPREME_COURT}/410/113`,
                court: 'U.S. Supreme Court',
                year: 1973,
                category: 'due-process'
            });
            cases.push({
                citation: 'Obergefell v. Hodges, 576 U.S. 644 (2015)',
                description: 'Same-sex couples have a fundamental right to marry under both the Due Process and Equal Protection Clauses of the Fourteenth Amendment.',
                url: `${LEGAL_APIS.LII_SUPREME_COURT}/576/644`,
                court: 'U.S. Supreme Court',
                year: 2015,
                category: 'equal-protection'
            });
        }

        // At-Will Employment Cases
        if (analysis.topics.includes('employment') && !analysis.topics.includes('civil rights')) {
            cases.push({
                citation: 'Adair v. United States, 208 U.S. 161 (1908)',
                description: 'Early Supreme Court case establishing the at-will employment doctrine under liberty of contract principles.',
                url: `${LEGAL_APIS.LII_SUPREME_COURT}/208/161`,
                court: 'U.S. Supreme Court',
                year: 1908,
                category: 'employment'
            });
        }

        return cases;
    }

    /**
     * Main method to process legal query and return comprehensive results
     */
    async processQuery(query) {
        try {
            // Analyze the query
            const analysis = this.analyzeQuery(query);
            
            // Fetch all relevant legal authorities in parallel
            const [federalLaws, stateLaws, constitutionalLaws, caseLaw] = await Promise.all([
                this.getFederalLaws(analysis),
                this.getStateLaws(analysis, query),
                this.getConstitutionalLaws(analysis),
                this.getCaseLaw(analysis)
            ]);

            return {
                success: true,
                query,
                analysis,
                results: {
                    federalLaws,
                    stateLaws,
                    constitutionalLaws,
                    caseLaw
                },
                summary: {
                    totalFederalLaws: federalLaws.length,
                    totalStateLaws: stateLaws.length,
                    totalConstitutionalLaws: constitutionalLaws.length,
                    totalCaseLaw: caseLaw.length
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error processing legal query:', error);
            throw new Error(`Failed to process legal query: ${error.message}`);
        }
    }
}

module.exports = new LegalResearchService();
