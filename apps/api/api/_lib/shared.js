export const DEFAULT_BADGE = '🌱';
export const DEFAULT_USERNAME = 'Misafir';
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const JWT_EXPIRES_IN = '30d';
export const OTP_EXPIRY_MINUTES = 15;
export const PAGINATION_DEFAULT_PAGE_SIZE = 20;

export function validateRegisterInput({ username, email, password }) {
  if (!username?.trim() || !email?.trim() || !password)
    return 'Kullanıcı adı, e-posta ve şifre gerekli.';
  if (password.length < 6)
    return 'Şifre en az 6 karakter olmalı.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return 'Geçersiz e-posta adresi.';
  return null;
}

export function validatePassword(password) {
  if (!password || password.length < 6)
    return 'Şifre en az 6 karakter olmalı.';
  return null;
}

export function welcomeEmail(username) {
  return {
    subject: "iNaturalist Lite'a Hoş Geldin! 🌱",
    html: `<div style='font-family:"Segoe UI",Roboto,sans-serif;color:#374151;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px;'>
  <h2 style='color:#10b981;'>Merhaba ${username}! 👋</h2>
  <p>iNaturalist Lite'a katıldığın için teşekkür ederiz.</p>
  <p style='font-weight:bold;color:#10b981;'>❤️ iNaturalist Lite Ekibi</p>
</div>`,
  };
}

export function otpEmail(username, otp) {
  return {
    subject: 'iNaturalist Lite - Şifre Sıfırlama Kodu',
    html: `<div style='font-family:"Segoe UI",Roboto,sans-serif;color:#374151;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px;'>
  <h2 style='color:#10b981;'>Şifre Sıfırlama Kodu 🔐</h2>
  <p>Merhaba ${username},</p>
  <div style='background:#f3f4f6;padding:20px;border-radius:8px;text-align:center;margin:16px 0;'>
    <p style='color:#6b7280;margin-bottom:8px;'>Doğrulama Kodun:</p>
    <h2 style='font-size:36px;color:#10b981;letter-spacing:8px;margin:0;'>${otp}</h2>
  </div>
  <p style='color:#4b5563;'>Bu kod <b>15 dakika</b> boyunca geçerlidir.</p>
  <p style='font-weight:bold;color:#10b981;'>❤️ iNaturalist Lite Ekibi</p>
</div>`,
  };
}

export function passwordChangedEmail(username) {
  return {
    subject: 'iNaturalist Lite - Şifreniz Değiştirildi',
    html: `<div style='font-family:"Segoe UI",Roboto,sans-serif;color:#374151;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px;'>
  <h2 style='color:#10b981;'>Şifren Başarıyla Değiştirildi ✅</h2>
  <p>Merhaba ${username}, hesabının şifresi güncellendi.</p>
  <p style='font-weight:bold;color:#10b981;'>❤️ iNaturalist Lite Ekibi</p>
</div>`,
  };
}
