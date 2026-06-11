const MONTHS_TR = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
];

const MONTHS_LONG_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export const formatDateShort = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return `${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatDateLong = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return `${d.getDate()} ${MONTHS_LONG_TR[d.getMonth()]} ${d.getFullYear()}`;
};

export const timeAgo = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Az önce';
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} sa önce`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} gün önce`;
  return formatDateShort(dateStr);
};
