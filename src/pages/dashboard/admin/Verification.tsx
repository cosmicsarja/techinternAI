import { Building } from 'lucide-react';

export default function AdminVerification() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Company Verification</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Review and approve new company registrations</p>
      </div>

      <div className="flex flex-col items-center py-20 text-center animate-slide-up">
        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
          <Building className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">No pending verifications</h2>
        <p className="text-sm text-muted-foreground max-w-sm mt-1">
          New companies requiring manual KYC/identity verification before they can post projects will appear here.
        </p>
      </div>
    </div>
  );
}
