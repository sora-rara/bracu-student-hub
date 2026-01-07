// ✅ Add this import at the top
const mongoose = require('mongoose');

class CourseCatalogService {
    constructor() {
        this.cache = new Map();
    }

    async getCourseDetails(courseCode) {
        // Check cache first
        if (this.cache.has(courseCode)) {
            return this.cache.get(courseCode);
        }

        // Fetch from Program requirements
        const program = await mongoose.model('Program').findOne({
            'requirements.courses.courseCode': courseCode
        });

        if (!program) {
            // Default values if not in catalog
            const defaultCourse = {
                courseCode,
                courseName: `${courseCode} Course`,
                credits: 3,
                category: 'program-core',
                isRequired: true
            };
            this.cache.set(courseCode, defaultCourse);
            return defaultCourse;
        }

        // Extract course details
        let courseDetails = null;
        for (const req of program.requirements) {
            courseDetails = req.courses.find(c => c.courseCode === courseCode);
            if (courseDetails) break;
        }

        if (courseDetails) {
            this.cache.set(courseCode, courseDetails);
        }

        return courseDetails;
    }

    async resolvePlannedCourses(plannedCourses) {
        // Resolve all course details in batch
        const resolved = [];

        for (const plannedCourse of plannedCourses) {
            const details = await this.getCourseDetails(plannedCourse.courseCode);
            resolved.push({
                ...plannedCourse.toObject(),
                resolvedDetails: details
            });
        }

        return resolved;
    }

    async validateCredits(plannedCourse) {
        const details = await this.getCourseDetails(plannedCourse.courseCode);
        return {
            courseCode: plannedCourse.courseCode,
            plannedCredits: details?.credits || 3,
            isValid: true,
            source: details ? 'catalog' : 'default'
        };
    }
}

module.exports = new CourseCatalogService();