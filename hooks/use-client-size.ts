import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { Product } from '@/types';

interface ClientMeasurements {
  preferred_size?: string;
}

export function useClientSize() {
  const { user } = useAuth();
  const [preferredSize, setPreferredSize] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchPreferredSize();
    } else {
      setPreferredSize(null);
      setLoading(false);
    }
  }, [user?.id]);

  const fetchPreferredSize = async () => {
    try {
      const { data, error } = await supabase
        .from('client_measurements')
        .select('preferred_size')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setPreferredSize(data?.preferred_size || null);
    } catch (error) {
      console.error('Error fetching preferred size:', error);
      setPreferredSize(null);
    } finally {
      setLoading(false);
    }
  };

  const isProductInMySize = (product: Product): boolean => {
    if (!preferredSize || !product) return false;

    const sizeAttribute = product.attributes?.nodes?.find(
      attr => attr.name?.toLowerCase() === 'taille' ||
              attr.name?.toLowerCase() === 'size' ||
              attr.slug?.toLowerCase() === 'pa_taille' ||
              attr.slug?.toLowerCase() === 'pa_size'
    );

    if (!sizeAttribute || !sizeAttribute.options) return false;

    return sizeAttribute.options.some(
      option => option.toUpperCase() === preferredSize.toUpperCase()
    );
  };

  return {
    preferredSize,
    loading,
    isProductInMySize,
  };
}
