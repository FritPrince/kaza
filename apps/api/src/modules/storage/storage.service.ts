import { Injectable, Logger } from '@nestjs/common';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

const DEFAULT_SIGNED_URL_TTL_SECONDS = 3600;

/**
 * S3-compatible object storage (AWS S3 or Cloudflare R2, §7.2). All media is
 * private; clients only ever see time-limited signed URLs.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket = process.env.S3_BUCKET ?? 'kaza-media';
  private readonly ttlSeconds = Number(
    process.env.S3_SIGNED_URL_TTL_SECONDS ?? DEFAULT_SIGNED_URL_TTL_SECONDS,
  );

  constructor() {
    this.client = new S3Client({
      // R2 and other S3-compatible stores need an explicit endpoint.
      ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
      region: process.env.S3_REGION ?? 'auto',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
      },
      forcePathStyle: true,
    });
  }

  /** Signed PUT URL: the mobile app uploads the compressed photo directly to storage. */
  async createUploadUrl(prefix: string, contentType: string): Promise<{ key: string; uploadUrl: string }> {
    const extension = contentType === 'image/png' ? 'png' : 'jpg';
    const key = `${prefix}/${randomUUID()}.${extension}`;
    const uploadUrl = await getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }),
      { expiresIn: this.ttlSeconds },
    );
    return { key, uploadUrl };
  }

  /** Signed GET URL for displaying a stored image. */
  getDownloadUrl(key: string): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: this.ttlSeconds,
    });
  }

  /** Uploads server-side generated content (AI renders fetched from providers). */
  async upload(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
    );
    this.logger.log(`Uploaded ${key} (${body.length} bytes)`);
  }
}
