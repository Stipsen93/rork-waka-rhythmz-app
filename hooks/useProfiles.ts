import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/providers/AuthProvider';
import { useAuth } from '@/providers/AuthProvider';

export function useProfiles() {
  const queryClient = useQueryClient();
  const { signUp } = useAuth();

  const profilesQuery = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      console.log('[useProfiles] Fetching profiles');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data.map((p): UserProfile & { passwordChangedByUser: boolean } => ({
        id: p.id,
        email: p.email,
        role: p.role as 'admin' | 'member',
        passwordChangedByUser: p.password_changed_by_user,
      }));
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: 'admin' | 'member' }) => {
      console.log('[useProfiles] Creating user:', email, role);
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Ongeldig e-mailadres formaat. Gebruik een geldig e-mailadres (bijv. gebruiker@voorbeeld.nl)');
      }
      
      const password = generatePassword();
      
      const result = await signUp(email, password, role);
      
      if (!result.success) {
        if (result.error?.toLowerCase().includes('invalid')) {
          throw new Error('E-mailadres wordt niet geaccepteerd. Gebruik een geldig e-mailadres met een bestaand domein (bijv. gmail.com, outlook.com, of een echt bedrijfsdomein).');
        }
        throw new Error(result.error || 'Kon gebruiker niet aanmaken');
      }

      return { email, password };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'member' }) => {
      console.log('[useProfiles] Updating role:', userId, role);
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log('[useProfiles] Resetting password:', userId);
      
      const newPassword = generatePassword();
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (!profileData) {
        throw new Error('User not found');
      }


      
      await supabase.auth.updateUser({
        password: newPassword,
      });

      await supabase
        .from('profiles')
        .update({ password_changed_by_user: false })
        .eq('id', userId);

      return { password: newPassword };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });

  return {
    profiles: profilesQuery.data ?? [],
    isLoading: profilesQuery.isLoading,
    createUser: createUserMutation.mutateAsync,
    updateRole: updateRoleMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
  };
}

function generatePassword(): string {
  const base = Math.random().toString(36).slice(2, 8);
  const suffix = Math.floor(100 + Math.random() * 900).toString();
  return `${base}${suffix}`;
}
