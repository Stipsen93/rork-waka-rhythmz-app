import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { supabase } from '../../../../../lib/supabase';

export const permanentDeleteAccountProcedure = publicProcedure
  .input(z.object({ 
    userId: z.string()
  }))
  .mutation(async ({ input }) => {
    console.log('💾 Permanently deleting user account...', input.userId);
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', input.userId);
    
    if (error) {
      console.error('❌ Error permanently deleting account:', error);
      throw new Error(`Account permanent verwijderen mislukt: ${error.message}`);
    }
    
    console.log('✅ Account permanently deleted');
    return { success: true };
  });
