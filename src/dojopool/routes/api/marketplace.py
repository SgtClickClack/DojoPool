from datetime import datetime

from flask import Blueprint, current_app, jsonify, request, g
from sqlalchemy import or_, desc, asc

from ...models.marketplace import MarketplaceItem, Transaction, Wallet, UserInventory
from dojopool.auth.decorators import login_required, admin_required
from ...core.extensions import db # Import the SQLAlchemy db session

# Imports are correct, using unified models
# --- All API endpoint logic below should now use the unified Wallet and Transaction models ---
# No changes needed to import section, but ensure all model usages match new fields and relationships.

marketplace = Blueprint("marketplace", __name__)

# get_wallet: already uses Wallet, but ensure field names and creation logic match unified model
# purchase_items: ensure wallet/transaction logic aligns with unified model (fields, relationships, creation)
# get_transactions: ensure Transaction model usage matches unified fields
# get_inventory: no changes needed for wallet, but ensure any transaction/inventory logic matches unified model

# (No code changes needed here for import, but all endpoint logic must be checked for compatibility. See next steps for refactor.)

@marketplace.route("/items", methods=["GET"])
def get_items():
    try:
        category = request.args.get("category")
        sort_by = request.args.get("sortBy")
        search = request.args.get("search")

        # Build query
        query = db.session.query(MarketplaceItem)

        if category:
            query = query.filter(MarketplaceItem.category == category)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    MarketplaceItem.name.ilike(search_term),
                    MarketplaceItem.description.ilike(search_term)
                )
            )

        # Build sort
        if sort_by:
            if sort_by == "price-asc":
                query = query.order_by(asc(MarketplaceItem.price))
            elif sort_by == "price-desc":
                query = query.order_by(desc(MarketplaceItem.price))
            elif sort_by == "newest":
                query = query.order_by(desc(MarketplaceItem.created_at))
            elif sort_by == "popular":
                query = query.order_by(desc(MarketplaceItem.purchase_count))
        else:
             query = query.order_by(desc(MarketplaceItem.created_at)) # Default sort

        items = query.all()
        return [item.to_dict() for item in items], 200

    except Exception as e:
        current_app.logger.error(f"Error fetching marketplace items: {str(e)}", exc_info=True)
        return {"error": "Failed to fetch items"}, 500


@marketplace.route("/inventory", methods=["GET"])
@login_required
def get_inventory(user):
    try:
        # Assuming user object is passed by @login_required decorator or available in context
        # If not, adjust user_id retrieval (e.g., user_id = request.user_id)
        user_id = user.id
        # Fetch inventory items directly, joining with MarketplaceItem if needed for details
        inventory_items = db.session.query(UserInventory).filter(UserInventory.user_id == user_id).all()

        # Prepare response (you might need item details from MarketplaceItem)
        response_data = []
        for inv_item in inventory_items:
            item_details = db.session.query(MarketplaceItem).get(inv_item.item_id)
            if item_details:
                item_data = item_details.to_dict()
                item_data['inventory_quantity'] = inv_item.quantity # Add quantity from inventory
                item_data['inventory_id'] = inv_item.id
                response_data.append(item_data)

        return response_data, 200

    except Exception as e:
        current_app.logger.error(f"Error fetching inventory: {str(e)}", exc_info=True)
        return {"error": "Failed to fetch inventory"}, 500


@marketplace.route("/transactions", methods=["GET"])
@login_required
def get_transactions(user):
    try:
        user_id = user.id # Assuming user object passed by decorator
        transactions = db.session.query(Transaction).filter(Transaction.user_id == user_id).order_by(Transaction.created_at.desc()).all()
        return [tx.to_dict() for tx in transactions], 200

    except Exception as e:
        current_app.logger.error(f"Error fetching transactions: {str(e)}", exc_info=True)
        return {"error": "Failed to fetch transactions"}, 500


@marketplace.route("/wallet", methods=["GET"])
@login_required
def get_wallet(user):
    try:
        user_id = user.id
        wallet = db.session.query(Wallet).filter(Wallet.user_id == user_id).first()
        if not wallet:
            wallet = Wallet(user_id=user_id, balance=0.0, currency='DP', is_active=True)
            db.session.add(wallet)
            db.session.commit()
            wallet = db.session.query(Wallet).filter(Wallet.user_id == user_id).first()
        return wallet.to_dict(), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error fetching wallet: {str(e)}", exc_info=True)
        return {"error": "Failed to fetch wallet"}, 500


