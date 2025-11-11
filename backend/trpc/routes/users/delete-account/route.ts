import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { supabase } from '../../../../../lib/supabase';

export const deleteAccountProcedure = publicProcedure
  .input(z.object({ 
    userId: z.string() 
  }))
  .mutation(async ({ input }) => {
    console.log('💾 Soft deleting user account...', input.userId);
    
    const { error } = await supabase
      .from('users')
      .update({ 
        deleted_by_user: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', input.userId);
    
    if (error) {
      console.error('❌ Error soft deleting account:', error);
      throw new Error(`Account verwijderen mislukt: ${error.message}`);
    }
    
    console.log('✅ Account soft deleted');
    return { success: true };
  });
