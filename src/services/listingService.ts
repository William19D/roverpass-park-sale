import { supabase } from "@/integrations/supabase/client";

// Define the Listing interface directly in this file
export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  location: {
    address: string;
    city: string;
    state: string;
    lat: number;
    lng: number;
  };
  numSites: number;
  occupancyRate: number;
  annualRevenue: number;
  capRate: number;
  images: string[];
  videoUrl?: string;
  broker: {
    avatar: string;
    name: string;
    phone: string;
    email: string;
    company: string;
    id: string;
  };
  pdfUrl?: string;
  createdAt: string;
  featured: boolean; // We'll simulate this since it doesn't exist in the DB
  status: string; // For approval status: 'approved', 'pending', 'rejected', etc.
}

// Filter interface for type safety when applying filters
export interface ListingFilters {
  priceMin?: number;
  priceMax?: number;
  state?: string;
  sitesMin?: number;
  sitesMax?: number;
  capRateMin?: number;
  occupancyRateMin?: number;
  search?: string;
  [key: string]: any; // For any additional filters
}

/**
 * Fetches only approved listings - accessible to all users including anonymous
 */
export const fetchApprovedListings = async (filters?: ListingFilters): Promise<Listing[]> => {
  try {
    
    // Simplified query - no join with users table and only existing columns
    let query = supabase
      .from('listings')
      .select(`
        id, title, description, price, address, city, state, 
        latitude, longitude, num_sites, occupancy_rate, annual_revenue, 
        cap_rate, created_at, status, property_type, user_id,
        listing_images(storage_path, is_primary)
      `)
      .eq('status', 'approved'); // Only fetch approved listings

    // Apply additional filters if provided
    if (filters) {
      // Price filters
      if (filters.priceMin !== undefined && filters.priceMin > 0) {
        query = query.gte('price', filters.priceMin);
      }
      
      if (filters.priceMax !== undefined && filters.priceMax < 10000000) {
        query = query.lte('price', filters.priceMax);
      }
      
      // State filter
      if (filters.state && filters.state !== '') {
        query = query.eq('state', filters.state);
      }
      
      // Site count filters
      if (filters.sitesMin !== undefined && filters.sitesMin > 0) {
        query = query.gte('num_sites', filters.sitesMin);
      }
      
      if (filters.sitesMax !== undefined && filters.sitesMax < 1000) {
        query = query.lte('num_sites', filters.sitesMax);
      }
      
      // Cap rate filter
      if (filters.capRateMin !== undefined && filters.capRateMin > 0) {
        query = query.gte('cap_rate', filters.capRateMin);
      }
      
      // Occupancy rate filter
      if (filters.occupancyRateMin !== undefined && filters.occupancyRateMin > 0) {
        query = query.gte('occupancy_rate', filters.occupancyRateMin);
      }
        // Search term
      if (filters.search && filters.search.trim() !== '') {
        const searchTerm = `%${filters.search.trim()}%`;
        query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm},city.ilike.${searchTerm},state.ilike.${searchTerm}`);
      }
    }

    const { data, error } = await query;
      if (error) {
      return [];
    }
    
    // Transform data to match the Listing interface
    if (data && data.length > 0) {
      return data.map(listing => {
        try {
          // Process images to get URLs
          const images = listing.listing_images?.map(img => {
            return supabase.storage.from('listing-images').getPublicUrl(img.storage_path).data.publicUrl;
          }) || [];
          
          // Sort images with primary first
          let primaryImageIndex = -1;
          if (listing.listing_images && listing.listing_images.length > 0) {
            primaryImageIndex = listing.listing_images.findIndex(img => img.is_primary);
          }
          
          if (primaryImageIndex > 0 && images.length > 0) {
            const primaryImage = images[primaryImageIndex];
            images.splice(primaryImageIndex, 1);
            images.unshift(primaryImage);
          }
          
          return {
            id: listing.id,
            title: listing.title || 'Untitled Listing',
            description: listing.description || '',
            price: listing.price || 0,
            location: {
              address: listing.address || '',
              city: listing.city || '',
              state: listing.state || '',
              lat: listing.latitude || 0,
              lng: listing.longitude || 0
            },
            numSites: listing.num_sites || 0,
            occupancyRate: listing.occupancy_rate || 0,
            annualRevenue: listing.annual_revenue || 0,
            capRate: listing.cap_rate || 0,
            images: images,
            broker: {
              id: listing.user_id || '',
              name: 'Contact Agent',
              email: 'contact@example.com',
              phone: '',
              company: '',
              avatar: '/default-avatar.png'
            },
            createdAt: listing.created_at || new Date().toISOString(),
            featured: false, // Since featured column doesn't exist, we default to false
            status: listing.status || 'approved'
          };        } catch (itemError) {
          return null;
        }
      }).filter(item => item !== null) as Listing[];
    }
    
    return [];
  } catch (error) {
    return [];
  }
};

/**
 * Fetches "featured" listings - since there's no featured column, 
 * we'll just get the most recent approved listings
 */
export const fetchFeaturedApprovedListings = async (): Promise<Listing[]> => {
  try {
    // Modified query - no featured column, just get the newest listings
    const { data, error } = await supabase
      .from('listings')
      .select(`
        id, title, description, price, address, city, state, 
        latitude, longitude, num_sites, occupancy_rate, annual_revenue, 
        cap_rate, created_at, status, property_type, user_id,
        listing_images(storage_path, is_primary)
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(3);
      if (error) {
      return [];
    }
    
    // Transform data to match the Listing interface
    if (data && data.length > 0) {
      return data.map(listing => {
        try {
          // Process images to get URLs
          const images = listing.listing_images?.map(img => {
            return supabase.storage.from('listing-images').getPublicUrl(img.storage_path).data.publicUrl;
          }) || [];
          
          // Sort images with primary first
          let primaryImageIndex = -1;
          if (listing.listing_images && listing.listing_images.length > 0) {
            primaryImageIndex = listing.listing_images.findIndex(img => img.is_primary);
          }
          
          if (primaryImageIndex > 0 && images.length > 0) {
            const primaryImage = images[primaryImageIndex];
            images.splice(primaryImageIndex, 1);
            images.unshift(primaryImage);
          }
          
          // Create the broker with default values
          const broker = {
            id: listing.user_id || '',
            name: 'Contact Agent',
            email: 'contact@example.com',
            phone: '',
            company: '',
            avatar: '/default-avatar.png'
          };
          
          return {
            id: listing.id,
            title: listing.title || 'Untitled Listing',
            description: listing.description || '',
            price: listing.price || 0,
            location: {
              address: listing.address || '',
              city: listing.city || '',
              state: listing.state || '',
              lat: listing.latitude || 0,
              lng: listing.longitude || 0
            },
            numSites: listing.num_sites || 0,
            occupancyRate: listing.occupancy_rate || 0,
            annualRevenue: listing.annual_revenue || 0,
            capRate: listing.cap_rate || 0,
            images: images,
            broker: broker,
            createdAt: listing.created_at || new Date().toISOString(),
            featured: true, // We mark these as featured in the response
            status: listing.status || 'approved'
          };        } catch (itemError) {
          return null;
        }
      }).filter(item => item !== null) as Listing[];
    }
    
    return [];
  } catch (error) {
    return [];
  }
};

/**
 * Fetches a single listing by ID (only if it's approved) - accessible to all users
 */
export const fetchApprovedListingById = async (id: string): Promise<Listing | null> => {
  try {
    // Simplified query - no join with users table and no featured column
    const { data, error } = await supabase
      .from('listings')
      .select(`
        id, title, description, price, address, city, state, 
        latitude, longitude, num_sites, occupancy_rate, annual_revenue, 
        cap_rate, created_at, status, property_type, user_id,
        listing_images(storage_path, is_primary)
      `)
      .eq('id', id)
      .eq('status', 'approved')  // Only return if approved
      .single();
      if (error) {
      return null;
    }
    
    if (data) {
      try {
        // Process images to get URLs
        const images = data.listing_images?.map(img => {
          return supabase.storage.from('listing-images').getPublicUrl(img.storage_path).data.publicUrl;
        }) || [];
        
        // Sort images with primary first
        let primaryImageIndex = -1;
        if (data.listing_images && data.listing_images.length > 0) {
          primaryImageIndex = data.listing_images.findIndex(img => img.is_primary);
        }
        
        if (primaryImageIndex > 0 && images.length > 0) {
          const primaryImage = images[primaryImageIndex];
          images.splice(primaryImageIndex, 1);
          images.unshift(primaryImage);
        }
        
        return {
          id: data.id,
          title: data.title || 'Untitled Listing',
          description: data.description || '',
          price: data.price || 0,
          location: {
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            lat: data.latitude || 0,
            lng: data.longitude || 0
          },
          numSites: data.num_sites || 0,
          occupancyRate: data.occupancy_rate || 0,
          annualRevenue: data.annual_revenue || 0,
          capRate: data.cap_rate || 0,
          images: images,
          broker: {
            id: data.user_id || '',
            name: 'Contact Agent',
            email: 'contact@example.com',
            phone: '',
            company: '',
            avatar: '/default-avatar.png'
          },
          createdAt: data.created_at || new Date().toISOString(),
          featured: false, // Since featured doesn't exist in DB, default to false
          status: data.status || 'approved'
        };      } catch (processingError) {
        return null;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Counts the total number of approved listings - accessible to all users
 */
export const countApprovedListings = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved');
      if (error) {
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    return 0;
  }
};