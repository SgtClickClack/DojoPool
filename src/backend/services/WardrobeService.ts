export interface ClothingItem {
  id: string;
  name: string;
  category: 'top' | 'bottom' | 'shoes' | 'accessory';
  meshUrl: string;
  textureUrl: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  previewUrl: string;
  metadata: {
    tags: string[];
    storyContext?: string;
  };
  description: string;
  unlockLevel: number;
}

class WardrobeService {
  private readonly initialClothingItems: ClothingItem[] = [
    {
      id: 'basic_tshirt',
      name: 'Classic Dojo T-Shirt',
      category: 'top',
      meshUrl: '/models/clothing/basic_tshirt.glb',
      textureUrl: '/textures/clothing/basic_tshirt_diffuse.jpg',
      rarity: 'common',
      previewUrl: '/previews/clothing/basic_tshirt.jpg',
      description: 'A comfortable cotton t-shirt perfect for casual pool games.',
      unlockLevel: 1,
      metadata: {
        tags: ['casual', 'starter', 'comfortable'],
        storyContext: 'Your first piece of Dojo gear - simple but reliable.'
      }
    },
    {
      id: 'denim_jeans',
      name: 'Classic Denim Jeans',
      category: 'bottom',
      meshUrl: '/models/clothing/denim_jeans.glb',
      textureUrl: '/textures/clothing/denim_jeans_diffuse.jpg',
      rarity: 'common',
      previewUrl: '/previews/clothing/denim_jeans.jpg',
      description: 'Durable denim jeans that can handle any pool hall adventure.',
      unlockLevel: 1,
      metadata: {
        tags: ['casual', 'durable', 'classic'],
        storyContext: 'Standard issue for any aspiring pool champion.'
      }
    },
    {
      id: 'pool_sneakers',
      name: 'Precision Pool Sneakers',
      category: 'shoes',
      meshUrl: '/models/clothing/pool_sneakers.glb',
      textureUrl: '/textures/clothing/pool_sneakers_diffuse.jpg',
      rarity: 'common',
      previewUrl: '/previews/clothing/pool_sneakers.jpg',
      description: 'Specially designed sneakers with excellent grip for precise pool shots.',
      unlockLevel: 1,
      metadata: {
        tags: ['performance', 'grip', 'precision'],
        storyContext: 'Every great player needs the right footwork foundation.'
      }
    },
    {
      id: 'lucky_cap',
      name: 'Lucky Dragon Cap',
      category: 'accessory',
      meshUrl: '/models/clothing/lucky_cap.glb',
      textureUrl: '/textures/clothing/lucky_cap_diffuse.jpg',
      rarity: 'rare',
      previewUrl: '/previews/clothing/lucky_cap.jpg',
      description: 'A rare cap blessed by the Pool Gods for extra luck in matches.',
      unlockLevel: 1,
      metadata: {
        tags: ['lucky', 'rare', 'blessed'],
        storyContext: 'Legend says this cap was worn by the first Pool God champion.'
      }
    },
    {
      id: 'champion_jacket',
      name: 'Rising Champion Jacket',
      category: 'top',
      meshUrl: '/models/clothing/champion_jacket.glb',
      textureUrl: '/textures/clothing/champion_jacket_diffuse.jpg',
      rarity: 'epic',
      previewUrl: '/previews/clothing/champion_jacket.jpg',
      description: 'An elegant jacket that marks you as a serious competitor.',
      unlockLevel: 1,
      metadata: {
        tags: ['champion', 'elegant', 'competitive'],
        storyContext: 'Awarded to those who show true dedication to the art of pool.'
      }
    }
  ];

  // Phase 1: Get all available clothing items
  async getAvailableClothing(): Promise<ClothingItem[]> {
    // In Phase 1, return all 5 initial items
    // In future phases, this could filter based on user progress, unlocks, etc.
    return this.initialClothingItems;
  }

  // Phase 1: Get specific clothing item
  async getClothingItem(itemId: string): Promise<ClothingItem> {
    const item = this.initialClothingItems.find(item => item.id === itemId);
    if (!item) {
      throw new Error(`Clothing item not found: ${itemId}`);
    }
    return item;
  }

