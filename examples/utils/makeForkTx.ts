import { CHAINS, PoolStateInput } from '../../src';
import {
    createTestClient,
    http,
    publicActions,
    walletActions,
    Address,
    Hex,
} from 'viem';
import {
    forkSetup,
    sendTransactionGetBalances,
} from '../../test/lib/utils/helper';

type Tx = {
    to: Address;
    call: Hex;
    value: bigint;
};

type ForkToken = {
    address: Address;
    slot: number;
    rawBalance: bigint;
};

/**
 * Sets balances for forkTokens, send tx to Anvil fork and print pool token deltas for account
 * @param tx
 * @param impersonateAccount
 * @param rpcUrl
 * @param poolStateInput
 * @param forkTokens
 */
export async function makeForkTx(
    tx: Tx,
    forkConfig: {
        rpcUrl: string;
        chainId: number;
        impersonateAccount: Address;
        forkTokens: ForkToken[];
    },
    poolStateInput: PoolStateInput,
) {
    const client = createTestClient({
        mode: 'anvil',
        chain: CHAINS[forkConfig.chainId],
        transport: http(forkConfig.rpcUrl),
    })
        .extend(publicActions)
        .extend(walletActions);

    await forkSetup(
        client,
        forkConfig.impersonateAccount,
        forkConfig.forkTokens.map((t) => t.address),
        forkConfig.forkTokens.map((t) => t.slot),
        forkConfig.forkTokens.map((t) => t.rawBalance),
    );

    console.log('\nSending tx...');

    const tokensForBalanceCheck = [
        ...poolStateInput.tokens.map(({ address }) => address),
        poolStateInput.address,
    ];
    const { transactionReceipt, balanceDeltas } =
        await sendTransactionGetBalances(
            tokensForBalanceCheck,
            client,
            forkConfig.impersonateAccount,
            tx.to,
            tx.call,
            tx.value,
        );
    if (transactionReceipt.status === 'reverted')
        throw Error('Transaction reverted');

    console.log('Token balance deltas:');
    tokensForBalanceCheck.forEach((t, i) => {
        console.log(`${t} ${balanceDeltas[i]}`);
    });
}
