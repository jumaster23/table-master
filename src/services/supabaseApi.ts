// Ejemplo de uso de Supabase para obtener restaurantes
import { supabase } from './supabaseClient';

export async function getRestaurants() {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*');
  if (error) throw error;
  return data;
}

export async function addRestaurant({ name, address, phone }: { name: string; address: string; phone: string }) {
  const { data, error } = await supabase
    .from('restaurants')
    .insert([{ name, address, phone }])
    .select();
  if (error) throw error;
  return data;
}

export async function getMenu(restaurantId: number) {
  const { data, error } = await supabase
    .from('menus')
    .select('*')
    .eq('restaurant_id', restaurantId);
  if (error) throw error;
  return data;
}
