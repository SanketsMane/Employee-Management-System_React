// Comprehensive role list for the EMS system
// This file contains all available roles organized by category

export const ROLE_CATEGORIES = {
  traditional: {
    title: "Traditional Roles",
    roles: [
      'Employee',
      'Intern',
      'Team Lead',
      'Manager',
      'HR',
      'Admin'
    ]
  },
  
  internship: {
    title: "Internship Roles",
    roles: [
      'Data Science Intern',
      'Data Analytics Intern',
      'Machine Learning Intern',
      'AI Research Intern',
      'Software Development Intern',
      'Full Stack Developer Intern',
      'Frontend Developer Intern',
      'Backend Developer Intern',
      'Mobile App Developer Intern',
      'Cloud Computing Intern',
      'DevOps Intern',
      'UI/UX Design Intern',
      'Figma Designer Intern',
      'Product Management Intern',
      'Business Analyst Intern',
      'Quality Assurance (QA) Intern',
      'Cybersecurity Intern',
      'Database Intern'
    ]
  },
  
  dataAnalytics: {
    title: "Data & Analytics Roles",
    roles: [
      'Data Scientist',
      'Data Analyst',
      'Machine Learning Engineer',
      'AI Engineer',
      'Business Intelligence (BI) Analyst',
      'Data Engineer',
      'Data Architect',
      'Statistician',
      'Research Analyst'
    ]
  },
  
  development: {
    title: "Development Roles",
    roles: [
      'Software Engineer / Developer',
      'Full Stack Developer',
      'Frontend Developer',
      'Backend Developer',
      'Mobile App Developer (iOS, Android, React Native)',
      'Web Developer',
      'API Developer',
      'Embedded Systems Developer',
      'Game Developer',
      'Cloud Engineer',
      'Systems Engineer',
      'Software developer trainee',
      'Associate software developer',
      'Dot net developer',
      'Flutter developer',
      'React native developer',
      'Java developer'
    ]
  },
  
  cloudInfrastructure: {
    title: "Cloud & Infrastructure Roles",
    roles: [
      'DevOps Engineer',
      'Cloud Architect',
      'AWS Engineer',
      'Azure Engineer',
      'Google Cloud Engineer',
      'Site Reliability Engineer (SRE)',
      'Network Engineer',
      'Security Engineer'
    ]
  },
  
  design: {
    title: "Design Roles",
    roles: [
      'UI UX designer',
      'Graphic Designer',
      'Interaction Designer',
      'Motion Graphics Designer',
      'Visual Designer',
      'Figma Designer',
      'Adobe XD Designer'
    ]
  }
};

// Flat array of all roles for easy filtering and searching
export const ALL_ROLES = Object.values(ROLE_CATEGORIES)
  .flatMap(category => category.roles)
  .concat(['Other']);

// Get roles that match a search query
export const searchRoles = (query) => {
  if (!query) return ALL_ROLES;
  
  const lowercaseQuery = query.toLowerCase();
  return ALL_ROLES.filter(role => 
    role.toLowerCase().includes(lowercaseQuery)
  );
};

// Get role category
export const getRoleCategory = (role) => {
  for (const [categoryKey, category] of Object.entries(ROLE_CATEGORIES)) {
    if (category.roles.includes(role)) {
      return category.title;
    }
  }
  return role === 'Other' ? 'Custom' : 'Unknown';
};

export default {
  ROLE_CATEGORIES,
  ALL_ROLES,
  searchRoles,
  getRoleCategory
};