@marketplace.route("/purchase", methods=["POST"])
@login_required
def purchase_items(user):
    try:
        user_id = user.id
        items_to_purchase = request.json.get("items", [])
        if not items_to_purchase:
            return {"error": "No items provided"}, 400
        wallet = db.session.query(Wallet).filter(Wallet.user_id == user_id).first()
        if not wallet or not wallet.is_active:
            return {"error": "Wallet not found or inactive"}, 400
        total_cost = 0
        item_details_map = {}
        item_ids = [item["id"] for item in items_to_purchase]
        marketplace_items = db.session.query(MarketplaceItem).filter(MarketplaceItem.id.in_(item_ids)).all()
        marketplace_items_dict = {item.id: item for item in marketplace_items}

        for item_req in items_to_purchase:
            item_id = item_req.get("id")
            quantity = item_req.get("quantity", 1)

            if not item_id or quantity <= 0:
                db.session.rollback()
                return {"error": "Invalid item ID or quantity"}, 400

            marketplace_item = marketplace_items_dict.get(item_id)

            if not marketplace_item:
                db.session.rollback()
                return {"error": f"Item {item_id} not found"}, 404
            if marketplace_item.stock < quantity:
                db.session.rollback()
                return {"error": f"Insufficient stock for {marketplace_item.name}"}, 400

            total_cost += marketplace_item.price * quantity
            item_details_map[item_id] = {"item": marketplace_item, "quantity": quantity}

        if wallet.balance < total_cost:
            return {"error": "Insufficient balance"}, 400
        # Deduct from wallet
        wallet.balance -= total_cost
        db.session.add(wallet)
        db.session.flush()
        # Create transaction(s)
        transaction = Transaction(
            wallet_id=wallet.id,
            user_id=user_id,
            amount=total_cost,
            currency=wallet.currency,
            type="purchase",
            status="completed",
            description=f"Purchase of items: {item_ids}",
            reference_id=None
        )
        db.session.add(transaction)
        db.session.commit()
        return {
            "success": True,
            "transactionId": transaction.id,
            "items": items_to_purchase,
            "total": total_cost,
            "newBalance": wallet.balance,
            "timestamp": transaction.created_at.isoformat() if transaction.created_at else None,
        }, 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error processing purchase: {str(e)}", exc_info=True)
        return {"error": "Failed to process purchase"}, 500


@marketplace.route("/items/<int:item_id>", methods=["GET"])
def get_item(item_id):
    try:
        item = db.session.query(MarketplaceItem).get(item_id)
        if not item:
            return {"error": "Item not found"}, 404
        return item.to_dict(), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching item {item_id}: {str(e)}", exc_info=True)
        return {"error": "Failed to fetch item"}, 500


# Preview route might not need changes if item.preview is a simple field
@marketplace.route("/items/<int:item_id>/preview", methods=["GET"])
def get_item_preview(item_id):
    try:
        item = db.session.query(MarketplaceItem).get(item_id)
        if not item:
             return {"error": "Item not found"}, 404
        # Assuming preview_url is the field to return
        if not item.preview_url:
            return {"error": "Preview not available"}, 404
        return {"preview_url": item.preview_url}, 200

    except Exception as e:
        current_app.logger.error(f"Error fetching item preview {item_id}: {str(e)}", exc_info=True)
        current_app.logger.error(f"Error fetching item preview: {str(e)}")
        return {"error": "Failed to fetch item preview"}, 500

# --- Admin Wallet Routes ---

@marketplace.route("/admin/wallet/<int:user_id>/freeze", methods=["POST"])
@login_required
@admin_required
def admin_freeze_wallet(user_id):
    """Admin endpoint to freeze a user's wallet."""
    reason = request.json.get("reason", "Admin action")
    admin_user_id = str(g.user.id) # Get admin ID from context (adjust if needed)

    wallet = db.session.query(Wallet).filter_by(user_id=user_id).first()
    if not wallet:
        return {"error": "Wallet not found for user"}, 404

    try:
        wallet.freeze(reason=reason, admin_user_id=admin_user_id)
        return {"success": True, "message": f"Wallet for user {user_id} frozen.", "status": wallet.is_active}, 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error freezing wallet {user_id}: {str(e)}", exc_info=True)
        return {"error": "Failed to freeze wallet"}, 500

@marketplace.route("/admin/wallet/<int:user_id>/reactivate", methods=["POST"])
@login_required
@admin_required
def admin_reactivate_wallet(user_id):
    """Admin endpoint to reactivate a user's wallet."""
    reason = request.json.get("reason", "Admin action")
    admin_user_id = str(g.user.id) # Get admin ID from context

    wallet = db.session.query(Wallet).filter_by(user_id=user_id).first()
    if not wallet:
        return {"error": "Wallet not found for user"}, 404

    try:
        wallet.reactivate(reason=reason, admin_user_id=admin_user_id)
        return {"success": True, "message": f"Wallet for user {user_id} reactivated.", "status": wallet.is_active}, 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error reactivating wallet {user_id}: {str(e)}", exc_info=True)
        return {"error": "Failed to reactivate wallet"}, 500

