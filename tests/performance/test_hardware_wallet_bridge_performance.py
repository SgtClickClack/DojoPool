import pytest
import time
import asyncio
from statistics import mean, median, stdev
from typing import List, Dict
from decimal import Decimal

from dojopool.core.blockchain.hardware_wallet import EthereumHardwareWallet, TokenType
from dojopool.core.exceptions import BridgeError

class BridgePerformanceMetrics:
    def __init__(self):
        self.quote_times: List[float] = []
        self.gas_estimation_times: List[float] = []
        self.bridge_times: List[float] = []
        self.transaction_confirmation_times: List[float] = []
        self.errors: List[str] = []
        
    def add_quote_time(self, duration: float):
        self.quote_times.append(duration)
        
    def add_gas_estimation_time(self, duration: float):
        self.gas_estimation_times.append(duration)
        
    def add_bridge_time(self, duration: float):
        self.bridge_times.append(duration)
        
    def add_confirmation_time(self, duration: float):
        self.transaction_confirmation_times.append(duration)
        
    def add_error(self, error: str):
        self.errors.append(error)
        
    def get_statistics(self) -> Dict:
        stats = {}
        for metric_name, times in [
            ("quote", self.quote_times),
            ("gas_estimation", self.gas_estimation_times),
            ("bridge", self.bridge_times),
            ("confirmation", self.transaction_confirmation_times)
        ]:
            if times:
                stats[metric_name] = {
                    "min": min(times),
                    "max": max(times),
                    "mean": mean(times),
                    "median": median(times),
                    "stddev": stdev(times) if len(times) > 1 else 0,
                    "samples": len(times)
                }
        stats["errors"] = len(self.errors)
        return stats

@pytest.fixture
async def ethereum_wallet():
    wallet = EthereumHardwareWallet(network="mainnet")
    await wallet.connect()
    yield wallet
    if wallet.is_connected:
        await wallet.disconnect()

@pytest.fixture
def metrics():
    return BridgePerformanceMetrics()

async def measure_bridge_quote(wallet: EthereumHardwareWallet, metrics: BridgePerformanceMetrics, **kwargs):
    start_time = time.time()
    try:
        quote = await wallet.get_bridge_quote(**kwargs)
        duration = time.time() - start_time
        metrics.add_quote_time(duration)
        return quote
    except Exception as e:
        metrics.add_error(f"Quote error: {str(e)}")
        raise

async def measure_gas_estimation(wallet: EthereumHardwareWallet, metrics: BridgePerformanceMetrics, **kwargs):
    start_time = time.time()
    try:
        gas = await wallet.estimate_bridge_gas(**kwargs)
        duration = time.time() - start_time
        metrics.add_gas_estimation_time(duration)
        return gas
    except Exception as e:
        metrics.add_error(f"Gas estimation error: {str(e)}")
        raise

async def measure_bridge_operation(wallet: EthereumHardwareWallet, metrics: BridgePerformanceMetrics, **kwargs):
    start_time = time.time()
    try:
        tx_hash = await wallet.bridge_assets(**kwargs)
        bridge_duration = time.time() - start_time
        metrics.add_bridge_time(bridge_duration)
        
        # Measure confirmation time
        confirm_start = time.time()
        tx_receipt = await wallet._monitor_transaction(tx_hash)
        confirm_duration = time.time() - confirm_start
        metrics.add_confirmation_time(confirm_duration)
        
        return tx_hash, tx_receipt
    except Exception as e:
        metrics.add_error(f"Bridge error: {str(e)}")
        raise

@pytest.mark.asyncio
async def test_eth_bridge_performance(ethereum_wallet: EthereumHardwareWallet, metrics: BridgePerformanceMetrics):
    """Benchmark ETH bridging performance."""
    # Test parameters
    amount = 0.1
    to_network = "arbitrum"
    num_iterations = 5
    
    for _ in range(num_iterations):
        # Measure quote performance
        await measure_bridge_quote(
            ethereum_wallet,
            metrics,
            to_network=to_network,
            amount=amount
        )
        
        # Measure gas estimation performance
        await measure_gas_estimation(
            ethereum_wallet,
            metrics,
            to_network=to_network,
            amount=amount
        )
        
        # Measure bridge operation performance
        await measure_bridge_operation(
            ethereum_wallet,
            metrics,
            to_network=to_network,
            amount=amount,
            wait_for_inclusion=True
        )
        
        # Add delay between iterations
        await asyncio.sleep(1)
    
    # Print performance statistics
    stats = metrics.get_statistics()
    print("\nETH Bridge Performance Statistics:")
    for metric, values in stats.items():
        if metric != "errors":
            print(f"\n{metric.upper()}:")
            for stat, value in values.items():
                print(f"  {stat}: {value:.3f}s" if isinstance(value, float) else f"  {stat}: {value}")
    print(f"\nTotal errors: {stats['errors']}")

@pytest.mark.asyncio
async def test_erc20_bridge_performance(ethereum_wallet: EthereumHardwareWallet, metrics: BridgePerformanceMetrics):
    """Benchmark ERC20 token bridging performance."""
    # Test parameters
    usdc_address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    amount = 100.0
    to_network = "optimism"
    num_iterations = 5
    
    for _ in range(num_iterations):
        # Measure quote performance
        await measure_bridge_quote(
            ethereum_wallet,
            metrics,
            to_network=to_network,
            amount=amount,
            token_address=usdc_address
        )
        
        # Measure gas estimation performance
        await measure_gas_estimation(
            ethereum_wallet,
            metrics,
            to_network=to_network,
            amount=amount,
            token_address=usdc_address
        )
        
        # Measure bridge operation performance
        await measure_bridge_operation(
            ethereum_wallet,
            metrics,
            to_network=to_network,
            amount=amount,
            token_address=usdc_address,
            wait_for_inclusion=True
        )
        
        # Add delay between iterations
        await asyncio.sleep(1)
    
    # Print performance statistics
    stats = metrics.get_statistics()
    print("\nERC20 Bridge Performance Statistics:")
    for metric, values in stats.items():
        if metric != "errors":
            print(f"\n{metric.upper()}:")
            for stat, value in values.items():
                print(f"  {stat}: {value:.3f}s" if isinstance(value, float) else f"  {stat}: {value}")
    print(f"\nTotal errors: {stats['errors']}")

