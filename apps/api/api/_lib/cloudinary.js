import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadImage(buffer, extension) {
  const base64 = buffer.toString('base64');
  const mimeMap = { '.jpg': 'jpeg', '.jpeg': 'jpeg', '.png': 'png', '.webp': 'webp', '.gif': 'gif' };
  const mime = mimeMap[extension] || 'jpeg';
  const dataUri = `data:image/${mime};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'inaturallite_uploads',
    resource_type: 'image',
  });

  if (result.error) throw new Error(result.error.message);
  return result.secure_url;
}

export async function deleteImage(url) {
  if (!url) return;
  // Extract public_id from Cloudinary URL: .../upload/v123/folder/file.ext → folder/file
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
  if (!match) return;
  const publicId = match[1];
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}
