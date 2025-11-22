
import type { Claim } from './types';


export const mockClaims: Claim[] = [
    {
        id: 'claim-1',
        itemId: 'item-2',
        claimantId: 'user-1',
        identificationMarks: [
            'It has a sticker of the Grand Tetons.',
            'There is a significant dent on the bottom right.',
            'The cap is a straw lid, not the standard one.'
        ],
        proofImages: [
            'https://picsum.photos/300/200',
            'https://picsum.photos/300/200'
        ],
        status: 'pending',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'claim-2',
        itemId: 'item-5',
        claimantId: 'user-3',
        identificationMarks: [
            'My laptop inside is a MacBook Air with a university logo sticker on it.',
            'The notebook has my name, Charlie Brown, written on the first page.',
            'The left shoulder strap is slightly frayed at the top.'
        ],
        status: 'approved',
        createdAt: new Date('2024-07-21').toISOString(),
    }
];

export const getClaimsByFinderId = async (finderId: string) => {
    // This function will need to be updated to work with Supabase
    return [];
}

export const getReportedItemsByUserId = async (userId: string) => {
    // This function will need to be updated to work with Supabase
    return [];
}
