// Typescript typing is more flexible than graphql, some models are more verbose than needed
// to ensure compatability with graphql schema limitations

type ID = string;
type Address = string;
type Integer = number;
type Decimal = string;

enum BalancerNetwork {
  MAINNET = "1",
  ARBITRUM = "42161",
  POLYGON = "137",
}

enum BalancerPoolType {
  ComposableStablePool = "ComposableStablePool",
  WeightedPool = "WeightedPool",
  LinearPool = "LinearPool",
  LiquidityBootstrappingPool = "LiquidityBootstrappingPool",
}

enum BalancerVaultVersion {
  TWO = "TWO",
}

enum BalancerPoolOwnerType {
  DAO = "DAO",
  ZERO_ADDRESS = "ZERO_ADDRESS",
  EXTERNAL = "EXTERNAL",
}

enum BalancerPoolJoinType {
  PROPORTIONAL = "PROPORTIONAL",
  SINGLE_ASSET = "SINGLE_ASSET",
  ANY_TOKENS = "ANY_TOKENS",
}

enum BalancerWithdrawType {
  PROPORTIONAL = "PROPORTIONAL",
  SINGLE_ASSET = "SINGLE_ASSET",
  ANY_TOKENS = "ANY_TOKENS",
}

enum BalancerPoolTokenType {
  // this type would need to be built in a way that there is no overlaps,
  // ie: a token cannot have more than one type. Could be a better name than "type"
  STABLE_BPT = "STABLE_BPT",
  LINEAR_BPT = "LINEAR_BPT",
  WETH = "WETH",
  STANDARD = "STANDARD", // could be a better name here, a token that is not a nested bpt
}

interface BalancerPool {
  id: ID; // ID will become address in v2.1/3, but still needed for backwards compatability
  address: Address;
  chain: BalancerNetwork;
  vault: Address;
  vaultVersion: BalancerVaultVersion;
  poolType: BalancerPoolType;
  poolTypeVersion: number;
  name: string;
  symbol: string;
  decimals: number;
  owner: BalancerPoolOwnerType;
  ownerAddress: Address;
  factory?: Address;
  createTime: number;
  joinConfig: BalancerPoolJoinConfig;
  exitConfig: any; //TODO: similar to join, but for exit

  totalShares: BigInt;
  holdersCount: BigInt;
  swapsCount: BigInt;
  swapFee: BigInt;
  swapsEnabled: boolean;
  inRecoveryMode: boolean;

  usdData: BalancerPoolDataUSD;
  apr: BalancerPoolApr;

  // tokens
  tokens: BalancerPoolToken[];
}

interface BalancerPoolToken {
  address: String;
  balance: BigInt;
  decimals: Integer;
  name: string;
  symbol: string;
  index: Integer;
  totalBalance: BigInt; //the total balance in the pool, regardless of nesting

  // identifies the token as WETH, nested stable BPT, nested linear BPT or "standard"
  type: BalancerPoolTokenType;
}

interface BalancerWeightedPoolToken extends BalancerPoolToken {
  weight: BigInt;
}

interface BalancerStablePoolToken extends BalancerPoolToken {
  priceRate: BigInt;
}

// USD data is data that changes at a high frequency and needs to be refetched often
interface BalancerPoolDataUSD {
  id: ID;
  poolId: ID;

  totalLiquidityUSD: Decimal;
  volume24hUSD: Decimal;
  swapFees24hUSD: Decimal;
  yieldCapture24hUSD: Decimal;

  totalShares24hAgo: BigInt;
  totalLiquidityUSD24hAgo: Decimal;
  volume48hUSD: Decimal;
  swapFees48hUSD: Decimal;
  yieldCapture48hUSD: Decimal;
}

interface BalancerPoolJoinConfig {
  supportedTypes: BalancerPoolJoinType[];

  // configs for each pool token
  poolTokenConfigs: BalancerPoolTokenJoinConfig[];

  // the ui doesn't use proportional joins, it uses EXACT_TOKENS_IN_FOR_BPT_OUT to allow the
  // user to configure any amount for each pool token, this concept could maybe use a better name.
  // Additionally, the ui provides a proportional estimation when applicable.
  //
  // Since it's possible not all tokens are being used for a given join, this path is not always the
  // "most efficient" for a given combination of tokens, but for the sake of limiting the scope, we
  // provide a "generic" path that works for any given combination.
  steps: BalancerPoolJoinStep[];

