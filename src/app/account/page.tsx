
'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LogOut, Files, User as UserIcon, Terminal, FileText, Link2 } from 'lucide-react';
import { ProfileForm } from '@/components/forms/profile-form';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ClaimsManager } from '@/components/claims-manager';
import type { Claim, Match } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MatchesManager } from '@/components/matches-manager';

type Profile = {
  full_name: string | null;
};

type EnrichedClaim = Claim & {
  item: { name: string } | null;
  claimant: { full_name: string | null; email: string | null; } | null;
};

type EnrichedMatch = Match & {
  lost_item: { name: string } | null;
  finder: { full_name: string | null; email: string | null; } | null;
};


// Client component that uses searchParams
function AccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [claims, setClaims] = useState<EnrichedClaim[]>([]);
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const defaultTab = searchParams.get('tab') === 'matches' ? 'matches' : 'claims';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        router.push('/login');
        return;
      }
      setUser(authUser);

      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setError("Could not fetch user profile.");
      } else {
        setProfile(profileData);
      }

      // Fetch claims on user's FOUND items
      const { data: claimsData, error: claimsError } = await supabase
        .rpc('get_claims_for_user_items', { user_id_param: authUser.id });

      if (claimsError) {
          console.error('Error fetching claims:', claimsError);
          setError("Could not fetch claims for your items.");
      } else {
          const enrichedClaims = claimsData.map((claim: any) => ({
            ...claim,
            item: claim.item ? { name: claim.item.name } : null,
            claimant: claim.claimant ? { full_name: claim.claimant.full_name, email: claim.claimant.email } : null,
          }));
          setClaims(enrichedClaims as EnrichedClaim[]);
      }
      
      // Fetch matches on user's LOST items
      const { data: userLostItems, error: lostItemsError } = await supabase
        .from('items')
        .select('id')
        .eq('user_id', authUser.id)
        .eq('status', 'lost');

      if (lostItemsError) {
        console.error('Error fetching user lost items:', lostItemsError);
        setError("Could not fetch your lost items to check for matches.");
      } else {
        const lostItemIds = userLostItems.map(item => item.id);
        
        if (lostItemIds.length > 0) {
            const { data: matchesData, error: matchesError } = await supabase
              .from('matches')
              .select(`
                  *,
                  lost_item:items(name),
                  finder:profiles(full_name, email)
              `)
              .in('lost_item_id', lostItemIds);
              
            if (matchesError) {
                console.error('Error fetching matches:', matchesError);
                setError("Could not fetch matches for your lost items.");
            } else {
                const enrichedMatches = matchesData.map((match: any) => ({
                  ...match,
                  lost_item: match.lost_item ? { name: (match.lost_item as any).name } : null,
                  finder: match.finder ? { full_name: (match.finder as any).full_name, email: (match.finder as any).email } : null,
                }));
                setMatches(enrichedMatches as EnrichedMatch[]);
            }
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleProfileUpdate = (updatedName: string) => {
    setProfile(prev => prev ? { ...prev, full_name: updatedName } : { full_name: updatedName });
  }

  const handleClaimUpdate = (updatedClaim: EnrichedClaim) => {
    setClaims(prev => prev.map(c => c.id === updatedClaim.id ? updatedClaim : c));
  }

  const handleMatchUpdate = (updatedMatch: EnrichedMatch) => {
    setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
  }


  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-4 mb-8">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-5 w-1/2" />
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-1 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
          </div>
          <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-1/4" />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-16 w-full" />
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
        <div className="container mx-auto max-w-lg px-4 py-8">
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error Loading Page</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-2 mb-8">
            <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
            <p className="text-muted-foreground">Manage your account and profile settings.</p>
        </div>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
            <Card>
                <CardHeader className="flex-row items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10 text-primary flex-shrink-0">
                        <UserIcon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                        <CardTitle className="text-xl truncate">{profile?.full_name}</CardTitle>
                        <CardDescription className="break-words">{user?.email}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/my-reports')}>
                        <Files className="mr-2 h-4 w-4" /> My Reports
                    </Button>
                     <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/my-claims')}>
                        <FileText className="mr-2 h-4 w-4" /> My Claims
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                            <LogOut className="mr-2 h-4 w-4" /> Logout
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                            <AlertDialogDescription>
                                You will be returned to the homepage and will need to sign in again to access your account.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Log Out
                            </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-2 space-y-8">
          {user && profile && <ProfileForm user={user} profile={profile} onProfileUpdate={handleProfileUpdate} />}
          
          <Tabs defaultValue={defaultTab}>
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 h-auto sm:h-10">
              <TabsTrigger value="claims" className="py-2 sm:py-1.5">
                <FileText className="mr-2 h-4 w-4" />
                Claims on My Items
              </TabsTrigger>
              <TabsTrigger value="matches" className="py-2 sm:py-1.5">
                <Link2 className="mr-2 h-4 w-4" />
                Matches for My Items
              </TabsTrigger>
            </TabsList>
            <TabsContent value="claims">
                <ClaimsManager initialClaims={claims} onClaimUpdate={handleClaimUpdate} />
            </TabsContent>
            <TabsContent value="matches">
                <MatchesManager initialMatches={matches} onMatchUpdate={handleMatchUpdate} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Export the main component with Suspense boundary
export default function AccountPage() {
  return (
    <Suspense fallback={<div className="p-4"><Skeleton className="h-[400px] w-full" /></div>}>
      <AccountPageContent />
    </Suspense>
  );
}
