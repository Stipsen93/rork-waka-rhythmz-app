import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { supabase } from '../../../../../lib/supabase';

export const reactivateAccountProcedure = publicProcedure
  .input(z.object({ 
    userId: z.string(),
    newPassword: z.string()
  }))
  .mutation(async ({ input }) => {
    console.log('💾 Reactivating user account...', input.userId);
    
    const { error } = await supabase
      .from('users')
      .update({ 
        deleted_by_user: false,
        deleted_at: null,
        password: input.newPassword,
        password_changed_by_user: false
      })
      .eq('id', input.userId);
    
    if (error) {
      console.error('❌ Error reactivating account:', error);
      throw new Error(`Account heractiveren mislukt: ${error.message}`);
    }
    
    console.log('✅ Account reactivated');
    return { success: true };
  });
