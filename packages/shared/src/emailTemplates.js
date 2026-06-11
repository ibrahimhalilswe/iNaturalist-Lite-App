function welcomeEmail(username) {
  return {
    subject: "iNaturalist Lite'a Hoş Geldin! 🌱",
    html: `
<div style='font-family:"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#374151;line-height:1.6;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px;'>
  <h2 style='color:#10b981;margin-bottom:16px;'>Merhaba ${username}! 👋</h2>
  <p style='font-size:16px;margin-bottom:24px;'>iNaturalist Lite'a katıldığın için teşekkür ederiz. Seni aramızda görmek harika!</p>
  <h3 style='color:#111827;font-size:18px;margin-bottom:12px;'>iNaturalist Lite ile yapabileceklerin:</h3>
  <ul style='padding-left:20px;margin-bottom:24px;'>
    <li style='margin-bottom:8px;'><b>Doğayı Keşfet:</b> Bitki fotoğraflarını çekip yapay zeka ile türlerini saniyeler içinde öğren.</li>
    <li style='margin-bottom:8px;'><b>Dijital Herbaryum Kur:</b> Kendi bitki koleksiyonunu oluşturup profilinde sergile.</li>
    <li style='margin-bottom:8px;'><b>Toplulukla Etkileşime Geç:</b> Diğer doğa severlerin keşiflerini incele, beğen ve yorum yap.</li>
  </ul>
  <p style='font-size:16px;font-weight:bold;color:#10b981;'>❤️ iNaturalist Lite Ekibi</p>
</div>`,
  };
}

function otpEmail(username, otp) {
  return {
    subject: 'iNaturalist Lite - Şifre Sıfırlama Kodu',
    html: `
<div style='font-family:"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#374151;line-height:1.6;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px;'>
  <h2 style='color:#10b981;margin-bottom:16px;'>Şifre Sıfırlama Kodu 🔐</h2>
  <p style='font-size:16px;margin-bottom:24px;'>Merhaba ${username}, hesabın için bir şifre sıfırlama talebi aldık.</p>
  <div style='background-color:#f3f4f6;padding:20px;border-radius:8px;text-align:center;margin-bottom:24px;'>
    <p style='font-size:14px;color:#6b7280;margin-bottom:8px;margin-top:0;'>Doğrulama Kodun:</p>
    <h2 style='font-size:36px;color:#10b981;letter-spacing:8px;margin:0;'>${otp}</h2>
  </div>
  <p style='font-size:14px;margin-bottom:24px;color:#4b5563;'>Bu kod <b>15 dakika</b> boyunca geçerlidir.</p>
  <p style='font-size:16px;font-weight:bold;color:#10b981;'>❤️ iNaturalist Lite Ekibi</p>
</div>`,
  };
}

function passwordChangedEmail(username) {
  return {
    subject: 'iNaturalist Lite - Şifreniz Değiştirildi',
    html: `
<div style='font-family:"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#374151;line-height:1.6;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px;'>
  <h2 style='color:#10b981;margin-bottom:16px;'>Şifren Başarıyla Değiştirildi ✅</h2>
  <p style='font-size:16px;margin-bottom:24px;'>Merhaba ${username}, hesabının şifresi az önce başarıyla güncellendi.</p>
  <div style='background-color:#fffbeb;border:1px solid #fde68a;padding:16px;border-radius:8px;margin-bottom:24px;'>
    <p style='font-size:14px;color:#92400e;margin:0;'><b>Güvenlik Uyarısı:</b> Bu değişikliği sen yapmadıysan lütfen bizimle iletişime geç.</p>
  </div>
  <p style='font-size:16px;font-weight:bold;color:#10b981;'>❤️ iNaturalist Lite Ekibi</p>
</div>`,
  };
}

module.exports = { welcomeEmail, otpEmail, passwordChangedEmail };
