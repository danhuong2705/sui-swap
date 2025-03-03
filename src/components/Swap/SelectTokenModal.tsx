import Modal from 'antd/es/modal/Modal';
import styles from './SelectTokenModal.module.css';
import { suiAddressFull, tokens } from '@/constants';
import type { Token } from '@/types/token';
import { ArrowIcon } from '@/assets';
import { memo, useEffect, useState } from 'react';
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import type { CoinBalance } from '@mysten/sui/dist/cjs/client';
import BigNumber from 'bignumber.js';
import { formatDecimal, formatNumber } from '@/utils/number';
import type { CoinsToPrice } from 'aftermath-ts-sdk';
import { Aftermath } from 'aftermath-ts-sdk';

interface SelectTokenModalProps {
  selectedToken: Token;
  setSelectedToken: (token: Token) => void;
}

interface TokenBalance extends Token {
  balance: string;
  price: number;
}
const SelectTokenModal: React.FC<SelectTokenModalProps> = ({ selectedToken, setSelectedToken }) => {
  const account = useCurrentAccount();
  const afSdk = new Aftermath('MAINNET');

  const prices = afSdk.Prices();

  const { data: allBalances } = useSuiClientQuery('getAllBalances', {
    owner: account?.address || '',
  });
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [tokenPrices, setTokenPrices] = useState<CoinsToPrice>();

  useEffect(() => {
    afSdk.init();
    getCoinPriceInfo();
  }, []);

  useEffect(() => {
    const balances = tokens.map((token) => {
      const tokenBalance = allBalances
        ? allBalances.find((coinBalance: CoinBalance) => coinBalance.coinType === token.address)
            ?.totalBalance || 0
        : 0;
      let price = 0;
      if (tokenPrices) {
        if (token.symbol === 'SUI') {
          price = tokenPrices[suiAddressFull];
        } else {
          price = tokenPrices[token.address];
        }
      }
      return {
        ...token,
        price: price,
        balance: tokenBalance
          ? formatNumber(new BigNumber(tokenBalance).div(`1e${token.decimals}`).toNumber())
          : '0',
      };
    });
    setTokenBalances(balances);
  }, [allBalances, tokens, tokenPrices]);

  const getCoinPriceInfo = async () => {
    const coinTypes = tokens.map((token) => token.address);
    const tokenPrices = await prices.getCoinsToPrice({ coins: coinTypes });
    setTokenPrices(tokenPrices);
  };
  return (
    <>
      <div className={styles['token-selector']} onClick={() => setIsOpen(true)}>
        <img src={selectedToken.iconUrl} alt={selectedToken.symbol} />
        <div className={styles['symbol']}>{selectedToken.symbol}</div>
        <ArrowIcon />
      </div>
      <Modal
        title="Select a token"
        centered
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onCancel={() => setIsOpen(false)}
        footer={null}
      >
        <div className={styles['token-list']}>
          {tokenBalances.map((token) => (
            <div
              onClick={() => {
                setSelectedToken(token);
                setIsOpen(false);
              }}
              key={token.address}
              className={styles.token}
            >
              <div className={styles['token-info']}>
                <img src={token.iconUrl} alt={token.symbol} />
                <div>
                  <p className={styles['token-symbol']}>{token.symbol}</p>
                  <p className={styles['token-name']}>{token.name}</p>
                </div>
              </div>
              <div className={styles['token-balance-price']}>
                <div className={styles['token-balance']}>{token.balance}</div>
                <div className={styles['token-price']}>${formatDecimal(token.price, 2)}</div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
};

export default memo(SelectTokenModal);
