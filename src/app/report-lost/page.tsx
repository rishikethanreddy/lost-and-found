import { ReportItemForm } from '@/components/forms/report-item-form';

export default function ReportLostPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Report a Lost Item</h1>
        <p className="text-muted-foreground">
          Fill out the form below to report an item you have lost. The more details you provide, the higher the chance of recovery.
        </p>
      </div>
      <ReportItemForm type="lost" />
    </div>
  );
}
