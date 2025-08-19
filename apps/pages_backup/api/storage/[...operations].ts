import { type NextApiRequest, type NextApiResponse } from 'next';
import {
  uploadFile,
  getFileURL,
  deleteFile,
  listFiles,
  uploadProfileImage,
  uploadGameRecording,
  uploadVenueImage,
} from '@/firebase/storage';
import formidable from 'formidable';
import { type File } from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = async (
  req: NextApiRequest
): Promise<{ fields: any; files: any }> => {
  return new Promise((resolve, reject) => {
    const form = formidable();
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const operations = req.query.operations as string[];

  try {
    switch (operations[0]) {
      case 'upload':
        if (method === 'POST') {
          const { fields, files } = await parseForm(req);
          const file = files.file as File;
          const path = fields.path as string;

          let result;
          switch (fields.type) {
            case 'profile':
              result = await uploadProfileImage(fields.userId, file);
              break;
            case 'game':
              result = await uploadGameRecording(fields.gameId, file);
              break;
            case 'venue':
              result = await uploadVenueImage(fields.venueId, file);
              break;
            default:
              result = await uploadFile(path, file);
          }

          return res.status(result.success ? 200 : 400).json(result);
        }
        break;

      case 'url':
        if (method === 'GET') {
          const path = operations[1];
          if (!path) {
            return res
              .status(400)
              .json({ success: false, error: 'Path required' });
          }
          const result = await getFileURL(path);
          return res.status(result.success ? 200 : 400).json(result);
        }
        break;

      case 'delete':
        if (method === 'DELETE') {
          const path = operations[1];
          if (!path) {
            return res
              .status(400)
              .json({ success: false, error: 'Path required' });
          }
          const result = await deleteFile(path);
          return res.status(result.success ? 200 : 400).json(result);
        }
        break;

      case 'list':
        if (method === 'GET') {
          const path = operations[1];
          if (!path) {
            return res
              .status(400)
              .json({ success: false, error: 'Path required' });
          }
          const result = await listFiles(path);
          return res.status(result.success ? 200 : 400).json(result);
        }
        break;

      default:
        return res
          .status(404)
          .json({ success: false, error: 'Operation not found' });
    }

    return res
      .status(405)
      .json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
