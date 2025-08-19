import { NextApiRequest, NextApiResponse } from 'next';
import { dojoCustomizationService } from '../services/DojoCustomizationService';
import {
  DojoCustomizationCreate,
  DojoCustomizationUpdate,
} from '../types/dojoCustomization';

export class DojoCustomizationController {
  static async getDojoCustomizations(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    try {
      const { dojoId } = req.query;

      if (!dojoId || typeof dojoId !== 'string') {
        return res.status(400).json({ message: 'Dojo ID is required' });
      }

      // TODO: Verify user has access to this dojo
      const currentUserId = req.headers['x-user-id'] as string;
      if (!currentUserId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const customizations =
        await dojoCustomizationService.getDojoCustomizations(dojoId);
      res.status(200).json(customizations);
    } catch (error) {
      console.error('Error fetching dojo customizations:', error);
      res.status(500).json({ message: 'Failed to fetch dojo customizations' });
    }
  }

  static async getAllCustomizationItems(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    try {
      // TODO: Get current user ID from authentication
      const currentUserId = req.headers['x-user-id'] as string;
      if (!currentUserId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const items = await dojoCustomizationService.getAllCustomizationItems();
      res.status(200).json(items);
    } catch (error) {
      console.error('Error fetching customization items:', error);
      res.status(500).json({ message: 'Failed to fetch customization items' });
    }
  }

  static async unlockCustomization(req: NextApiRequest, res: NextApiResponse) {
    try {
      const { dojoId } = req.query;
      const { customizationItemId, isApplied } =
        req.body as DojoCustomizationCreate;

      if (!dojoId || typeof dojoId !== 'string') {
        return res.status(400).json({ message: 'Dojo ID is required' });
      }

      if (!customizationItemId) {
        return res
          .status(400)
          .json({ message: 'Customization item ID is required' });
      }

      // TODO: Verify user has access to this dojo and can unlock customizations
      const currentUserId = req.headers['x-user-id'] as string;
      if (!currentUserId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const customization = await dojoCustomizationService.unlockCustomization(
        dojoId,
        {
          customizationItemId,
          isApplied: isApplied || false,
        }
      );

      res.status(201).json(customization);
    } catch (error) {
      console.error('Error unlocking customization:', error);
      res.status(500).json({ message: 'Failed to unlock customization' });
    }
  }

  static async updateCustomization(req: NextApiRequest, res: NextApiResponse) {
    try {
      const { dojoId, customizationId } = req.query;
      const { isApplied } = req.body as DojoCustomizationUpdate;

      if (!dojoId || typeof dojoId !== 'string') {
        return res.status(400).json({ message: 'Dojo ID is required' });
      }

      if (!customizationId || typeof customizationId !== 'string') {
        return res
          .status(400)
          .json({ message: 'Customization ID is required' });
      }

      if (typeof isApplied !== 'boolean') {
        return res.status(400).json({ message: 'isApplied must be a boolean' });
      }

      // TODO: Verify user has access to this dojo
      const currentUserId = req.headers['x-user-id'] as string;
      if (!currentUserId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const updatedCustomization =
        await dojoCustomizationService.applyCustomization(
          dojoId,
          customizationId,
          { isApplied }
        );

      res.status(200).json(updatedCustomization);
    } catch (error) {
      console.error('Error updating customization:', error);
      res.status(500).json({ message: 'Failed to update customization' });
    }
  }

  static async removeCustomization(req: NextApiRequest, res: NextApiResponse) {
    try {
      const { dojoId, customizationId } = req.query;

      if (!dojoId || typeof dojoId !== 'string') {
        return res.status(400).json({ message: 'Dojo ID is required' });
      }

      if (!customizationId || typeof customizationId !== 'string') {
        return res
          .status(400)
          .json({ message: 'Customization ID is required' });
      }

      // TODO: Verify user has access to this dojo
      const currentUserId = req.headers['x-user-id'] as string;
      if (!currentUserId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      await dojoCustomizationService.removeCustomization(
        dojoId,
        customizationId
      );
      res.status(204).end();
    } catch (error) {
      console.error('Error removing customization:', error);
      res.status(500).json({ message: 'Failed to remove customization' });
    }
  }

  static async getDojoCustomizationStats(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    try {
      const { dojoId } = req.query;

      if (!dojoId || typeof dojoId !== 'string') {
        return res.status(400).json({ message: 'Dojo ID is required' });
      }

      // TODO: Verify user has access to this dojo
      const currentUserId = req.headers['x-user-id'] as string;
      if (!currentUserId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const stats = await dojoCustomizationService.getDojoCustomizationStats(
        dojoId
      );
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error fetching dojo customization stats:', error);
      res
        .status(500)
        .json({ message: 'Failed to fetch dojo customization stats' });
    }
  }
}
