function validateRegisterInput({ username, email, password }) {
  if (!username?.trim() || !email?.trim() || !password)
    return 'Kullanıcı adı, e-posta ve şifre gerekli.';
  if (password.length < 6)
    return 'Şifre en az 6 karakter olmalı.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return 'Geçersiz e-posta adresi.';
  return null;
}

function validatePassword(password) {
  if (!password || password.length < 6)
    return 'Şifre en az 6 karakter olmalı.';
  return null;
}

module.exports = { validateRegisterInput, validatePassword };
