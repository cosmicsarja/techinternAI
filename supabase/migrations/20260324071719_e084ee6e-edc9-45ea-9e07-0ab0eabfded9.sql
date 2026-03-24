
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('student', 'company', 'admin');
CREATE TYPE public.project_status AS ENUM ('open', 'assigned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.bid_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE public.milestone_status AS ENUM ('pending', 'in_progress', 'submitted', 'approved', 'rejected');
CREATE TYPE public.payment_status AS ENUM ('escrow', 'released', 'refunded');
CREATE TYPE public.deliverable_status AS ENUM ('pending', 'submitted', 'approved', 'rejected');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  role app_role NOT NULL DEFAULT 'student',
  skill_score INTEGER NOT NULL DEFAULT 0,
  github_url TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  tech_stack TEXT[] DEFAULT '{}',
  budget NUMERIC(10,2) NOT NULL DEFAULT 0,
  deadline TIMESTAMPTZ,
  company_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status project_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone auth can view projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Companies can insert projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = company_id);
CREATE POLICY "Companies can update own projects" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = company_id);

-- Bids table
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  proposal TEXT NOT NULL DEFAULT '',
  bid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  timeline TEXT DEFAULT '',
  status bid_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own bids" ON public.bids FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Companies can view bids on their projects" ON public.bids FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = bids.project_id AND projects.company_id = auth.uid())
);
CREATE POLICY "Admins can view all bids" ON public.bids FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Students can insert bids" ON public.bids FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Companies can update bids on their projects" ON public.bids FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = bids.project_id AND projects.company_id = auth.uid())
);

-- Teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  leader_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can view teams" ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leaders can insert teams" ON public.teams FOR INSERT TO authenticated WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "Leaders can update teams" ON public.teams FOR UPDATE TO authenticated USING (auth.uid() = leader_id);

-- Team members
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can view team members" ON public.team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team leaders can manage members" ON public.team_members FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.teams WHERE teams.id = team_members.team_id AND teams.leader_id = auth.uid())
);
CREATE POLICY "Team leaders can delete members" ON public.team_members FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.teams WHERE teams.id = team_members.team_id AND teams.leader_id = auth.uid())
);

-- Milestones
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  deadline TIMESTAMPTZ,
  status milestone_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can view milestones" ON public.milestones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Project participants can insert milestones" ON public.milestones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Project participants can update milestones" ON public.milestones FOR UPDATE TO authenticated USING (true);

-- Deliverables
CREATE TABLE public.deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE CASCADE NOT NULL,
  submission_link TEXT DEFAULT '',
  file_url TEXT DEFAULT '',
  status deliverable_status NOT NULL DEFAULT 'pending',
  submitted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can view deliverables" ON public.deliverables FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert deliverables" ON public.deliverables FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update deliverables" ON public.deliverables FOR UPDATE TO authenticated USING (true);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status payment_status NOT NULL DEFAULT 'escrow',
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can view payments" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Companies can insert payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins and companies can update payments" ON public.payments FOR UPDATE TO authenticated USING (true);

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can view reviews" ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  read BOOLEAN NOT NULL DEFAULT false,
  type TEXT NOT NULL DEFAULT 'info',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Workspace files (for Monaco editor)
CREATE TABLE public.workspace_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  content TEXT DEFAULT '',
  language TEXT DEFAULT 'javascript',
  created_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workspace_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can view workspace files" ON public.workspace_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert workspace files" ON public.workspace_files FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update workspace files" ON public.workspace_files FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete workspace files" ON public.workspace_files FOR DELETE TO authenticated USING (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
