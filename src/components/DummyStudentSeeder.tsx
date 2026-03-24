import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Zap, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { seedDummyStudents, clearDummyStudents } from '@/lib/seed-students';

/**
 * Debug component for seeding dummy students
 * Shows in development/testing mode
 */
export function DummyStudentSeeder() {
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await seedDummyStudents();
      if (result.success) {
        toast.success(result.message);
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Are you sure you want to remove all dummy students?')) return;
    
    setClearing(true);
    setError(null);
    try {
      const result = await clearDummyStudents();
      if (result.success) {
        toast.success(result.message);
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } finally {
      setClearing(false);
    }
  };

  return (
    <Card className="border-amber-500/30 bg-amber-500/5 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-600">
          <Zap className="w-5 h-5" /> Test Data Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Seed 15 realistic dummy students for testing the AI matching system. These profiles have varied skill levels, GitHub URLs, and experience.
        </p>
        
        {error && (
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2 text-sm">
              {error}
              {error.includes('RLS') && (
                <div className="mt-2 text-xs">
                  <strong>Solution:</strong> Go to Supabase dashboard → Authentication → Policies → Find "Users can insert own profile" policy for the profiles table → Change it to also allow companies to insert student records.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex gap-3">
          <Button
            onClick={handleSeed}
            disabled={loading}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? 'Seeding...' : (
              <>
                <CheckCircle className="w-4 h-4" /> Seed Dummy Students
              </>
            )}
          </Button>
          <Button
            onClick={handleClear}
            disabled={clearing}
            variant="destructive"
            className="gap-2"
          >
            {clearing ? 'Clearing...' : (
              <>
                <Trash2 className="w-4 h-4" /> Clear Test Data
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
