// src/services/supabaseConnectionTest.ts
import { supabase } from './supabaseClient';

export async function testSupabaseConnection() {
  try {
    const { error, data } = await supabase
      .from('restaurants')
      .select('id')
      .limit(1);
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Conexión exitosa', data };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
