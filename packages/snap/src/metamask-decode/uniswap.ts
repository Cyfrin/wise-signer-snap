import { Interface, TransactionDescription } from '@ethersproject/abi';
import { Hex } from '@metamask/utils';
import { addHexPrefix, stripHexPrefix } from 'ethereumjs-util';
import { UNISWAP_ROUTER_COMMANDS } from './uniswap-commands';

export const CHAIN_IDS = {
  MAINNET: '0x1',
  GOERLI: '0x5',
  LOCALHOST: '0x539',
  BSC: '0x38',
  BSC_TESTNET: '0x61',
  OPTIMISM: '0xa',
  OPTIMISM_TESTNET: '0xaa37dc',
  OPTIMISM_GOERLI: '0x1a4',
  BASE: '0x2105',
  BASE_TESTNET: '0x14a33',
  OPBNB: '0xcc',
  OPBNB_TESTNET: '0x15eb',
  POLYGON: '0x89',
  POLYGON_TESTNET: '0x13881',
  AVALANCHE: '0xa86a',
  AVALANCHE_TESTNET: '0xa869',
  FANTOM: '0xfa',
  FANTOM_TESTNET: '0xfa2',
  CELO: '0xa4ec',
  ARBITRUM: '0xa4b1',
  HARMONY: '0x63564c40',
  PALM: '0x2a15c308d',
  SEPOLIA: '0xaa36a7',
  HOLESKY: '0x4268',
  LINEA_GOERLI: '0xe704',
  LINEA_SEPOLIA: '0xe705',
  AMOY: '0x13882',
  BASE_SEPOLIA: '0x14a34',
  BLAST_SEPOLIA: '0xa0c71fd',
  OPTIMISM_SEPOLIA: '0xaa37dc',
  PALM_TESTNET: '0x2a15c3083',
  CELO_TESTNET: '0xaef3',
  ZK_SYNC_ERA_TESTNET: '0x12c',
  MANTA_SEPOLIA: '0x138b',
  UNICHAIN: '0x82',
  UNICHAIN_SEPOLIA: '0x515',
  LINEA_MAINNET: '0xe708',
  AURORA: '0x4e454152',
  MOONBEAM: '0x504',
  MOONBEAM_TESTNET: '0x507',
  MOONRIVER: '0x505',
  CRONOS: '0x19',
  GNOSIS: '0x64',
  ZKSYNC_ERA: '0x144',
  TEST_ETH: '0x539',
  ARBITRUM_GOERLI: '0x66eed',
  BLAST: '0x13e31',
  FILECOIN: '0x13a',
  POLYGON_ZKEVM: '0x44d',
  SCROLL: '0x82750',
  SCROLL_SEPOLIA: '0x8274f',
  WETHIO: '0x4e',
  CHZ: '0x15b38',
  NUMBERS: '0x290b',
  SEI: '0x531',
  APE_TESTNET: '0x8157',
  APE_MAINNET: '0x8173',
  BERACHAIN: '0x138d5',
  METACHAIN_ONE: '0x1b6e6',
  ARBITRUM_SEPOLIA: '0x66eee',
  NEAR: '0x18d',
  NEAR_TESTNET: '0x18e',
  B3: '0x208d',
  B3_TESTNET: '0x7c9',
  GRAVITY_ALPHA_MAINNET: '0x659',
  GRAVITY_ALPHA_TESTNET_SEPOLIA: '0x34c1',
  LISK: '0x46f',
  LISK_SEPOLIA: '0x106a',
  INK_SEPOLIA: '0xba5eD',
  INK: '0xdef1',
  GSYS_MAINNET: '0x407b',
  GSYS_TESTNET: '0xa5c8',
  MODE_SEPOLIA: '0x397',
  MODE: '0x868b',
  MEGAETH_TESTNET: '0x18c6',
  XRPLEVM_TESTNET: '0x161c28',
  LENS: '0xe8',
  PLUME: '0x18232',
  MATCHAIN: '0x2ba',
  FLOW: '0x2eb',
  MONAD_TESTNET: '0x279f',
} as const;

export type UniswapRouterCommand = {
  name: string;
  params: {
    name: string;
    type: string;
    description: string;

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any;
  }[];
};

export type UniswapPathPool = {
  firstAddress: Hex;
  tickSpacing: number;
  secondAddress: Hex;
};

const ADDRESS_LENGTH = 40;
const TICK_SPACING_LENGTH = 6;

