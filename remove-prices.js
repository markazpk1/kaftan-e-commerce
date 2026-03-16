// Script to remove prices from all products in the database
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key'; // You'll need to provide this

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function removeAllPrices() {
  try {
    console.log('🔄 Starting to remove prices from all products...');
    
    // First, get all products to see what we're working with
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, price, original_price');
    
    if (fetchError) {
      console.error('❌ Error fetching products:', fetchError);
      return;
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
      return;
    }
    
    console.log(`\n✅ Successfully updated ${updatedProducts.length} products`);
    console.log('\n📋 New prices:');
    updatedProducts.forEach(product => {
      console.log(`  - ${product.name}: $${product.price} (Original: $${product.original_price || 'N/A'})`);
    });
    
    console.log('\n🎉 All product prices have been removed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
removeAllPrices();
