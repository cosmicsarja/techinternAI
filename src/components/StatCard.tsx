import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: 'default' | 'primary' | 'accent' | 'warning';
}

export default function StatCard({ title, value, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  const iconBg = {
    default: 'bg-muted',
    primary: 'bg-primary/10',
    accent: 'bg-accent/10',
    warning: 'bg-warning/10',
  }[variant];

  const iconColor = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    accent: 'text-accent',
    warning: 'text-warning',
  }[variant];

  return (
    <Card className="shadow-card hover:shadow-elevated transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {trend && <p className="text-xs text-success mt-1">{trend}</p>}
          </div>
          <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
