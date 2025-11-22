
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Item } from '@/lib/types';
import { UserReportsList } from '@/components/user-reports-list';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MyReportsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserItems = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
        console.error('Error fetching user items:', error.message);
      } else {
        setItems(data as Item[]);
      }
      setLoading(false);
    };

    fetchUserItems();
  }, [router]);

  const onReportDeleted = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Reports</h1>
        <p className="text-muted-foreground">
          View, edit, or delete the items you have reported.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <UserReportsList items={items} onReportDeleted={onReportDeleted} />
      )}
    </div>
  );
}