export const UNISWAP_UNIVERSAL_ROUTER_ADDRESSES = {
  [CHAIN_IDS.ARBITRUM]: [
    '0x4C60051384bd2d3C01bfc845Cf5F4b44bcbE9de5',
    '0xeC8B0F7Ffe3ae75d7FfAb09429e3675bb63503e4',
    '0x5E325eDA8064b456f4781070C0738d849c824258',
  ],
  [CHAIN_IDS.AVALANCHE]: [
    '0x82635AF6146972cD6601161c4472ffe97237D292',
    '0x4Dae2f939ACf50408e13d58534Ff8c2776d45265',
  ],
  [CHAIN_IDS.BASE]: [
    '0xeC8B0F7Ffe3ae75d7FfAb09429e3675bb63503e4',
    '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
  ],
  [CHAIN_IDS.BSC]: [
    '0x5Dc88340E1c5c6366864Ee415d6034cadd1A9897',
    '0xeC8B0F7Ffe3ae75d7FfAb09429e3675bb63503e4',
    '0x4Dae2f939ACf50408e13d58534Ff8c2776d45265',
  ],
  [CHAIN_IDS.MAINNET]: [
    '0xEf1c6E67703c7BD7107eed8303Fbe6EC2554BF6B',
    '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
  ],
  [CHAIN_IDS.OPTIMISM]: [
    '0xb555edF5dcF85f42cEeF1f3630a52A108E55A654',
    '0xeC8B0F7Ffe3ae75d7FfAb09429e3675bb63503e4',
    '0xCb1355ff08Ab38bBCE60111F1bb2B784bE25D7e8',
  ],
  [CHAIN_IDS.POLYGON]: [
    '0x4C60051384bd2d3C01bfc845Cf5F4b44bcbE9de5',
    '0x643770E279d5D0733F21d6DC03A8efbABf3255B4',
    '0xec7BE89e9d109e7e3Fec59c222CF297125FEFda2',
  ],
  [CHAIN_IDS.SEPOLIA]: ['0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD'],
} as Record<string, string[]>;

const ABI = [
  {
    constant: true,
    inputs: [
      {
        name: 'commands',
        type: 'bytes',
      },
      {
        name: 'inputs',
        type: 'bytes[]',
      },
      {
        name: 'deadline',
        type: 'uint256',
      },
    ],
    name: 'execute',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: 'commands',
        type: 'bytes',
      },
      {
        name: 'inputs',
        type: 'bytes[]',
      },
    ],
    name: 'execute',
    type: 'function',
  },
];

export function decodeUniswapRouterTransactionData({
  transactionData,
  contractAddress,
  chainId,
}: {
  transactionData: string;
  contractAddress: string;
  chainId: string;
}): UniswapRouterCommand[] | undefined {
  const supportedAddresses = UNISWAP_UNIVERSAL_ROUTER_ADDRESSES[chainId];

  if (
    !supportedAddresses
      ?.map((address) => address.toLowerCase())
      .includes(contractAddress.toLowerCase())
  ) {
    return undefined;
  }

  const contractInterface = new Interface(ABI);

  let parsedTransactionData: TransactionDescription;

  try {
    parsedTransactionData = contractInterface.parseTransaction({
      data: transactionData,
    });
  } catch (error) {
    return undefined;
  }

  const commands = parsedTransactionData.args.commands as string;
  const inputs = parsedTransactionData.args.inputs as string[];
  const commandBytes = commands.slice(2).match(/.{1,2}/gu) as string[];

  return commandBytes
    .map((commandByte, i) => decodeUniswapCommand(commandByte, inputs[i]!))
    .filter((command) => command !== undefined) as UniswapRouterCommand[];
}

function decodeUniswapCommand(
  commandByte: string,
  input: string,
): UniswapRouterCommand | undefined {
  const commandValue = parseInt(commandByte, 16);
  // eslint-disable-next-line no-bitwise
  const commandIndex = commandValue & 0b11111;

  const data =
    UNISWAP_ROUTER_COMMANDS[
    String(commandIndex) as keyof typeof UNISWAP_ROUTER_COMMANDS
    ];

  if (!data) {
    return undefined;
  }

  const types = data.params.map((param) => param.type);
  const abiDecoder = Interface.getAbiCoder();
  const values = abiDecoder.decode(types, input);
  const { name } = data;

  const params = data.params.map((param, index) => {
    const { name: paramName, type, description } = param;
    const rawData = values[index];
    const value = paramName === 'path' ? decodeUniswapPath(rawData) : rawData;

    return { name: paramName, type, value, description };
  });

  return {
    name,
    params,
  };
}

function decodeUniswapPath(rawPath: string): UniswapPathPool[] {
  const pools: UniswapPathPool[] = [];
  let remainingData = stripHexPrefix(rawPath);
  let currentPool = {} as UniswapPathPool;
  let isParsingAddress = true;

  while (remainingData.length) {
    if (isParsingAddress) {
      const address = addHexPrefix(
        remainingData.slice(0, ADDRESS_LENGTH),
      ) as Hex;

      if (currentPool.firstAddress) {
        currentPool.secondAddress = address;

        pools.push(currentPool);

        currentPool = {
          firstAddress: address,
        } as UniswapPathPool;
      } else {
        currentPool.firstAddress = address;
      }

      remainingData = remainingData.slice(ADDRESS_LENGTH);
    } else {
      currentPool.tickSpacing = parseInt(
        remainingData.slice(0, TICK_SPACING_LENGTH),
        16,
      );

      remainingData = remainingData.slice(TICK_SPACING_LENGTH);
    }

    isParsingAddress = !isParsingAddress;
  }

  return pools;
}
