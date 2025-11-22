
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, CheckCheck, FileText, Link2, XCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';

type FounderNotification = {
  id: string;
  claimant_name: string | null;
  item_name: string | null;
  created_at: string;
};

type ClaimantNotification = {
    id: string;
    message: string;
    created_at: string;
    claim_id: string;
    item_id: string;
    is_read: boolean;
};

type MatchNotification = {
    id: string;
    message: string;
    created_at: string;
    claim_id: string; // Using claim_id to store match_id
    item_id: string;
    is_read: boolean;
    type: 'match';
}

type CombinedNotification = 
    | { type: 'founder_claim'; data: FounderNotification }
    | { type: 'claimant_status'; data: ClaimantNotification }
    | { type: 'loser_match'; data: MatchNotification };

export function Notifications() {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<CombinedNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
    }
    fetchUser();
  }, []);

  const fetchNotifications = async (currentUser: User | null) => {
    if (!currentUser) return;

    // Fetch notifications for claims on user's items (as a founder)
    const { data: founderData, error: founderError } = await supabase
      .rpc('get_claims_for_user_items', { user_id_param: currentUser.id, claim_status: 'pending' });

    if (founderError) console.error('Error fetching founder notifications:', founderError);

    const founderNotifications: CombinedNotification[] = founderData?.map((claim: any) => ({
      type: 'founder_claim',
      data: {
        id: claim.id,
        claimant_name: claim.claimant.full_name || 'An unknown user',
        item_name: claim.item.name,
        created_at: claim.created_at,
      }
    })) || [];
    
    // Fetch notifications for user's own claims (as a claimant) and matches (as a loser)
    const { data: userNotificationsData, error: userNotificationsError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (userNotificationsError) console.error('Error fetching user notifications:', userNotificationsError);

    const userNotifications: CombinedNotification[] = userNotificationsData?.map((n: any) => {
        if (n.type === 'match') {
            return { type: 'loser_match', data: n as MatchNotification };
        }
        return { type: 'claimant_status', data: n as ClaimantNotification };
    }) || [];
    
    // Combine and sort notifications
    const allNotifications = [...founderNotifications, ...userNotifications].sort(
      (a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
    );
    setNotifications(allNotifications.slice(0, 10)); // Limit to 10 most recent

    // Calculate unread count (pending claims + unread status updates)
    const { count: unreadUserNotificationsCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUser.id)
      .eq('is_read', false);
    
    if (countError) console.error('Error fetching unread count:', countError);

    setUnreadCount((founderNotifications.length) + (unreadUserNotificationsCount ?? 0));
  };

  useEffect(() => {
    if (user) {
        fetchNotifications(user);
    }

    const channel = supabase
        .channel('all-notifications-v2')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'claims' }, () => fetchNotifications(user))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' }, () => fetchNotifications(user))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetchNotifications(user))
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async () => {
    if (!user) return;
    
    const unreadIds = notifications
        .filter(n => (n.type === 'claimant_status' || n.type === 'loser_match') && !n.data.is_read)
        .map(n => n.data.id);
    
    if (unreadIds.length === 0) {
        return;
    };

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);
    
    if (error) {
        console.error("Error marking notifications as read", error);
    }
    // Re-fetch to get the latest state after marking as read
    fetchNotifications(user);
  }

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Optimistically set unread count to 0 for instant UI feedback
      setUnreadCount(0);
      markAsRead();
    }
  }

  const getNotificationContent = (notification: CombinedNotification) => {
    switch(notification.type) {
        case 'founder_claim':
            return {
                href: '/account',
                icon: <FileText className="h-5 w-5 text-blue-500 mt-0.5" />,
                isUnread: true, // Founder claims are always "new"
                text: (
                    <p className="text-sm">
                        <span className="font-semibold">{notification.data.claimant_name}</span> has made a claim on your item: <span className="font-semibold">{notification.data.item_name}</span>.
                    </p>
                )
            };
        case 'claimant_status':
             const isApproved = notification.data.message.includes('approved');
             return {
                href: '/my-claims',
                icon: isApproved ? 
                      <CheckCheck className="h-5 w-5 text-green-500 mt-0.5" /> : 
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5" />,
                isUnread: !notification.data.is_read,
                text: (
                    <div>
                        <p className="font-semibold text-sm">{isApproved ? 'Claim Approved' : 'Claim Rejected'}</p>
                        <p className="text-sm text-muted-foreground">{notification.data.message}</p>
                    </div>
                )
            };
        case 'loser_match':
             return {
                href: '/account?tab=matches',
                icon: <Link2 className="h-5 w-5 text-purple-500 mt-0.5" />,
                isUnread: !notification.data.is_read,
                text: (
                    <div>
                        <p className="font-semibold text-sm">Potential Match Found</p>
                        <p className="text-sm text-muted-foreground">{notification.data.message}</p>
                    </div>
                )
            };
    }
  }

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-4">
          <h4 className="text-sm font-medium">Notifications</h4>
        </div>
        <Separator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length > 0 ? (
            <ul className="divide-y">
              {notifications.map((notification, index) => {
                const { href, icon, text, isUnread } = getNotificationContent(notification);
                return (
                 <li key={`${notification.type}-${notification.data.id}-${index}`} className={cn("p-4", isUnread ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50")}>
                    <Link href={href} className="flex items-start space-x-3">
                        {icon}
                        <div>
                            {text}
                            <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(notification.data.created_at), { addSuffix: true })}
                            </p>
                        </div>
                    </Link>
                </li>
                )
            })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <BellOff className="h-8 w-8 text-muted-foreground mb-2"/>
                <p className="text-sm text-muted-foreground">You have no new notifications.</p>
            </div>
          )}
        </div>
        <Separator />
        <div className="p-2 grid grid-cols-2 gap-2">
            <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                <Link href="/account">Review Activity</Link>
            </Button>
            <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                <Link href="/my-claims">Submitted Claims</Link>
            </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
