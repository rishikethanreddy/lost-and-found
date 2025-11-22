import { ReportItemForm } from '@/components/forms/report-item-form';

export default function ReportFoundPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Report a Found Item</h1>
        <p className="text-muted-foreground">
          Thank you for being a responsible member of our community. Please provide details about the item you found.
        </p>
      </div>
      <ReportItemForm type="found" />
    </div>
  );
}
