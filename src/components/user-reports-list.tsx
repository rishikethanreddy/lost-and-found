
'use client';

import type { Item } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "./ui/button";
import { Edit, Trash2 } from "lucide-react";
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
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const getBadgeVariant = (status: Item['status']) => {
  switch (status) {
    case 'lost':
      return 'destructive';
    case 'found':
      return 'default';
    case 'claimed':
      return 'secondary';
    default:
      return 'outline';
  }
};

type UserReportsListProps = {
    items: Item[];
    onReportDeleted: (itemId: string) => void;
}

export function UserReportsList({ items, onReportDeleted }: UserReportsListProps) {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (item: Item) => {
        setIsDeleting(true);
        try {
            if (item.image_urls && item.image_urls.length > 0) {
                const filePaths = item.image_urls.map(url => url.substring(url.indexOf('public/')));
                const { error: storageError } = await supabase.storage
                    .from('item_images')
                    .remove(filePaths);
                
                if (storageError) {
                    console.error("Error deleting images from storage:", storageError.message);
                }
            }

            const { error } = await supabase
                .from('items')
                .delete()
                .eq('id', item.id);
            
            if (error) throw error;

            toast({ title: "Success", description: "Report deleted successfully." });
            onReportDeleted(item.id);

        } catch (error: any) {
            toast({ title: "Error", description: `Failed to delete report: ${error.message}`, variant: "destructive" });
        } finally {
            setIsDeleting(false);
        }
    }


    if (items.length === 0) {
        return (
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>No Reported Items</CardTitle>
                    <CardDescription>You have not reported any lost or found items yet.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>My Reported Items</CardTitle>
                <CardDescription>A list of items you've reported as lost or found.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {items.map(item => (
                        <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-md border p-4 gap-4">
                            <div className="flex-1">
                                <h3 className="font-semibold">{item.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    Reported on {format(new Date(item.created_at), "PPP")}
                                </p>
                                <Badge variant={getBadgeVariant(item.status)} className="capitalize mt-2">{item.status}</Badge>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-center">
                               <Button asChild variant="ghost" size="icon">
                                   <Link href={`/my-reports/${item.id}/edit`}><Edit className="h-4 w-4" /></Link>
                               </Button>
                               <AlertDialog>
                                 <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                 </AlertDialogTrigger>
                                 <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete your report for "{item.name}".
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(item)} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                            {isDeleting ? 'Deleting...' : 'Continue'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                 </AlertDialogContent>
                               </AlertDialog>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
