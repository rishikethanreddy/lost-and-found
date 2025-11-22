'use client';
import type { Claim, Item } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Button } from "./ui/button";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import Image from "next/image";

const mockItemData: { [key: string]: Partial<Item> } = {
    'item-2': { name: 'Blue Hydro Flask' },
};

const mockUserData: { [key: string]: { name: string, email: string } } = {
    'user-1': { name: 'Alice', email: 'a***e@university.edu' }
};

export function ClaimsList({ claims }: { claims: Claim[] }) {
    if (claims.length === 0) {
        return (
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>No Active Claims</CardTitle>
                    <CardDescription>There are no pending claims on items you have found.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    const handleApprove = (claimId: string) => {
        console.log("Approving claim:", claimId);
    }
    
    const handleReject = (claimId: string) => {
        console.log("Rejecting claim:", claimId);
    }

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Claims on Your Found Items</CardTitle>
                <CardDescription>Review these claims to verify the rightful owner.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {claims.map(claim => (
                        <AccordionItem value={claim.id} key={claim.id}>
                            <AccordionTrigger>
                                <div className="flex justify-between w-full pr-4">
                                    <span>Claim on "{mockItemData[claim.itemId]?.name}" by {mockUserData[claim.claimantId]?.name}</span>
                                    <span className={`capitalize font-semibold ${claim.status === 'pending' ? 'text-yellow-600' : claim.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                                        {claim.status}
                                    </span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                                <h4 className="font-semibold">Claimant Details:</h4>
                                <p className="text-sm text-muted-foreground">{mockUserData[claim.claimantId]?.name} ({mockUserData[claim.claimantId]?.email})</p>
                                
                                <h4 className="font-semibold">Identifying Marks Provided:</h4>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    {claim.identificationMarks.map((mark, index) => (
                                        <li key={index}>{mark}</li>
                                    ))}
                                </ul>

                                {claim.proofImages && claim.proofImages.length > 0 && (
                                    <>
                                        <h4 className="font-semibold">Proof of Ownership:</h4>
                                        <div className="flex gap-4">
                                            {claim.proofImages.map((img, index) => (
                                                <div key={index} className="relative h-24 w-24 rounded-md overflow-hidden">
                                                    <Image src={img} alt={`Proof image ${index + 1}`} width={96} height={96} className="object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                                
                                {claim.status === 'pending' && (
                                    <div className="flex gap-4 pt-4">
                                        <Button onClick={() => handleApprove(claim.id)}><ThumbsUp className="mr-2 h-4 w-4" /> Approve</Button>
                                        <Button variant="destructive" onClick={() => handleReject(claim.id)}><ThumbsDown className="mr-2 h-4 w-4" /> Reject</Button>
                                    </div>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    );
}
