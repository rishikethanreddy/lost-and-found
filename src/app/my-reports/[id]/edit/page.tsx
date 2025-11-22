
'use client';

import { ReportItemForm } from '@/components/forms/report-item-form';
import { supabase } from '@/lib/supabase/client';
import type { Item } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { notFound, useParams } from 'next/navigation';

export default function EditReportPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchItem = async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error("Error fetching item for edit:", error.message);
        setError(error.message);
      } else if (data) {
        setItem(data as Item);
      } else {
        notFound();
      }
      setLoading(false);
    };
    fetchItem();
  }, [id]);

  if (loading) {
      return (
          <div className="container mx-auto max-w-3xl px-4 py-8 space-y-8">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-1/4" />
          </div>
      )
  }

  if (error) {
    return (
        <div className="container mx-auto max-w-3xl px-4 py-8">
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Failed to load item</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
    )
  }

  if (!item) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Item Report</h1>
        <p className="text-muted-foreground">
          Update the details of your reported item below.
        </p>
      </div>
      <ReportItemForm type={item.status as 'lost' | 'found'} itemToEdit={item} />
    </div>
  );
}
