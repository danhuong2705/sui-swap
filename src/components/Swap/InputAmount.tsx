import styles from '@/styles/Home.module.css';
import { memo } from 'react';

interface InputAmountProps {
  amount: string;
  onAmountChange: (amount: string) => void;
}
const InputAmount: React.FC<InputAmountProps> = ({ amount, onAmountChange }) => {
  const handleChangeToTokenAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
      onAmountChange(e.target.value);
      return;
    }
    if (!/^\d+(,\d+)*\.?\d*$/.test(e.target.value)) {
      return;
    }
    const rawValue = e.target.value.replace(/,/g, ''); // Xóa dấu phẩy khi nhập lại
    onAmountChange(rawValue);
  };
  return (
    <input
      className={styles['input']}
      value={amount}
      placeholder="0.0"
      onChange={handleChangeToTokenAmount}
    />
  );
};

export default memo(InputAmount);
