import { ConnectButton, useAutoConnectWallet } from '@mysten/dapp-kit';
import styles from './Header.module.css';
import '@mysten/dapp-kit/dist/index.css';
import { memo } from 'react';
const Header = () => {
  useAutoConnectWallet();
  return (
    <header className={styles['header']}>
      <div></div>
      <ConnectButton />
    </header>
  );
};

export default memo(Header);