@pytest.mark.asyncio
async def test_nft_bridge_performance(ethereum_wallet: EthereumHardwareWallet, metrics: BridgePerformanceMetrics):
    """Benchmark NFT bridging performance."""
    # Test parameters
    nft_address = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d"
    token_id = 1234
    to_network = "polygon"
    num_iterations = 5
    
    for _ in range(num_iterations):
        # Measure quote performance
        await measure_bridge_quote(
            ethereum_wallet,
            metrics,
            to_network=to_network,
            token_address=nft_address,
            token_type=TokenType.ERC721,
            token_id=token_id
        )
        
        # Measure gas estimation performance
        await measure_gas_estimation(
            ethereum_wallet,
            metrics,
            to_network=to_network,
            token_address=nft_address,
            token_type=TokenType.ERC721,
            token_id=token_id
        )
        
        # Measure bridge operation performance
        await measure_bridge_operation(
            ethereum_wallet,
            metrics,
            to_network=to_network,
            token_address=nft_address,
            token_type=TokenType.ERC721,
            token_id=token_id,
            wait_for_inclusion=True
        )
        
        # Add delay between iterations
        await asyncio.sleep(1)
    
    # Print performance statistics
    stats = metrics.get_statistics()
    print("\nNFT Bridge Performance Statistics:")
    for metric, values in stats.items():
        if metric != "errors":
            print(f"\n{metric.upper()}:")
            for stat, value in values.items():
                print(f"  {stat}: {value:.3f}s" if isinstance(value, float) else f"  {stat}: {value}")
    print(f"\nTotal errors: {stats['errors']}")

@pytest.mark.asyncio
async def test_batch_nft_bridge_performance(ethereum_wallet: EthereumHardwareWallet, metrics: BridgePerformanceMetrics):
    """Benchmark batch NFT bridging performance."""
    # Test parameters
    nft_address = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d"
    token_ids = [1234, 5678, 9012]
    to_network = "polygon"
    num_iterations = 3
    
    for _ in range(num_iterations):
        start_time = time.time()
        try:
            # Bridge multiple NFTs
            tx_hashes = await ethereum_wallet.batch_bridge_nfts(
                to_network=to_network,
                token_address=nft_address,
                token_type=TokenType.ERC721,
                token_ids=token_ids,
                wait_for_inclusion=True
            )
            
            duration = time.time() - start_time
            metrics.add_bridge_time(duration)
            
            # Measure confirmation times for each transaction
            for tx_hash in tx_hashes:
                confirm_start = time.time()
                await ethereum_wallet._monitor_transaction(tx_hash)
                confirm_duration = time.time() - confirm_start
                metrics.add_confirmation_time(confirm_duration)
                
        except Exception as e:
            metrics.add_error(f"Batch bridge error: {str(e)}")
            raise
        
        # Add delay between iterations
        await asyncio.sleep(2)
    
    # Print performance statistics
    stats = metrics.get_statistics()
    print("\nBatch NFT Bridge Performance Statistics:")
    for metric, values in stats.items():
        if metric != "errors":
            print(f"\n{metric.upper()}:")
            for stat, value in values.items():
                print(f"  {stat}: {value:.3f}s" if isinstance(value, float) else f"  {stat}: {value}")
    print(f"\nTotal errors: {stats['errors']}")

@pytest.mark.asyncio
async def test_concurrent_bridge_performance(ethereum_wallet: EthereumHardwareWallet, metrics: BridgePerformanceMetrics):
    """Benchmark concurrent bridge operations performance."""
    async def bridge_eth():
        await measure_bridge_operation(
            ethereum_wallet,
            metrics,
            to_network="arbitrum",
            amount=0.1,
            wait_for_inclusion=True
        )
    
    async def bridge_erc20():
        await measure_bridge_operation(
            ethereum_wallet,
            metrics,
            to_network="optimism",
            amount=100.0,
            token_address="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            wait_for_inclusion=True
        )
    
    async def bridge_nft():
        await measure_bridge_operation(
            ethereum_wallet,
            metrics,
            to_network="polygon",
            token_address="0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
            token_type=TokenType.ERC721,
            token_id=1234,
            wait_for_inclusion=True
        )
    
    # Run bridge operations concurrently
    start_time = time.time()
    try:
        await asyncio.gather(
            bridge_eth(),
            bridge_erc20(),
            bridge_nft()
        )
    except Exception as e:
        metrics.add_error(f"Concurrent bridge error: {str(e)}")
        raise
    
    total_duration = time.time() - start_time
    print(f"\nTotal concurrent bridge duration: {total_duration:.3f}s")
    
    # Print performance statistics
    stats = metrics.get_statistics()
    print("\nConcurrent Bridge Performance Statistics:")
    for metric, values in stats.items():
        if metric != "errors":
            print(f"\n{metric.upper()}:")
            for stat, value in values.items():
                print(f"  {stat}: {value:.3f}s" if isinstance(value, float) else f"  {stat}: {value}")
    print(f"\nTotal errors: {stats['errors']}") 