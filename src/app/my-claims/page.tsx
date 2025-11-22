
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Claim } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Frown, Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';

type EnrichedClaim = Claim & {
  item: { name: string; id: string } | null;
};

export default function MyClaimsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [claims, setClaims] = useState<EnrichedClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserClaims = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('claims')
        .select(`
          *,
          item:items(id, name)
        `)
        .eq('claimant_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
        console.error('Error fetching user claims:', error.message);
      } else {
        const enrichedData = data.map(d => ({
            ...d,
            item: d.item ? { id: (d.item as any).id, name: (d.item as any).name } : null,
        }))
        setClaims(enrichedData);
      }
      setLoading(false);
    };

    fetchUserClaims();
  }, [router]);
  
  const handleDeleteClaim = async (claimToDelete: EnrichedClaim) => {
    setIsDeleting(claimToDelete.id);
    try {
        // Delete images from storage first
        if (claimToDelete.proof_image_urls && claimToDelete.proof_image_urls.length > 0) {
            const filePaths = claimToDelete.proof_image_urls.map(url => url.substring(url.indexOf('claims/')));
            const { error: storageError } = await supabase.storage.from('item_images').remove(filePaths);
            if (storageError) {
                console.error("Error deleting proof images:", storageError.message);
            }
        }

        // Delete the claim record
        const { error: dbError } = await supabase.from('claims').delete().eq('id', claimToDelete.id);

        if (dbError) throw dbError;

        setClaims(prev => prev.filter(c => c.id !== claimToDelete.id));
        toast({
            title: 'Claim Deleted',
            description: 'Your claim has been successfully withdrawn and deleted.',
        });

    } catch (error: any) {
        toast({
            title: 'Error Deleting Claim',
            description: error.message,
            variant: 'destructive',
        });
    } finally {
        setIsDeleting(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
        case 'pending': return 'default';
        case 'approved': return 'secondary';
        case 'rejected': return 'destructive';
        default: return 'outline';
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Submitted Claims</h1>
        <p className="text-muted-foreground">
          Track the status of all the claims you have submitted for found items.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : claims.length > 0 ? (
        <Card>
            <CardContent className="divide-y p-0">
                {claims.map(claim => (
                    <div key={claim.id} className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 items-start">
                        <div className="sm:col-span-3">
                            <Link href={`/items/${claim.item?.id}`} className="font-semibold text-primary hover:underline">
                                Claim on "{claim.item?.name || 'an item'}"
                            </Link>
                            <p className="text-sm text-muted-foreground mt-1">
                                Submitted on {format(new Date(claim.created_at), "PPP")}
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm hidden sm:block">
                                {claim.identification_marks.slice(0, 2).map((mark, index) => (
                                    <li key={index} className="truncate">{mark}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="flex items-center justify-start sm:justify-end gap-4">
                            <Badge variant={getStatusBadgeVariant(claim.status)} className="capitalize">{claim.status}</Badge>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={isDeleting === claim.id}>
                                        {isDeleting === claim.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently withdraw and delete your claim for "{claim.item?.name}".
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteClaim(claim)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            Delete Claim
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
      ) : (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
            <CardHeader>
                <div className="mx-auto bg-muted rounded-full p-3 w-fit mb-4">
                    <Frown className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle>No Claims Submitted</CardTitle>
                <CardDescription>You haven't submitted any claims yet.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/">Browse Found Items</Link>
                </Button>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
