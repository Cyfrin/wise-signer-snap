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
      const accounts = await provider?.request({ method: 'eth_requestAccounts' }) as string[];

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
      const txHash = await provider?.request({
        method: 'eth_sendTransaction',
        params: [transactionParams],
      }) as string;

      console.log('WETH Transaction sent! Hash:', txHash);

      // Optionally show success message to user
      alert(`WETH transaction sent successfully! Transaction hash: ${txHash}`);

    } catch (error: any) {
      console.error('Error sending WETH transaction:', error);
    }
  };

  return (
    <Button {...props} onClick={handleSendWETH}>
      Send WETH
    </Button>
  );
};

export const SignEIP712Button = (props: ComponentProps<typeof Button>) => {
  const { provider } = useMetaMaskContext();

  const handleSignClick = async () => {
    try {
      // Get current chain ID
      const chainId = await provider?.request({ method: 'eth_chainId' }) as string;
      console.log('Current Chain ID:', chainId);

      // Convert hex chain ID to decimal string for EIP-712 domain
      const chainIdDecimal = parseInt(chainId, 16).toString();

      const msgParams = {
        types: {
          SafeTx: [
            { type: "address", name: "to" },
            { type: "uint256", name: "value" },
            { type: "bytes", name: "data" },
            { type: "uint8", name: "operation" },
            { type: "uint256", name: "safeTxGas" },
            { type: "uint256", name: "baseGas" },
            { type: "uint256", name: "gasPrice" },
            { type: "address", name: "gasToken" },
            { type: "address", name: "refundReceiver" },
            { type: "uint256", name: "nonce" }
          ],
          EIP712Domain: [
            { name: "chainId", type: "uint256" },
            { name: "verifyingContract", type: "address" }
          ]
        },
        domain: {
          chainId: chainIdDecimal, // Use dynamic chain ID
          verifyingContract: "0x4087d2046A7435911fC26DCFac1c2Db26957Ab72"
        },
        primaryType: "SafeTx",
        message: {
          to: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
          value: "0",
          data: "0xa9059cbb000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000de0b6b3a7640000",
          operation: "0",
          safeTxGas: "0",
          baseGas: "0",
          gasPrice: "0",
          gasToken: "0x0000000000000000000000000000000000000000",
          refundReceiver: "0x0000000000000000000000000000000000000000",
          nonce: "29"
        }
      };

      const accounts = await provider?.request({ method: 'eth_requestAccounts' }) as string[];
      const result = await provider?.request({
        method: 'eth_signTypedData_v4',
        params: [accounts[0], JSON.stringify(msgParams)],
      });

      console.log('EIP-712 Signature:', result);
    } catch (error) {
      console.error('Error signing message:', error);
    }
  };

  return <Button {...props} onClick={handleSignClick}>Sign EIP-712 Message</Button>;
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
