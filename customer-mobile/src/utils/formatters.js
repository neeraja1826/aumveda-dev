export function formatCurrency(value) {
  const amount = Number(value) || 0;

  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}