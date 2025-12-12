import { NextResponse } from 'next/server';

interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number;
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
      }
    }
  });

  return rootCategories;
}

export async function GET() {
  try {
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

    const response = await fetch(
      `${wordpressUrl}/wp-json/wc/v3/products/categories?per_page=100`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`WooCommerce API error: ${response.status}`);
    }

    const categories: Category[] = await response.json();
    const hierarchicalCategories = buildCategoryTree(categories);

    return NextResponse.json(hierarchicalCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
