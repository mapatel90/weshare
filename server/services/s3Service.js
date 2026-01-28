import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaClient } from '@prisma/client';
import { decrypt } from '../utils/encryption.js';
import path from 'path';

const prisma = new PrismaClient();

// S3 setting keys stored in settings table
export const S3_KEYS = {
  ACCESS_KEY_ID: 's3_aws_access_key_id',
  SECRET_ACCESS_KEY: 's3_aws_secret_access_key',
  REGION: 's3_aws_region',
  BUCKET_NAME: 's3_bucket_name',
  FOLDER_PATH: 's3_folder_path',
  PUBLIC_URL: 's3_public_url',
  FILE_VISIBILITY: 's3_file_visibility',
  SIGNED_URL_EXPIRY: 's3_signed_url_expiry',
  ENABLED: 's3_enabled',
};

/**
 * Get S3 configuration from settings table
 * @returns {Promise<Object>} S3 configuration
 */
export const getS3Config = async () => {
  try {
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: Object.values(S3_KEYS),
        },
      },
    });

    const settingsMap = {};
    settings.forEach((setting) => {
      settingsMap[setting.key] = setting.value;
    });

    // Check if S3 is enabled and configured
    if (
      settingsMap[S3_KEYS.ENABLED] !== '1' ||
      !settingsMap[S3_KEYS.ACCESS_KEY_ID] ||
      !settingsMap[S3_KEYS.SECRET_ACCESS_KEY] ||
      !settingsMap[S3_KEYS.REGION] ||
      !settingsMap[S3_KEYS.BUCKET_NAME]
    ) {
      throw new Error('S3 is not configured or enabled in settings');
    }

    return {
      accessKeyId: settingsMap[S3_KEYS.ACCESS_KEY_ID],
      secretAccessKey: decrypt(settingsMap[S3_KEYS.SECRET_ACCESS_KEY]),
      region: settingsMap[S3_KEYS.REGION],
      bucketName: settingsMap[S3_KEYS.BUCKET_NAME],
      folderPath: settingsMap[S3_KEYS.FOLDER_PATH] || '',
      publicUrl: settingsMap[S3_KEYS.PUBLIC_URL] || null,
      fileVisibility: settingsMap[S3_KEYS.FILE_VISIBILITY] || 'private',
      signedUrlExpiry: parseInt(settingsMap[S3_KEYS.SIGNED_URL_EXPIRY]) || 3600,
    };
  } catch (error) {
    console.error('Error getting S3 config:', error);
    throw error;
  }
};

/**
 * Create S3 client instance
 * @param {Object} config - S3 configuration
 * @returns {S3Client}
 */
export const createS3Client = (config) => {
  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
};

/**
 * Validate S3 credentials by checking bucket access
 * @param {string} accessKeyId
 * @param {string} secretAccessKey
 * @param {string} region
 * @param {string} bucketName
 * @returns {Promise<Object>}
 */
export const validateS3Credentials = async (
  accessKeyId,
  secretAccessKey,
  region,
  bucketName
) => {
  try {
    const client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const headCommand = new HeadBucketCommand({ Bucket: bucketName });
    await client.send(headCommand);

    return { valid: true, message: 'Credentials validated successfully' };
  } catch (error) {
    console.error('S3 validation error:', error);

    if (error.name === 'NotFound') {
      return { valid: false, message: `Bucket "${bucketName}" not found` };
    }

    if (error.name === 'Forbidden' || error.$metadata?.httpStatusCode === 403) {
      return {
        valid: false,
        message: 'Access denied. Check bucket permissions.',
      };
    }

    return {
      valid: false,
      message: error.message || 'Invalid AWS credentials or configuration',
    };
  }
};

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original filename
 * @param {string} mimeType - File MIME type
 * @param {Object} options - Additional options (folder, metadata)
 * @returns {Promise<Object>}
 */
export const uploadToS3 = async (
  fileBuffer,
  fileName,
  mimeType,
  options = {}
) => {
  try {
    const config = await getS3Config();
    const s3Client = createS3Client(config);

    // Generate unique file key
    const timestamp = Date.now();
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');

    // Build S3 key with optional folder path
    const folder = options.folder || config.folderPath || 'uploads';
    const fileKey = `${folder}/${sanitizedName}_${timestamp}${ext}`;

    // Upload to S3 (ACL removed - bucket policy controls access)
    const uploadCommand = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: mimeType,
      Metadata: options.metadata || {},
    });

    await s3Client.send(uploadCommand);

    // Generate file URL
    let fileUrl;
    if (config.fileVisibility === 'public') {
      fileUrl = config.publicUrl
        ? `${config.publicUrl}/${fileKey}`
        : `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${fileKey}`;
    } else {
      // For private files, generate signed URL
      fileUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: config.bucketName,
          Key: fileKey,
        }),
        { expiresIn: config.signedUrlExpiry }
      );
    }

    return {
      success: true,
      data: {
        fileKey,
        fileName,
        fileUrl,
        fileSize: fileBuffer.length,
        mimeType,
      },
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

/**
 * Generate signed URL for private S3 file
 * @param {string} fileKey - S3 object key
 * @param {number} expiresIn - URL expiry in seconds
 * @returns {Promise<string>}
 */
export const generateSignedUrl = async (fileKey, expiresIn = null) => {
  try {
    const config = await getS3Config();
    const s3Client = createS3Client(config);

    const expiry = expiresIn || config.signedUrlExpiry || 3600;

    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: fileKey,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: expiry,
    });

    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

/**
 * Delete file from S3
 * @param {string} fileKey - S3 object key
 * @returns {Promise<Object>}
 */
export const deleteFromS3 = async (fileKey) => {
  try {
    const config = await getS3Config();
    const s3Client = createS3Client(config);

    const deleteCommand = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: fileKey,
    });

    await s3Client.send(deleteCommand);

    return {
      success: true,
      message: 'File deleted successfully',
    };
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
};

/**
 * Check if S3 is enabled and configured
 * @returns {Promise<boolean>}
 */
export const isS3Enabled = async () => {
  try {
    await getS3Config();
    return true;
  } catch (error) {
    return false;
  }
};

export default {
  getS3Config,
  createS3Client,
  validateS3Credentials,
  uploadToS3,
  generateSignedUrl,
  deleteFromS3,
  isS3Enabled,
  S3_KEYS,
};
