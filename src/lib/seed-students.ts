import { supabase } from '@/integrations/supabase/client';

export const dummyStudents = [
  {
    name: 'Alex Chen',
    email: 'alex.chen@example.com',
    skill_score: 92,
    github_url: 'https://github.com/alexchen',
    avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
    bio: 'Senior Full-Stack Developer with 8+ years experience. Expert in React, Node.js, TypeScript, PostgreSQL, AWS, Docker, and GraphQL. Led multiple successful projects for startups and enterprises. JavaScript, TypeScript, Python, React, Next.js, Node.js, Express, PostgreSQL, MongoDB, AWS, Docker, Kubernetes, GraphQL',
  },
  {
    name: 'Jordan Martinez',
    email: 'jordan.m@example.com',
    skill_score: 78,
    github_url: 'https://github.com/jordanmart',
    avatar_url: 'https://avatars.githubusercontent.com/u/2?v=4',
    bio: 'React & Frontend specialist with 4 years of experience. Strong in TypeScript, TailwindCSS, Next.js, and modern JavaScript. React, TypeScript, JavaScript, Next.js, TailwindCSS, React Query, Redux, Jest, Vitest',
  },
  {
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    skill_score: 85,
    github_url: 'https://github.com/priyap',
    avatar_url: 'https://avatars.githubusercontent.com/u/3?v=4',
    bio: 'Backend engineer specializing in Python and database design. 6 years building scalable APIs and microservices. Python, FastAPI, Django, PostgreSQL, MySQL, Redis, Docker, Kubernetes, Linux',
  },
  {
    name: 'Sam Rodriguez',
    email: 'sam.rodriguez@example.com',
    skill_score: 88,
    github_url: 'https://github.com/samrodriguez',
    avatar_url: 'https://avatars.githubusercontent.com/u/4?v=4',
    bio: 'DevOps engineer with 7 years of experience. Expert in Kubernetes, Docker, Terraform, AWS, GCP, and CI/CD. Docker, Kubernetes, Terraform, AWS, GCP, Jenkins, GitHub Actions, Linux, Bash, Python, Go',
  },
  {
    name: 'Emma Wilson',
    email: 'emma.wilson@example.com',
    skill_score: 81,
    github_url: 'https://github.com/emmaw',
    avatar_url: 'https://avatars.githubusercontent.com/u/5?v=4',
    bio: 'Full-Stack JavaScript developer with 5 years experience. Proficient in Vue.js, Node.js, Express, and modern tooling. JavaScript, TypeScript, Vue.js, Node.js, Express, MongoDB, Firebase, GraphQL, Webpack, Vite',
  },
  {
    name: 'Mike Johnson',
    email: 'mike.j@example.com',
    skill_score: 62,
    github_url: 'https://github.com/mikej',
    avatar_url: 'https://avatars.githubusercontent.com/u/6?v=4',
    bio: 'Junior React developer with 2 years of experience. Currently learning advanced patterns and state management. JavaScript, React, CSS, HTML, React Hooks, Fetch API, Git',
  },
  {
    name: 'Lisa Wang',
    email: 'lisa.wang@example.com',
    skill_score: 84,
    github_url: 'https://github.com/lisawang',
    avatar_url: 'https://avatars.githubusercontent.com/u/7?v=4',
    bio: 'Mobile developer specializing in React Native and iOS. 6 years building cross-platform apps. React Native, JavaScript, TypeScript, Swift, iOS, Android, Firebase, Redux, React Navigation',
  },
  {
    name: 'Rajesh Kumar',
    email: 'rajesh.k@example.com',
    skill_score: 87,
    github_url: 'https://github.com/rajeshk',
    avatar_url: 'https://avatars.githubusercontent.com/u/8?v=4',
    bio: 'Data scientist and backend engineer with 7 years experience. Strong Python skills for data analysis and web development. Python, FastAPI, Django, Pandas, NumPy, TensorFlow, PostgreSQL, MongoDB, AWS, Docker',
  },
  {
    name: 'Sophie Adams',
    email: 'sophie.adams@example.com',
    skill_score: 79,
    github_url: 'https://github.com/sophiea',
    avatar_url: 'https://avatars.githubusercontent.com/u/9?v=4',
    bio: 'Full-Stack developer with 4 years experience in startups. Comfortable with both frontend and backend. React, Node.js, Express, JavaScript, TypeScript, MongoDB, PostgreSQL, TailwindCSS, Stripe API',
  },
  {
    name: 'David Lee',
    email: 'david.lee@example.com',
    skill_score: 72,
    github_url: 'https://github.com/davidlee',
    avatar_url: 'https://avatars.githubusercontent.com/u/10?v=4',
    bio: 'Mid-level full-stack developer with 3 years experience. Passionate about building web applications. JavaScript, React, Vue.js, Node.js, Firebase, SQL, REST APIs, Git, HTML, CSS',
  },
  {
    name: 'Maya Desai',
    email: 'maya.desai@example.com',
    skill_score: 76,
    github_url: 'https://github.com/mayad',
    avatar_url: 'https://avatars.githubusercontent.com/u/11?v=4',
    bio: 'Frontend-focused developer with strong design sense. 5 years experience building beautiful, accessible interfaces. React, TypeScript, TailwindCSS, Styled Components, Figma, Accessibility, HTML, CSS',
  },
  {
    name: 'Oliver Chen',
    email: 'oliver.chen@example.com',
    skill_score: 83,
    github_url: 'https://github.com/oliverchen',
    avatar_url: 'https://avatars.githubusercontent.com/u/12?v=4',
    bio: 'Backend engineer specializing in Go and high-performance systems. 6 years building microservices and distributed systems. Go, Rust, Docker, Kubernetes, PostgreSQL, Redis, gRPC, Protocol Buffers',
  },
  {
    name: 'Catherine Mitchell',
    email: 'catherine.m@example.com',
    skill_score: 89,
    github_url: 'https://github.com/catherinemitchell',
    avatar_url: 'https://avatars.githubusercontent.com/u/13?v=4',
    bio: 'Senior full-stack TypeScript developer. 8+ years experience with focus on type-safe, maintainable code. TypeScript, React, Next.js, Node.js, NestJS, PostgreSQL, Docker, AWS, Microservices',
  },
  {
    name: 'Tom Bradley',
    email: 'tom.bradley@example.com',
    skill_score: 58,
    github_url: 'https://github.com/tombradley',
    avatar_url: 'https://avatars.githubusercontent.com/u/14?v=4',
    bio: 'Junior full-stack developer with 1.5 years experience. Learning and growing rapidly. JavaScript, React, Node.js, Express, MongoDB, HTML, CSS, Git, REST APIs',
  },
  {
    name: 'Angela Zhang',
    email: 'angela.z@example.com',
    skill_score: 86,
    github_url: 'https://github.com/angelazhang',
    avatar_url: 'https://avatars.githubusercontent.com/u/15?v=4',
    bio: 'Cloud infrastructure and DevOps specialist. 7 years experience designing and managing cloud systems. AWS, Terraform, Docker, Kubernetes, Linux, Bash, Python, CloudFormation, CI/CD, Monitoring',
  },
];