@marketplace.route("/admin/wallet/<int:user_id>/audit", methods=["GET"])
@login_required
@admin_required
def admin_get_wallet_audit(user_id):
    """Admin endpoint to get the audit trail for a user's wallet."""
    wallet = db.session.query(Wallet).filter_by(user_id=user_id).first()
    if not wallet:
        return {"error": "Wallet not found for user"}, 404

    try:
        # Potential parameters for filtering audit trail (start_date, end_date)
        start_date_str = request.args.get("start_date")
        end_date_str = request.args.get("end_date")
        start_time = datetime.fromisoformat(start_date_str) if start_date_str else None
        end_time = datetime.fromisoformat(end_date_str) if end_date_str else None

        audit_trail = wallet.get_audit_trail(start_date=start_time, end_date=end_time)
        return {"audit_trail": audit_trail}, 200
    except Exception as e:
        current_app.logger.error(f"Error fetching wallet audit {user_id}: {str(e)}", exc_info=True)
        return {"error": "Failed to fetch wallet audit"}, 500

@marketplace.route("/wallet/stats", methods=["GET"])
@login_required
def get_wallet_stats(user):
    try:
        user_id = user.id
        wallet = db.session.query(Wallet).filter(Wallet.user_id == user_id).first()
        if not wallet:
            return {"error": "Wallet not found"}, 404
        # Aggregate stats
        transactions = db.session.query(Transaction).filter(Transaction.user_id == user_id).all()
        total_transactions = len(transactions)
        total_volume = sum(abs(tx.amount) for tx in transactions)
        total_incoming = sum(tx.amount for tx in transactions if tx.amount > 0)
        total_outgoing = sum(-tx.amount for tx in transactions if tx.amount < 0)
        # Rewards summary (if rewards are tracked in transactions)
        rewards = {}
        for tx in transactions:
            if tx.type == "reward":
                key = tx.description or "reward"
                if key not in rewards:
                    rewards[key] = {"count": 0, "total_amount": 0}
                rewards[key]["count"] += 1
                rewards[key]["total_amount"] += tx.amount
        stats = {
            "total_transactions": total_transactions,
            "total_volume": total_volume,
            "total_incoming": total_incoming,
            "total_outgoing": total_outgoing,
            "rewards": rewards
        }
        return stats, 200
    except Exception as e:
        current_app.logger.error(f"Error fetching wallet stats: {str(e)}", exc_info=True)
        return {"error": "Failed to fetch wallet stats"}, 500

@marketplace.route("/wallet/transfer", methods=["POST"])
@login_required
def transfer_coins(user):
    try:
        user_id = user.id
        data = request.json
        recipient_id = data.get("recipient_id")
        amount = data.get("amount")
        description = data.get("description", "Transfer")

        if not recipient_id or not amount:
            return {"error": "Recipient ID and amount are required"}, 400

        if amount <= 0:
            return {"error": "Amount must be positive"}, 400

        # Get sender's wallet
        sender_wallet = db.session.query(Wallet).filter(Wallet.user_id == user_id).first()
        if not sender_wallet or not sender_wallet.is_active:
            return {"error": "Sender wallet not found or inactive"}, 400

        # Get recipient's wallet
        recipient_wallet = db.session.query(Wallet).filter(Wallet.user_id == recipient_id).first()
        if not recipient_wallet or not recipient_wallet.is_active:
            return {"error": "Recipient wallet not found or inactive"}, 400

        if sender_wallet.balance < amount:
            return {"error": "Insufficient balance"}, 400

        # Perform transfer
        sender_wallet.balance -= amount
        recipient_wallet.balance += amount

        # Create transactions
        sender_transaction = Transaction(
            wallet_id=sender_wallet.id,
            user_id=user_id,
            amount=amount,
            currency=sender_wallet.currency,
            type="transfer_out",
            status="completed",
            description=f"Transfer to user {recipient_id}: {description}",
            reference_id=None
        )

        recipient_transaction = Transaction(
            wallet_id=recipient_wallet.id,
            user_id=recipient_id,
            amount=amount,
            currency=recipient_wallet.currency,
            type="transfer_in",
            status="completed",
            description=f"Transfer from user {user_id}: {description}",
            reference_id=None
        )

        db.session.add_all([sender_transaction, recipient_transaction])
        db.session.commit()

        return {
            "success": True,
            "senderTransactionId": sender_transaction.id,
            "recipientTransactionId": recipient_transaction.id,
            "amount": amount,
            "newSenderBalance": sender_wallet.balance,
            "newRecipientBalance": recipient_wallet.balance,
            "timestamp": sender_transaction.created_at.isoformat() if sender_transaction.created_at else None,
        }, 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error processing transfer: {str(e)}", exc_info=True)
        return {"error": "Failed to process transfer"}, 500
