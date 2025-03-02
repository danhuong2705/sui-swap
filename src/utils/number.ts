import BigNumber from 'bignumber.js';

export const formatNumber = (num: string | number) => {
  const number = num.toString();
  const [integer, decimal] = number.split('.');
  const integerWithCommas = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimal || number.includes('.') ? `${integerWithCommas}.${decimal}` : integerWithCommas;
};

export const formatDecimal = (num: string | number, decimal: number) => {
  return new BigNumber(num).toFormat(decimal);
};
export const getRawValue = (value: string) => {
  return value.replace(/,/g, ''); // Loại bỏ dấu `,` khi lấy giá trị
};