/**
 * Seed dummy student profiles for AI matching demonstration
 * This function creates test student profiles in the database
 */
export async function seedDummyStudents() {
  try {
    // Check if students already exist to avoid duplicates
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'student')
      .limit(1)
      .maybeSingle();

    if (existing) {
      console.log('Dummy students already exist in database');
      return { success: true, message: 'Dummy students already seeded' };
    }

    // Use batch insert with proper error handling
    const profilesToInsert = dummyStudents.map(student => ({
      name: student.name,
      email: student.email,
      role: 'student' as const,
      skill_score: student.skill_score,
      github_url: student.github_url,
      avatar_url: student.avatar_url,
      bio: student.bio,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('profiles')
      .insert(profilesToInsert)
      .select();

    if (error) {
      console.error('Error seeding dummy students:', error);
      
      // Provide detailed error feedback
      if (error.message.includes('row-level security') || error.code === 'PGRST301') {
        return {
          success: false,
          error: 'RLS Policy Error: Your account does not have permission to create student profiles. Please use an admin account or contact your administrator.',
          details: error.message
        };
      }
      
      return { success: false, error: error.message };
    }

    console.log(`Successfully seeded ${data?.length || 0} dummy students`);
    return {
      success: true,
      message: `Seeded ${data?.length || 0} dummy students`,
      data,
    };
  } catch (err) {
    console.error('Unexpected error seeding dummy students:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Get all dummy students (useful for testing without database)
 */
export function getDummyStudents() {
  return dummyStudents.map((student, index) => ({
    id: `dummy-student-${index + 1}`,
    ...student,
    role: 'student',
  }));
}

/**
 * Get dummy student by email
 */
export function getDummyStudentByEmail(email: string) {
  return dummyStudents.find(s => s.email === email);
}

/**
 * Clear all dummy students (for cleanup)
 */
export async function clearDummyStudents() {
  try {
    const emails = dummyStudents.map(s => s.email);

    const { error } = await supabase
      .from('profiles')
      .delete()
      .in('email', emails)
      .eq('role', 'student');

    if (error) {
      console.error('Error clearing dummy students:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully cleared dummy students');
    return { success: true, message: 'Cleared all dummy students' };
  } catch (err) {
    console.error('Unexpected error clearing dummy students:', err);
    return { success: false, error: String(err) };
  }
}
