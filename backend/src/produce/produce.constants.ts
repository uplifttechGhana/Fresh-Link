export const DEFAULT_PRODUCE_CATEGORIES = ['Fruits', 'Vegetables'] as const;

export type ProduceCategoryName = (typeof DEFAULT_PRODUCE_CATEGORIES)[number];

export interface GhanaProduceCatalogItem {
  title: string;
  category: ProduceCategoryName;
  unit: string;
  basePrice: number;
  description: string;
  imageKey: string;
  sourceImageUrl: string;
}

/** Common Ghanaian fruits and vegetables sold in local markets */
export const GHANA_PRODUCE_CATALOG: GhanaProduceCatalogItem[] = [
  {
    title: 'Fresh Tomatoes',
    category: 'Vegetables',
    unit: 'kg',
    basePrice: 12,
    description: 'Locally grown vine tomatoes, ideal for stews and salads.',
    imageKey: 'fresh-tomatoes',
    sourceImageUrl: 'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    title: 'Garden Eggs',
    category: 'Vegetables',
    unit: 'crate',
    basePrice: 28,
    description: 'Small white garden eggs (aubergine), a staple in Ghanaian soups.',
    imageKey: 'garden-eggs',
    sourceImageUrl: 'https://images.pexels.com/photos/321551/pexels-photo-321551.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    title: 'Okra',
    category: 'Vegetables',
    unit: 'kg',
    basePrice: 14,
    description: 'Fresh okra for soups, stews, and banku accompaniments.',
    imageKey: 'okra',
    sourceImageUrl: 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    title: 'Kontomire (Cocoyam Leaves)',
    category: 'Vegetables',
    unit: 'bunch',
    basePrice: 6,
    description: 'Tender cocoyam leaves for kontomire stew and palava sauce.',
    imageKey: 'kontomire',
    sourceImageUrl: 'https://images.pexels.com/photos/1199957/pexels-photo-1199957.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    title: 'Fresh Cabbage',
    category: 'Vegetables',
    unit: 'head',
    basePrice: 10,
    description: 'Crisp cabbage heads from local farms.',
    imageKey: 'cabbage',
    sourceImageUrl: 'https://images.pexels.com/photos/1300975/pexels-photo-1300975.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    title: 'Carrots',
    category: 'Vegetables',
    unit: 'kg',
    basePrice: 15,
    description: 'Sweet orange carrots, washed and market-ready.',
    imageKey: 'carrots',
    sourceImageUrl: 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=900&h=900&fit=crop',
  },
  {
    title: 'Red Onions',
    category: 'Vegetables',
    unit: 'kg',
    basePrice: 18,
    description: 'Aromatic red onions for everyday cooking.',
    imageKey: 'red-onions',
    sourceImageUrl: 'https://images.pexels.com/photos/135932/pexels-photo-135932.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    title: 'Green Bell Pepper',
    category: 'Vegetables',
    unit: 'kg',
    basePrice: 20,
    description: 'Fresh green peppers for jollof, salads, and stir-fries.',
    imageKey: 'green-pepper',
    sourceImageUrl: 'https://images.pexels.com/photos/128420/pexels-photo-128420.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    title: 'Scotch Bonnet Pepper',
    category: 'Vegetables',
    unit: 'kg',
    basePrice: 26,
    description: 'Hot local pepper for shito, soups, and spicy dishes.',
    imageKey: 'scotch-bonnet',
    sourceImageUrl: 'https://images.pexels.com/photos/4198020/pexels-photo-4198020.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    title: 'Cucumber',
    category: 'Vegetables',
    unit: 'kg',
    basePrice: 10,
    description: 'Cool, crunchy cucumbers from greenhouse and open-field farms.',
    imageKey: 'cucumber',
    sourceImageUrl: 'https://images.pexels.com/photos/2329440/pexels-photo-2329440.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    title: 'Beetroot',
    category: 'Vegetables',
    unit: 'kg',
    basePrice: 14,
    description: 'Deep red beetroot, rich in nutrients.',
    imageKey: 'beetroot',
    sourceImageUrl: 'https://images.pexels.com/photos/1442515/pexels-photo-1442515.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    title: 'Sweet Potato',
    category: 'Vegetables',
    unit: 'kg',
    basePrice: 9,
    description: 'Orange-fleshed sweet potatoes, popular across Ghana.',
    imageKey: 'sweet-potato',
    sourceImageUrl: 'https://images.pexels.com/photos/4198017/pexels-photo-4198017.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    title: 'Sweet Plantain',
    category: 'Fruits',
    unit: 'bunch',
    basePrice: 15,
    description: 'Ripe plantain bunch for kelewele, ampesi, and roasting.',
    imageKey: 'plantain',
    sourceImageUrl: 'https://images.pexels.com/photos/2872755/pexels-photo-2872755.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    title: 'Pawpaw (Papaya)',
    category: 'Fruits',
    unit: 'piece',
    basePrice: 8,
    description: 'Sweet ripe pawpaw from coastal and forest-zone farms.',
    imageKey: 'pawpaw',
    sourceImageUrl: 'https://images.pexels.com/photos/2132820/pexels-photo-2132820.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    title: 'Sweet Mango',
    category: 'Fruits',
    unit: 'kg',
    basePrice: 12,
    description: 'Seasonal Kent and local mango varieties.',
    imageKey: 'mango',
    sourceImageUrl: 'https://images.pexels.com/photos/2294471/pexels-photo-2294471.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    title: 'Pineapple',
    category: 'Fruits',
    unit: 'piece',
    basePrice: 10,
    description: 'Golden pineapples from Eastern and Central Region growers.',
    imageKey: 'pineapple',
    sourceImageUrl: 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    title: 'Watermelon',
    category: 'Fruits',
    unit: 'piece',
    basePrice: 25,
    description: 'Large juicy watermelons, perfect for hot season sales.',
    imageKey: 'watermelon',
    sourceImageUrl: 'https://images.pexels.com/photos/1313260/pexels-photo-1313260.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    title: 'Oranges',
    category: 'Fruits',
    unit: 'kg',
    basePrice: 10,
    description: 'Fresh citrus oranges for juice and snacking.',
    imageKey: 'oranges',
    sourceImageUrl: 'https://images.pexels.com/photos/161559/background-bitter-breakfast-bright-161559.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    title: 'Bananas',
    category: 'Fruits',
    unit: 'bunch',
    basePrice: 12,
    description: 'Finger-sweet banana bunches from local plantations.',
    imageKey: 'bananas',
    sourceImageUrl: 'https://images.pexels.com/photos/61127/pexels-photo-61127.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    title: 'Coconut',
    category: 'Fruits',
    unit: 'piece',
    basePrice: 6,
    description: 'Fresh coconuts with sweet water and firm meat.',
    imageKey: 'coconut',
    sourceImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Coconut.jpg',
  },
  {
    title: 'Avocado',
    category: 'Fruits',
    unit: 'piece',
    basePrice: 5,
    description: 'Creamy avocados from Volta and Ashanti farms.',
    imageKey: 'avocado',
    sourceImageUrl: 'https://images.pexels.com/photos/557780/pexels-photo-557780.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    title: 'Guava',
    category: 'Fruits',
    unit: 'kg',
    basePrice: 8,
    description: 'Fragrant pink guava, eaten fresh or blended into juice.',
    imageKey: 'guava',
    sourceImageUrl: 'https://images.pexels.com/photos/5945905/pexels-photo-5945905.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
];

export function pickCatalogForFarmer(
  farmerIndex: number,
  itemsPerCategory = 5,
): GhanaProduceCatalogItem[] {
  const vegetables = GHANA_PRODUCE_CATALOG.filter((i) => i.category === 'Vegetables');
  const fruits = GHANA_PRODUCE_CATALOG.filter((i) => i.category === 'Fruits');

  const pick = (list: GhanaProduceCatalogItem[], offset: number) => {
    const out: GhanaProduceCatalogItem[] = [];
    for (let n = 0; n < itemsPerCategory; n++) {
      out.push(list[(offset + n) % list.length]);
    }
    return out;
  };

  return [
    ...pick(vegetables, farmerIndex % vegetables.length),
    ...pick(fruits, farmerIndex % fruits.length),
  ];
}

export function catalogImageByTitle(title: string): GhanaProduceCatalogItem | undefined {
  return GHANA_PRODUCE_CATALOG.find(
    (item) => item.title.toLowerCase() === title.toLowerCase(),
  );
}
