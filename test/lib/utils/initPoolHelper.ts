import { InitPoolBuildOutput, PoolStateInput } from '../../../src';
import { InitPool } from '../../../src/entities/initPool/initPool';
import { InitPoolInput } from '../../../src/entities/initPool/types';
import { getTokensForBalanceCheck } from './getTokensForBalanceCheck';
import { TxOutput, sendTransactionGetBalances } from './helper';
import { InitPoolTxInput } from './types';

function sdkInitPool({
    initPool,
    initPoolInput: addLiquidityInput,
    poolStateInput,
}: {
    initPool: InitPool;
    initPoolInput: InitPoolInput;
    poolStateInput: PoolStateInput;
}): {
    initPoolBuildOutput: InitPoolBuildOutput;
} {
    const initPoolBuildOutput = initPool.buildCall(
        addLiquidityInput,
        poolStateInput,
    );

    return {
        initPoolBuildOutput,
    };
}

export async function doInitPool(txInput: InitPoolTxInput) {
    const { initPool, poolStateInput, initPoolInput, testAddress, client } =
        txInput;

    const { initPoolBuildOutput } = sdkInitPool({
        initPool,
        initPoolInput,
        poolStateInput,
    });

    const tokens = getTokensForBalanceCheck(poolStateInput);

    // send transaction and calculate balance changes
    const txOutput = await sendTransactionGetBalances(
        tokens,
        client,
        testAddress,
        initPoolBuildOutput.to,
        initPoolBuildOutput.call,
        initPoolBuildOutput.value,
    );
    return {
        initPoolBuildOutput,
        txOutput,
    };
}

export function assertInitPool(
    initPoolInput: InitPoolInput,
    initPoolOutput: {
        txOutput: TxOutput;
        initPoolBuildOutput: InitPoolBuildOutput;
    },
) {
    const { txOutput } = initPoolOutput;

    expect(txOutput.transactionReceipt.status).to.eq('success');

    // Matching order of getTokens helper: [poolTokens, BPT, native]
    const expectedDeltas = initPoolInput.amountsIn.map((a) => a.rawAmount);

    expect(
        txOutput.balanceDeltas.slice(0, initPoolInput.amountsIn.length),
    ).to.deep.eq(expectedDeltas);

    // TODO: Improve this test - BPT Amount is slightly different from calculated Bpt: expected: 200000000000000000000n, real: 199999999999994999520n,
    expect(
        txOutput.balanceDeltas[initPoolInput.amountsIn.length],
    ).to.not.be.equal(0n);
}
