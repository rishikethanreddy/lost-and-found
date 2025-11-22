
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  full_name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email(),
});

type Profile = {
  full_name: string | null;
}

type ProfileFormProps = {
  user: User;
  profile: Profile;
  onProfileUpdate: (updatedName: string) => void;
};

export function ProfileForm({ user, profile, onProfileUpdate }: ProfileFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: profile.full_name || '',
      email: user.email || '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: values.full_name })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: 'Profile Updated!',
        description: 'Your changes have been saved successfully.',
      });
      onProfileUpdate(values.full_name);
      setIsEditing(false);
    } catch (error: any) {
        toast({
            title: 'Error updating profile',
            description: error.message,
            variant: 'destructive',
        });
    } finally {
        setLoading(false);
    }
  }

  const handleCancel = () => {
    form.reset({
        full_name: profile.full_name || '',
        email: user.email || '',
    });
    setIsEditing(false);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>
                {isEditing ? "Make changes to your profile here. Click save when you're done." : "View your profile details below."}
            </CardDescription>
        </div>
        {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Profile</Button>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} disabled={!isEditing || loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} readOnly disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isEditing && (
                <div className="flex gap-4">
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                     <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                        Cancel
                    </Button>
                </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
