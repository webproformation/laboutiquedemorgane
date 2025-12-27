import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

console.log('[Categories Route] Module loaded');

interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number;
  image?: {
    src: string;
    name?: string;
    alt?: string;
  } | null;
  [key: string]: any;
}

interface HierarchicalCategory extends Category {
  children?: HierarchicalCategory[];
}

function buildCategoryTree(categories: Category[]): HierarchicalCategory[] {
  const categoryMap = new Map<number, HierarchicalCategory>();
  const rootCategories: HierarchicalCategory[] = [];

  categories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });

  categories.forEach(cat => {
    const category = categoryMap.get(cat.id)!;
    if (cat.parent === 0) {
      rootCategories.push(category);
    } else {
      const parent = categoryMap.get(cat.parent);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(category);
      } else {
        rootCategories.push(category);
      }
    }
  });

  const cleanEmptyChildren = (cats: HierarchicalCategory[]) => {
    cats.forEach(cat => {
      if (cat.children && cat.children.length === 0) {
        delete cat.children;
      } else if (cat.children && cat.children.length > 0) {
        cleanEmptyChildren(cat.children);
      }
    });
  };

  cleanEmptyChildren(rootCategories);
  return rootCategories;
}

async function syncCategoriesFromWooCommerce() {
  const wordpressUrl = process.env.WORDPRESS_URL;
  const consumerKey = process.env.WC_CONSUMER_KEY;
  const consumerSecret = process.env.WC_CONSUMER_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!wordpressUrl || !consumerKey || !consumerSecret) {
    throw new Error('Missing WooCommerce configuration');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const auth = `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')}`;

  // Récupérer TOUTES les catégories avec pagination
  let allCategories: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `${wordpressUrl}/wp-json/wc/v3/products/categories?per_page=100&page=${page}&orderby=menu_order&order=asc`,
      {
        headers: { Authorization: auth },
        next: { revalidate: 0 }
      }
    );

    if (!response.ok) {
      throw new Error(`WooCommerce API error: ${response.status}`);
    }

    const pageCategories = await response.json();
    allCategories = [...allCategories, ...pageCategories];

    const totalPages = response.headers.get('x-wp-totalpages');
    hasMore = totalPages ? page < parseInt(totalPages) : false;
    page++;
  }

  await supabase.from('woocommerce_categories_cache').delete().neq('id', 0);

  const categoriesToInsert = allCategories.map((cat: any) => ({
    category_id: cat.id,
    name: cat.name,
    slug: cat.slug,
    parent: cat.parent,
    description: cat.description || '',
    image: cat.image,
    count: cat.count || 0,
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from('woocommerce_categories_cache')
    .insert(categoriesToInsert);

  if (error) {
    console.error('Error inserting categories into cache:', error);
    throw error;
  }

  return categoriesToInsert;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const refresh = url.searchParams.get('refresh') === 'true';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Si refresh est demandé, synchroniser depuis WooCommerce
    if (refresh) {
      console.log('[Categories API] Refresh requested, syncing from WooCommerce...');
      await syncCategoriesFromWooCommerce();
    }

    // Charger depuis le cache
    const { data: cachedCategories, error: cacheError } = await supabase
      .from('woocommerce_categories_cache')
      .select('*')
      .order('category_id', { ascending: true });

    if (cacheError) {
      console.error('[Categories API] Cache error:', cacheError);
      throw cacheError;
    }

    // Si le cache est vide, synchroniser depuis WooCommerce
    if (!cachedCategories || cachedCategories.length === 0) {
      console.log('[Categories API] Cache empty, syncing from WooCommerce...');
      const synced = await syncCategoriesFromWooCommerce();

      const categories: Category[] = synced.map((cat: any) => ({
        id: cat.category_id,
        name: cat.name,
        slug: cat.slug,
        parent: cat.parent,
        description: cat.description || '',
        image: cat.image,
        count: cat.count || 0,
      }));

      if (action === 'list') {
        return NextResponse.json(categories);
      }

      const tree = buildCategoryTree(categories);
      return NextResponse.json(tree);
    }

    // Utiliser le cache
    console.log('[Categories API] Using cached categories:', cachedCategories.length);

    const categories: Category[] = cachedCategories.map((cat: any) => ({
      id: cat.category_id,
      name: cat.name,
      slug: cat.slug,
      parent: cat.parent,
      description: cat.description || '',
      image: cat.image,
      count: cat.count || 0,
    }));

    if (action === 'list') {
      return NextResponse.json(categories);
    }

    const tree = buildCategoryTree(categories);
    return NextResponse.json(tree);
  } catch (error) {
    console.error('[Categories API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : undefined },
      { status: 500 }
    );
  }
}

async function invalidateCache() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  await supabase.from('woocommerce_categories_cache').delete().neq('id', 0);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, categoryData } = body;

    const wordpressUrl = process.env.WORDPRESS_URL;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!wordpressUrl || !consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: 'Missing WooCommerce configuration' },
        { status: 500 }
      );
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    if (action === 'create') {
      const createResponse = await fetch(
        `${wordpressUrl}/wp-json/wc/v3/products/categories`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData),
        }
      );

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        return NextResponse.json(
          { error: 'Failed to create category', details: errorData },
          { status: createResponse.status }
        );
      }

      const createdCategory = await createResponse.json();
      await invalidateCache();
      return NextResponse.json(createdCategory);
    }

    if (action === 'setup-morgane-categories') {
      const existingResponse = await fetch(
        `${wordpressUrl}/wp-json/wc/v3/products/categories?per_page=100`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      if (!existingResponse.ok) {
        throw new Error(`WooCommerce API error: ${existingResponse.status}`);
      }

      const existingCategories = await existingResponse.json();

      let parentCategory = existingCategories.find(
        (cat: any) => cat.slug === 'les-looks-de-morgane'
      );

      if (!parentCategory) {
        const createParentResponse = await fetch(
          `${wordpressUrl}/wp-json/wc/v3/products/categories`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: 'Les looks de Morgane',
              slug: 'les-looks-de-morgane',
            }),
          }
        );

        if (!createParentResponse.ok) {
          const errorData = await createParentResponse.json();
          throw new Error(`Failed to create parent category: ${JSON.stringify(errorData)}`);
        }

        parentCategory = await createParentResponse.json();
      }

      const subCategories = [
        { name: "L'ambiance de la semaine", slug: 'lambiance-de-la-semaine' },
        { name: 'Les coups de coeur de Morgane', slug: 'les-coups-de-coeur-de-morgane' },
        { name: 'Le look de la semaine by Morgane', slug: 'le-look-de-la-semaine-by-morgane' },
      ];

      const createdCategories = [parentCategory];

      for (const subCat of subCategories) {
        const existingSubCat = existingCategories.find(
          (cat: any) => cat.slug === subCat.slug
        );

        if (!existingSubCat) {
          const createSubCatResponse = await fetch(
            `${wordpressUrl}/wp-json/wc/v3/products/categories`,
            {
              method: 'POST',
              headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: subCat.name,
                slug: subCat.slug,
                parent: parentCategory.id,
              }),
            }
          );

          if (!createSubCatResponse.ok) {
            const errorData = await createSubCatResponse.json();
            console.error(`Failed to create ${subCat.name}:`, errorData);
          } else {
            const createdSubCat = await createSubCatResponse.json();
            createdCategories.push(createdSubCat);
          }
        } else {
          createdCategories.push(existingSubCat);
        }
      }

      await invalidateCache();
      return NextResponse.json({
        success: true,
        categories: createdCategories,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in POST /api/woocommerce/categories:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { action, categoryId, categoryData } = body;

    const wordpressUrl = process.env.WORDPRESS_URL;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!wordpressUrl || !consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: 'Missing WooCommerce configuration' },
        { status: 500 }
      );
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    if (action === 'update') {
      if (!categoryId) {
        return NextResponse.json(
          { error: 'Category ID is required' },
          { status: 400 }
        );
      }

      const updateResponse = await fetch(
        `${wordpressUrl}/wp-json/wc/v3/products/categories/${categoryId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData),
        }
      );

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        return NextResponse.json(
          { error: 'Failed to update category', details: errorData },
          { status: updateResponse.status }
        );
      }

      const updatedCategory = await updateResponse.json();
      await invalidateCache();
      return NextResponse.json(updatedCategory);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in PUT /api/woocommerce/categories:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { action, categoryId } = body;

    const wordpressUrl = process.env.WORDPRESS_URL;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!wordpressUrl || !consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: 'Missing WooCommerce configuration' },
        { status: 500 }
      );
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    if (action === 'delete') {
      if (!categoryId) {
        return NextResponse.json(
          { error: 'Category ID is required' },
          { status: 400 }
        );
      }

      const deleteResponse = await fetch(
        `${wordpressUrl}/wp-json/wc/v3/products/categories/${categoryId}?force=true`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        return NextResponse.json(
          { error: 'Failed to delete category', details: errorData },
          { status: deleteResponse.status }
        );
      }

      const deletedCategory = await deleteResponse.json();
      await invalidateCache();
      return NextResponse.json(deletedCategory);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/woocommerce/categories:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