  // Phase 1: Get clothing items by category
  async getClothingByCategory(category: ClothingItem['category']): Promise<ClothingItem[]> {
    return this.initialClothingItems.filter(item => item.category === category);
  }

  // Phase 1: Get clothing items by rarity
  async getClothingByRarity(rarity: ClothingItem['rarity']): Promise<ClothingItem[]> {
    return this.initialClothingItems.filter(item => item.rarity === rarity);
  }

  // Phase 1: Validate clothing selection
  async validateClothingSelection(itemIds: string[]): Promise<{
    isValid: boolean;
    issues: string[];
    validItems: ClothingItem[];
  }> {
    const validItems: ClothingItem[] = [];
    const issues: string[] = [];
    const categories = new Set<string>();

    for (const itemId of itemIds) {
      const item = this.initialClothingItems.find(i => i.id === itemId);
      if (!item) {
        issues.push(`Unknown clothing item: ${itemId}`);
        continue;
      }

      // Check for duplicate categories (e.g., two tops)
      if (categories.has(item.category)) {
        issues.push(`Duplicate category detected: ${item.category}`);
        continue;
      }

      categories.add(item.category);
      validItems.push(item);
    }

    return {
      isValid: issues.length === 0,
      issues,
      validItems
    };
  }

  // Phase 1: Get default outfit
  async getDefaultOutfit(): Promise<ClothingItem[]> {
    // Return a basic starter outfit
    return [
      this.initialClothingItems.find(item => item.id === 'basic_tshirt')!,
      this.initialClothingItems.find(item => item.id === 'denim_jeans')!,
      this.initialClothingItems.find(item => item.id === 'pool_sneakers')!
    ];
  }

  // Phase 1: Get outfit combinations
  async getOutfitCombinations(): Promise<{
    name: string;
    items: ClothingItem[];
    theme: string;
  }[]> {
    return [
      {
        name: 'Casual Player',
        items: [
          this.initialClothingItems.find(item => item.id === 'basic_tshirt')!,
          this.initialClothingItems.find(item => item.id === 'denim_jeans')!,
          this.initialClothingItems.find(item => item.id === 'pool_sneakers')!
        ],
        theme: 'Relaxed and comfortable for friendly games'
      },
      {
        name: 'Lucky Challenger',
        items: [
          this.initialClothingItems.find(item => item.id === 'basic_tshirt')!,
          this.initialClothingItems.find(item => item.id === 'denim_jeans')!,
          this.initialClothingItems.find(item => item.id === 'pool_sneakers')!,
          this.initialClothingItems.find(item => item.id === 'lucky_cap')!
        ],
        theme: 'Boost your luck with the blessed cap'
      },
      {
        name: 'Rising Champion',
        items: [
          this.initialClothingItems.find(item => item.id === 'champion_jacket')!,
          this.initialClothingItems.find(item => item.id === 'denim_jeans')!,
          this.initialClothingItems.find(item => item.id === 'pool_sneakers')!,
          this.initialClothingItems.find(item => item.id === 'lucky_cap')!
        ],
        theme: 'Dress like the champion you aspire to be'
      }
    ];
  }

  // Phase 1: Calculate outfit stats (for future gameplay integration)
  async calculateOutfitStats(itemIds: string[]): Promise<{
    luck: number;
    precision: number;
    style: number;
    comfort: number;
  }> {
    let luck = 0;
    let precision = 0;
    let style = 0;
    let comfort = 0;

    for (const itemId of itemIds) {
      const item = this.initialClothingItems.find(i => i.id === itemId);
      if (!item) continue;

      // Calculate stats based on item metadata
      if (item.metadata.tags.includes('lucky')) luck += 10;
      if (item.metadata.tags.includes('precision')) precision += 10;
      if (item.metadata.tags.includes('elegant') || item.metadata.tags.includes('champion')) style += 15;
      if (item.metadata.tags.includes('comfortable')) comfort += 10;

      // Rarity bonuses
      switch (item.rarity) {
        case 'rare': luck += 5; break;
        case 'epic': style += 10; break;
        case 'legendary': 
          luck += 10;
          precision += 10;
          style += 15;
          break;
      }
    }

    return { luck, precision, style, comfort };
  }
}

export default new WardrobeService();


