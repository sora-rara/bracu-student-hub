const mongoose = require('mongoose');

const prerequisiteSchema = new mongoose.Schema({
    courseCode: { type: String, required: true },
    type: {
        type: String,
        enum: ['hard-prerequisite', 'soft-prerequisite', 'none'],
        default: 'none'
    }
});

// models/Program.js - Update the courseRequirementSchema
const courseRequirementSchema = new mongoose.Schema({
    courseCode: { type: String, required: true },
    courseName: { type: String }, // Remove required: true or make it optional
    credits: { type: Number, required: true },
    isRequired: { type: Boolean, default: true },
    hardPrerequisites: [prerequisiteSchema],
    softPrerequisites: [prerequisiteSchema],
    alternatives: [{ type: String }],
    stream: { type: String },
    category: {
        type: String,
        enum: ['gen-ed', 'school-core', 'program-core', 'program-elective', 'project-thesis']
    },
    comments: { type: String }
});

const requirementCategorySchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        enum: ['gen-ed', 'school-core', 'program-core', 'program-elective', 'project-thesis']
    },
    categoryName: { type: String, required: true },
    creditsRequired: { type: Number, required: true },
    courses: [courseRequirementSchema],
    notes: { type: String }
});

const programSchema = new mongoose.Schema({
    programCode: { type: String, required: true, unique: true },
    programName: { type: String, required: true },
    department: { type: String, required: true },
    totalCreditsRequired: { type: Number, required: true },
    requirements: [requirementCategorySchema],
    active: { type: Boolean, default: true },
    version: { type: String, default: '1.0' },
    createdAt: { type: Date, default: Date.now }
});

// Add method to check prerequisites
programSchema.methods.getPrerequisitesForCourse = function (courseCode) {
    for (const category of this.requirements) {
        for (const course of category.courses) {
            if (course.courseCode === courseCode) {
                return {
                    hardPrerequisites: course.hardPrerequisites || [],
                    softPrerequisites: course.softPrerequisites || []
                };
            }
        }
    }
    return { hardPrerequisites: [], softPrerequisites: [] };
};

module.exports = mongoose.model('Program', programSchema);