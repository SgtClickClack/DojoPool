import React, { useState } from 'react';
import { useEnhancedBlockchain } from '../../hooks/useEnhancedBlockchain';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import {
  Wallet,
  ArrowRightLeft,
  ShoppingCart,
  TrendingUp,
  Activity,
  Coins,
  Network,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export const EnhancedBlockchainPanel: React.FC = () => {
  const {
    balances,
    loadingBalances,
    getBalance,
    transferCoins,
    crossChainTransactions,
    loadingCrossChain,
    initiateCrossChainTransfer,
    marketplaceItems,
    loadingMarketplace,
    listNFT,
    buyNFT,
    analytics,
    loadingAnalytics,
    refreshAnalytics,
    healthStatus,
    loadingHealth,
    checkHealth,
    error,
    clearError,
  } = useEnhancedBlockchain();

  const [activeTab, setActiveTab] = useState('overview');
  const [transferForm, setTransferForm] = useState({
    fromUserId: '',
    toUserId: '',
    amount: '',
    network: 'ethereum',
  });
  const [crossChainForm, setCrossChainForm] = useState({
    fromUserId: '',
    toUserId: '',
    amount: '',
    fromNetwork: 'ethereum',
    toNetwork: 'polygon',
  });
  const [nftForm, setNftForm] = useState({
    tokenId: '',
    contractAddress: '',
    network: 'ethereum',
    seller: '',
    price: '',
    currency: 'DOJO' as const,
  });

  const handleTransfer = async () => {
    if (
      !transferForm.fromUserId ||
      !transferForm.toUserId ||
      !transferForm.amount
    ) {
      return;
    }

    await transferCoins(
      transferForm.fromUserId,
      transferForm.toUserId,
      transferForm.amount,
      transferForm.network
    );

    setTransferForm({
      fromUserId: '',
      toUserId: '',
      amount: '',
      network: 'ethereum',
    });
  };

  const handleCrossChainTransfer = async () => {
    if (
      !crossChainForm.fromUserId ||
      !crossChainForm.toUserId ||
      !crossChainForm.amount
    ) {
      return;
    }

    await initiateCrossChainTransfer(
      crossChainForm.fromUserId,
      crossChainForm.toUserId,
      crossChainForm.amount,
      crossChainForm.fromNetwork,
      crossChainForm.toNetwork
    );

    setCrossChainForm({
      fromUserId: '',
      toUserId: '',
      amount: '',
      fromNetwork: 'ethereum',
      toNetwork: 'polygon',
    });
  };

  const handleListNFT = async () => {
    if (
      !nftForm.tokenId ||
      !nftForm.contractAddress ||
      !nftForm.seller ||
      !nftForm.price
    ) {
      return;
    }

    await listNFT(
      nftForm.tokenId,
      nftForm.contractAddress,
      nftForm.network,
      nftForm.seller,
      nftForm.price,
      nftForm.currency,
      {
        name: `NFT ${nftForm.tokenId}`,
        description: 'A unique Dojo Pool NFT',
        image: '/images/nft-placeholder.webp',
        attributes: [
          { trait_type: 'Rarity', value: 'Common' },
          { trait_type: 'Type', value: 'Trophy' },
        ],
      }
    );

    setNftForm({
      tokenId: '',
      contractAddress: '',
      network: 'ethereum',
      seller: '',
      price: '',
      currency: 'DOJO',
    });
  };

  const handleBuyNFT = async (itemId: string, price: string) => {
    await buyNFT(itemId, 'current-user', 'DOJO');
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance) / 1e18; // Convert from wei
    return num.toFixed(4);
  };

  const getNetworkIcon = (network: string) => {
    switch (network) {
      case 'ethereum':
        return <Network className="w-4 h-4" />;
      case 'polygon':
        return <Zap className="w-4 h-4" />;
      case 'solana':
        return <Activity className="w-4 h-4" />;
      default:
        return <Network className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="ml-2"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="cross-chain">Cross-Chain</TabsTrigger>
          <TabsTrigger value="marketplace">NFT Marketplace</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Volume
                </CardTitle>
                <Coins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics
                    ? `${formatBalance(analytics.totalVolume)} DOJO`
                    : 'Loading...'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all networks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics ? analytics.activeUsers : 'Loading...'}
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Cross-Chain Transfers
                </CardTitle>
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics ? analytics.crossChainTransfers : 'Loading...'}
                </div>
                <p className="text-xs text-muted-foreground">Total transfers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  NFT Listings
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics ? analytics.nftListings : 'Loading...'}
                </div>
                <p className="text-xs text-muted-foreground">Active listings</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Network Health Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHealth ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Checking network health...
                </div>
              ) : healthStatus ? (
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(healthStatus).map(
                    ([network, status]) =>
                      network !== 'overall' && (
                        <div
                          key={network}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            {getNetworkIcon(network)}
                            <span className="capitalize">{network}</span>
                          </div>
                          {status ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      )
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No health data available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Dojo Coin Balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from(balances.values()).map((balance) => (
                  <div
                    key={`${balance.userId}-${balance.network}`}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getNetworkIcon(balance.network)}
                      <div>
                        <p className="font-medium">User {balance.userId}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {balance.network}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {formatBalance(balance.balance)} DOJO
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Updated {balance.lastUpdated.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transfer Dojo Coins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromUserId">From User ID</Label>
                  <Input
                    id="fromUserId"
                    value={transferForm.fromUserId}
                    onChange={(e) =>
                      setTransferForm((prev) => ({
                        ...prev,
                        fromUserId: e.target.value,
                      }))
                    }
                    placeholder="Enter sender user ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toUserId">To User ID</Label>
                  <Input
                    id="toUserId"
                    value={transferForm.toUserId}
                    onChange={(e) =>
                      setTransferForm((prev) => ({
                        ...prev,
                        toUserId: e.target.value,
                      }))
                    }
                    placeholder="Enter recipient user ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (DOJO)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={transferForm.amount}
                    onChange={(e) =>
                      setTransferForm((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    placeholder="Enter amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="network">Network</Label>
                  <Select
                    value={transferForm.network}
                    onValueChange={(value) =>
                      setTransferForm((prev) => ({ ...prev, network: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ethereum">Ethereum</SelectItem>
                      <SelectItem value="polygon">Polygon</SelectItem>
                      <SelectItem value="solana">Solana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleTransfer}
                className="mt-4"
                disabled={loadingBalances}
              >
                {loadingBalances ? 'Transferring...' : 'Transfer Coins'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cross-chain" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Cross-Chain Transfers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from(crossChainTransactions.values()).map(
                  (transaction) => (
                    <div key={transaction.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transaction.status)}
                          <span className="font-medium">
                            Transfer #{transaction.id.slice(-8)}
                          </span>
                        </div>
                        <Badge
                          variant={
                            transaction.status === 'completed'
                              ? 'default'
                              : transaction.status === 'pending'
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">From</p>
                          <p className="font-medium">
                            {transaction.fromNetwork}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">To</p>
                          <p className="font-medium">{transaction.toNetwork}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-medium">
                            {formatBalance(transaction.amount)} DOJO
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Bridge Fee</p>
                          <p className="font-medium">
                            {formatBalance(transaction.bridgeFee)} DOJO
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Created: {transaction.createdAt.toLocaleString()}
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Initiate Cross-Chain Transfer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="crossFromUserId">From User ID</Label>
                  <Input
                    id="crossFromUserId"
                    value={crossChainForm.fromUserId}
                    onChange={(e) =>
                      setCrossChainForm((prev) => ({
                        ...prev,
                        fromUserId: e.target.value,
                      }))
                    }
                    placeholder="Enter sender user ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crossToUserId">To User ID</Label>
                  <Input
                    id="crossToUserId"
                    value={crossChainForm.toUserId}
                    onChange={(e) =>
                      setCrossChainForm((prev) => ({
                        ...prev,
                        toUserId: e.target.value,
                      }))
                    }
                    placeholder="Enter recipient user ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crossAmount">Amount (DOJO)</Label>
                  <Input
                    id="crossAmount"
                    type="number"
                    value={crossChainForm.amount}
                    onChange={(e) =>
                      setCrossChainForm((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    placeholder="Enter amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromNetwork">From Network</Label>
                  <Select
                    value={crossChainForm.fromNetwork}
                    onValueChange={(value) =>
                      setCrossChainForm((prev) => ({
                        ...prev,
                        fromNetwork: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ethereum">Ethereum</SelectItem>
                      <SelectItem value="polygon">Polygon</SelectItem>
                      <SelectItem value="solana">Solana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toNetwork">To Network</Label>
                  <Select
                    value={crossChainForm.toNetwork}
                    onValueChange={(value) =>
                      setCrossChainForm((prev) => ({
                        ...prev,
                        toNetwork: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ethereum">Ethereum</SelectItem>
                      <SelectItem value="polygon">Polygon</SelectItem>
                      <SelectItem value="solana">Solana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleCrossChainTransfer}
                className="mt-4"
                disabled={loadingCrossChain}
              >
                {loadingCrossChain ? 'Initiating...' : 'Initiate Transfer'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                NFT Marketplace
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingMarketplace ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {marketplaceItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                        <img
                          src={item.metadata.image}
                          alt={item.metadata.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src =
                              '/images/nft-placeholder.webp';
                          }}
                        />
                      </div>
                      <h3 className="font-semibold mb-1">
                        {item.metadata.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.metadata.description}
                      </p>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1">
                          {getNetworkIcon(item.network)}
                          <span className="text-xs capitalize">
                            {item.network}
                          </span>
                        </div>
                        <Badge variant="outline">{item.currency}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold">
                          {formatBalance(item.price)} DOJO
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleBuyNFT(item.id, item.price)}
                        >
                          Buy
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>List New NFT</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tokenId">Token ID</Label>
                  <Input
                    id="tokenId"
                    value={nftForm.tokenId}
                    onChange={(e) =>
                      setNftForm((prev) => ({
                        ...prev,
                        tokenId: e.target.value,
                      }))
                    }
                    placeholder="Enter token ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractAddress">Contract Address</Label>
                  <Input
                    id="contractAddress"
                    value={nftForm.contractAddress}
                    onChange={(e) =>
                      setNftForm((prev) => ({
                        ...prev,
                        contractAddress: e.target.value,
                      }))
                    }
                    placeholder="Enter contract address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nftNetwork">Network</Label>
                  <Select
                    value={nftForm.network}
                    onValueChange={(value) =>
                      setNftForm((prev) => ({ ...prev, network: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ethereum">Ethereum</SelectItem>
                      <SelectItem value="polygon">Polygon</SelectItem>
                      <SelectItem value="solana">Solana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seller">Seller</Label>
                  <Input
                    id="seller"
                    value={nftForm.seller}
                    onChange={(e) =>
                      setNftForm((prev) => ({
                        ...prev,
                        seller: e.target.value,
                      }))
                    }
                    placeholder="Enter seller address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nftPrice">Price (DOJO)</Label>
                  <Input
                    id="nftPrice"
                    type="number"
                    value={nftForm.price}
                    onChange={(e) =>
                      setNftForm((prev) => ({ ...prev, price: e.target.value }))
                    }
                    placeholder="Enter price"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={nftForm.currency}
                    onValueChange={(value: 'DOJO' | 'ETH' | 'SOL') =>
                      setNftForm((prev) => ({ ...prev, currency: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOJO">DOJO</SelectItem>
                      <SelectItem value="ETH">ETH</SelectItem>
                      <SelectItem value="SOL">SOL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleListNFT} className="mt-4">
                List NFT
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Blockchain Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAnalytics ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : analytics ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">
                        Network Distribution
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(analytics.networkDistribution).map(
                          ([network, count]) => (
                            <div
                              key={network}
                              className="flex items-center justify-between"
                            >
                              <span className="capitalize">{network}</span>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={
                                    (count / analytics.totalTransactions) * 100
                                  }
                                  className="w-20"
                                />
                                <span className="text-sm font-medium">
                                  {count}
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-3">Key Metrics</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Total Transactions</span>
                          <span className="font-medium">
                            {analytics.totalTransactions}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Volume</span>
                          <span className="font-medium">
                            {formatBalance(analytics.totalVolume)} DOJO
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active Users</span>
                          <span className="font-medium">
                            {analytics.activeUsers}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cross-Chain Transfers</span>
                          <span className="font-medium">
                            {analytics.crossChainTransfers}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>NFT Listings</span>
                          <span className="font-medium">
                            {analytics.nftListings}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No analytics data available
                </p>
              )}
              <Button
                onClick={refreshAnalytics}
                className="mt-4"
                disabled={loadingAnalytics}
              >
                {loadingAnalytics ? 'Refreshing...' : 'Refresh Analytics'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
