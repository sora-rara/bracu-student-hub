// routes/careerRoutes.js
const express = require('express');
const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Career API is working!',
    timestamp: new Date().toISOString()
  });
});

// Scholarships route (temporary mock data)
router.get('/scholarships', (req, res) => {
  const { 
    page = 1, 
    limit = 12,
    search = '',
    category = '',
    minAmount = '',
    academicLevel = '',
    upcoming = 'true',
    sort = 'deadline'
  } = req.query;

  // Mock data for testing
  const mockScholarships = [
    {
      _id: '1',
      name: 'Academic Excellence Scholarship',
      provider: {
        name: 'University Excellence Program',
        isVerified: true
      },
      shortDescription: 'Awarded to students with outstanding academic performance',
      award: {
        amount: 5000,
        type: 'tuition',
        renewable: true
      },
      category: 'academic-merit',
      eligibility: {
        minGPA: 3.5,
        financialNeed: false,
        essaysRequired: true,
        recommendationsRequired: 2
      },
      application: {
        deadline: '2024-12-31',
        openDate: '2024-01-01',
        applicationLink: 'https://example.com/apply'
      },
      isFeatured: true,
      isExclusive: false,
      views: 150,
      applicantsCount: 45,
      createdAt: '2024-01-15T00:00:00.000Z'
    },
    {
      _id: '2',
      name: 'STEM Diversity Scholarship',
      provider: {
        name: 'Tech Diversity Foundation',
        isVerified: true
      },
      shortDescription: 'Supporting underrepresented groups in STEM fields',
      award: {
        amount: 7500,
        type: 'stipend',
        renewable: false
      },
      category: 'minority',
      eligibility: {
        minGPA: 3.0,
        financialNeed: true,
        essaysRequired: true,
        recommendationsRequired: 1
      },
      application: {
        deadline: '2024-11-30',
        openDate: '2024-02-01',
        applicationLink: 'https://example.com/stem-apply'
      },
      isFeatured: true,
      isExclusive: true,
      views: 220,
      applicantsCount: 78,
      createdAt: '2024-02-01T00:00:00.000Z'
    },
    // Add more mock scholarships as needed...
  ];

  // Filtering logic
  let filtered = [...mockScholarships];

  if (search) {
    filtered = filtered.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.provider.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (category) {
    filtered = filtered.filter(s => s.category === category);
  }

  if (minAmount) {
    filtered = filtered.filter(s => s.award.amount >= parseInt(minAmount));
  }

  if (upcoming === 'true') {
    const today = new Date();
    filtered = filtered.filter(s => new Date(s.application.deadline) > today);
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  const paginated = filtered.slice(startIndex, endIndex);

  res.json({
    success: true,
    scholarships: paginated,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(filtered.length / limitNum),
      totalScholarships: filtered.length,
      hasNextPage: endIndex < filtered.length,
      hasPrevPage: startIndex > 0
    }
  });
});

// Similar routes for jobs and internships
router.get('/jobs', (req, res) => {
  res.json({
    success: true,
    jobs: [],
    pagination: {
      currentPage: 1,
      totalPages: 0,
      totalJobs: 0,
      hasNextPage: false,
      hasPrevPage: false
    }
  });
});

router.get('/internships', (req, res) => {
  res.json({
    success: true,
    internships: [],
    pagination: {
      currentPage: 1,
      totalPages: 0,
      totalInternships: 0,
      hasNextPage: false,
      hasPrevPage: false
    }
  });
});

router.get('/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      totals: {
        jobs: 0,
        internships: 0,
        scholarships: 2,
        featuredJobs: 0,
        featuredInternships: 0,
        featuredScholarships: 2
      },
      categories: {
        jobs: [],
        internships: [],
        scholarships: [
          { _id: 'academic-merit', count: 1 },
          { _id: 'minority', count: 1 }
        ]
      },
      user: {
        applications: 0,
        savedOpportunities: 0,
        appliedJobs: 0,
        appliedInternships: 0,
        appliedScholarships: 0
      }
    }
  });
});

module.exports = router;