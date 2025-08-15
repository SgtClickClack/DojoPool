import { NextApiRequest, NextApiResponse } from "next";
import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  getActiveGames,
  getVenuesByLocation,
  getUpcomingTournaments,
} from "@/firebase/firestore";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { method } = req;
  const collection = req.query.collection as string;
  const operations = req.query.operations as string[];

  try {
    // Handle special queries first
    if (collection === "games" && operations[0] === "active") {
      const result = await getActiveGames(Number(req.query.limit) || 10);
      return res.status(result.success ? 200 : 400).json(result);
    }

    if (collection === "venues" && operations[0] === "by-location") {
      const result = await getVenuesByLocation(
        req.query.location as string,
        Number(req.query.limit) || 10,
      );
      return res.status(result.success ? 200 : 400).json(result);
    }

    if (collection === "tournaments" && operations[0] === "upcoming") {
      const result = await getUpcomingTournaments(
        Number(req.query.limit) || 10,
      );
      return res.status(result.success ? 200 : 400).json(result);
    }

    // Handle standard CRUD operations
    switch (operations[0]) {
      case "create":
        if (method === "POST") {
          const result = await createDocument(collection, req.body);
          return res.status(result.success ? 200 : 400).json(result);
        }
        break;

      case "get":
        if (method === "GET") {
          const documentId = operations[1];
          if (!documentId) {
            return res
              .status(400)
              .json({ success: false, error: "Document ID required" });
          }
          const result = await getDocument(collection, documentId);
          return res.status(result.success ? 200 : 400).json(result);
        }
        break;

      case "update":
        if (method === "PUT") {
          const documentId = operations[1];
          if (!documentId) {
            return res
              .status(400)
              .json({ success: false, error: "Document ID required" });
          }
          const result = await updateDocument(collection, documentId, req.body);
          return res.status(result.success ? 200 : 400).json(result);
        }
        break;

      case "delete":
        if (method === "DELETE") {
          const documentId = operations[1];
          if (!documentId) {
            return res
              .status(400)
              .json({ success: false, error: "Document ID required" });
          }
          const result = await deleteDocument(collection, documentId);
          return res.status(result.success ? 200 : 400).json(result);
        }
        break;

      case "query":
        if (method === "POST") {
          const { constraints = [], limit = 10 } = req.body;
          const result = await queryDocuments(collection, constraints, limit);
          return res.status(result.success ? 200 : 400).json(result);
        }
        break;

      default:
        return res
          .status(404)
          .json({ success: false, error: "Operation not found" });
    }

    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
