import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Zap, Trash2, CheckCircle } from 'lucide-react';
import { seedDummyStudents, clearDummyStudents } from '@/lib/seed-students';

/**
 * Debug component for seeding dummy students
 * Shows in development/testing mode
 */
export function DummyStudentSeeder() {
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    try {
      const result = await seedDummyStudents();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Are you sure you want to remove all dummy students?')) return;
    
    setClearing(true);
    try {
      const result = await clearDummyStudents();
      if (result.success) {
        toast.success(result.message);
      } else {
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
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Seed 15 realistic dummy students for testing the AI matching system. These profiles have varied skill levels, GitHub URLs, and experience.
        </p>
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
