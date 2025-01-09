"""Marketplace module for managing virtual items and transactions."""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import json
from uuid import uuid4
from dataclasses import dataclass
from redis import Redis, ConnectionPool

from .analytics import analytics_manager
from .constants import MetricTypes
from .log_config import logger

class ItemType(Enum):
    """Types of items available in the marketplace."""
    AVATAR = 'avatar'
    ACCESSORY = 'accessory'
    EMOTE = 'emote'
    BACKGROUND = 'background'
    EFFECT = 'effect'
    BADGE = 'badge'

class ItemRarity(Enum):
    """Rarity levels for items."""
    COMMON = 'common'
    UNCOMMON = 'uncommon'
    RARE = 'rare'
    EPIC = 'epic'
    LEGENDARY = 'legendary'

class TransactionStatus(Enum):
    """Status of marketplace transactions."""
    PENDING = 'pending'
    COMPLETED = 'completed'
    FAILED = 'failed'
    REFUNDED = 'refunded'

class AuctionStatus(Enum):
    """Status of marketplace auctions."""
    PENDING = 'pending'  # Not started yet
    ACTIVE = 'active'   # Currently running
    ENDED = 'ended'     # Auction ended
    CANCELLED = 'cancelled'  # Auction cancelled
    COMPLETED = 'completed'  # Item transferred to winner

@dataclass
class MarketplaceItem:
    """Represents an item in the marketplace."""
    id: str
    name: str
    description: str
    type: ItemType
    rarity: ItemRarity
    price: float
    creator_id: str
    created_at: datetime
    metadata: Dict[str, Any]
    available_quantity: int
    total_sold: int = 0
    is_active: bool = True

@dataclass
class Transaction:
    """Represents a marketplace transaction."""
    id: str
    item_id: str
    buyer_id: str
    seller_id: str
    price: float
    quantity: int
    status: TransactionStatus
    created_at: datetime
    completed_at: Optional[datetime] = None
    metadata: Dict[str, Any] = None

@dataclass
class Bid:
    """Represents a bid in an auction."""
    id: str
    auction_id: str
    bidder_id: str
    amount: float
    created_at: datetime
    metadata: Dict[str, Any]

@dataclass
class Auction:
    """Represents an auction in the marketplace."""
    id: str
    item_id: str
    seller_id: str
    start_price: float
    min_increment: float
    start_time: datetime
    end_time: datetime
    status: AuctionStatus
    current_bid: Optional[float] = None
    current_winner: Optional[str] = None
    created_at: datetime = None
    metadata: Dict[str, Any] = None

