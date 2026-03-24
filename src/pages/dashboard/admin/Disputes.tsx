import { Search } from 'lucide-react';

export default function AdminDisputes() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dispute Resolution</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage and resolve reported issues between companies and students</p>
      </div>

      <div className="flex flex-col items-center py-20 text-center animate-slide-up">
        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">No active disputes</h2>
        <p className="text-sm text-muted-foreground max-w-sm mt-1">
          When companies dispute a milestone submission or a student reports non-payment, they will appear here.
        </p>
      </div>
    </div>
  );
}
