const DEFAULT_BADGE = '🌱';
const DEFAULT_USERNAME = 'Misafir';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const JWT_EXPIRES_IN = '30d';

const OTP_EXPIRY_MINUTES = 15;

const PAGINATION_DEFAULT_PAGE_SIZE = 20;

module.exports = {
  DEFAULT_BADGE,
  DEFAULT_USERNAME,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  JWT_EXPIRES_IN,
  OTP_EXPIRY_MINUTES,
  PAGINATION_DEFAULT_PAGE_SIZE,
};
