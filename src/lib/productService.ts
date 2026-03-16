import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

export interface Product extends ProductRow {}

export interface AdminProduct extends Product {
  stock: number;
  status: "Active" | "Draft" | "Archived";
  sku: string;
}

export const productService = {
  // Get all products
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get product by ID
  async getProduct(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create new product
  async createProduct(product: Omit<ProductInsert, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    try {
      console.log('📦 productService.createProduct called with:', product);
      
      // Generate slug from name if not provided
      const slug = product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...product,
          slug,
          // Ensure in_stock is properly set based on the stock value
          in_stock: product.in_stock || true
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Database error creating product:', error);
        throw error;
      }

      console.log('✅ Product created successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error in createProduct:', error);
      throw error;
    }
  },

  // Update product
  async updateProduct(id: string, updates: ProductUpdate): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete product
  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get products by category
  async getProductsByCategory(category: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get featured products
  async getFeaturedProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('featured', true)
      .eq('in_stock', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Search products
  async searchProducts(query: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Remove all prices from products
  async removeAllPrices(): Promise<{ success: boolean; updated: number; error?: string }> {
    try {
      console.log('🔄 Starting to remove prices from all products...');
      
      // First, get all products to see what we're working with
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, name, price, original_price');
      
      if (fetchError) {
        console.error('❌ Error fetching products:', fetchError);
        return { success: false, updated: 0, error: fetchError.message };
      }
      
      console.log(`📦 Found ${products.length} products`);
      
      // Show current prices before update
      console.log('\n📋 Current prices:');
      products.forEach(product => {
        console.log(`  - ${product.name}: $${product.price} (Original: $${product.original_price || 'N/A'})`);
      });
      
      // Update all products to have zero prices
      const { data: updatedProducts, error: updateError } = await supabase
        .from('products')
        .update({ 
          price: 0,
          original_price: null 
        })
        .select('id, name, price, original_price');
      
      if (updateError) {
        console.error('❌ Error updating products:', updateError);
        return { success: false, updated: 0, error: updateError.message };
      }
      
      console.log(`\n✅ Successfully updated ${updatedProducts.length} products`);
      console.log('\n📋 New prices:');
      updatedProducts.forEach(product => {
        console.log(`  - ${product.name}: $${product.price} (Original: $${product.original_price || 'N/A'})`);
      });
      
      console.log('\n🎉 All product prices have been removed!');
      
      return { success: true, updated: updatedProducts.length };
      
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      return { success: false, updated: 0, error: error.message };
    }
  }
};
