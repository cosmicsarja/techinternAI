-- Add dummy students for AI matching testing and demonstration
-- This migration creates realistic student profiles with varied skill levels and tech stacks

-- Insert dummy student auth users first (these would normally be created via auth)
-- Note: In production, use proper auth user creation. This is for testing only.

-- Create test student profiles with varied skills and experience
INSERT INTO public.profiles (id, name, email, role, skill_score, github_url, avatar_url, bio, created_at, updated_at)
VALUES
  -- Senior Full-Stack Developer
  (
    gen_random_uuid(),
    'Alex Chen',
    'alex.chen@example.com',
    'student',
    92,
    'https://github.com/alexchen',
    'https://avatars.githubusercontent.com/u/1?v=4',
    'Senior Full-Stack Developer with 8+ years experience. Expert in React, Node.js, TypeScript, PostgreSQL, AWS, Docker, and GraphQL. Led multiple successful projects for startups and enterprises. Passionate about scalable architectures and mentoring junior developers. JavaScript, TypeScript, Python, React, Next.js, Node.js, Express, PostgreSQL, MongoDB, AWS, Docker, Kubernetes, GraphQL, REST APIs.',
    now(),
    now()
  ),
  
  -- Mid-Level React Specialist
  (
    gen_random_uuid(),
    'Jordan Martinez',
    'jordan.m@example.com',
    'student',
    78,
    'https://github.com/jordanmart',
    'https://avatars.githubusercontent.com/u/2?v=4',
    'React & Frontend specialist with 4 years of experience. Strong in TypeScript, TailwindCSS, Next.js, and modern JavaScript. Experienced with state management (Redux, Zustand) and testing frameworks. React, TypeScript, JavaScript, Next.js, TailwindCSS, React Query, Redux, Jest, Vitest, CSS, HTML, Responsive Design.',
    now(),
    now()
  ),

  -- Backend Python Developer
  (
    gen_random_uuid(),
    'Priya Patel',
    'priya.patel@example.com',
    'student',
    85,
    'https://github.com/priyap',
    'https://avatars.githubusercontent.com/u/3?v=4',
    'Backend engineer specializing in Python and database design. 6 years building scalable APIs and microservices. Proficient with Django, FastAPI, PostgreSQL, and cloud deployment. Experience with Docker, Kubernetes, CI/CD pipelines. Python, FastAPI, Django, PostgreSQL, MySQL, Redis, Docker, Kubernetes, Linux, Git, REST APIs, AWS.',
    now(),
    now()
  ),

  -- DevOps & Infrastructure Engineer
  (
    gen_random_uuid(),
    'Sam Rodriguez',
    'sam.rodriguez@example.com',
    'student',
    88,
    'https://github.com/samrodriguez',
    'https://avatars.githubusercontent.com/u/4?v=4',
    'DevOps engineer with 7 years of experience. Expert in Kubernetes, Docker, Terraform, AWS, GCP, and CI/CD. Strong Linux and infrastructure automation skills. Excellent at system design and cloud architecture. Docker, Kubernetes, Terraform, AWS, GCP, Jenkins, GitHub Actions, Linux, Bash, Python, Go, Monitoring, Infrastructure as Code.',
    now(),
    now()
  ),

  -- Full-Stack JavaScript Developer
  (
    gen_random_uuid(),
    'Emma Wilson',
    'emma.wilson@example.com',
    'student',
    81,
    'https://github.com/emmaw',
    'https://avatars.githubusercontent.com/u/5?v=4',
    'Full-Stack JavaScript developer with 5 years experience. Proficient in Vue.js, Node.js, Express, and modern tooling. Built 30+ production applications. Interested in JAMstack and serverless architectures. JavaScript, TypeScript, Vue.js, Node.js, Express, MongoDB, Firebase, GraphQL, Webpack, Vite, Testing.',
    now(),
    now()
  ),

  -- Junior React Developer
  (
    gen_random_uuid(),
    'Mike Johnson',
    'mike.j@example.com',
    'student',
    62,
    'https://github.com/mikej',
    'https://avatars.githubusercontent.com/u/6?v=4',
    'Junior React developer with 2 years of experience. Currently learning advanced patterns and state management. Solid foundation in JavaScript, React, and CSS. Eager to contribute to larger projects. JavaScript, React, CSS, HTML, React Hooks, Fetch API, Git, VS Code.',
    now(),
    now()
  ),

  -- Mobile Developer (React Native)
  (
    gen_random_uuid(),
    'Lisa Wang',
    'lisa.wang@example.com',
    'student',
    84,
    'https://github.com/lisawang',
    'https://avatars.githubusercontent.com/u/7?v=4',
    'Mobile developer specializing in React Native and iOS. 6 years building cross-platform apps. Experienced with Redux, Firebase, and native modules. Published 5 apps on App Store. React Native, JavaScript, TypeScript, Swift, iOS, Android, Firebase, Redux, React Navigation.',
    now(),
    now()
  ),

  -- Data Science & Python Developer
  (
    gen_random_uuid(),
    'Rajesh Kumar',
    'rajesh.k@example.com',
    'student',
    87,
    'https://github.com/rajeshk',
    'https://avatars.githubusercontent.com/u/8?v=4',
    'Data scientist and backend engineer with 7 years experience. Strong Python skills for data analysis and web development. Experienced with machine learning, data pipelines, and API development. Python, FastAPI, Django, Pandas, NumPy, TensorFlow, PostgreSQL, MongoDB, AWS, Docker, Jupyter.',
    now(),
    now()
  ),

  -- Full-Stack Web Developer
  (
    gen_random_uuid(),
    'Sophie Adams',
    'sophie.adams@example.com',
    'student',
    79,
    'https://github.com/sophiea',
    'https://avatars.githubusercontent.com/u/9?v=4',
    'Full-Stack developer with 4 years experience in startups. Comfortable with both frontend and backend. Experienced with modern JavaScript, React, Node.js, and databases. React, Node.js, Express, JavaScript, TypeScript, MongoDB, PostgreSQL, TailwindCSS, Stripe API.',
    now(),
    now()
  ),

  -- Intermediate Full-Stack Developer
  (
    gen_random_uuid(),
    'David Lee',
    'david.lee@example.com',
    'student',
    72,
    'https://github.com/davidlee',
    'https://avatars.githubusercontent.com/u/10?v=4',
    'Mid-level full-stack developer with 3 years experience. Passionate about building web applications. Knowledge of React, Vue, Node.js, and cloud platforms. Always learning new technologies. JavaScript, React, Vue.js, Node.js, Firebase, SQL, REST APIs, Git, HTML, CSS.',
    now(),
    now()
  ),

  -- UI/UX & Frontend Developer
  (
    gen_random_uuid(),
    'Maya Desai',
    'maya.desai@example.com',
    'student',
    76,
    'https://github.com/mayad',
    'https://avatars.githubusercontent.com/u/11?v=4',
    'Frontend-focused developer with strong design sense. 5 years experience building beautiful, accessible interfaces. Skilled in React, TailwindCSS, and design systems. Experienced with Figma and component libraries. React, TypeScript, TailwindCSS, Styled Components, Figma, Accessibility, HTML, CSS, JavaScript.',
    now(),
    now()
  ),

  -- Backend Go Developer
  (
    gen_random_uuid(),
    'Oliver Chen',
    'oliver.chen@example.com',
    'student',
    83,
    'https://github.com/oliverchen',
    'https://avatars.githubusercontent.com/u/12?v=4',
    'Backend engineer specializing in Go and high-performance systems. 6 years building microservices and distributed systems. Expert in concurrency, database optimization, and cloud deployment. Go, Rust, Docker, Kubernetes, PostgreSQL, Redis, gRPC, Protocol Buffers, Linux.',
    now(),
    now()
  ),

  -- Full-Stack TypeScript Developer
  (
    gen_random_uuid(),
    'Catherine Mitchell',
    'catherine.m@example.com',
    'student',
    89,
    'https://github.com/catherinemitchell',
    'https://avatars.githubusercontent.com/u/13?v=4',
    'Senior full-stack TypeScript developer. 8+ years experience with focus on type-safe, maintainable code. Expert in React, Node.js, NestJS, and cloud platforms. Lead architect on several SaaS products. TypeScript, React, Next.js, Node.js, NestJS, PostgreSQL, Docker, AWS, Microservices.',
    now(),
    now()
  ),

  -- Junior Full-Stack Developer
  (
    gen_random_uuid(),
    'Tom Bradley',
    'tom.bradley@example.com',
    'student',
    58,
    'https://github.com/tombradley',
    'https://avatars.githubusercontent.com/u/14?v=4',
    'Junior full-stack developer with 1.5 years experience. Learning and growing rapidly. Proficient in React and Node.js basics. Excited to work on real-world projects. JavaScript, React, Node.js, Express, MongoDB, HTML, CSS, Git, REST APIs.',
    now(),
    now()
  ),

  -- Cloud & DevOps Specialist
  (
    gen_random_uuid(),
    'Angela Zhang',
    'angela.z@example.com',
    'student',
    86,
    'https://github.com/angelazhang',
    'https://avatars.githubusercontent.com/u/15?v=4',
    'Cloud infrastructure and DevOps specialist. 7 years experience designing and managing cloud systems. Expert in AWS, Terraform, and automation. Strong Linux and networking knowledge. AWS, Terraform, Docker, Kubernetes, Linux, Bash, Python, CloudFormation, CI/CD, Monitoring.',
    now(),
    now()
  );
