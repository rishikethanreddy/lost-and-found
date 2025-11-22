
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Notification } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, BellOff, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .rpc('get_claims_for_user_items', { user_id_param: user.id })
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        const formattedNotifications = data.map((claim: any) => ({
          id: claim.id,
          claimant_name: claim.claimant.full_name || 'An unknown user',
          item_name: claim.item.name,
          created_at: claim.created_at,
        }));
        setNotifications(formattedNotifications);
      }
      setLoading(false);
    };
    fetchNotifications();
  }, [router]);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">Recent claims on your found items.</p>
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
      ) : notifications.length > 0 ? (
        <Card>
            <CardContent className="p-0">
                 <ul className="divide-y">
                    {notifications.map((notification) => (
                        <li key={notification.id} className="p-4 hover:bg-muted/50">
                            <Link href="/account" className="flex items-start space-x-4">
                               <div className="flex-shrink-0 pt-1">
                                    <Bell className="h-5 w-5 text-primary" />
                               </div>
                               <div>
                                    <p className="text-sm">
                                        <span className="font-semibold">{notification.claimant_name}</span> submitted a claim for your item: <span className="font-semibold">{notification.item_name}</span>.
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                    </p>
                               </div>
                            </Link>
                        </li>
                    ))}
                 </ul>
            </CardContent>
        </Card>
      ) : (
        <Card className="flex flex-col items-center justify-center py-16">
            <CardHeader className="text-center">
                <div className="mx-auto bg-muted rounded-full p-3 w-fit mb-4">
                    <BellOff className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle>No Notifications Yet</CardTitle>
                <CardDescription>You have no new claims on your items.</CardDescription>
            </CardHeader>
        </Card>
      )}
    </div>
  );
}
    