
'use client';
import type { Claim } from "@/lib/types";
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
import { ChevronDown, Info } from "lucide-react";

type EnrichedClaim = Claim & {
    item: { name: string } | null;
    claimant: { full_name: string | null; email: string | null; } | null;
};

type ClaimsManagerProps = {
    initialClaims: EnrichedClaim[];
    onClaimUpdate: (updatedClaim: EnrichedClaim) => void;
}

export function ClaimsManager({ initialClaims, onClaimUpdate }: ClaimsManagerProps) {
    const { toast } = useToast();
    const [claims, setClaims] = useState(initialClaims);
    const [loadingClaimId, setLoadingClaimId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleUpdateClaim = async (claimId: string, status: 'approved' | 'rejected') => {
        setLoadingClaimId(claimId);
        const { data, error } = await supabase
            .from('claims')
            .update({ status })
            .eq('id', claimId)
            .select(`
                *,
                item:items(name),
                claimant:profiles(full_name, email)
            `)
            .single();

        setLoadingClaimId(null);

        if (error) {
            toast({
                title: `Error ${status === 'approved' ? 'Approving' : 'Rejecting'} Claim`,
                description: error.message,
                variant: 'destructive',
            });
        } else if (data) {
             const updatedClaim = {
              ...data,
              item: data.item ? { name: (data.item as any).name } : null,
              claimant: data.claimant ? { full_name: (data.claimant as any).full_name, email: (data.claimant as any).email } : null,
            };
            const newClaims = claims.map(c => c.id === claimId ? updatedClaim : c);
            setClaims(newClaims);
            onClaimUpdate(updatedClaim);
            toast({
                title: 'Success!',
                description: `Claim has been ${status}.`
            });

            // If approved, also update the item status to 'claimed'
            if (status === 'approved') {
                const { error: itemUpdateError } = await supabase
                    .from('items')
                    .update({ status: 'claimed' })
                    .eq('id', data.item_id);
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

    const handleDeleteClaim = async (claimToDelete: EnrichedClaim) => {
        setIsDeleting(claimToDelete.id);
        try {
            if (claimToDelete.proof_image_urls && claimToDelete.proof_image_urls.length > 0) {
                const filePaths = claimToDelete.proof_image_urls.map(url => url.substring(url.indexOf('claims/')));
                const { error: storageError } = await supabase.storage.from('item_images').remove(filePaths);
                if (storageError) console.error("Error deleting proof images:", storageError.message);
            }

            const { error: dbError } = await supabase.from('claims').delete().eq('id', claimToDelete.id);

            if (dbError) throw dbError;

            const updatedClaims = claims.filter(c => c.id !== claimToDelete.id);
            setClaims(updatedClaims);
            toast({
                title: 'Claim Deleted',
                description: `The claim from ${claimToDelete.claimant?.full_name} has been deleted.`,
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

    if (claims.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>No Active Claims</CardTitle>
                    <CardDescription>There are no pending claims on items you have found.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Claims on Your Found Items</CardTitle>
                <CardDescription>Review these claims to verify the rightful owner.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {claims.map(claim => (
                        <AccordionItem value={claim.id} key={claim.id}>
                           <div className="flex w-full items-center justify-between pr-4 group">
                                <AccordionTrigger className="flex-1 py-4 pl-4 text-left hover:no-underline [&>svg]:hidden">
                                    <span className="truncate group-hover:underline">Claim on "{claim.item?.name}" by {claim.claimant?.full_name || 'Anonymous'}</span>
                                </AccordionTrigger>
                                <div className="flex items-center gap-2 pl-2" onClick={(e) => e.stopPropagation()}>
                                    <Badge variant={getStatusBadgeVariant(claim.status)} className="capitalize">{claim.status}</Badge>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8" disabled={isDeleting === claim.id}>
                                                {isDeleting === claim.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the claim from {claim.claimant?.full_name} for "{claim.item?.name}".
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteClaim(claim)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    <AccordionTrigger className="p-0 hover:no-underline">
                                       <span className="sr-only">Toggle details</span>
                                     </AccordionTrigger>
                                </div>
                            </div>
                            <AccordionContent className="space-y-4">
                                {claim.status === 'pending' && (
                                     <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 flex items-start gap-3 mx-4">
                                        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <p><strong>Reviewer&apos;s Note:</strong> Carefully compare the claimant&apos;s identifying marks with the details of the item you found. Only approve if you are confident it is the true owner.</p>
                                     </div>
                                )}
                                <div>
                                    <h4 className="font-semibold mb-2">Claimant Details:</h4>
                                    <div className="text-sm text-muted-foreground space-y-2 rounded-md bg-muted p-3">
                                        {claim.claimant?.full_name && (
                                            <p><strong className="font-medium text-card-foreground">Name:</strong> {claim.claimant.full_name}</p>
                                        )}
                                        {claim.claimant?.email && (
                                            <p><strong className="font-medium text-card-foreground">Email:</strong> {claim.claimant.email}</p>
                                        )}
                                        {claim.contact_number && (
                                            <p><strong className="font-medium text-card-foreground">Contact Number:</strong> {claim.contact_number}</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 className="font-semibold">Identifying Marks Provided:</h4>
                                    <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
                                        {claim.identification_marks.map((mark, index) => (
                                            <li key={index}>{mark}</li>
                                        ))}
                                    </ul>
                                </div>

                                {claim.proof_image_urls && claim.proof_image_urls.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold">Proof of Ownership:</h4>
                                        <div className="flex flex-wrap gap-4 mt-2">
                                            {claim.proof_image_urls.map((url, index) => (
                                                <div key={index} className="relative h-24 w-24 rounded-md overflow-hidden">
                                                    <Image src={url} alt={`Proof image ${index + 1}`} fill sizes="96px" className="object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex flex-wrap gap-4 pt-4 items-center">
                                    {claim.status === 'pending' && (
                                        <>
                                            <Button onClick={() => handleUpdateClaim(claim.id, 'approved')} disabled={loadingClaimId === claim.id}>
                                                {loadingClaimId === claim.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsUp className="mr-2 h-4 w-4" />}
                                                 Approve
                                            </Button>
                                            <Button variant="destructive" onClick={() => handleUpdateClaim(claim.id, 'rejected')} disabled={loadingClaimId === claim.id}>
                                                {loadingClaimId === claim.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsDown className="mr-2 h-4 w-4" />}
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
