
'use client';
import type { Match } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Button } from "./ui/button";
import { Loader2, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Badge } from "./ui/badge";
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
import { ChevronDown } from "lucide-react";

type EnrichedMatch = Match & {
  lost_item: { name: string } | null;
  finder: { full_name: string | null; email: string | null; } | null;
};

type MatchesManagerProps = {
    initialMatches: EnrichedMatch[];
    onMatchUpdate: (updatedMatch: EnrichedMatch) => void;
}

export function MatchesManager({ initialMatches, onMatchUpdate }: MatchesManagerProps) {
    const { toast } = useToast();
    const [matches, setMatches] = useState(initialMatches);
    const [loadingMatchId, setLoadingMatchId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleUpdateMatch = async (matchId: string, status: 'accepted' | 'rejected') => {
        setLoadingMatchId(matchId);
        const { data, error } = await supabase
            .from('matches')
            .update({ status })
            .eq('id', matchId)
            .select(`
                *,
                lost_item:items(name),
                finder:profiles(full_name, email)
            `)
            .single();

        setLoadingMatchId(null);

        if (error) {
            toast({
                title: `Error ${status === 'accepted' ? 'Accepting' : 'Rejecting'} Match`,
                description: error.message,
                variant: 'destructive',
            });
        } else if (data) {
             const updatedMatch = {
              ...data,
              lost_item: data.lost_item ? { name: (data.lost_item as any).name } : null,
              finder: data.finder ? { full_name: (data.finder as any).full_name, email: (data.finder as any).email } : null,
            };
            const newMatches = matches.map(m => m.id === matchId ? updatedMatch : m);
            setMatches(newMatches);
            onMatchUpdate(updatedMatch);
            toast({
                title: 'Success!',
                description: `Match has been ${status}.`
            });

            // If accepted, also update the item status to 'claimed'
            if (status === 'accepted') {
                const { error: itemUpdateError } = await supabase
                    .from('items')
                    .update({ status: 'claimed' })
                    .eq('id', data.lost_item_id);
                if (itemUpdateError) {
                    toast({
                        title: 'Error updating item status',
                        description: itemUpdateError.message,
                        variant: 'destructive',
                    });
                }
            }
        }
    }

    const handleDeleteMatch = async (matchToDelete: EnrichedMatch) => {
        setIsDeleting(matchToDelete.id);
        try {
            if (matchToDelete.image_urls && matchToDelete.image_urls.length > 0) {
                const filePaths = matchToDelete.image_urls.map(url => url.substring(url.indexOf('matches/')));
                if (filePaths.length > 0) {
                    const { error: storageError } = await supabase.storage.from('item_images').remove(filePaths);
                    if (storageError) console.error("Error deleting match images:", storageError.message);
                }
            }

            const { error: dbError } = await supabase.from('matches').delete().eq('id', matchToDelete.id);

            if (dbError) throw dbError;

            const updatedMatches = matches.filter(m => m.id !== matchToDelete.id);
            setMatches(updatedMatches);
            
            toast({
                title: 'Match Deleted',
                description: `The match from ${matchToDelete.finder?.full_name} has been deleted.`,
            });
        } catch (error: any) {
            toast({
                title: 'Error Deleting Match',
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
            case 'accepted': return 'secondary';
            case 'rejected': return 'destructive';
            default: return 'outline';
        }
    }

    if (matches.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>No Active Matches</CardTitle>
                    <CardDescription>No one has reported finding any of your lost items yet.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Matches for Your Lost Items</CardTitle>
                <CardDescription>Review these matches to see if someone has found your item.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {matches.map(match => (
                        <AccordionItem value={match.id} key={match.id}>
                            <div className="flex w-full items-center justify-between pr-4">
                                <div className="flex-1 py-4 pl-4">
                                    <span className="truncate">Match for "{match.lost_item?.name}" by {match.finder?.full_name || 'Anonymous'}</span>
                                </div>
                                <div className="flex items-center gap-2 pl-2">
                                     <Badge variant={getStatusBadgeVariant(match.status)} className="capitalize">{match.status}</Badge>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8" disabled={isDeleting === match.id}>
                                                {isDeleting === match.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the match from {match.finder?.full_name} for "{match.lost_item?.name}".
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteMatch(match)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                     <AccordionTrigger className="p-0 hover:no-underline [&>svg]:ml-0">
                                       <span className="sr-only">Toggle details</span>
                                     </AccordionTrigger>
                                </div>
                            </div>
                            <AccordionContent className="space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2">Finder's Details:</h4>
                                    <div className="text-sm text-muted-foreground space-y-2 rounded-md bg-muted p-3">
                                        {match.finder?.full_name && (
                                            <p><strong className="font-medium text-card-foreground">Name:</strong> {match.finder.full_name}</p>
                                        )}
                                        {match.finder?.email && (
                                            <p><strong className="font-medium text-card-foreground">Email:</strong> {match.finder.email}</p>
                                        )}
                                        {match.contact_details && (
                                            <p><strong className="font-medium text-card-foreground">Contact Info:</strong> {match.contact_details}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold">Message from Finder:</h4>
                                    <p className="text-sm mt-2 p-3 bg-muted rounded-md">{match.message}</p>
                                </div>

                                {match.image_urls && match.image_urls.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold">Attached Images:</h4>
                                        <div className="flex flex-wrap gap-4 mt-2">
                                            {match.image_urls.map((url, index) => (
                                                <div key={index} className="relative h-24 w-24 rounded-md overflow-hidden">
                                                    <Image src={url} alt={`Finder image ${index + 1}`} fill sizes="96px" className="object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex gap-4 pt-4">
                                    {match.status === 'pending' && (
                                        <>
                                            <Button onClick={() => handleUpdateMatch(match.id, 'accepted')} disabled={loadingMatchId === match.id}>
                                                {loadingMatchId === match.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsUp className="mr-2 h-4 w-4" />}
                                                 Accept
                                            </Button>
                                            <Button variant="destructive" onClick={() => handleUpdateMatch(match.id, 'rejected')} disabled={loadingMatchId === match.id}>
                                                {loadingMatchId === match.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsDown className="mr-2 h-4 w-4" />}
                                                 Reject
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    );
}