class Marketplace:
    """Marketplace manager for virtual items."""
    
    def __init__(self):
        """Initialize marketplace."""
        self._redis_pool = ConnectionPool(
            host='localhost',
            port=6379,
            db=2  # Separate DB for marketplace
        )
        self._redis = Redis(connection_pool=self._redis_pool)
        self._transaction_lock = asyncio.Lock()
        self._auction_lock = asyncio.Lock()
        
        # Start auction manager task
        asyncio.create_task(self._manage_auctions())
    
    async def create_item(
        self,
        name: str,
        description: str,
        type: ItemType,
        rarity: ItemRarity,
        price: float,
        creator_id: str,
        available_quantity: int,
        metadata: Optional[Dict[str, Any]] = None
    ) -> MarketplaceItem:
        """Create a new marketplace item."""
        try:
            item = MarketplaceItem(
                id=str(uuid4()),
                name=name,
                description=description,
                type=type,
                rarity=rarity,
                price=price,
                creator_id=creator_id,
                created_at=datetime.utcnow(),
                metadata=metadata or {},
                available_quantity=available_quantity
            )
            
            # Store item in Redis
            await self._store_item(item)
            
            # Record analytics
            await analytics_manager.record_metric(
                MetricTypes.MARKETPLACE_LISTING,
                1,
                {
                    'item_type': type.value,
                    'rarity': rarity.value,
                    'price': price
                }
            )
            
            return item
            
        except Exception as e:
            logger.error(f"Error creating marketplace item: {str(e)}", exc_info=True)
            raise
    
    async def _store_item(self, item: MarketplaceItem) -> None:
        """Store item in Redis."""
        key = f"marketplace:item:{item.id}"
        self._redis.set(
            key,
            json.dumps({
                'id': item.id,
                'name': item.name,
                'description': item.description,
                'type': item.type.value,
                'rarity': item.rarity.value,
                'price': item.price,
                'creator_id': item.creator_id,
                'created_at': item.created_at.isoformat(),
                'metadata': item.metadata,
                'available_quantity': item.available_quantity,
                'total_sold': item.total_sold,
                'is_active': item.is_active
            })
        )
    
    async def get_item(self, item_id: str) -> Optional[MarketplaceItem]:
        """Get item by ID."""
        try:
            key = f"marketplace:item:{item_id}"
            data = self._redis.get(key)
            if not data:
                return None
            
            item_data = json.loads(data)
            return MarketplaceItem(
                id=item_data['id'],
                name=item_data['name'],
                description=item_data['description'],
                type=ItemType(item_data['type']),
                rarity=ItemRarity(item_data['rarity']),
                price=item_data['price'],
                creator_id=item_data['creator_id'],
                created_at=datetime.fromisoformat(item_data['created_at']),
                metadata=item_data['metadata'],
                available_quantity=item_data['available_quantity'],
                total_sold=item_data['total_sold'],
                is_active=item_data['is_active']
            )
            
        except Exception as e:
            logger.error(f"Error getting marketplace item: {str(e)}", exc_info=True)
            return None
    
    async def list_items(
        self,
        type: Optional[ItemType] = None,
        rarity: Optional[ItemRarity] = None,
        creator_id: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        active_only: bool = True
    ) -> List[MarketplaceItem]:
        """List marketplace items with optional filters."""
        try:
            items = []
            for key in self._redis.scan_iter("marketplace:item:*"):
                try:
                    data = self._redis.get(key)
                    if data:
                        item_data = json.loads(data)
                        
                        # Apply filters
                        if active_only and not item_data['is_active']:
                            continue
                        if type and item_data['type'] != type.value:
                            continue
                        if rarity and item_data['rarity'] != rarity.value:
                            continue
                        if creator_id and item_data['creator_id'] != creator_id:
                            continue
                        if min_price is not None and item_data['price'] < min_price:
                            continue
                        if max_price is not None and item_data['price'] > max_price:
                            continue
                        
                        items.append(MarketplaceItem(
                            id=item_data['id'],
                            name=item_data['name'],
                            description=item_data['description'],
                            type=ItemType(item_data['type']),
                            rarity=ItemRarity(item_data['rarity']),
                            price=item_data['price'],
                            creator_id=item_data['creator_id'],
                            created_at=datetime.fromisoformat(item_data['created_at']),
                            metadata=item_data['metadata'],
                            available_quantity=item_data['available_quantity'],
                            total_sold=item_data['total_sold'],
                            is_active=item_data['is_active']
                        ))
                except Exception:
                    continue
            
            return sorted(items, key=lambda x: x.created_at, reverse=True)
            
        except Exception as e:
            logger.error(f"Error listing marketplace items: {str(e)}", exc_info=True)
            return []
    
    async def create_transaction(
        self,
        item_id: str,
        buyer_id: str,
        quantity: int = 1,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[Transaction]:
        """Create a new transaction."""
        try:
            async with self._transaction_lock:
                # Get item
                item = await self.get_item(item_id)
                if not item or not item.is_active:
                    return None
                
                # Check quantity
                if item.available_quantity < quantity:
                    return None
                
                # Create transaction
                transaction = Transaction(
                    id=str(uuid4()),
                    item_id=item_id,
                    buyer_id=buyer_id,
                    seller_id=item.creator_id,
                    price=item.price * quantity,
                    quantity=quantity,
                    status=TransactionStatus.PENDING,
                    created_at=datetime.utcnow(),
                    metadata=metadata
                )
                
                # Store transaction
                await self._store_transaction(transaction)
                
                # Update item quantity
                item.available_quantity -= quantity
                item.total_sold += quantity
                await self._store_item(item)
                
                # Record analytics
                await analytics_manager.record_metric(
                    MetricTypes.MARKETPLACE_TRANSACTION,
                    transaction.price,
                    {
                        'item_type': item.type.value,
                        'rarity': item.rarity.value,
                        'quantity': quantity
                    }
                )
                
                return transaction
                
        except Exception as e:
            logger.error(f"Error creating transaction: {str(e)}", exc_info=True)
            return None
    
    async def _store_transaction(self, transaction: Transaction) -> None:
        """Store transaction in Redis."""
        key = f"marketplace:transaction:{transaction.id}"
        self._redis.set(
            key,
            json.dumps({
                'id': transaction.id,
                'item_id': transaction.item_id,
                'buyer_id': transaction.buyer_id,
                'seller_id': transaction.seller_id,
                'price': transaction.price,
                'quantity': transaction.quantity,
                'status': transaction.status.value,
                'created_at': transaction.created_at.isoformat(),
                'completed_at': transaction.completed_at.isoformat() if transaction.completed_at else None,
                'metadata': transaction.metadata
            })
        )
    
    async def complete_transaction(
        self,
        transaction_id: str
    ) -> Optional[Transaction]:
        """Complete a pending transaction."""
        try:
            async with self._transaction_lock:
                # Get transaction
                transaction = await self.get_transaction(transaction_id)
                if not transaction or transaction.status != TransactionStatus.PENDING:
                    return None
                
                # Update transaction
                transaction.status = TransactionStatus.COMPLETED
                transaction.completed_at = datetime.utcnow()
                await self._store_transaction(transaction)
                
                return transaction
                
        except Exception as e:
            logger.error(f"Error completing transaction: {str(e)}", exc_info=True)
            return None
    
    async def get_transaction(
        self,
        transaction_id: str
    ) -> Optional[Transaction]:
        """Get transaction by ID."""
        try:
            key = f"marketplace:transaction:{transaction_id}"
            data = self._redis.get(key)
            if not data:
                return None
            
            transaction_data = json.loads(data)
            return Transaction(
                id=transaction_data['id'],
                item_id=transaction_data['item_id'],
                buyer_id=transaction_data['buyer_id'],
                seller_id=transaction_data['seller_id'],
                price=transaction_data['price'],
                quantity=transaction_data['quantity'],
                status=TransactionStatus(transaction_data['status']),
                created_at=datetime.fromisoformat(transaction_data['created_at']),
                completed_at=datetime.fromisoformat(transaction_data['completed_at']) if transaction_data['completed_at'] else None,
                metadata=transaction_data['metadata']
            )
            
        except Exception as e:
            logger.error(f"Error getting transaction: {str(e)}", exc_info=True)
            return None
    
    async def get_user_transactions(
        self,
        user_id: str,
        as_buyer: bool = True,
        status: Optional[TransactionStatus] = None
    ) -> List[Transaction]:
        """Get transactions for a user."""
        try:
            transactions = []
            for key in self._redis.scan_iter("marketplace:transaction:*"):
                try:
                    data = self._redis.get(key)
                    if data:
                        transaction_data = json.loads(data)
                        
                        # Apply filters
                        if as_buyer and transaction_data['buyer_id'] != user_id:
                            continue
                        if not as_buyer and transaction_data['seller_id'] != user_id:
                            continue
                        if status and transaction_data['status'] != status.value:
                            continue
                        
                        transactions.append(Transaction(
                            id=transaction_data['id'],
                            item_id=transaction_data['item_id'],
                            buyer_id=transaction_data['buyer_id'],
                            seller_id=transaction_data['seller_id'],
                            price=transaction_data['price'],
                            quantity=transaction_data['quantity'],
                            status=TransactionStatus(transaction_data['status']),
                            created_at=datetime.fromisoformat(transaction_data['created_at']),
                            completed_at=datetime.fromisoformat(transaction_data['completed_at']) if transaction_data['completed_at'] else None,
                            metadata=transaction_data['metadata']
                        ))
                except Exception:
                    continue
            
            return sorted(transactions, key=lambda x: x.created_at, reverse=True)
            
        except Exception as e:
            logger.error(f"Error getting user transactions: {str(e)}", exc_info=True)
            return []
    
    async def search_items(
        self,
        query: str,
        type: Optional[ItemType] = None,
        rarity: Optional[ItemRarity] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        active_only: bool = True
    ) -> List[MarketplaceItem]:
        """Search marketplace items by name or description."""
        try:
            items = await self.list_items(
                type=type,
                rarity=rarity,
                min_price=min_price,
                max_price=max_price,
                active_only=active_only
            )
            
            query = query.lower()
            return [
                item for item in items
                if query in item.name.lower() or query in item.description.lower()
            ]
            
        except Exception as e:
            logger.error(f"Error searching marketplace items: {str(e)}", exc_info=True)
            return []
    
    async def get_featured_items(
        self,
        limit: int = 10
    ) -> List[MarketplaceItem]:
        """Get featured marketplace items based on popularity and rarity."""
        try:
            items = await self.list_items(active_only=True)
            
            # Sort by score (rarity weight * total sold)
            rarity_weights = {
                ItemRarity.COMMON: 1,
                ItemRarity.UNCOMMON: 2,
                ItemRarity.RARE: 3,
                ItemRarity.EPIC: 4,
                ItemRarity.LEGENDARY: 5
            }
            
            scored_items = [
                (item, rarity_weights[item.rarity] * item.total_sold)
                for item in items
            ]
            scored_items.sort(key=lambda x: x[1], reverse=True)
            
            return [item for item, _ in scored_items[:limit]]
            
        except Exception as e:
            logger.error(f"Error getting featured items: {str(e)}", exc_info=True)
            return []
    
    async def refund_transaction(
        self,
        transaction_id: str,
        reason: Optional[str] = None
    ) -> Optional[Transaction]:
        """Refund a completed transaction."""
        try:
            async with self._transaction_lock:
                # Get transaction
                transaction = await self.get_transaction(transaction_id)
                if not transaction or transaction.status != TransactionStatus.COMPLETED:
                    return None
                
                # Get item
                item = await self.get_item(transaction.item_id)
                if not item:
                    return None
                
                # Update transaction
                transaction.status = TransactionStatus.REFUNDED
                transaction.metadata = {
                    **(transaction.metadata or {}),
                    'refund_reason': reason,
                    'refunded_at': datetime.utcnow().isoformat()
                }
                await self._store_transaction(transaction)
                
                # Restore item quantity
                item.available_quantity += transaction.quantity
                item.total_sold -= transaction.quantity
                await self._store_item(item)
                
                # Record analytics
                await analytics_manager.record_metric(
                    MetricTypes.MARKETPLACE_REFUND,
                    transaction.price,
                    {
                        'item_type': item.type.value,
                        'rarity': item.rarity.value,
                        'quantity': transaction.quantity,
                        'reason': reason
                    }
                )
                
                return transaction
                
        except Exception as e:
            logger.error(f"Error refunding transaction: {str(e)}", exc_info=True)
            return None
    
    async def get_item_stats(
        self,
        item_id: str
    ) -> Dict[str, Any]:
        """Get statistics for an item."""
        try:
            item = await self.get_item(item_id)
            if not item:
                return {}
            
            # Get all transactions for this item
            transactions = []
            for key in self._redis.scan_iter("marketplace:transaction:*"):
                try:
                    data = self._redis.get(key)
                    if data:
                        transaction_data = json.loads(data)
                        if transaction_data['item_id'] == item_id:
                            transactions.append(Transaction(
                                id=transaction_data['id'],
                                item_id=transaction_data['item_id'],
                                buyer_id=transaction_data['buyer_id'],
                                seller_id=transaction_data['seller_id'],
                                price=transaction_data['price'],
                                quantity=transaction_data['quantity'],
                                status=TransactionStatus(transaction_data['status']),
                                created_at=datetime.fromisoformat(transaction_data['created_at']),
                                completed_at=datetime.fromisoformat(transaction_data['completed_at']) if transaction_data['completed_at'] else None,
                                metadata=transaction_data['metadata']
                            ))
                except Exception:
                    continue
            
            # Calculate statistics
            completed_transactions = [t for t in transactions if t.status == TransactionStatus.COMPLETED]
            refunded_transactions = [t for t in transactions if t.status == TransactionStatus.REFUNDED]
            
            total_revenue = sum(t.price for t in completed_transactions)
            avg_price = total_revenue / len(completed_transactions) if completed_transactions else 0
            
            return {
                'total_sold': item.total_sold,
                'available_quantity': item.available_quantity,
                'total_revenue': total_revenue,
                'average_price': avg_price,
                'total_transactions': len(transactions),
                'completed_transactions': len(completed_transactions),
                'refunded_transactions': len(refunded_transactions),
                'refund_rate': len(refunded_transactions) / len(completed_transactions) if completed_transactions else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting item stats: {str(e)}", exc_info=True)
            return {}
    
    async def create_auction(
        self,
        item_id: str,
        seller_id: str,
        start_price: float,
        min_increment: float,
        duration_hours: float,
        start_delay_hours: float = 0,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[Auction]:
        """Create a new auction."""
        try:
            async with self._auction_lock:
                # Get item
                item = await self.get_item(item_id)
                if not item or not item.is_active or item.available_quantity < 1:
                    return None
                
                # Create auction
                now = datetime.utcnow()
                auction = Auction(
                    id=str(uuid4()),
                    item_id=item_id,
                    seller_id=seller_id,
                    start_price=start_price,
                    min_increment=min_increment,
                    start_time=now + timedelta(hours=start_delay_hours),
                    end_time=now + timedelta(hours=start_delay_hours + duration_hours),
                    status=AuctionStatus.PENDING if start_delay_hours > 0 else AuctionStatus.ACTIVE,
                    created_at=now,
                    metadata=metadata or {}
                )
                
                # Store auction
                await self._store_auction(auction)
                
                # Update item status
                item.is_active = False  # Lock item while in auction
                await self._store_item(item)
                
                # Record analytics
                await analytics_manager.record_metric(
                    MetricTypes.MARKETPLACE_AUCTION_CREATED,
                    start_price,
                    {
                        'item_type': item.type.value,
                        'rarity': item.rarity.value,
                        'duration_hours': duration_hours
                    }
                )
                
                return auction
                
        except Exception as e:
            logger.error(f"Error creating auction: {str(e)}", exc_info=True)
            return None
    
    async def place_bid(
        self,
        auction_id: str,
        bidder_id: str,
        amount: float,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[Bid]:
        """Place a bid on an auction."""
        try:
            async with self._auction_lock:
                # Get auction
                auction = await self.get_auction(auction_id)
                if not auction or auction.status != AuctionStatus.ACTIVE:
                    return None
                
                # Validate bid
                if auction.current_bid:
                    if amount < auction.current_bid + auction.min_increment:
                        return None
                elif amount < auction.start_price:
                    return None
                
                # Create bid
                bid = Bid(
                    id=str(uuid4()),
                    auction_id=auction_id,
                    bidder_id=bidder_id,
                    amount=amount,
                    created_at=datetime.utcnow(),
                    metadata=metadata or {}
                )
                
                # Update auction
                auction.current_bid = amount
                auction.current_winner = bidder_id
                await self._store_auction(auction)
                
                # Store bid
                await self._store_bid(bid)
                
                # Record analytics
                await analytics_manager.record_metric(
                    MetricTypes.MARKETPLACE_BID_PLACED,
                    amount,
                    {
                        'auction_id': auction_id,
                        'previous_bid': auction.current_bid
                    }
                )
                
                return bid
                
        except Exception as e:
            logger.error(f"Error placing bid: {str(e)}", exc_info=True)
            return None
    
    async def get_auction(
        self,
        auction_id: str
    ) -> Optional[Auction]:
        """Get auction by ID."""
        try:
            key = f"marketplace:auction:{auction_id}"
            data = self._redis.get(key)
            if not data:
                return None
            
            auction_data = json.loads(data)
            return Auction(
                id=auction_data['id'],
                item_id=auction_data['item_id'],
                seller_id=auction_data['seller_id'],
                start_price=auction_data['start_price'],
                min_increment=auction_data['min_increment'],
                start_time=datetime.fromisoformat(auction_data['start_time']),
                end_time=datetime.fromisoformat(auction_data['end_time']),
                status=AuctionStatus(auction_data['status']),
                current_bid=auction_data.get('current_bid'),
                current_winner=auction_data.get('current_winner'),
                created_at=datetime.fromisoformat(auction_data['created_at']),
                metadata=auction_data.get('metadata', {})
            )
            
        except Exception as e:
            logger.error(f"Error getting auction: {str(e)}", exc_info=True)
            return None
    
    async def _store_auction(self, auction: Auction) -> None:
        """Store auction in Redis."""
        key = f"marketplace:auction:{auction.id}"
        self._redis.set(
            key,
            json.dumps({
                'id': auction.id,
                'item_id': auction.item_id,
                'seller_id': auction.seller_id,
                'start_price': auction.start_price,
                'min_increment': auction.min_increment,
                'start_time': auction.start_time.isoformat(),
                'end_time': auction.end_time.isoformat(),
                'status': auction.status.value,
                'current_bid': auction.current_bid,
                'current_winner': auction.current_winner,
                'created_at': auction.created_at.isoformat(),
                'metadata': auction.metadata
            })
        )
    
    async def _store_bid(self, bid: Bid) -> None:
        """Store bid in Redis."""
        key = f"marketplace:bid:{bid.id}"
        self._redis.set(
            key,
            json.dumps({
                'id': bid.id,
                'auction_id': bid.auction_id,
                'bidder_id': bid.bidder_id,
                'amount': bid.amount,
                'created_at': bid.created_at.isoformat(),
                'metadata': bid.metadata
            })
        )
    
    async def get_auction_bids(
        self,
        auction_id: str,
        limit: Optional[int] = None
    ) -> List[Bid]:
        """Get bids for an auction."""
        try:
            bids = []
            for key in self._redis.scan_iter(f"marketplace:bid:*"):
                try:
                    data = self._redis.get(key)
                    if data:
                        bid_data = json.loads(data)
                        if bid_data['auction_id'] == auction_id:
                            bids.append(Bid(
                                id=bid_data['id'],
                                auction_id=bid_data['auction_id'],
                                bidder_id=bid_data['bidder_id'],
                                amount=bid_data['amount'],
                                created_at=datetime.fromisoformat(bid_data['created_at']),
                                metadata=bid_data.get('metadata', {})
                            ))
                except Exception:
                    continue
            
            # Sort by amount descending
            bids.sort(key=lambda x: x.amount, reverse=True)
            
            return bids[:limit] if limit else bids
            
        except Exception as e:
            logger.error(f"Error getting auction bids: {str(e)}", exc_info=True)
            return []
    
    async def get_active_auctions(
        self,
        item_type: Optional[ItemType] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None
    ) -> List[Auction]:
        """Get active auctions with optional filters."""
        try:
            auctions = []
            for key in self._redis.scan_iter("marketplace:auction:*"):
                try:
                    data = self._redis.get(key)
                    if data:
                        auction_data = json.loads(data)
                        if auction_data['status'] != AuctionStatus.ACTIVE.value:
                            continue
                        
                        # Get item for type filtering
                        if item_type:
                            item = await self.get_item(auction_data['item_id'])
                            if not item or item.type != item_type:
                                continue
                        
                        current_price = auction_data.get('current_bid', auction_data['start_price'])
                        if min_price is not None and current_price < min_price:
                            continue
                        if max_price is not None and current_price > max_price:
                            continue
                        
                        auctions.append(Auction(
                            id=auction_data['id'],
                            item_id=auction_data['item_id'],
                            seller_id=auction_data['seller_id'],
                            start_price=auction_data['start_price'],
                            min_increment=auction_data['min_increment'],
                            start_time=datetime.fromisoformat(auction_data['start_time']),
                            end_time=datetime.fromisoformat(auction_data['end_time']),
                            status=AuctionStatus(auction_data['status']),
                            current_bid=auction_data.get('current_bid'),
                            current_winner=auction_data.get('current_winner'),
                            created_at=datetime.fromisoformat(auction_data['created_at']),
                            metadata=auction_data.get('metadata', {})
                        ))
                except Exception:
                    continue
            
            return sorted(auctions, key=lambda x: x.end_time)
            
        except Exception as e:
            logger.error(f"Error getting active auctions: {str(e)}", exc_info=True)
            return []
    
    async def _manage_auctions(self) -> None:
        """Background task to manage auction states."""
        while True:
            try:
                now = datetime.utcnow()
                
                # Find auctions that need updating
                for key in self._redis.scan_iter("marketplace:auction:*"):
                    try:
                        data = self._redis.get(key)
                        if data:
                            auction_data = json.loads(data)
                            auction = Auction(
                                id=auction_data['id'],
                                item_id=auction_data['item_id'],
                                seller_id=auction_data['seller_id'],
                                start_price=auction_data['start_price'],
                                min_increment=auction_data['min_increment'],
                                start_time=datetime.fromisoformat(auction_data['start_time']),
                                end_time=datetime.fromisoformat(auction_data['end_time']),
                                status=AuctionStatus(auction_data['status']),
                                current_bid=auction_data.get('current_bid'),
                                current_winner=auction_data.get('current_winner'),
                                created_at=datetime.fromisoformat(auction_data['created_at']),
                                metadata=auction_data.get('metadata', {})
                            )
                            
                            # Start pending auctions
                            if auction.status == AuctionStatus.PENDING and now >= auction.start_time:
                                auction.status = AuctionStatus.ACTIVE
                                await self._store_auction(auction)
                            
                            # End active auctions
                            elif auction.status == AuctionStatus.ACTIVE and now >= auction.end_time:
                                auction.status = AuctionStatus.ENDED
                                await self._store_auction(auction)
                                
                                # If there's a winner, create transaction
                                if auction.current_winner:
                                    item = await self.get_item(auction.item_id)
                                    if item:
                                        transaction = await self.create_transaction(
                                            item_id=auction.item_id,
                                            buyer_id=auction.current_winner,
                                            quantity=1,
                                            metadata={
                                                'auction_id': auction.id,
                                                'winning_bid': auction.current_bid
                                            }
                                        )
                                        if transaction:
                                            auction.status = AuctionStatus.COMPLETED
                                            await self._store_auction(auction)
                                        
                                # If no winner, make item available again
                                else:
                                    item = await self.get_item(auction.item_id)
                                    if item:
                                        item.is_active = True
                                        await self._store_item(item)
                    except Exception:
                        continue
                
            except Exception as e:
                logger.error(f"Error in auction manager: {str(e)}", exc_info=True)
            
            await asyncio.sleep(60)  # Check every minute

# Global marketplace instance
marketplace = Marketplace() 