  // Leaf tokens are tokens that represent the last node in the tree. These are most often the
  // "normal" tokens that users hold in their wallet ie: USDC/USDT/DAI instead of bbausd
  // We consider the main token of a linear pool the leaf token.
  leafTokens: Address[];
}

interface BalancerPoolTokenJoinConfig {
  poolTokenIndex: number;
  poolTokenAddress: Address;
  // To scope this, we support the following options:
  // - Standard token (the pool token is not a nested bpt)
  // - Linear pool main token (the pool token is a nested linear bpt)
  // - Stable BPT (the pool token is a nested stable bpt)
  // - Leaf tokens of a nested stable BPT (the pool token is a nested stable bpt)
  options: BalancerPoolTokenJoinConfigOptions[];
}

type BalancerPoolTokenJoinConfigOptions =
  | BalancerPoolTokenConfigStandardToken
  | BalancerPoolTokenConfigLinearMainToken
  | BalancerPoolTokenConfigStableBpt
  | BalancerPoolTokenConfigStableBptLeafTokens;

interface BalancerPoolConfigBaseToken {
  address: Address;
}

interface BalancerPoolTokenConfigStandardToken
  extends BalancerPoolConfigBaseToken {
  __typename: "BalancerPoolTokenConfigStandardToken";
}

interface BalancerPoolConfigLinearBpt extends BalancerPoolConfigBaseToken {
  __typename: "BalancerPoolConfigLinearBpt";
  poolId: ID;
}

interface BalancerPoolTokenConfigLinearMainToken
  extends BalancerPoolConfigBaseToken {
  __typename: "BalancerPoolTokenConfigLinearMainToken";
  poolId: ID;
}

interface BalancerPoolConfigLinearWrappedToken
  extends BalancerPoolConfigBaseToken {
  __typename: "BalancerPoolConfigLinearWrappedToken";
  poolId: ID;
}

interface BalancerPoolTokenConfigStableBpt extends BalancerPoolConfigBaseToken {
  __typename: "BalancerPoolConfigStableBpt";
  poolId: ID;
}

interface BalancerPoolTokenConfigStableBptLeafTokens
  extends BalancerPoolConfigBaseToken {
  __typename: "BalancerPoolTokenConfigStableBptLeafTokens";
  poolId: ID;
  // the leaf tokens of this stable bpt
  leafTokens: Address[];
}

export type BalancerPoolJoinStep =
  | BalancerPoolJoinBatchSwapStep
  | BalancerPoolJoinMintBptStep;

// Currently, there should only ever be one batchSwap step that swaps any linear main tokens for the
// corresponding linear phantom BPT
export interface BalancerPoolJoinBatchSwapStep {
  __typename: "BalancerPoolJoinBatchSwapStep";
  swaps: {
    poolId: ID;
    tokenIn: Address;
    tokenOut: Address;
  }[];
  tokensIn: Address[];
  tokensOut: Address[];
}

// The mint BPT step is a standard join step. At least one mint step will always occur on the pool itself.
// Additionally, a second mint step will be present if there is a nested stable BPT in the pool.
export interface BalancerPoolJoinMintBptStep {
  __typename: "BalancerPoolJoinMintBptStep";
  poolId: ID;
  tokensIn: Address[];
}

interface BalancerPoolApr {
  apr: BalancerPoolAprValue;
  swapApr: Decimal; // we make the assumption swap apr will never have a range
  nativeRewardApr: BalancerPoolAprValue;
  thirdPartyApr: BalancerPoolAprValue;
  items: BalancerPoolAprItem[];
  hasRewardApr: boolean;
}

// All APR values are represented as the union of a range or a total. While range is only supported on BAL emissions
// we model it in such a way to allow for a generic ui implementation.
type BalancerPoolAprValue = BalancerPoolAprRange | BalancerPoolAprTotal;

interface BalancerPoolAprRange {
  __typename: "BalancerPoolAprRange";
  min: Decimal;
  max: Decimal;
}

interface BalancerPoolAprTotal {
  __typename: "BalancerPoolAprTotal";
  total: Decimal;
}

interface BalancerPoolAprItem {
  id: ID;
  title: string;
  apr: BalancerPoolAprValue;
  subItems: BalancerPoolAprSubItem[];
}

interface BalancerPoolAprSubItem {
  id: ID;
  title: string;
  apr: BalancerPoolAprValue;
}
