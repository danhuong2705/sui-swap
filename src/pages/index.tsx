import Head from 'next/head';
import { Inter } from 'next/font/google';
import styles from '@/styles/Home.module.css';
import { SwapArrowIcon, WalletIcon } from '@/assets';
import { useEffect, useState } from 'react';
import type { Token } from '@/types/token';
import { tokens } from '@/constants';
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClientQuery,
} from '@mysten/dapp-kit';
import BigNumber from 'bignumber.js';
import type { RouterCompleteTradeRoute } from 'aftermath-ts-sdk';
import { Aftermath } from 'aftermath-ts-sdk';
import { message, Skeleton, Spin } from 'antd';
import SlippageModal from '@/components/Swap/SlippageModal';
import SelectTokenModal from '@/components/Swap/SelectTokenModal';
import { formatDecimal, formatNumber, getRawValue } from '@/utils/number';
import useDebounce from '@/hooks/useDebounce';
import { LoadingOutlined } from '@ant-design/icons';
import InputAmount from '@/components/Swap/InputAmount';
const inter = Inter({ subsets: ['latin'] });

export default function Home() {
  const afSdk = new Aftermath('MAINNET');
  const router = afSdk.Router();
  const account = useCurrentAccount();

  const [messageApi, contextHolder] = message.useMessage();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [selectedFromToken, setSelectedFromToken] = useState<Token>(tokens[0]);
  const [selectedToToken, setSelectedToToken] = useState<Token>(tokens[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const { data: fromTokenBalance, refetch: refetchFromTokenBalance } = useSuiClientQuery(
    'getBalance',
    {
      owner: account?.address || '',
      coinType: selectedFromToken?.address,
    },
  );
  const { data: toTokenBalance, refetch: refetchToTokenBalance } = useSuiClientQuery('getBalance', {
    owner: account?.address || '',
    coinType: selectedToToken?.address,
  });
  const [loadingFromTokenAmount, setLoadingFromTokenAmount] = useState(false);
  const [loadingToTokenAmount, setLoadingToTokenAmount] = useState(false);
  const [route, setRoute] = useState<RouterCompleteTradeRoute | null>();
  const disableSwap =
    selectedFromToken.address === selectedToToken.address ||
    isLoading ||
    !account ||
    !selectedFromToken ||
    !selectedToToken ||
    !fromAmount ||
    !toAmount ||
    !route;

  useEffect(() => {
    afSdk.init();
  }, []);

  useEffect(() => {
    setFromAmount('');
    setToAmount('');
    setRoute(null);
  }, [selectedFromToken, selectedToToken]);

  const getToTokenAmount = async (fromAmount: string) => {
    if (!account) {
      return;
    }
    if (isNaN(new BigNumber(fromAmount).toNumber())) {
      return;
    }
    try {
      setLoadingToTokenAmount(true);
      const route = await router.getCompleteTradeRouteGivenAmountIn({
        coinInType: selectedFromToken.address,
        coinOutType: selectedToToken.address,
        coinInAmount: BigInt(
          new BigNumber(getRawValue(fromAmount))
            .times(`1e${selectedFromToken.decimals}`)
            .toString(),
        ),
      });
      setRoute(route);
      setToAmount(
        new BigNumber(route.coinOut.amount.toString())
          .div(`1e${selectedToToken.decimals}`)
          .toString(),
      );
    } catch (error) {
      setToAmount('');
    } finally {
      setLoadingToTokenAmount(false);
    }
  };

  const getFromTokenAmount = async (toAmount: string) => {
    if (!account) {
      return;
    }
    if (isNaN(new BigNumber(toAmount).toNumber())) {
      return;
    }
    try {
      setLoadingFromTokenAmount(true);
      const route = await router.getCompleteTradeRouteGivenAmountOut({
        coinInType: selectedFromToken.address,
        coinOutType: selectedToToken.address,
        coinOutAmount: BigInt(
          new BigNumber(getRawValue(toAmount)).times(`1e${selectedToToken.decimals}`).toString(),
        ),
        slippage: slippage,
      });
      setRoute(route);
      setFromAmount(
        new BigNumber(route.coinIn.amount.toString())
          .div(`1e${selectedFromToken.decimals}`)
          .toString(),
      );
    } catch (error) {
      setFromAmount('');
    } finally {
      setLoadingFromTokenAmount(false);
    }
  };
  const debouncedGetToTokenAmount = useDebounce(getToTokenAmount, 500);
  const debouncedGetFromTokenAmount = useDebounce(getFromTokenAmount, 500);

  const handleFromAmountChange = (amount: string) => {
    setFromAmount(amount);
    if (!amount) return;
    debouncedGetToTokenAmount(amount);
  };

  const handleToAmountChange = (amount: string) => {
    setToAmount(amount);
    if (!amount) return;
    debouncedGetFromTokenAmount(amount);
  };
  const handleSwap = async () => {
    if (!account || !route) {
      return;
    }
    if (
      new BigNumber(fromAmount).isGreaterThan(
        new BigNumber(fromTokenBalance?.totalBalance || 0).div(`1e${selectedFromToken.decimals}`),
      )
    ) {
      messageApi.error('Insufficient balance');
      return;
    }
    if (isLoading) return;
    try {
      setIsLoading(true);
      const tx = await router.getTransactionForCompleteTradeRoute({
        walletAddress: account.address,
        completeRoute: route,
        slippage: slippage,
      });

      signAndExecuteTransaction(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            reset();
            messageApi.success('Swap success!');
          },
          onError: (error) => {
            console.error(error);
            messageApi.error('Swap failed!');
          },
        },
      );
    } catch (error) {
      console.error(error);
      messageApi.error('Swap failed!');
    } finally {
      setIsLoading(false);
    }
  };

  const swapToken = () => {
    const temp = selectedFromToken;
    setSelectedFromToken(selectedToToken);
    setSelectedToToken(temp);
    setFromAmount('');
    setToAmount('');
  };
  const reset = () => {
    refetchFromTokenBalance();
    refetchToTokenBalance();
    setFromAmount('');
    setToAmount('');
  };
  return (
    <>
      <Head>
        <title>SWAP</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${styles.main} ${inter.className}`}>
        <div className={styles['setting-wrapper']}>
          <div className={styles['title']}>SWAP</div>
          <SlippageModal setSlippage={setSlippage} slippage={slippage} />
        </div>
        <div className={styles['panel']}>
          {/*From Token block */}
          <div className={styles['token-block']}>
            <div className={styles['label-row']}>
              <div className={styles['label']}>You Pay</div>
              <div className={styles['quick-actions']}>
                <div
                  className={styles['action']}
                  onClick={() => {
                    const userBalance = new BigNumber(fromTokenBalance?.totalBalance || 0)
                      .div(`1e${selectedFromToken.decimals}`)
                      .toString();
                    setFromAmount(formatNumber(new BigNumber(userBalance).div(2).toString()));
                    getToTokenAmount(userBalance);
                  }}
                >
                  Half
                </div>
                <div
                  className={styles['action']}
                  onClick={() => {
                    const userBalance = new BigNumber(fromTokenBalance?.totalBalance || 0)
                      .div(`1e${selectedFromToken.decimals}`)
                      .toString();
                    setFromAmount(formatNumber(userBalance));
                    getToTokenAmount(userBalance);
                  }}
                >
                  MAX
                </div>
              </div>
            </div>
            <div className={styles['input-row']}>
              {loadingFromTokenAmount ? (
                <Skeleton.Input active size="default" />
              ) : (
                <InputAmount
                  amount={fromAmount}
                  onAmountChange={(amount: string) => handleFromAmountChange(amount)}
                />
              )}
              <SelectTokenModal
                selectedToken={selectedFromToken}
                setSelectedToken={setSelectedFromToken}
              />
            </div>
            <div className={styles.balance}>
              <WalletIcon />{' '}
              {fromTokenBalance?.totalBalance
                ? +formatDecimal(
                    new BigNumber(fromTokenBalance?.totalBalance)
                      .div(`1e${selectedFromToken.decimals}`)
                      .toNumber(),
                    4,
                  )
                : '0'}
            </div>
          </div>
          <div className={styles['swap-arrow']} onClick={swapToken}>
            <SwapArrowIcon />
          </div>
          {/* To Token block */}

          <div className={styles['token-block']}>
            <div className={styles['label-row']}>
              <div className={styles['label']}>You Receive</div>
            </div>
            <div className={styles['input-row']}>
              {loadingToTokenAmount ? (
                <Skeleton.Input active size="default" />
              ) : (
                <InputAmount
                  amount={toAmount}
                  onAmountChange={(amount: string) => handleToAmountChange(amount)}
                />
              )}
              <SelectTokenModal
                selectedToken={selectedToToken}
                setSelectedToken={setSelectedToToken}
              />
            </div>
            <div className={styles['balance']}>
              <WalletIcon />{' '}
              {toTokenBalance?.totalBalance
                ? +formatDecimal(
                    new BigNumber(toTokenBalance?.totalBalance)
                      .div(`1e${selectedToToken.decimals}`)
                      .toNumber(),
                    4,
                  )
                : '0'}
            </div>
          </div>

          {account ? (
            <button disabled={disableSwap} className={styles['swap-button']} onClick={handleSwap}>
              {isLoading ? <Spin indicator={<LoadingOutlined spin />} size="small" /> : 'Swap'}
            </button>
          ) : (
            <ConnectButton className={styles['connect-btn']} />
          )}
        </div>
      </main>
      {contextHolder}
    </>
  );
}
