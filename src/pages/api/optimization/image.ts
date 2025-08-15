import { NextApiRequest, NextApiResponse } from "next";
import { ImageOptimizationService } from "../../../../dojopool/services/optimization/image";
import { getCurrentUser } from "../../../../dojopool/services/auth/session";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get current user
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "GET") {
      // Get image analysis
      const analysis = await ImageOptimizationService.get_image_analysis();
      return res.status(200).json(analysis);
    } else {
      // Process optimization request
      const { action, data } = req.body;

      if (!action) {
        return res.status(400).json({ error: "Action is required" });
      }

      let result;
      switch (action) {
        case "analyze_image":
          if (!data?.image_path) {
            return res.status(400).json({ error: "Image path is required" });
          }
          result = await ImageOptimizationService.analyze_image(
            data.image_path,
          );
          break;
        case "optimize_image":
          if (!data?.image_path) {
            return res.status(400).json({ error: "Image path is required" });
          }
          const { optimized_bytes, metrics } =
            await ImageOptimizationService.optimize_image(
              data.image_path,
              data.target_format,
              data.max_width,
              data.max_height,
              data.quality,
            );
          if (!optimized_bytes) {
            return res.status(500).json({ error: "Failed to optimize image" });
          }
          result = {
            metrics,
            image: optimized_bytes.toString("base64"),
          };
          break;
        case "generate_responsive":
          if (!data?.image_path) {
            return res.status(400).json({ error: "Image path is required" });
          }
          result = await ImageOptimizationService.generate_responsive_images(
            data.image_path,
            data.sizes,
          );
          break;
        default:
          return res.status(400).json({ error: "Invalid action" });
      }

      return res.status(200).json(result);
    }
  } catch (error) {
    console.error("Error processing image optimization:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
