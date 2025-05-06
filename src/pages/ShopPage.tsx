import React from 'react';

// Define product data structure
interface Product {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    affiliateUrl: string;
    category: string;
}

// Placeholder product data (replace with real data/fetching later)
const placeholderProducts: Product[] = [
    {
        id: 'prod1',
        name: 'Golden Shampoo Bar - Mango',
        description: 'A nourishing shampoo bar with a tropical mango scent. Plastic-free packaging.',
        imageUrl: 'https://cdn.shopify.com/s/files/1/0496/0603/5012/products/1-MangoShampoo_900x.png?v=1636998123', // Example image URL
        affiliateUrl: '#', // Replace with actual affiliate link
        category: 'Hair Care',
    },
    {
        id: 'prod2',
        name: 'Solid Dish Soap',
        description: 'A long-lasting dish soap block that cuts grease. Zero-waste alternative to liquid soap.',
        imageUrl: 'https://cdn.shopify.com/s/files/1/0496/0603/5012/products/NoToxLife-VeganDishBlock-PlasticFreePursuit-1_900x.jpg?v=1636661751', // Example image URL
        affiliateUrl: '#', // Replace with actual affiliate link
        category: 'Kitchen',
    },
    {
        id: 'prod3',
        name: 'Reusable Cotton Tea Bags',
        description: 'Set of reusable organic cotton tea bags for loose leaf tea. Washable and durable.',
        imageUrl: 'https://cdn.shopify.com/s/files/1/0496/0603/5012/products/PFP-OrganicCottonTeaBag-PlasticFreePursuit-1_900x.jpg?v=1636662176', // Example image URL
        affiliateUrl: '#', // Replace with actual affiliate link
        category: 'Kitchen',
    },
    {
        id: 'prod4',
        name: 'Bamboo Toothbrush',
        description: 'Biodegradable bamboo toothbrush with medium bristles. Sustainable oral care.',
        imageUrl: 'https://cdn.shopify.com/s/files/1/0496/0603/5012/products/Truthbrush-PetalPinkMedium-PlasticFreePursuit-1_900x.jpg?v=1636662997', // Example image URL
        affiliateUrl: '#', // Replace with actual affiliate link
        category: 'Oral Care',
    },
];

const ShopPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 md:mb-12 text-brand-darker">Shop Microplastic-Free Alternatives</h1>
      
      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
         {placeholderProducts.map((product) => (
           <div key={product.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col group">
             {/* Image */}
             <div className="aspect-square overflow-hidden">
                <img 
                   src={product.imageUrl} 
                   alt={product.name} 
                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"
                 />
             </div>
             {/* Content */}
             <div className="p-4 flex flex-col flex-grow">
                <h2 className="text-lg font-semibold text-brand-darker mb-2 truncate" title={product.name}>{product.name}</h2>
                <p className="text-sm text-brand-dark mb-4 line-clamp-3 flex-grow">{product.description}</p>
                <a 
                   href={product.affiliateUrl} 
                   target="_blank" 
                   rel="noopener noreferrer nofollow" // Add nofollow for affiliate links
                   className="mt-auto inline-block text-center w-full bg-brand-blue hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-150 no-underline"
                 >
                   View Product
                 </a>
             </div>
           </div>
         ))}
      </div>
      
    </div>
  );
};

export default ShopPage; 