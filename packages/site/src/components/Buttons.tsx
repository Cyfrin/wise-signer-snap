import type { ComponentProps } from 'react';
import styled from 'styled-components';

import { ReactComponent as FlaskFox } from '../assets/flask_fox.svg';
import { useMetaMask, useRequestSnap, useMetaMaskContext } from '../hooks';
import { shouldDisplayReconnectButton } from '../utils';

const Link = styled.a`
  display: flex;
  align-self: flex-start;
  align-items: center;
  justify-content: center;
  font-size: ${(props) => props.theme.fontSizes.small};
  border-radius: ${(props) => props.theme.radii.button};
  border: 1px solid ${(props) => props.theme.colors.background?.inverse};
  background-color: ${(props) => props.theme.colors.background?.inverse};
  color: ${(props) => props.theme.colors.text?.inverse};
  text-decoration: none;
  font-weight: bold;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: transparent;
    border: 1px solid ${(props) => props.theme.colors.background?.inverse};
    color: ${(props) => props.theme.colors.text?.default};
  }

  ${({ theme }) => theme.mediaQueries.small} {
    width: 100%;
    box-sizing: border-box;
  }
`;

const Button = styled.button`
  display: flex;
  align-self: flex-start;
  align-items: center;
  justify-content: center;
  margin-top: auto;
  ${({ theme }) => theme.mediaQueries.small} {
    width: 100%;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #666;
    color: #999;
  }
`;

const ButtonText = styled.span`
  margin-left: 1rem;
`;

const ConnectedContainer = styled.div`
  display: flex;
  align-self: flex-start;
  align-items: center;
  justify-content: center;
  font-size: ${(props) => props.theme.fontSizes.small};
  border-radius: ${(props) => props.theme.radii.button};
  border: 1px solid ${(props) => props.theme.colors.background?.inverse};
  background-color: ${(props) => props.theme.colors.background?.inverse};
  color: ${(props) => props.theme.colors.text?.inverse};
  font-weight: bold;
  padding: 1.2rem;
`;

const ConnectedIndicator = styled.div`
  content: ' ';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: green;
`;

export const InstallFlaskButton = () => (
  <Link href="https://metamask.io/flask/" target="_blank">
    <FlaskFox />
    <ButtonText>Install MetaMask Flask</ButtonText>
  </Link>
);

export const ConnectButton = (props: ComponentProps<typeof Button>) => {
  return (
    <Button {...props}>
      <FlaskFox />
      <ButtonText>Connect</ButtonText>
    </Button>
  );
};

export const ReconnectButton = (props: ComponentProps<typeof Button>) => {
  return (
    <Button {...props}>
      <FlaskFox />
      <ButtonText>Reconnect</ButtonText>
    </Button>
  );
};

export const SendWETHButton = (props: ComponentProps<typeof Button>) => {
  const { provider } = useMetaMaskContext();

  const handleSendWETH = async () => {
    try {
      // First ensure we have account access
      const accounts = (await provider?.request({
        method: 'eth_requestAccounts',
      })) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available');
      }

      // Transaction parameters
      const transactionParams = {
        to: '0xdd13E55209Fd76AfE204dBda4007C227904f0a81', // WETH contract on Sepolia
        from: accounts[0],
        data: '0xa9059cbb000000000000000000000000321c020bb4d7eda179122870e99688dff6b9914b000000000000000000000000000000000000000000000000000000e8d4a51000',
        // data: '0x6a761202000000000000000000000000c3b8167c303fef6968d48e09d270ff19a33d72f1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c3b8167c303fef6968d48e09d270ff19a33d72f1000000000000000000000000c3b8167c303fef6968d48e09d270ff19a33d72f100000000000000000000000000000000000000000000000000000000000001c00000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000c3b8167c303fef6968d48e09d270ff19a33d72f10000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000',
        value: '0x0', // No ETH value being sent, just calling contract function
        // Let MetaMask estimate gas automatically by not specifying gas/gasPrice
      };

      console.log('Sending WETH transaction with params:', transactionParams);

      // Send the transaction
      const txHash = (await provider?.request({
        method: 'eth_sendTransaction',
        params: [transactionParams],
      })) as string;

      console.log('WETH Transaction sent! Hash:', txHash);

      // Optionally show success message to user
      alert(`WETH transaction sent successfully! Transaction hash: ${txHash}`);
    } catch (error: any) {
      console.error('Error sending WETH transaction:', error);
    }
  };

  return (
    <Button {...props} onClick={handleSendWETH}>
      Send WETH (Sepolia)
    </Button>
  );
};

