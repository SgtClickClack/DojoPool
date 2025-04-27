from datetime import datetime

from flask import Blueprint, current_app, jsonify, request, g
from sqlalchemy import or_, desc, asc

from ...models.marketplace import MarketplaceItem, Transaction, Wallet, UserInventory
from ...services.auth import login_required
from ...core.extensions import db # Import the SQLAlchemy db session
from ...core.decorators import admin_required # Assuming this exists

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
        return jsonify([item.to_dict() for item in items])

    except Exception as e:
        current_app.logger.error(f"Error fetching marketplace items: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to fetch items"}), 500


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

        return jsonify(response_data)

    except Exception as e:
        current_app.logger.error(f"Error fetching inventory: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to fetch inventory"}), 500


@marketplace.route("/transactions", methods=["GET"])
@login_required
def get_transactions(user):
    try:
        user_id = user.id # Assuming user object passed by decorator
        transactions = db.session.query(Transaction).filter(Transaction.user_id == user_id).order_by(Transaction.created_at.desc()).all()
        return jsonify([tx.to_dict() for tx in transactions])

    except Exception as e:
        current_app.logger.error(f"Error fetching transactions: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to fetch transactions"}), 500


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
        return jsonify(wallet.to_dict())
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error fetching wallet: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to fetch wallet"}), 500


@marketplace.route("/purchase", methods=["POST"])
@login_required
def purchase_items(user):
    try:
        user_id = user.id
        items_to_purchase = request.json.get("items", [])
        if not items_to_purchase:
            return jsonify({"error": "No items provided"}), 400
        wallet = db.session.query(Wallet).filter(Wallet.user_id == user_id).first()
        if not wallet or not wallet.is_active:
            return jsonify({"error": "Wallet not found or inactive"}), 400
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
                return jsonify({"error": "Invalid item ID or quantity"}), 400

            marketplace_item = marketplace_items_dict.get(item_id)

            if not marketplace_item:
                db.session.rollback()
                return jsonify({"error": f"Item {item_id} not found"}), 404
            if marketplace_item.stock < quantity:
                db.session.rollback()
                return jsonify({"error": f"Insufficient stock for {marketplace_item.name}"}), 400

            total_cost += marketplace_item.price * quantity
            item_details_map[item_id] = {"item": marketplace_item, "quantity": quantity}

        if wallet.balance < total_cost:
            return jsonify({"error": "Insufficient balance"}), 400
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
        return jsonify({
            "success": True,
            "transactionId": transaction.id,
            "items": items_to_purchase,
            "total": total_cost,
            "newBalance": wallet.balance,
            "timestamp": transaction.created_at.isoformat() if transaction.created_at else None,
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error processing purchase: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to process purchase"}), 500


@marketplace.route("/items/<int:item_id>", methods=["GET"])
def get_item(item_id):
    try:
        item = db.session.query(MarketplaceItem).get(item_id)
        if not item:
            return jsonify({"error": "Item not found"}), 404
        return jsonify(item.to_dict())

    except Exception as e:
        current_app.logger.error(f"Error fetching item {item_id}: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to fetch item"}), 500


# Preview route might not need changes if item.preview is a simple field
@marketplace.route("/items/<int:item_id>/preview", methods=["GET"])
def get_item_preview(item_id):
    try:
        item = db.session.query(MarketplaceItem).get(item_id)
        if not item:
             return jsonify({"error": "Item not found"}), 404
        # Assuming preview_url is the field to return
        if not item.preview_url:
            return jsonify({"error": "Preview not available"}), 404
        return jsonify({"preview_url": item.preview_url})

    except Exception as e:
        current_app.logger.error(f"Error fetching item preview {item_id}: {str(e)}", exc_info=True)
        current_app.logger.error(f"Error fetching item preview: {str(e)}")
        return jsonify({"error": "Failed to fetch item preview"}), 500

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
        return jsonify({"error": "Wallet not found for user"}), 404

    try:
        wallet.freeze(reason=reason, admin_user_id=admin_user_id)
        return jsonify({"success": True, "message": f"Wallet for user {user_id} frozen.", "status": wallet.is_active}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error freezing wallet {user_id}: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to freeze wallet"}), 500

@marketplace.route("/admin/wallet/<int:user_id>/reactivate", methods=["POST"])
@login_required
@admin_required
def admin_reactivate_wallet(user_id):
    """Admin endpoint to reactivate a user's wallet."""
    reason = request.json.get("reason", "Admin action")
    admin_user_id = str(g.user.id) # Get admin ID from context

    wallet = db.session.query(Wallet).filter_by(user_id=user_id).first()
    if not wallet:
        return jsonify({"error": "Wallet not found for user"}), 404

    try:
        wallet.reactivate(reason=reason, admin_user_id=admin_user_id)
        return jsonify({"success": True, "message": f"Wallet for user {user_id} reactivated.", "status": wallet.is_active}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error reactivating wallet {user_id}: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to reactivate wallet"}), 500

@marketplace.route("/admin/wallet/<int:user_id>/audit", methods=["GET"])
@login_required
@admin_required
def admin_get_wallet_audit(user_id):
    """Admin endpoint to get the audit trail for a user's wallet."""
    wallet = db.session.query(Wallet).filter_by(user_id=user_id).first()
    if not wallet:
        return jsonify({"error": "Wallet not found for user"}), 404

    try:
        # Potential parameters for filtering audit trail (start_date, end_date)
        start_date_str = request.args.get("start_date")
        end_date_str = request.args.get("end_date")
        start_time = datetime.fromisoformat(start_date_str) if start_date_str else None
        end_time = datetime.fromisoformat(end_date_str) if end_date_str else None

        audit_trail = wallet.get_audit_trail(start_time=start_time, end_time=end_time)

        # Log the audit access by the admin
        admin_user_id = str(g.user.id)
        wallet._log_wallet_event(
            event_type=AuditEventType.WALLET_AUDIT,
            action="Wallet Audit Accessed by Admin",
            status="success",
            details={"admin_user_id": admin_user_id, "filters": {"start_time": start_date_str, "end_time": end_date_str}}
        )

        return jsonify(audit_trail), 200
    except ValueError as ve:
         return jsonify({"error": f"Invalid date format: {ve}"}), 400
    except Exception as e:
        current_app.logger.error(f"Error fetching audit trail for wallet {user_id}: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to fetch audit trail"}), 500
