import { communityShowcaseService } from '../../services/community/CommunityShowcaseService';
import { textureAIService } from '../../services/ai/TextureAIService';
import { logger } from '../../config/monitoring';

// Type mappings for GraphQL enums to service types
const mapStyleFromGraphQL = (style: string) => {
  switch (style) {
    case 'REALISTIC':
      return 'realistic';
    case 'CARTOON':
      return 'cartoon';
    case 'ARTISTIC':
      return 'artistic';
    case 'CYBERPUNK':
      return 'cyberpunk';
    default:
      return 'realistic';
  }
};

const mapStyleToGraphQL = (style: string) => {
  switch (style) {
    case 'realistic':
      return 'REALISTIC';
    case 'cartoon':
      return 'CARTOON';
    case 'artistic':
      return 'ARTISTIC';
    case 'cyberpunk':
      return 'CYBERPUNK';
    default:
      return 'REALISTIC';
  }
};

const mapCategoryFromGraphQL = (category: string) => {
  switch (category) {
    case 'CHARACTER':
      return 'character';
    case 'ENVIRONMENT':
      return 'environment';
    case 'OBJECT':
      return 'object';
    case 'ABSTRACT':
      return 'abstract';
    case 'OTHER':
      return 'other';
    default:
      return 'other';
  }
};

const mapSortByFromGraphQL = (sortBy: string) => {
  switch (sortBy) {
    case 'NEWEST':
      return 'newest';
    case 'POPULAR':
      return 'popular';
    case 'TRENDING':
      return 'trending';
    case 'MOST_LIKED':
      return 'most_liked';
    case 'MOST_DOWNLOADED':
      return 'most_downloaded';
    default:
      return 'newest';
  }
};

const mapGenerationStatusToGraphQL = (status: string) => {
  switch (status) {
    case 'generating':
      return 'GENERATING';
    case 'completed':
      return 'COMPLETED';
    case 'failed':
      return 'FAILED';
    default:
      return 'GENERATING';
  }
};

