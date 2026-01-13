export const formatNumber = ( num:number ) => {
  return num < 10 ? '0' + num : num; // Add leading zero if less than 10
}

export const getCurrentDateTimeFormatted: any = () => {
  const now = new Date(); // Get current date and time

  const day = formatNumber(now.getDate());
  const month = formatNumber(now.getMonth() + 1); // getMonth() is 0-indexed (0=Jan)
  const year = now.getFullYear();

  const hours = formatNumber(now.getHours());
  const minutes = formatNumber(now.getMinutes());
  const seconds = formatNumber(now.getSeconds());

  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}