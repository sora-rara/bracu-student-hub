const Opportunity = require('../models/Opportunity');
const Internship = require('../models/Internship');
const Scholarship = require('../models/Scholarship');
const PartTimeJob = require('../models/PartTimeJob');
const StudentProfile = require('../models/StudentProfile');

// Middleware to check admin role
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required' });
};

// Get all opportunities with filters
exports.getOpportunities = async (req, res) => {
  try {
    const { type, department, search } = req.query;
    const filter = { isActive: true };
    
    if (type) filter.type = type;
    if (department) filter.department = { $in: [department] };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const opportunities = await Opportunity.find(filter).sort({ createdAt: -1 });
    res.json(opportunities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new opportunity (Admin only)
exports.createOpportunity = [isAdmin, async (req, res) => {
  try {
    const { type, ...data } = req.body;
    data.postedBy = req.session.user._id;
    
    let opportunity;
    switch (type) {
      case 'internship':
        opportunity = new Internship(data);
        break;
      case 'scholarship':
        opportunity = new Scholarship(data);
        break;
      case 'part-time':
        opportunity = new PartTimeJob(data);
        break;
      default:
        return res.status(400).json({ error: 'Invalid opportunity type' });
    }
    
    await opportunity.save();
    res.status(201).json(opportunity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}];

// Update student profile
exports.updateStudentProfile = async (req, res) => {
  try {
    const { department, cgpa, creditsCompleted, skills } = req.body;
    const userId = req.session.user._id;
    
    const profile = await StudentProfile.findOneAndUpdate(
      { user: userId },
      { department, cgpa, creditsCompleted, skills },
      { new: true, upsert: true }
    );
    
    res.json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Save opportunity for student
exports.saveOpportunity = async (req, res) => {
  try {
    const { opportunityId, type } = req.body;
    const userId = req.session.user._id;
    
    const profile = await StudentProfile.findOneAndUpdate(
      { user: userId },
      { $addToSet: { 
        savedOpportunities: { opportunity: opportunityId, type } 
      }},
      { new: true }
    );
    
    res.json(profile.savedOpportunities);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Apply for opportunity
exports.applyForOpportunity = async (req, res) => {
  try {
    const { opportunityId, type } = req.body;
    const userId = req.session.user._id;
    
    // Check student profile exists
    const profile = await StudentProfile.findOne({ user: userId });
    if (!profile) {
      return res.status(400).json({ error: 'Please complete your profile first' });
    }
    
    // Check if already applied
    const alreadyApplied = profile.appliedOpportunities.some(
      app => app.opportunity.toString() === opportunityId
    );
    
    if (alreadyApplied) {
      return res.status(400).json({ error: 'Already applied for this opportunity' });
    }
    
    // Add to applied opportunities
    profile.appliedOpportunities.push({
      opportunity: opportunityId,
      type,
      status: 'Pending'
    });
    
    await profile.save();
    res.json(profile.appliedOpportunities);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Check scholarship eligibility
exports.checkEligibility = async (req, res) => {
  try {
    const { cgpa, creditsCompleted } = req.body;
    const scholarships = await Scholarship.find({
      'criteria.minCGPA': { $lte: cgpa },
      'criteria.minCredits': { $lte: creditsCompleted },
      isActive: true
    });
    
    res.json(scholarships);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search part-time jobs with advanced filters
exports.searchPartTimeJobs = async (req, res) => {
  try {
    const { department, company, duration, workLocation } = req.query;
    const filter = { type: 'part-time', isActive: true };
    
    if (department) filter.department = { $in: [department] };
    if (company) filter.company = { $regex: company, $options: 'i' };
    if (duration) filter.duration = { $regex: duration, $options: 'i' };
    if (workLocation) filter.workLocation = workLocation;
    
    const jobs = await PartTimeJob.find(filter).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};