export const SupplyZKButton = (props: ComponentProps<typeof Button>) => {
  const { provider } = useMetaMaskContext();

  const handleSupplyZK = async () => {
    try {
      // First ensure we have account access
      const accounts = (await provider?.request({
        method: 'eth_requestAccounts',
      })) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available');
      }

      // Transaction parameters for supply function
      // supply(asset, amount, onBehalfOf, referralCode)

      // This would be a goodish one...
      // const transactionParams = {
      //   to: '0x78e30497a3c7527d953c6B1E3541b021A98Ac43c', // Lending protocol contract
      //   from: accounts[0],
      //   data: `0x617ba037000000000000000000000000005A7d6b2F92C77FAD6CCaBd7EE0624E64907Eaf3E0000000000000000000000000000000000000000000000002bc48b15b8b58000000000000000000000000000${accounts[0]?.slice(
      //     2,
      //   )}0000000000000000000000000000000000000000000000000000000000000000`, // supply(asset=ZK token, amount=50 ZK, onBehalfOf=user, referralCode=0)
      //   value: '0x0',
      // };

      const transactionParams = {
        to: '0x78e30497a3c7527d953c6B1E3541b021A98Ac43c', // Lending protocol contract
        from: accounts[0],
        data: '0x617ba037000000000000000000000000005a7d6b2f92c77fad6ccabd7ee0624e64907eaf0000000000000000000000000000000000000000000000056bc75e2d6310000000000000000000000000000047666fab8bd0ac7003bce3f5c3585383f09486e20000000000000000000000000000000000000000000000000000000000000000',
        value: '0x0', // No ETH value being sent, just calling contract function
      }

      console.log(
        'Sending supply ZK transaction with params:',
        transactionParams,
      );

      // Send the transaction
      const txHash = (await provider?.request({
        method: 'eth_sendTransaction',
        params: [transactionParams],
      })) as string;

      console.log('Supply ZK Transaction sent! Hash:', txHash);

      // Show success message to user
      alert(
        `Supply ZK transaction sent successfully! Transaction hash: ${txHash}`,
      );
    } catch (error: any) {
      console.error('Error sending supply ZK transaction:', error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <Button {...props} onClick={handleSupplyZK}>
      Supply ZK (ZKSync Era)
    </Button>
  );
};

export const BatchSendWETHButton = (props: ComponentProps<typeof Button>) => {
  const { provider } = useMetaMaskContext();

  const handleBatchSendWETH = async () => {
    try {
      // First ensure we have account access
      const accounts = (await provider?.request({
        method: 'eth_requestAccounts',
      })) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available');
      }

      // Get current chain ID
      const chainId = (await provider?.request({
        method: 'eth_chainId',
      })) as string;
      console.log('Current Chain ID:', chainId);

      // Based on the example JSON provided - approve + supply batch transaction
      const batchTransactionParams = {
        version: '2.0.0',
        from: accounts[0],
        chainId,
        atomicRequired: true,
        calls: [
          {
            // First transaction: Approve WETH for the lending protocol
            to: '0x5A7d6b2F92C77FAD6CCaBd7EE0624E64907Eaf3E', // WETH token contract
            value: '0x0',
            data: '0x095ea7b300000000000000000000000078e30497a3c7527d953c6B1E3541b021A98Ac43c0000000000000000000000000000000000000000000000002bc48b15b8b58000', // approve(spender, 50 WETH)
          },
          {
            // Second transaction: Supply WETH to the lending protocol
            to: '0x78e30497a3c7527d953c6B1E3541b021A98Ac43c', // Lending protocol contract
            value: '0x0',
            data: '0x617ba037000000000000000000000000005A7d6b2F92C77FAD6CCaBd7EE0624E64907Eaf3E0000000000000000000000000000000000000000000000002bc48b15b8b580000000000000000000000000009467919138E36f0252886519f34a0f8016dDb3a30000000000000000000000000000000000000000000000000000000000000000', // supply(asset, amount, onBehalfOf, referralCode)
          },
        ],
      };

      console.log(
        'Sending batch WETH transaction with params:',
        batchTransactionParams,
      );

      // Send the batch transaction using wallet_sendCalls
      const batchResult = (await provider?.request({
        method: 'wallet_sendCalls',
        params: [batchTransactionParams],
      })) as any;

      console.log('Batch WETH Transaction submitted! Batch ID:', batchResult);

      // Track the batch status
      const batchId = batchResult?.id;

      // Poll for batch status (you might want to implement a more sophisticated polling mechanism)
      const checkBatchStatus = async () => {
        try {
          const status = (await provider?.request({
            method: 'wallet_getCallsStatus',
            params: [batchId],
          })) as any;

          console.log('Batch status:', status);

          if (status?.status === 200) {
            alert(
              `Batch WETH transaction completed successfully! Batch ID: ${batchId}`,
            );
          } else if (status?.status === 400) {
            alert(`Batch WETH transaction failed. Batch ID: ${batchId}`);
          } else {
            // Still pending, check again in 2 seconds
            setTimeout(checkBatchStatus, 2000);
          }
        } catch (error) {
          console.error('Error checking batch status:', error);
        }
      };

      // Start status polling
      setTimeout(checkBatchStatus, 1000);

      alert(
        `Batch WETH transaction submitted! Batch ID: ${batchId}\nTracking status...`,
      );
    } catch (error: any) {
      console.error('Error sending batch WETH transaction:', error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <Button {...props} onClick={handleBatchSendWETH} disabled>
      Batch Send WETH (EIP-7702) - Not Supported
    </Button>
  );
};

export const SignEIP712Button = (props: ComponentProps<typeof Button>) => {
  const { provider } = useMetaMaskContext();

  const handleSignClick = async () => {
    try {
      // Get current chain ID
      const chainId = (await provider?.request({
        method: 'eth_chainId',
      })) as string;
      console.log('Current Chain ID:', chainId);

      // Convert hex chain ID to decimal string for EIP-712 domain
      const chainIdDecimal = parseInt(chainId, 16).toString();

      const msgParams = {
        types: {
          SafeTx: [
            { type: 'address', name: 'to' },
            { type: 'uint256', name: 'value' },
            { type: 'bytes', name: 'data' },
            { type: 'uint8', name: 'operation' },
            { type: 'uint256', name: 'safeTxGas' },
            { type: 'uint256', name: 'baseGas' },
            { type: 'uint256', name: 'gasPrice' },
            { type: 'address', name: 'gasToken' },
            { type: 'address', name: 'refundReceiver' },
            { type: 'uint256', name: 'nonce' },
          ],
          EIP712Domain: [
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
        },
        domain: {
          chainId: chainIdDecimal, // Use dynamic chain ID
          verifyingContract: '0x4087d2046A7435911fC26DCFac1c2Db26957Ab72',
        },
        primaryType: 'SafeTx',
        message: {
          to: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
          value: '0',
          data: '0xa9059cbb000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000de0b6b3a7640000',
          operation: '0',
          safeTxGas: '0',
          baseGas: '0',
          gasPrice: '0',
          gasToken: '0x0000000000000000000000000000000000000000',
          refundReceiver: '0x0000000000000000000000000000000000000000',
          nonce: '29',
        },
      };

      const accounts = (await provider?.request({
        method: 'eth_requestAccounts',
      })) as string[];
      const result = await provider?.request({
        method: 'eth_signTypedData_v4',
        params: [accounts[0], JSON.stringify(msgParams)],
      });

      console.log('EIP-712 Signature:', result);
    } catch (error) {
      console.error('Error signing message:', error);
    }
  };

  return (
    <Button {...props} onClick={handleSignClick}>
      Sign EIP-712 Message
    </Button>
  );
};

export const HeaderButtons = () => {
  const requestSnap = useRequestSnap();
  const { isFlask, installedSnap } = useMetaMask();

  if (!isFlask && !installedSnap) {
    return <InstallFlaskButton />;
  }

  if (!installedSnap) {
    return <ConnectButton onClick={requestSnap} />;
  }

  if (shouldDisplayReconnectButton(installedSnap)) {
    return <ReconnectButton onClick={requestSnap} />;
  }

  return (
    <ConnectedContainer>
      <ConnectedIndicator />
      <ButtonText>Connected</ButtonText>
    </ConnectedContainer>
  );
};
