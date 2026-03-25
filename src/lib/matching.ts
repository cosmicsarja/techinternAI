/**
 * AI Matching Algorithm
 * Analyzes student profiles and GitHub activity to match them with projects
 */

export interface StudentProfile {
  id: string;
  name: string;
  skill_score: number;
  github_url?: string;
  portfolio_url?: string;
  linkedin_url?: string;
  bio?: string;
}

export interface ProjectProfile {
  id: string;
  title: string;
  description: string;
  tech_stack: string[];
  budget: number;
  status: string;
}

export interface MatchResult {
  studentId: string;
  projectId: string;
  compatibilityScore: number; // 0-100
  matchReasons: string[];
  suggestedRole: string;
  confidence: number;
}

export interface TeamRecommendation {
  projectId: string;
  suggestedMembers: Array<{
    studentId: string;
    role: string;
    score: number;
    name: string;
  }>;
  overallScore: number;
}

/**
 * Calculate tech stack similarity between student experience and project requirements
 */
function calculateTechMatch(studentTechs: string[], projectTechs: string[]): number {
  if (projectTechs.length === 0) return 100;
  if (studentTechs.length === 0) return 0;

  const matches = studentTechs.filter(tech => 
    projectTechs.some(pTech => pTech.toLowerCase().includes(tech.toLowerCase()) || 
                               tech.toLowerCase().includes(pTech.toLowerCase()))
  ).length;

  return (matches / projectTechs.length) * 100;
}

/**
 * Analyze GitHub activity level
 * (In a real scenario, this would fetch actual GitHub data)
 */
function estimateGitHubActivity(skillScore: number): number {
  // Skill score correlates with GitHub activity
  // Higher skill score = more likely to have good GitHub activity
  return Math.min(100, skillScore);
}

/**
 * Calculate experience level based on skill score
 */
function getExperienceLevel(skillScore: number): 'junior' | 'mid' | 'senior' {
  if (skillScore < 40) return 'junior';
  if (skillScore < 75) return 'mid';
  return 'senior';
}

/**
 * Suggest best role for a student based on their profile
 */
function suggestRole(skillScore: number, isLeader: boolean = false): string {
  if (isLeader || skillScore >= 80) return 'lead_developer';
  if (skillScore >= 65) return 'developer';
  if (skillScore >= 50) return 'junior_developer';
  return 'developer';
}

/**
 * Calculate compatibility score between student and project
 */
export function calculateCompatibility(
  student: StudentProfile,
  project: ProjectProfile
): MatchResult {
  const matchReasons: string[] = [];
  let score = 0;

  // Extract tech stack from bio/description if available
  const studentTechs = extractTechStack(student.bio || '');

  // 1. Tech Stack Match (40% weight)
  const techScore = calculateTechMatch(studentTechs, project.tech_stack);
  score += techScore * 0.4;
  if (techScore >= 70) {
    matchReasons.push('Strong tech stack alignment');
  } else if (techScore >= 50) {
    matchReasons.push('Partial tech stack match');
  }

  // 2. Skill Score Match (30% weight)
  // Assuming projects need experienced developers for larger budgets
  const budgetMultiplier = Math.min(100, (project.budget / 5000) * 100);
  const skillMatch = Math.abs(student.skill_score - (budgetMultiplier / 100 * 100));
  const skillScore = 100 - Math.min(100, skillMatch);
  score += skillScore * 0.3;

  if (student.skill_score >= 75) {
    matchReasons.push('High skill level matches project complexity');
  }

  // 3. Profile Links (20% weight) — GitHub + Portfolio + LinkedIn
  let linkScore = 0;
  if (student.github_url) {
    linkScore += 50;
    matchReasons.push('Active GitHub presence');
  }
  if (student.portfolio_url) {
    linkScore += 30;
    matchReasons.push('Portfolio available for review');
  }
  if (student.linkedin_url) {
    linkScore += 20;
    matchReasons.push('LinkedIn profile linked');
  }
  score += Math.min(100, linkScore) * 0.2;

  // 4. Budget Fit (10% weight)
  const budgetFit = Math.min(100, (student.skill_score / 100) * 100);
  score += budgetFit * 0.1;

  // Add more specific matches
  if (project.budget > 5000 && student.skill_score >= 70) {
    matchReasons.push('Suitable for well-funded project');
  }

  return {
    studentId: student.id,
    projectId: project.id,
    compatibilityScore: Math.round(score),
    matchReasons,
    suggestedRole: suggestRole(student.skill_score),
    confidence: Math.min(100, Math.round((matchReasons.length / 3) * 100)),
  };
}

/**
 * Match multiple students to a project and recommend a team
 */
export function recommendTeam(
  students: StudentProfile[],
  project: ProjectProfile
): TeamRecommendation {
  // Calculate compatibility for each student
  const matches = students
    .map(student => calculateCompatibility(student, project))
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  // Select top students for team composition
  // Ideal team: 1 lead + 2-3 developers + optional specialist
  const teamSize = project.tech_stack.length > 4 ? 4 : 3;
  const selectedMatches = matches.slice(0, teamSize);

  // Assign roles
  const teamMembers = selectedMatches.map((match, index) => {
    const student = students.find(s => s.id === match.studentId)!;
    let role = 'developer';
    
    if (index === 0) {
      role = 'team_lead';
    } else if (index === teamSize - 1 && project.tech_stack.length > 3) {
      role = 'specialist';
    }

    return {
      studentId: match.studentId,
      role,
      score: match.compatibilityScore,
      name: student.name,
    };
  });

  const overallScore = Math.round(
    teamMembers.reduce((sum, m) => sum + m.score, 0) / teamMembers.length
  );

  return {
    projectId: project.id,
    suggestedMembers: teamMembers,
    overallScore,
  };
}

/**
 * Extract technologies mentioned in text
 */
export function extractTechStack(text: string): string[] {
  const commonTechs = [
    'javascript', 'typescript', 'python', 'java', 'golang', 'rust', 'php', 'ruby',
    'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'gatsby',
    'node.js', 'express', 'django', 'flask', 'rails', 'spring', 'fastapi',
    'postgresql', 'mongodb', 'mysql', 'redis', 'elasticsearch', 'firebase',
    'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'terraform',
    'git', 'graphql', 'rest', 'websocket', 'tailwindcss', 'sass', 'css',
    'html', 'sql', 'nosql', 'ai', 'ml', 'machine learning', 'deep learning',
  ];

  const lowerText = text.toLowerCase();
  return commonTechs.filter(tech => lowerText.includes(tech));
}

/**
 * Match a single student to projects
 */
export function matchStudentToProjects(
  student: StudentProfile,
  projects: ProjectProfile[]
): MatchResult[] {
  return projects
    .map(project => calculateCompatibility(student, project))
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, 10); // Top 10 matches
}

/**
 * Get match statistics
 */
export function getMatchStatistics(matches: MatchResult[]) {
  const avgScore = Math.round(
    matches.reduce((sum, m) => sum + m.compatibilityScore, 0) / matches.length || 0
  );
  
  const excellentMatches = matches.filter(m => m.compatibilityScore >= 80).length;
  const goodMatches = matches.filter(m => m.compatibilityScore >= 60 && m.compatibilityScore < 80).length;
  const fairMatches = matches.filter(m => m.compatibilityScore < 60).length;

  return {
    totalMatches: matches.length,
    averageScore: avgScore,
    excellentMatches,
    goodMatches,
    fairMatches,
  };
}
