from datetime import datetime
from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from bson import ObjectId
from flask import Blueprint, Request, Response, current_app, jsonify, request
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

from ...models.marketplace import MarketplaceItem, Transaction, Wallet
from ...services.auth import login_required

marketplace: Blueprint = Blueprint("marketplace", __name__)


@marketplace.route("/items", methods=["GET"])
def get_items() -> Response:
    try:
        category = request.args.get("category", type=str)
        sort_by = request.args.get("sortBy", type=str)
        search: Any = request.args.get("search", type=str)

        # Build query
        query: Dict[Any, Any] = {}
        if category:
            query["category"] = category
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
            ]

        # Build sort
        sort_params: List[Any] = []
        if sort_by:
            if sort_by == "price-asc":
                sort_params.append(("price", 1))
            elif sort_by == "price-desc":
                sort_params.append(("price", -1))
            elif sort_by == "newest":
                sort_params.append(("createdAt", -1))
            elif sort_by == "popular":
                sort_params.append(("purchaseCount", -1))

        items: Any = MarketplaceItem.find(query, sort=sort_params)
        return jsonify([item.to_dict() for item in items])

    except Exception as e:
        current_app.logger.error(f"Error fetching marketplace items: {str(e)}")
        return jsonify({"error": "Failed to fetch items"}), 500


@marketplace.route("/inventory", methods=["GET"])
@login_required
def get_inventory():
    try:
        user_id = request.user_id
        inventory: Any = MarketplaceItem.get_user_inventory(user_id)
        return jsonify([item.to_dict() for item in inventory])

    except Exception as e:
        current_app.logger.error(f"Error fetching inventory: {str(e)}")
        return jsonify({"error": "Failed to fetch inventory"}), 500


@marketplace.route("/transactions", methods=["GET"])
@login_required
def get_transactions():
    try:
        user_id = request.user_id
        transactions: Any = Transaction.find({"userId": ObjectId(user_id)})
        return jsonify([tx.to_dict() for tx in transactions])

    except Exception as e:
        current_app.logger.error(f"Error fetching transactions: {str(e)}")
        return jsonify({"error": "Failed to fetch transactions"}), 500


@marketplace.route("/wallet", methods=["GET"])
@login_required
def get_wallet():
    try:
        user_id = request.user_id
        wallet: Any = Wallet.find_one({"userId": ObjectId(user_id)})
        if not wallet:
            wallet: Any = Wallet.create({"userId": ObjectId(user_id), "balance": 0})
        return jsonify(wallet.to_dict())

    except Exception as e:
        current_app.logger.error(f"Error fetching wallet: {str(e)}")
        return jsonify({"error": "Failed to fetch wallet"}), 500


@marketplace.route("/purchase", methods=["POST"])
@login_required
def purchase_items():
    try:
        user_id = request.user_id
        items: Any = request.json.get("items", [])

        # Validate items and check stock
        total: int = 0
        items_to_update: List[Any] = []
        for item in items:
            marketplace_item = MarketplaceItem.find_one({"_id": ObjectId(item["id"])})
            if not marketplace_item:
                return jsonify({"error": f"Item {item['id']} not found"}), 404
            if marketplace_item.stock < item["quantity"]:
                return (
                    jsonify(
                        {"error": f"Insufficient stock for {marketplace_item.name}"}
                    ),
                    400,
                )

            total += marketplace_item.price * item["quantity"]
            items_to_update.append(
                {"item": marketplace_item, "quantity": item["quantity"]}
            )

        # Check wallet balance
        wallet: Any = Wallet.find_one({"userId": ObjectId(user_id)})
        if not wallet or wallet.balance < total:
            return jsonify({"error": "Insufficient funds"}), 400

        # Process transaction
        transaction: Any = Transaction.create(
            {
                "userId": ObjectId(user_id),
                "items": [
                    {
                        "itemId": str(item["item"]._id),
                        "quantity": item["quantity"],
                        "priceAtPurchase": item["item"].price,
                    }
                    for item in items_to_update
                ],
                "total": total,
                "status": "completed",
                "timestamp": datetime.utcnow(),
                "paymentMethod": "wallet",
            }
        )

        # Update stock and wallet
        for item_update in items_to_update:
            item_update["item"].stock -= item_update["quantity"]
            item_update["item"].purchaseCount = (
                item_update["item"].purchaseCount or 0
            ) + 1
            item_update["item"].save()

        wallet.balance -= total
        wallet.save()

        return jsonify(
            {
                "success": True,
                "transactionId": str(transaction._id),
                "items": items,
                "total": total,
                "newBalance": wallet.balance,
                "timestamp": transaction.timestamp.isoformat(),
            }
        )

    except Exception as e:
        current_app.logger.error(
            f"Error processing purchase -> Response -> Any: {str(e)}"
        )
        return jsonify({"error": "Failed to process purchase"}), 500


@marketplace.route("/items/<item_id>", methods=["GET"])
def get_item(item_id):
    try:
        item = MarketplaceItem.find_one({"_id": ObjectId(item_id)})
        if not item:
            return jsonify({"error": "Item not found"}), 404
        return jsonify(item.to_dict())

    except Exception as e:
        current_app.logger.error(f"Error fetching item -> Response -> Any: {str(e)}")
        return jsonify({"error": "Failed to fetch item"}), 500


@marketplace.route("/items/<item_id>/preview", methods=["GET"])
def get_item_preview(item_id):
    try:
        item = MarketplaceItem.find_one({"_id": ObjectId(item_id)})
        if not item or not item.preview:
            return jsonify({"error": "Preview not available"}), 404
        return jsonify({"preview": item.preview})

    except Exception as e:
        current_app.logger.error(f"Error fetching item preview: {str(e)}")
        return jsonify({"error": "Failed to fetch item preview"}), 500
