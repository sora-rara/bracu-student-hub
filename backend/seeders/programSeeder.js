const mongoose = require('mongoose');
const Program = require('../models/Program');
require('dotenv').config();

// Helper function to create prerequisite object
const hp = (courseCode) => ({ courseCode, type: 'hard-prerequisite' });
const sp = (courseCode) => ({ courseCode, type: 'soft-prerequisite' });

// Validator function (STRONGLY recommended)
function validateProgram(program) {
    const seen = new Set();

    for (const req of program.requirements) {
        for (const course of req.courses) {
            // Check for duplicates within program
            if (seen.has(course.courseCode)) {
                throw new Error(
                    `Duplicate course ${course.courseCode} in ${program.programCode}`
                );
            }
            seen.add(course.courseCode);

            // Optional: Validate credits exist (except for 0 credit courses)
            if (!course.credits && course.credits !== 0) {
                throw new Error(
                    `Missing credits for ${course.courseCode} in ${program.programCode}`
                );
            }
        }
    }
    console.log(`✅ Validated ${program.programCode}: ${seen.size} unique courses`);
}

const seedPrograms = async () => {
    try {
        console.log('🌱 Seeding program data with clean structure...');

        // Connect to database
        const connectDB = require('../config/db');
        await connectDB();

        // ============================
        // CSE PROGRAM (Computer Science and Engineering)
        // ============================
        const cseProgram = {
            programCode: 'CSE',
            programName: 'Computer Science and Engineering',
            department: 'CSE',
            totalCreditsRequired: 136,  // NOTE: Check if your schema uses 'totalCredits' instead
            requirements: [
                {
                    category: 'gen-ed',
                    categoryName: 'General Education',
                    creditsRequired: 39,
                    courses: [
                        // Stream 1: Writing Comprehension
                        { courseCode: 'ENG 091', courseName: 'Foundation Course', credits: 0, isRequired: true, stream: 'Writing Comprehension' },
                        { courseCode: 'ENG 101', courseName: 'English Fundamentals', credits: 3, isRequired: true, stream: 'Writing Comprehension' },
                        { courseCode: 'ENG 102', courseName: 'English Composition I', credits: 3, isRequired: true, stream: 'Writing Comprehension' },
                        { courseCode: 'ENG 103', courseName: 'Advanced Writing Skills and Presentation', credits: 3, isRequired: false, stream: 'Writing Comprehension' },

                        // Stream 2: Math and Natural Sciences
                        { courseCode: 'MAT 092', courseName: 'Remedial Course in Mathematics', credits: 0, isRequired: true, stream: 'Math and Natural Sciences' },
                        { courseCode: 'MAT 110', courseName: 'MATH I: Differential Calculus and Co-ordinate Geometry', credits: 3, isRequired: true, stream: 'Math and Natural Sciences' },
                        { courseCode: 'PHY 111', courseName: 'Principles of Physics I', credits: 3, isRequired: true, stream: 'Math and Natural Sciences' },
                        { courseCode: 'STA 201', courseName: 'Elements of Statistics and Probability', credits: 3, isRequired: true, stream: 'Math and Natural Sciences' },
                        { courseCode: 'CHE 101', courseName: 'Introduction to Chemistry', credits: 3, isRequired: false, stream: 'Math and Natural Sciences' },
                        { courseCode: 'BIO 101', courseName: 'Introduction to Biology', credits: 3, isRequired: false, stream: 'Math and Natural Sciences' },
                        { courseCode: 'ENV 103', courseName: 'Elements of Environmental Sciences', credits: 3, isRequired: false, stream: 'Math and Natural Sciences' },

                        // Stream 3: Arts and Humanities
                        { courseCode: 'HUM 103', courseName: 'Ethics and Culture', credits: 3, isRequired: true, stream: 'Arts and Humanities' },
                        { courseCode: 'BNG 103', courseName: 'Bangla Language and Literature', credits: 3, isRequired: true, stream: 'Arts and Humanities' },
                        { courseCode: 'HUM 101', courseName: 'World Civilization & Culture', credits: 3, isRequired: false, stream: 'Arts and Humanities' },
                        { courseCode: 'HUM 102', courseName: 'Introduction to Philosophy', credits: 3, isRequired: false, stream: 'Arts and Humanities' },
                        { courseCode: 'HST 102', courseName: 'The Modern World', credits: 3, isRequired: false, stream: 'Arts and Humanities' },
                        { courseCode: 'HST 103', courseName: 'History of Bangladesh', credits: 3, isRequired: false, stream: 'Arts and Humanities' },
                        { courseCode: 'HST 104', courseName: 'Global History Lab - A History of World since 1300', credits: 3, isRequired: false, stream: 'Arts and Humanities' },
                        { courseCode: 'HUM 207', courseName: 'Narratives of Truth and Lies', credits: 3, isRequired: false, stream: 'Arts and Humanities' },
                        { courseCode: 'ENG 110', courseName: 'English for Life', credits: 3, isRequired: false, stream: 'Arts and Humanities' },
                        { courseCode: 'ENG 113', courseName: 'Introduction to English Poetry', credits: 3, isRequired: false, stream: 'Arts and Humanities' },
                        { courseCode: 'ENG 114', courseName: 'Introduction to English Drama', credits: 3, isRequired: false, stream: 'Arts and Humanities' },
                        { courseCode: 'ENG 115', courseName: 'Introduction English Prose', credits: 3, isRequired: false, stream: 'Arts and Humanities' },
                        { courseCode: 'ENG 333', courseName: 'Globalization and the Media', credits: 3, isRequired: false, stream: 'Arts and Humanities' },

                        // Stream 4: Social Sciences
                        { courseCode: 'EMB 101', courseName: 'Emergence of Bangladesh', credits: 3, isRequired: true, stream: 'Social Sciences' },
                        { courseCode: 'DEV 101', courseName: 'Bangladesh Studies', credits: 3, isRequired: true, stream: 'Social Sciences' },
                        { courseCode: 'PSY 101', courseName: 'Introduction to Psychology', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'SOC 101', courseName: 'Introduction to Sociology', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'ANT 101', courseName: 'Introduction to Anthropology', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'POL 101', courseName: 'Introduction to Political Science', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'BUS 201', courseName: 'Business and Human Communication', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'ECO 101', courseName: 'Introduction to Microeconomics', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'ECO 102', courseName: 'Introduction to Macroeconomics', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'ECO 105', courseName: 'Introduction to Economics', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'BUS 102', courseName: 'Business - Basics, Ethics and Environment', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'POL 102', courseName: 'Comparative Governance', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'POL 103', courseName: 'International Relations and Global Politics', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'POL 201', courseName: 'Introduction to Civic Engagement', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'POL 202', courseName: 'Foundations in Public Policy', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'PSY 102', courseName: 'Understanding the Human Minds', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'DEV 104', courseName: 'Foundations of International Development', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'DEV 201', courseName: 'Health, Culture and Development', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'SOC 201', courseName: 'Social Inequality', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'ANT 202', courseName: 'Social Inequality', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'ANT 342', courseName: 'Body and Society', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'ANT 351', courseName: 'Gender & Development', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'BUS 333', courseName: 'Social Entrepreneurship Practicum', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'BUS 334', courseName: 'Social Intrapreneurship Practicum - Leading Change', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'BUS 335', courseName: 'Sustainable Development and Social Enterprise', credits: 3, isRequired: false, stream: 'Social Sciences' },

                        // Stream 5: Computer Science and Technology
                        { courseCode: 'CST 301', courseName: 'For the Love of Food', credits: 3, isRequired: false, stream: 'Communities, Seeking Transformation' },
                        { courseCode: 'CST 302', courseName: 'The Pursuit of Wellbeing', credits: 3, isRequired: false, stream: 'Communities, Seeking Transformation' },
                        { courseCode: 'CST 303', courseName: 'Law for Life, Peace and Justice', credits: 3, isRequired: false, stream: 'Communities, Seeking Transformation' },
                        { courseCode: 'CST 304', courseName: 'Documentary Film: Theory and Practice', credits: 3, isRequired: false, stream: 'Communities, Seeking Transformation' },
                        { courseCode: 'CST 305', courseName: 'Borders and Beyond: Past and Future', credits: 3, isRequired: false, stream: 'Communities, Seeking Transformation' },
                        { courseCode: 'CST 306', courseName: 'Ethical Leadership', credits: 3, isRequired: false, stream: 'Communities, Seeking Transformation' },
                        { courseCode: 'CST 307', courseName: 'Art, Community and the Future', credits: 3, isRequired: false, stream: 'Communities, Seeking Transformation' },
                        { courseCode: 'CST 308', courseName: 'Social Dimensions of Faith and Development', credits: 3, isRequired: false, stream: 'Communities, Seeking Transformation' },
                        { courseCode: 'CST 309', courseName: 'Global Citizenship', credits: 3, isRequired: false, stream: 'Communities, Seeking Transformation' },
                        { courseCode: 'CST 310', courseName: 'Social Cohesion and Peace Building', credits: 3, isRequired: false, stream: 'Communities, Seeking Transformation' }
                    ]
                },
                {
                    category: 'school-core',
                    categoryName: 'School Core',
                    creditsRequired: 12,
                    courses: [
                        {
                            courseCode: 'MAT 120',
                            courseName: 'MATH II: Integral Calculus and Differential Equations',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('MAT 110')]
                        },
                        {
                            courseCode: 'MAT 215',
                            courseName: 'MATH III: Complex Variables and Laplace Transformations',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('MAT 120')]
                        },
                        {
                            courseCode: 'MAT 216',
                            courseName: 'MATH IV: Linear Algebra and Fourier Analysis',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('MAT 120')]
                        },
                        {
                            courseCode: 'PHY 112',
                            courseName: 'Principles of Physics II',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('PHY 111')]
                        }
                    ]
                },
                {
                    category: 'program-core',
                    categoryName: 'Program Core',
                    creditsRequired: 75,
                    courses: [
                        // CSE Core Courses - MANDATORY for CSE students
                        {
                            courseCode: 'CSE 110',
                            courseName: 'Programming Language I',
                            credits: 3,
                            isRequired: true
                        },
                        {
                            courseCode: 'CSE 111',
                            courseName: 'Programming Language II',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 110')]
                        },
                        {
                            courseCode: 'CSE 220',
                            courseName: 'Data Structures',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 111')]
                        },
                        {
                            courseCode: 'CSE 221',
                            courseName: 'Algorithms',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 220')]
                        },
                        {
                            courseCode: 'CSE 230',
                            courseName: 'Discrete Mathematics',
                            credits: 3,
                            isRequired: true
                        },
                        {
                            courseCode: 'CSE 250',
                            courseName: 'Circuits and Electronics',
                            credits: 3,
                            isRequired: true,
                            softPrerequisites: [sp('PHY 112')]
                        },
                        {
                            courseCode: 'CSE 251',
                            courseName: 'Electronic Devices and Circuits',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 250')]
                        },
                        {
                            courseCode: 'CSE 260',
                            courseName: 'Digital Logic Design',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 251')]
                        },
                        {
                            courseCode: 'CSE 320',
                            courseName: 'Data Communications',
                            credits: 3,
                            isRequired: true
                        },
                        {
                            courseCode: 'CSE 321',
                            courseName: 'Operating Systems',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 221')],
                            softPrerequisites: [sp('CSE 340')]
                        },
                        {
                            courseCode: 'CSE 330',
                            courseName: 'Numerical Methods',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('MAT 216')]
                        },
                        {
                            courseCode: 'CSE 331',
                            courseName: 'Automata and Computability',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 221')]
                        },
                        {
                            courseCode: 'CSE 340',
                            courseName: 'Computer Architecture',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 260')]
                        },
                        {
                            courseCode: 'CSE 341',
                            courseName: 'Microprocessors',
                            credits: 3,
                            isRequired: true,
                            softPrerequisites: [sp('CSE 340')]
                        },
                        {
                            courseCode: 'CSE 350',
                            courseName: 'Digital Electronics and Pulse Techniques',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 251')]
                        },
                        {
                            courseCode: 'CSE 360',
                            courseName: 'Computer Interfacing',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 341')]
                        },
                        {
                            courseCode: 'CSE 370',
                            courseName: 'Database Systems',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 221')]
                        },
                        // CSE 400 is ONLY in project-thesis, NOT here
                        {
                            courseCode: 'CSE 420',
                            courseName: 'Compiler Design',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 321'), hp('CSE 331'), hp('CSE 340')]
                        },
                        {
                            courseCode: 'CSE 421',
                            courseName: 'Computer Networks',
                            credits: 3,
                            isRequired: true,
                            softPrerequisites: [sp('CSE 320')]
                        },
                        {
                            courseCode: 'CSE 422',
                            courseName: 'Artificial Intelligence',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 221')]
                        },
                        {
                            courseCode: 'CSE 423',
                            courseName: 'Computer Graphics',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('MAT 216')]
                        },
                        {
                            courseCode: 'CSE 460',
                            courseName: 'VLSI Design',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 260')]
                        },
                        {
                            courseCode: 'CSE 461',
                            courseName: 'Introduction to Robotics',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 260'), hp('CSE 341'), hp('CSE 360')]
                        },
                        {
                            courseCode: 'CSE 470',
                            courseName: 'Software Engineering',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 370')]
                        },
                        {
                            courseCode: 'CSE 471',
                            courseName: 'System Analysis and Design',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 370')]
                        }
                    ]
                },
                {
                    category: 'program-elective',
                    categoryName: 'Program Elective',
                    creditsRequired: 6,
                    courses: [
                        // ONLY ELECTIVE COURSES for CSE (courses that are NOT in program-core)
                        { courseCode: 'CSE 391', courseName: 'Programming for the Internet', credits: 3, isRequired: false, hardPrerequisites: [hp('CSE 370')] },
                        { courseCode: 'CSE 419', courseName: 'Programming Languages and Competitive Programming', credits: 3, isRequired: false },
                        { courseCode: 'CSE 424', courseName: 'Pattern Recognition', credits: 3, isRequired: false },
                        { courseCode: 'CSE 425', courseName: 'Neural Network', credits: 3, isRequired: false },
                        { courseCode: 'CSE 426', courseName: 'Advanced Algorithms', credits: 3, isRequired: false },
                        { courseCode: 'CSE 427', courseName: 'Machine Learning', credits: 3, isRequired: false },
                        { courseCode: 'CSE 428', courseName: 'Image Processing', credits: 3, isRequired: false },
                        { courseCode: 'CSE 437', courseName: 'Data Science: Coding With Real-World Data', credits: 3, isRequired: false },
                        { courseCode: 'CSE 440', courseName: 'Natural Language Processing (NLP) II', credits: 3, isRequired: false },
                        { courseCode: 'CSE 446', courseName: 'Blockchain and Cryptocurrencies', credits: 3, isRequired: false },
                        { courseCode: 'CSE 447', courseName: 'Cryptography and Cryptoanalysis', credits: 3, isRequired: false },
                        { courseCode: 'CSE 449', courseName: 'Parallel, Distributed, and High-performance Computing (HPC)', credits: 3, isRequired: false },
                        { courseCode: 'CSE 481', courseName: 'Quantum Computing I', credits: 3, isRequired: false },
                        { courseCode: 'CSE 489', courseName: 'Android App Development', credits: 3, isRequired: false, hardPrerequisites: [hp('CSE 370')] },
                        { courseCode: 'CSE 490A', courseName: 'Special Topics', credits: 3, isRequired: false },
                        { courseCode: 'CSE 402', courseName: 'Optimization', credits: 3, isRequired: false },
                        { courseCode: 'CSE 430', courseName: 'Digital Signal Processing', credits: 3, isRequired: false },
                        { courseCode: 'CSE 443', courseName: 'Bioinformatics I', credits: 3, isRequired: false },
                        { courseCode: 'CSE 463', courseName: 'Computer Vision: Fundamentals and Applications', credits: 3, isRequired: false }
                    ]
                },
                {
                    category: 'project-thesis',
                    categoryName: 'Project/Thesis',
                    creditsRequired: 4,
                    courses: [
                        // CSE 400 is ONLY here, not in program-core
                        {
                            courseCode: 'CSE 400',
                            courseName: 'Final Year Design Project',
                            credits: 4,
                            isRequired: true
                        }
                    ]
                }
            ]
        };

        // ============================
        // CS PROGRAM (Computer Science)
        // ============================
        const csProgram = {
            programCode: 'CS',
            programName: 'Computer Science',
            department: 'CSE',
            totalCreditsRequired: 124,  // NOTE: Check if your schema uses 'totalCredits' instead
            requirements: [
                {
                    category: 'gen-ed',
                    categoryName: 'General Education',
                    creditsRequired: 39,
                    courses: [
                        // Same General Education as CSE (all non-duplicate)
                        // Stream 1: Writing Comprehension
                        { courseCode: 'ENG 091', courseName: 'Foundation Course', credits: 0, isRequired: true, stream: 'Writing Comprehension' },
                        { courseCode: 'ENG 101', courseName: 'English Fundamentals', credits: 3, isRequired: true, stream: 'Writing Comprehension' },
                        { courseCode: 'ENG 102', courseName: 'English Composition I', credits: 3, isRequired: true, stream: 'Writing Comprehension' },
                        { courseCode: 'ENG 103', courseName: 'Advanced Writing Skills and Presentation', credits: 3, isRequired: false, stream: 'Writing Comprehension' },

                        // Stream 2: Math and Natural Sciences
                        { courseCode: 'MAT 092', courseName: 'Remedial Course in Mathematics', credits: 0, isRequired: true, stream: 'Math and Natural Sciences' },
                        { courseCode: 'MAT 110', courseName: 'MATH I: Differential Calculus and Co-ordinate Geometry', credits: 3, isRequired: true, stream: 'Math and Natural Sciences' },
                        { courseCode: 'PHY 111', courseName: 'Principles of Physics I', credits: 3, isRequired: true, stream: 'Math and Natural Sciences' },
                        { courseCode: 'STA 201', courseName: 'Elements of Statistics and Probability', credits: 3, isRequired: true, stream: 'Math and Natural Sciences' },
                        { courseCode: 'CHE 101', courseName: 'Introduction to Chemistry', credits: 3, isRequired: false, stream: 'Math and Natural Sciences' },
                        { courseCode: 'BIO 101', courseName: 'Introduction to Biology', credits: 3, isRequired: false, stream: 'Math and Natural Sciences' },
                        { courseCode: 'ENV 103', courseName: 'Elements of Environmental Sciences', credits: 3, isRequired: false, stream: 'Math and Natural Sciences' },

                        // Stream 3: Arts and Humanities
                        { courseCode: 'HUM 103', courseName: 'Ethics and Culture', credits: 3, isRequired: true, stream: 'Arts and Humanities' },
                        { courseCode: 'BNG 103', courseName: 'Bangla Language and Literature', credits: 3, isRequired: true, stream: 'Arts and Humanities' },
                        { courseCode: 'HUM 101', courseName: 'World Civilization & Culture', credits: 3, isRequired: false, stream: 'Arts and Humanities' },
                        { courseCode: 'HUM 102', courseName: 'Introduction to Philosophy', credits: 3, isRequired: false, stream: 'Arts and Humanities' },
                        { courseCode: 'HST 102', courseName: 'The Modern World', credits: 3, isRequired: false, stream: 'Arts and Humanities' },
                        { courseCode: 'HST 103', courseName: 'History of Bangladesh', credits: 3, isRequired: false, stream: 'Arts and Humanities' },
                        { courseCode: 'HST 104', courseName: 'Global History Lab - A History of World since 1300', credits: 3, isRequired: false, stream: 'Arts and Humanities' },
                        { courseCode: 'HUM 207', courseName: 'Narratives of Truth and Lies', credits: 3, isRequired: false, stream: 'Arts and Humanities' },
                        { courseCode: 'ENG 110', courseName: 'English for Life', credits: 3, isRequired: false, stream: 'Arts and Humanities' },
                        { courseCode: 'ENG 113', courseName: 'Introduction to English Poetry', credits: 3, isRequired: false, stream: 'Arts and Humanities' },
                        { courseCode: 'ENG 114', courseName: 'Introduction to English Drama', credits: 3, isRequired: false, stream: 'Arts and Humanities' },
                        { courseCode: 'ENG 115', courseName: 'Introduction English Prose', credits: 3, isRequired: false, stream: 'Arts and Humanities' },
                        { courseCode: 'ENG 333', courseName: 'Globalization and the Media', credits: 3, isRequired: false, stream: 'Arts and Humanities' },

                        // Stream 4: Social Sciences
                        { courseCode: 'EMB 101', courseName: 'Emergence of Bangladesh', credits: 3, isRequired: true, stream: 'Social Sciences' },
                        { courseCode: 'DEV 101', courseName: 'Bangladesh Studies', credits: 3, isRequired: true, stream: 'Social Sciences' },
                        { courseCode: 'PSY 101', courseName: 'Introduction to Psychology', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'SOC 101', courseName: 'Introduction to Sociology', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'ANT 101', courseName: 'Introduction to Anthropology', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'POL 101', courseName: 'Introduction to Political Science', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'BUS 201', courseName: 'Business and Human Communication', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'ECO 101', courseName: 'Introduction to Microeconomics', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'ECO 102', courseName: 'Introduction to Macroeconomics', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'ECO 105', courseName: 'Introduction to Economics', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'BUS 102', courseName: 'Business - Basics, Ethics and Environment', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'POL 102', courseName: 'Comparative Governance', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'POL 103', courseName: 'International Relations and Global Politics', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'POL 201', courseName: 'Introduction to Civic Engagement', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'POL 202', courseName: 'Foundations in Public Policy', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'PSY 102', courseName: 'Understanding the Human Minds', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'DEV 104', courseName: 'Foundations of International Development', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'DEV 201', courseName: 'Health, Culture and Development', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'SOC 201', courseName: 'Social Inequality', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'ANT 202', courseName: 'Social Inequality', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'ANT 342', courseName: 'Body and Society', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'ANT 351', courseName: 'Gender & Development', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'BUS 333', courseName: 'Social Entrepreneurship Practicum', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'BUS 334', courseName: 'Social Intrapreneurship Practicum - Leading Change', credits: 3, isRequired: false, stream: 'Social Sciences' },
                        { courseCode: 'BUS 335', courseName: 'Sustainable Development and Social Enterprise', credits: 3, isRequired: false, stream: 'Social Sciences' },

                        // Stream 5: Computer Science and Technology
                        { courseCode: 'CST 301', courseName: 'For the Love of Food', credits: 3, isRequired: false, stream: 'Communities, Seeking Transformation' },
                        { courseCode: 'CST 302', courseName: 'The Pursuit of Wellbeing', credits: 3, isRequired: false, stream: 'Communities, Seeking Transformation' },
                        { courseCode: 'CST 303', courseName: 'Law for Life, Peace and Justice', credits: 3, isRequired: false, stream: 'Communities, Seeking Transformation' },
                        { courseCode: 'CST 304', courseName: 'Documentary Film: Theory and Practice', credits: 3, isRequired: false, stream: 'Communities, Seeking Transformation' },
                        { courseCode: 'CST 305', courseName: 'Borders and Beyond: Past and Future', credits: 3, isRequired: false, stream: 'Communities, Seeking Transformation' },
                        { courseCode: 'CST 306', courseName: 'Ethical Leadership', credits: 3, isRequired: false, stream: 'Communities, Seeking Transformation' },
                        { courseCode: 'CST 307', courseName: 'Art, Community and the Future', credits: 3, isRequired: false, stream: 'Communities, Seeking Transformation' },
                        { courseCode: 'CST 308', courseName: 'Social Dimensions of Faith and Development', credits: 3, isRequired: false, stream: 'Communities, Seeking Transformation' },
                        { courseCode: 'CST 309', courseName: 'Global Citizenship', credits: 3, isRequired: false, stream: 'Communities, Seeking Transformation' },
                        { courseCode: 'CST 310', courseName: 'Social Cohesion and Peace Building', credits: 3, isRequired: false, stream: 'Communities, Seeking Transformation' }
                    ]
                },
                {
                    category: 'school-core',
                    categoryName: 'School Core',
                    creditsRequired: 12,
                    courses: [
                        // Same School Core as CSE
                        {
                            courseCode: 'MAT 120',
                            courseName: 'MATH II: Integral Calculus and Differential Equations',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('MAT 110')]
                        },
                        {
                            courseCode: 'MAT 215',
                            courseName: 'MATH III: Complex Variables and Laplace Transformations',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('MAT 120')]
                        },
                        {
                            courseCode: 'MAT 216',
                            courseName: 'MATH IV: Linear Algebra and Fourier Analysis',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('MAT 120')]
                        },
                        {
                            courseCode: 'PHY 112',
                            courseName: 'Principles of Physics II',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('PHY 111')]
                        }
                    ]
                },
                {
                    category: 'program-core',
                    categoryName: 'Program Core',
                    creditsRequired: 48,
                    courses: [
                        // CS Core Courses - DIFFERENT from CSE
                        {
                            courseCode: 'CSE 110',
                            courseName: 'Programming Language I',
                            credits: 3,
                            isRequired: true
                        },
                        {
                            courseCode: 'CSE 111',
                            courseName: 'Programming Language II',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 110')]
                        },
                        {
                            courseCode: 'CSE 220',
                            courseName: 'Data Structures',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 111')]
                        },
                        {
                            courseCode: 'CSE 221',
                            courseName: 'Algorithms',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 220')]
                        },
                        {
                            courseCode: 'CSE 230',
                            courseName: 'Discrete Mathematics',
                            credits: 3,
                            isRequired: true
                        },
                        {
                            courseCode: 'CSE 260',
                            courseName: 'Digital Logic Design',
                            credits: 3,
                            isRequired: true
                        },
                        {
                            courseCode: 'CSE 321',
                            courseName: 'Operating Systems',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 221')]
                        },
                        {
                            courseCode: 'CSE 330',
                            courseName: 'Numerical Methods',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('MAT 216')]
                        },
                        {
                            courseCode: 'CSE 331',
                            courseName: 'Automata and Computability',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 221')]
                        },
                        {
                            courseCode: 'CSE 340',
                            courseName: 'Computer Architecture',
                            credits: 3,
                            isRequired: true
                        },
                        {
                            courseCode: 'CSE 370',
                            courseName: 'Database Systems',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 221')]
                        },
                        {
                            courseCode: 'CSE 420',
                            courseName: 'Compiler Design',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 321'), hp('CSE 331'), hp('CSE 340')]
                        },
                        {
                            courseCode: 'CSE 421',
                            courseName: 'Computer Networks',
                            credits: 3,
                            isRequired: true
                        },
                        {
                            courseCode: 'CSE 422',
                            courseName: 'Artificial Intelligence',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 221')]
                        },
                        {
                            courseCode: 'CSE 423',
                            courseName: 'Computer Graphics',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('MAT 216')]
                        },
                        {
                            courseCode: 'CSE 470',
                            courseName: 'Software Engineering',
                            credits: 3,
                            isRequired: true,
                            hardPrerequisites: [hp('CSE 370')]
                        }
                    ]
                },
                {
                    category: 'program-elective',
                    categoryName: 'Program Elective',
                    creditsRequired: 21,
                    courses: [
                        // CS Electives - INCLUDES courses that are CORE in CSE but ELECTIVE in CS
                        { courseCode: 'CSE 250', courseName: 'Circuits and Electronics', credits: 3, isRequired: false, softPrerequisites: [sp('PHY 112')] },
                        { courseCode: 'CSE 251', courseName: 'Electronic Devices and Circuits', credits: 3, isRequired: false, hardPrerequisites: [hp('CSE 250')] },
                        { courseCode: 'CSE 320', courseName: 'Data Communications', credits: 3, isRequired: false },
                        { courseCode: 'CSE 341', courseName: 'Microprocessors', credits: 3, isRequired: false, softPrerequisites: [sp('CSE 340')] },
                        { courseCode: 'CSE 350', courseName: 'Digital Electronics and Pulse Techniques', credits: 3, isRequired: false, hardPrerequisites: [hp('CSE 251')] },
                        { courseCode: 'CSE 360', courseName: 'Computer Interfacing', credits: 3, isRequired: false, hardPrerequisites: [hp('CSE 341')] },
                        { courseCode: 'CSE 460', courseName: 'VLSI Design', credits: 3, isRequired: false, hardPrerequisites: [hp('CSE 260')] },
                        { courseCode: 'CSE 461', courseName: 'Introduction to Robotics', credits: 3, isRequired: false, hardPrerequisites: [hp('CSE 260'), hp('CSE 341'), hp('CSE 360')] },
                        { courseCode: 'CSE 471', courseName: 'System Analysis and Design', credits: 3, isRequired: false, hardPrerequisites: [hp('CSE 370')] },

                        // Shared electives with CSE
                        { courseCode: 'CSE 391', courseName: 'Programming for the Internet', credits: 3, isRequired: false, hardPrerequisites: [hp('CSE 370')] },
                        { courseCode: 'CSE 419', courseName: 'Programming Languages and Competitive Programming', credits: 3, isRequired: false },
                        { courseCode: 'CSE 424', courseName: 'Pattern Recognition', credits: 3, isRequired: false },
                        { courseCode: 'CSE 425', courseName: 'Neural Network', credits: 3, isRequired: false },
                        { courseCode: 'CSE 426', courseName: 'Advanced Algorithms', credits: 3, isRequired: false },
                        { courseCode: 'CSE 427', courseName: 'Machine Learning', credits: 3, isRequired: false },
                        { courseCode: 'CSE 428', courseName: 'Image Processing', credits: 3, isRequired: false },
                        { courseCode: 'CSE 437', courseName: 'Data Science: Coding With Real-World Data', credits: 3, isRequired: false },
                        { courseCode: 'CSE 440', courseName: 'Natural Language Processing (NLP) II', credits: 3, isRequired: false },
                        { courseCode: 'CSE 446', courseName: 'Blockchain and Cryptocurrencies', credits: 3, isRequired: false },
                        { courseCode: 'CSE 447', courseName: 'Cryptography and Cryptoanalysis', credits: 3, isRequired: false },
                        { courseCode: 'CSE 449', courseName: 'Parallel, Distributed, and High-performance Computing (HPC)', credits: 3, isRequired: false },
                        { courseCode: 'CSE 481', courseName: 'Quantum Computing I', credits: 3, isRequired: false },
                        { courseCode: 'CSE 489', courseName: 'Android App Development', credits: 3, isRequired: false, hardPrerequisites: [hp('CSE 370')] },
                        { courseCode: 'CSE 490A', courseName: 'Special Topics', credits: 3, isRequired: false },
                        { courseCode: 'CSE 402', courseName: 'Optimization', credits: 3, isRequired: false },
                        { courseCode: 'CSE 430', courseName: 'Digital Signal Processing', credits: 3, isRequired: false },
                        { courseCode: 'CSE 443', courseName: 'Bioinformatics I', credits: 3, isRequired: false },
                        { courseCode: 'CSE 463', courseName: 'Computer Vision: Fundamentals and Applications', credits: 3, isRequired: false }
                    ]
                },
                {
                    category: 'project-thesis',
                    categoryName: 'Project/Thesis',
                    creditsRequired: 4,
                    courses: [
                        {
                            courseCode: 'CSE 400',
                            courseName: 'Final Year Design Project',
                            credits: 4,
                            isRequired: true
                        }
                    ]
                }
            ]
        };

        // Validate programs before insertion
        console.log('🔍 Validating program structures...');
        validateProgram(cseProgram);
        validateProgram(csProgram);
        console.log('✅ All programs validated successfully!');

        // SAFE UPSERT - NO DELETE MANY!
        console.log('📥 Upserting program data safely...');

        await Program.updateOne(
            { programCode: 'CSE' },
            { $set: cseProgram },
            { upsert: true }
        );

        await Program.updateOne(
            { programCode: 'CS' },
            { $set: csProgram },
            { upsert: true }
        );

        console.log('✅ Program data seeded/updated successfully!');
        console.log('🎯 CSE Program (136 credits)');
        console.log('   - Core: 25 courses including CSE 250, 251, 320, 341 (Engineering focus)');
        console.log('   - Electives: 19 courses');
        console.log('   - CSE 400: Project/Thesis only (not in core)');

        console.log('🎯 CS Program (124 credits)');
        console.log('   - Core: 16 courses (Software focus)');
        console.log('   - Electives: 30 courses including CSE 250, 251, 320, 341 (as electives)');
        console.log('   - CSE 400: Project/Thesis only');

        console.log('\n🔑 SAFE SEEDING APPLIED:');
        console.log('   ✓ Used updateOne with upsert instead of deleteMany');
        console.log('   ✓ User progress and plans preserved');
        console.log('   ✓ Existing references to program _id remain valid');
        console.log('   ✓ Course duplicates prevented within each program');
        console.log('   ✓ Different roles per program: CSE 250 core in CSE, elective in CS');

        console.log('\n⚠️  IMPORTANT NOTE:');
        console.log('   - Check if your Program schema uses "totalCredits" instead of "totalCreditsRequired"');
        console.log('   - If schema mismatch, update the field names above');

        // Disconnect from database (optional)
        // mongoose.disconnect();
        // console.log('📤 Disconnected from database');

    } catch (error) {
        console.error('❌ Error seeding program data:', error.message);
        if (error.message.includes('Duplicate course')) {
            console.error('💥 SEED VALIDATOR FAILED: Fix the duplicate before running again!');
        }
        process.exit(1);
    }
};

// If this file is run directly (not imported)
if (require.main === module) {
    seedPrograms();
}

module.exports = seedPrograms;