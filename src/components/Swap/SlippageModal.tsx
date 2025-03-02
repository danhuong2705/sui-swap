import { memo, useState } from 'react';
import { Modal } from 'antd';
import { SettingIcon } from '@/assets';
import styles from './SlippageModal.module.css';

interface SlippageModalProps {
  slippage: number;
  setSlippage: (slippage: number) => void;
}

const slippageOptions = [0.1, 0.5, 1, 2];
const SlippageModal: React.FC<SlippageModalProps> = ({ slippage, setSlippage }) => {
  const [open, setOpen] = useState(false);
  const [currentSlippage, setCurrentSlippage] = useState<string>(slippage.toString());

  return (
    <>
      <div className={styles['slippage-setting']} onClick={() => setOpen(true)}>
        <SettingIcon />
      </div>
      <Modal
        onClose={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        centered
        open={open}
        title={'Slippage tolerance'}
        footer={[]}
      >
        <div className={styles.content}>
          <div className={styles.options}>
            {slippageOptions.map((option) => (
              <div
                key={option}
                className={`${styles['quick-option']} ${slippage == option ? styles['active'] : ''}`}
                onClick={() => {
                  setSlippage(option);
                  setCurrentSlippage(option.toString());
                }}
              >
                {option}%
              </div>
            ))}
            <div className={styles['inputWrapper']}>
              <input
                value={currentSlippage}
                placeholder="Custom"
                spellCheck={false}
                onChange={(event) => {
                  if (!event.target.value) {
                    setCurrentSlippage('');
                    setSlippage(2);
                  }
                  // Only allow numbers and one decimal point
                  else if (/^\d*\.?\d*$/.test(event.target.value)) {
                    setSlippage(Number(event.target.value));
                    setCurrentSlippage(event.target.value);
                  }
                }}
              />
              <span>%</span>
            </div>
          </div>
          {Number(slippage) > 50 && (
            <div className={styles['warning']}>
              Beware that using over 50% slippage is risky. It means that you are willing to accept
              a price movement of over 50% once your order is executed.
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default memo(SlippageModal);