export const communityShowcaseResolvers = {
  Query: {
    getShowcaseTextures: async (
      _: any,
      args: {
        filters?: any;
        limit?: number;
        offset?: number;
      }
    ) => {
      try {
        const filters = args.filters || {};
        const mappedFilters = {
          ...filters,
          style: filters.style ? mapStyleFromGraphQL(filters.style) : undefined,
          category: filters.category
            ? mapCategoryFromGraphQL(filters.category)
            : undefined,
          sortBy: filters.sortBy
            ? mapSortByFromGraphQL(filters.sortBy)
            : undefined,
        };

        const result = await communityShowcaseService.getShowcaseTextures(
          mappedFilters,
          args.limit || 20,
          args.offset || 0
        );

        return {
          textures: result.textures.map((texture) => ({
            ...texture,
            style: mapStyleToGraphQL(texture.style),
            category: texture.category.toUpperCase(),
            moderationStatus: texture.moderationStatus.toUpperCase(),
            createdAt: texture.createdAt.toISOString(),
            updatedAt: texture.updatedAt.toISOString(),
            moderatedAt: texture.moderatedAt?.toISOString(),
          })),
          total: result.total,
          hasMore: result.hasMore,
        };
      } catch (error) {
        logger.error('Error in getShowcaseTextures resolver:', error);
        throw new Error('Failed to fetch showcase textures');
      }
    },

    getTextureById: async (_: any, args: { id: string }) => {
      try {
        const texture = await communityShowcaseService.getTextureById(args.id);
        if (!texture) return null;

        return {
          ...texture,
          style: mapStyleToGraphQL(texture.style),
          category: texture.category.toUpperCase(),
          moderationStatus: texture.moderationStatus.toUpperCase(),
          createdAt: texture.createdAt.toISOString(),
          updatedAt: texture.updatedAt.toISOString(),
          moderatedAt: texture.moderatedAt?.toISOString(),
        };
      } catch (error) {
        logger.error('Error in getTextureById resolver:', error);
        throw new Error('Failed to fetch texture');
      }
    },

    getUserById: async (_: any, args: { id: string }) => {
      try {
        const user = await communityShowcaseService.getUserById(args.id);
        if (!user) return null;

        return {
          ...user,
          createdAt: user.createdAt.toISOString(),
          lastActiveAt: user.lastActiveAt.toISOString(),
        };
      } catch (error) {
        logger.error('Error in getUserById resolver:', error);
        throw new Error('Failed to fetch user');
      }
    },

    getFeaturedTextures: async (_: any, args: { limit?: number }) => {
      try {
        const textures = await communityShowcaseService.getFeaturedTextures(
          args.limit || 10
        );
        return textures.map((texture) => ({
          ...texture,
          style: mapStyleToGraphQL(texture.style),
          category: texture.category.toUpperCase(),
          moderationStatus: texture.moderationStatus.toUpperCase(),
          createdAt: texture.createdAt.toISOString(),
          updatedAt: texture.updatedAt.toISOString(),
          moderatedAt: texture.moderatedAt?.toISOString(),
        }));
      } catch (error) {
        logger.error('Error in getFeaturedTextures resolver:', error);
        throw new Error('Failed to fetch featured textures');
      }
    },

    getTrendingTextures: async (_: any, args: { limit?: number }) => {
      try {
        const textures = await communityShowcaseService.getTrendingTextures(
          args.limit || 10
        );
        return textures.map((texture) => ({
          ...texture,
          style: mapStyleToGraphQL(texture.style),
          category: texture.category.toUpperCase(),
          moderationStatus: texture.moderationStatus.toUpperCase(),
          createdAt: texture.createdAt.toISOString(),
          updatedAt: texture.updatedAt.toISOString(),
          moderatedAt: texture.moderatedAt?.toISOString(),
        }));
      } catch (error) {
        logger.error('Error in getTrendingTextures resolver:', error);
        throw new Error('Failed to fetch trending textures');
      }
    },

    getShowcaseStats: async () => {
      try {
        const stats = await communityShowcaseService.getShowcaseStats();
        return {
          ...stats,
          categoryCounts: Object.entries(stats.categoryCounts).map(
            ([category, count]) => ({
              category: category.toUpperCase(),
              count,
            })
          ),
          styleCounts: Object.entries(stats.styleCounts).map(
            ([style, count]) => ({
              style: mapStyleToGraphQL(style),
              count,
            })
          ),
        };
      } catch (error) {
        logger.error('Error in getShowcaseStats resolver:', error);
        throw new Error('Failed to fetch showcase stats');
      }
    },

    getPopularPrompts: async (_: any, args: { limit?: number }) => {
      try {
        const prompts = await communityShowcaseService.getPopularPrompts(
          args.limit || 20
        );
        return prompts.map((prompt) => ({
          ...prompt,
          category: prompt.category.toUpperCase(),
        }));
      } catch (error) {
        logger.error('Error in getPopularPrompts resolver:', error);
        throw new Error('Failed to fetch popular prompts');
      }
    },

    // Texture AI resolvers
    getTextureGenerationResult: async (_: any, args: { id: string }) => {
      try {
        const result = await textureAIService.getGenerationResult(args.id);
        if (!result) return null;

        return {
          ...result,
          style: mapStyleToGraphQL(result.style),
          status: mapGenerationStatusToGraphQL(result.status),
          generatedAt: result.generatedAt.toISOString(),
        };
      } catch (error) {
        logger.error('Error in getTextureGenerationResult resolver:', error);
        throw new Error('Failed to fetch generation result');
      }
    },

    getTextureGenerationStatus: async (_: any, args: { id: string }) => {
      try {
        const status = await textureAIService.getGenerationStatus(args.id);
        return mapGenerationStatusToGraphQL(status);
      } catch (error) {
        logger.error('Error in getTextureGenerationStatus resolver:', error);
        throw new Error('Failed to fetch generation status');
      }
    },

    getUserGenerations: async (
      _: any,
      args: { userId: string; limit?: number }
    ) => {
      try {
        const generations = await textureAIService.getUserGenerations(
          args.userId
        );
        const limited = generations.slice(0, args.limit || 20);

        return limited.map((generation) => ({
          ...generation,
          style: mapStyleToGraphQL(generation.style),
          status: mapGenerationStatusToGraphQL(generation.status),
          generatedAt: generation.generatedAt.toISOString(),
        }));
      } catch (error) {
        logger.error('Error in getUserGenerations resolver:', error);
        throw new Error('Failed to fetch user generations');
      }
    },

    getTextureAIPopularPrompts: async (_: any, args: { limit?: number }) => {
      try {
        const prompts = await textureAIService.getPopularPrompts(
          args.limit || 10
        );
        return prompts.map((prompt) => ({
          ...prompt,
          category: 'OTHER', // Default category for AI prompts
        }));
      } catch (error) {
        logger.error('Error in getTextureAIPopularPrompts resolver:', error);
        throw new Error('Failed to fetch AI popular prompts');
      }
    },
  },

  Mutation: {
    likeTexture: async (
      _: any,
      args: { userId: string; textureId: string }
    ) => {
      try {
        const result = await communityShowcaseService.likeTexture(
          args.userId,
          args.textureId
        );
        return result;
      } catch (error) {
        logger.error('Error in likeTexture resolver:', error);
        throw new Error('Failed to like texture');
      }
    },

    downloadTexture: async (
      _: any,
      args: { userId: string; textureId: string }
    ) => {
      try {
        const result = await communityShowcaseService.downloadTexture(
          args.userId,
          args.textureId
        );
        return result;
      } catch (error) {
        logger.error('Error in downloadTexture resolver:', error);
        throw new Error('Failed to download texture');
      }
    },

    shareTexture: async (
      _: any,
      args: { userId: string; textureId: string; platform: string }
    ) => {
      try {
        const result = await communityShowcaseService.shareTexture(
          args.userId,
          args.textureId,
          args.platform
        );
        return result;
      } catch (error) {
        logger.error('Error in shareTexture resolver:', error);
        throw new Error('Failed to share texture');
      }
    },

    generateTexture: async (_: any, args: { input: any }) => {
      try {
        const request = {
          ...args.input,
          style: args.input.style
            ? mapStyleFromGraphQL(args.input.style)
            : 'realistic',
        };

        const generationId =
          await textureAIService.requestTextureGeneration(request);
        return generationId;
      } catch (error) {
        logger.error('Error in generateTexture resolver:', error);
        throw new Error('Failed to generate texture');
      }
    },

    updateUserPreferences: async (
      _: any,
      args: { userId: string; preferences: any }
    ) => {
      try {
        // This would update user preferences in the database
        // For now, return mock success
        const user = await communityShowcaseService.getUserById(args.userId);
        if (!user) throw new Error('User not found');

        // In production, this would update the user's preferences
        logger.info(`Updated preferences for user ${args.userId}`);

        return {
          ...user,
          preferences: args.preferences,
          createdAt: user.createdAt.toISOString(),
          lastActiveAt: user.lastActiveAt.toISOString(),
        };
      } catch (error) {
        logger.error('Error in updateUserPreferences resolver:', error);
        throw new Error('Failed to update user preferences');
      }
    },

    followUser: async (
      _: any,
      args: { userId: string; targetUserId: string }
    ) => {
      try {
        // Mock follow functionality
        logger.info(`User ${args.userId} followed user ${args.targetUserId}`);
        return true;
      } catch (error) {
        logger.error('Error in followUser resolver:', error);
        throw new Error('Failed to follow user');
      }
    },

    unfollowUser: async (
      _: any,
      args: { userId: string; targetUserId: string }
    ) => {
      try {
        // Mock unfollow functionality
        logger.info(`User ${args.userId} unfollowed user ${args.targetUserId}`);
        return true;
      } catch (error) {
        logger.error('Error in unfollowUser resolver:', error);
        throw new Error('Failed to unfollow user');
      }
    },

    reportTexture: async (
      _: any,
      args: { userId: string; textureId: string; reason: string }
    ) => {
      try {
        // Mock report functionality
        logger.info(
          `User ${args.userId} reported texture ${args.textureId}: ${args.reason}`
        );
        return true;
      } catch (error) {
        logger.error('Error in reportTexture resolver:', error);
        throw new Error('Failed to report texture');
      }
    },

    moderateTexture: async (
      _: any,
      args: {
        textureId: string;
        status: string;
        reason?: string;
        moderatorId: string;
      }
    ) => {
      try {
        // Mock moderation functionality
        const texture = await communityShowcaseService.getTextureById(
          args.textureId
        );
        if (!texture) throw new Error('Texture not found');

        logger.info(
          `Moderator ${args.moderatorId} set texture ${args.textureId} status to ${args.status}`
        );

        return {
          ...texture,
          moderationStatus: args.status,
          moderationReason: args.reason,
          moderatedBy: args.moderatorId,
          moderatedAt: new Date().toISOString(),
          style: mapStyleToGraphQL(texture.style),
          category: texture.category.toUpperCase(),
          createdAt: texture.createdAt.toISOString(),
          updatedAt: texture.updatedAt.toISOString(),
        };
      } catch (error) {
        logger.error('Error in moderateTexture resolver:', error);
        throw new Error('Failed to moderate texture');
      }
    },
  },

  // Field resolvers for nested data
  CommunityTexture: {
    user: async (parent: any) => {
      try {
        const user = await communityShowcaseService.getUserById(parent.userId);
        if (!user) return null;

        return {
          ...user,
          createdAt: user.createdAt.toISOString(),
          lastActiveAt: user.lastActiveAt.toISOString(),
        };
      } catch (error) {
        logger.error('Error resolving texture user:', error);
        return null;
      }
    },

    remixedFrom: async (parent: any) => {
      if (!parent.remixedFromId) return null;

      try {
        const texture = await communityShowcaseService.getTextureById(
          parent.remixedFromId
        );
        if (!texture) return null;

        return {
          ...texture,
          style: mapStyleToGraphQL(texture.style),
          category: texture.category.toUpperCase(),
          moderationStatus: texture.moderationStatus.toUpperCase(),
          createdAt: texture.createdAt.toISOString(),
          updatedAt: texture.updatedAt.toISOString(),
          moderatedAt: texture.moderatedAt?.toISOString(),
        };
      } catch (error) {
        logger.error('Error resolving remixed from texture:', error);
        return null;
      }
    },
  },

  CommunityUser: {
    textures: async (parent: any) => {
      try {
        const result = await communityShowcaseService.getShowcaseTextures(
          { userId: parent.id },
          50, // Limit to 50 textures per user
          0
        );

        return result.textures.map((texture) => ({
          ...texture,
          style: mapStyleToGraphQL(texture.style),
          category: texture.category.toUpperCase(),
          moderationStatus: texture.moderationStatus.toUpperCase(),
          createdAt: texture.createdAt.toISOString(),
          updatedAt: texture.updatedAt.toISOString(),
          moderatedAt: texture.moderatedAt?.toISOString(),
        }));
      } catch (error) {
        logger.error('Error resolving user textures:', error);
        return [];
      }
    },
  },
};
