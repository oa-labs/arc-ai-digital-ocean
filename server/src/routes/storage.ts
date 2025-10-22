import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { getStorageServiceForBucket } from '../services/bucket-credentials.js';
import { config } from '../env.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const listQuerySchema = z.object({
  prefix: z.string().optional(),
});

const deleteSchema = z.object({
  key: z.string().min(1),
});

const renameSchema = z.object({
  key: z.string().min(1),
  newName: z.string().min(1),
});

const presignSchema = z.object({
  key: z.string().min(1),
  expiresIn: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : undefined)),
});

export const storageRouter = Router();

storageRouter.get('/buckets/:bucket/objects', requireAuth, async (req, res, next) => {
  try {
    const bucket = decodeURIComponent(req.params.bucket);
    const query = listQuerySchema.parse(req.query);
    const storage = await getStorageServiceForBucket(bucket);
    const files = await storage.listObjects({ prefix: query.prefix });
    return res.json({ files });
  } catch (error) {
    return next(error);
  }
});

storageRouter.post(
  '/buckets/:bucket/objects',
  requireAuth,
  upload.single('file'),
  async (req, res, next) => {
    try {
      const bucket = decodeURIComponent(req.params.bucket);
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'File is required' });
      }

      const storage = await getStorageServiceForBucket(bucket);
      const stored = await storage.uploadObject(file.buffer, file.originalname, {
        contentType: file.mimetype,
      });

      return res.status(201).json({ file: stored });
    } catch (error) {
      return next(error);
    }
  }
);

storageRouter.delete('/buckets/:bucket/objects', requireAuth, async (req, res, next) => {
  try {
    const bucket = decodeURIComponent(req.params.bucket);
    const body = deleteSchema.parse(req.body);
    const storage = await getStorageServiceForBucket(bucket);
    await storage.deleteObject(body.key);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

storageRouter.post('/buckets/:bucket/rename', requireAuth, async (req, res, next) => {
  try {
    const bucket = decodeURIComponent(req.params.bucket);
    const body = renameSchema.parse(req.body);
    const storage = await getStorageServiceForBucket(bucket);
    const file = await storage.renameObject(body.key, body.newName);
    return res.json({ file });
  } catch (error) {
    return next(error);
  }
});

storageRouter.get('/buckets/:bucket/presign', requireAuth, async (req, res, next) => {
  try {
    const bucket = decodeURIComponent(req.params.bucket);
    const query = presignSchema.parse(req.query);
    const storage = await getStorageServiceForBucket(bucket);
    const expiresIn = query.expiresIn && Number.isFinite(query.expiresIn)
      ? Math.max(1, Math.min(86400, query.expiresIn))
      : config.storage.downloadUrlTtl;
    const url = await storage.getPresignedUrl(query.key, expiresIn);
    return res.json({ url, expiresIn });
  } catch (error) {
    return next(error);
  }
});
