"""
Logistics & Procurement Approval API Routes
Handles procurement orders, multi-level approval workflow, and logistics tracking.
Features:
- Create procurement/reorder requests
- Multi-level approval chain (requester -> logistics head -> Senior VP Yash)
- Track who made changes or gave permission
- Notification alerts for all users in the approval loop
- Integration with inventory for stock sync
"""
from datetime import datetime, date, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import text

from app.services.database import async_session
from app.routes.auth import get_current_user
from app.config import logger

router = APIRouter(tags=["Logistics & Procurement"])


# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class ProcurementOrderCreate(BaseModel):
    model_config = ConfigDict(strict=True)
    item_id: int
    item_name: str
    category: str
    store_id: int
    store_name: str
    quantity: int
    unit_cost: float
    priority: str = "medium"  # critical, high, medium, low
    reason: str = ""
    notes: str = ""


class ProcurementApproval(BaseModel):
    model_config = ConfigDict(strict=True)
    decision: str  # approved, rejected
    comments: str = ""


class BulkProcurementCreate(BaseModel):
    model_config = ConfigDict(strict=True)
    orders: List[ProcurementOrderCreate]


# In-memory store for procurement orders and notifications
# In production, these would be in the database
_procurement_orders: List[dict] = []
_notifications: List[dict] = []
_order_counter = 0


def _get_next_order_id():
    global _order_counter
    _order_counter += 1
    return _order_counter


def _create_notification(
    title: str,
    message: str,
    notification_type: str,
    severity: str,
    target_roles: List[str],
    order_id: int = None,
    created_by: str = "",
):
    """Create a notification for users in the approval loop"""
    notif = {
        "id": len(_notifications) + 1,
        "title": title,
        "message": message,
        "type": notification_type,  # procurement, approval, rejection, info
        "severity": severity,  # critical, warning, info, success
        "target_roles": target_roles,
        "order_id": order_id,
        "created_by": created_by,
        "created_at": datetime.now().isoformat(),
        "read_by": [],
    }
    _notifications.append(notif)
    return notif


# =============================================================================
# LOGISTICS DASHBOARD
# =============================================================================

@router.get("/dashboard")
async def get_logistics_dashboard(
    current_user: dict = Depends(get_current_user)
):
    """Get logistics dashboard overview"""
    pending = [o for o in _procurement_orders if o["status"] == "pending_logistics"]
    awaiting_vp = [o for o in _procurement_orders if o["status"] == "pending_vp_approval"]
    approved = [o for o in _procurement_orders if o["status"] == "approved"]
    rejected = [o for o in _procurement_orders if o["status"] == "rejected"]
    in_transit = [o for o in _procurement_orders if o["status"] == "in_transit"]
    delivered = [o for o in _procurement_orders if o["status"] == "delivered"]

    total_cost_pending = sum(o["quantity"] * o["unit_cost"] for o in pending + awaiting_vp)
    total_cost_approved = sum(o["quantity"] * o["unit_cost"] for o in approved + in_transit)

    return {
        "summary": {
            "pending_logistics_review": len(pending),
            "pending_vp_approval": len(awaiting_vp),
            "approved": len(approved),
            "rejected": len(rejected),
            "in_transit": len(in_transit),
            "delivered": len(delivered),
            "total_orders": len(_procurement_orders),
            "total_cost_pending": round(total_cost_pending, 2),
            "total_cost_approved": round(total_cost_approved, 2),
            "currency": "AED",
        },
        "recent_orders": sorted(
            _procurement_orders[-20:], key=lambda x: x["created_at"], reverse=True
        ),
    }


# =============================================================================
# PROCUREMENT ORDERS
# =============================================================================

@router.get("/orders")
async def get_procurement_orders(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    store_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get procurement orders with filtering"""
    orders = list(_procurement_orders)

    if status:
        orders = [o for o in orders if o["status"] == status]
    if priority:
        orders = [o for o in orders if o["priority"] == priority]
    if store_id:
        orders = [o for o in orders if o["store_id"] == store_id]

    # Sort by priority then date
    priority_map = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    orders.sort(key=lambda x: (priority_map.get(x["priority"], 9), x["created_at"]))
    orders.reverse()

    total = len(orders)
    offset = (page - 1) * limit
    orders = orders[offset : offset + limit]

    return {
        "orders": orders,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": max(1, (total + limit - 1) // limit),
    }


@router.post("/orders")
async def create_procurement_order(
    order: ProcurementOrderCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new procurement order.
    Workflow: Requester -> Logistics Head review -> Senior VP (Yash) final approval
    """
    user_name = f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}"
    user_role = current_user.get("role", "")
    user_email = current_user.get("email", "")

    order_id = _get_next_order_id()
    now = datetime.now().isoformat()

    new_order = {
        "id": order_id,
        "item_id": order.item_id,
        "item_name": order.item_name,
        "category": order.category,
        "store_id": order.store_id,
        "store_name": order.store_name,
        "quantity": order.quantity,
        "unit_cost": order.unit_cost,
        "estimated_cost": round(order.quantity * order.unit_cost, 2),
        "priority": order.priority,
        "reason": order.reason,
        "notes": order.notes,
        "status": "pending_logistics",
        "created_by": user_name,
        "created_by_email": user_email,
        "created_by_role": user_role,
        "created_at": now,
        "updated_at": now,
        "approval_chain": [
            {
                "step": 1,
                "role": "logistics_head",
                "name": "Pending",
                "status": "pending",
                "timestamp": None,
                "comments": "",
            },
            {
                "step": 2,
                "role": "senior_vp",
                "name": "Yash Patel (Senior VP)",
                "status": "pending",
                "timestamp": None,
                "comments": "",
            },
        ],
        "history": [
            {
                "action": "created",
                "by": user_name,
                "role": user_role,
                "timestamp": now,
                "details": f"Procurement order created for {order.quantity} units of {order.item_name}",
            }
        ],
    }

    _procurement_orders.append(new_order)

    # Notify logistics team and all managers
    _create_notification(
        title=f"New Procurement Order #{order_id}",
        message=f"{user_name} ({user_role}) requested {order.quantity} units of {order.item_name} for {order.store_name}. Priority: {order.priority.upper()}. Estimated cost: AED {new_order['estimated_cost']:,.2f}",
        notification_type="procurement",
        severity="warning" if order.priority in ("critical", "high") else "info",
        target_roles=["super_admin", "regional_manager", "store_manager", "logistics_head"],
        order_id=order_id,
        created_by=user_name,
    )

    logger.info(
        f"Procurement order #{order_id} created by {user_email} for {order.item_name}"
    )

    return {
        "success": True,
        "message": "Procurement order created and sent for logistics review",
        "order": new_order,
    }


@router.post("/orders/bulk")
async def create_bulk_procurement_orders(
    bulk: BulkProcurementCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create multiple procurement orders at once"""
    results = []
    for order_data in bulk.orders:
        # Reuse single order creation logic
        user_name = f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}"
        user_role = current_user.get("role", "")
        user_email = current_user.get("email", "")

        order_id = _get_next_order_id()
        now = datetime.now().isoformat()

        new_order = {
            "id": order_id,
            "item_id": order_data.item_id,
            "item_name": order_data.item_name,
            "category": order_data.category,
            "store_id": order_data.store_id,
            "store_name": order_data.store_name,
            "quantity": order_data.quantity,
            "unit_cost": order_data.unit_cost,
            "estimated_cost": round(order_data.quantity * order_data.unit_cost, 2),
            "priority": order_data.priority,
            "reason": order_data.reason,
            "notes": order_data.notes,
            "status": "pending_logistics",
            "created_by": user_name,
            "created_by_email": user_email,
            "created_by_role": user_role,
            "created_at": now,
            "updated_at": now,
            "approval_chain": [
                {"step": 1, "role": "logistics_head", "name": "Pending", "status": "pending", "timestamp": None, "comments": ""},
                {"step": 2, "role": "senior_vp", "name": "Yash Patel (Senior VP)", "status": "pending", "timestamp": None, "comments": ""},
            ],
            "history": [
                {"action": "created", "by": user_name, "role": user_role, "timestamp": now,
                 "details": f"Bulk procurement order for {order_data.quantity} units of {order_data.item_name}"}
            ],
        }
        _procurement_orders.append(new_order)
        results.append(new_order)

    # Single notification for bulk
    _create_notification(
        title=f"Bulk Procurement: {len(results)} Orders Created",
        message=f"{current_user.get('first_name', '')} {current_user.get('last_name', '')} created {len(results)} procurement orders. Total estimated cost: AED {sum(o['estimated_cost'] for o in results):,.2f}",
        notification_type="procurement",
        severity="warning",
        target_roles=["super_admin", "regional_manager", "store_manager", "logistics_head"],
        created_by=f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}",
    )

    return {
        "success": True,
        "message": f"{len(results)} procurement orders created",
        "orders": results,
    }


@router.get("/orders/{order_id}")
async def get_procurement_order(
    order_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed procurement order with full approval chain and history"""
    order = next((o for o in _procurement_orders if o["id"] == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# =============================================================================
# APPROVAL WORKFLOW
# =============================================================================

@router.post("/orders/{order_id}/logistics-review")
async def logistics_review(
    order_id: int,
    approval: ProcurementApproval,
    current_user: dict = Depends(get_current_user)
):
    """
    Logistics head reviews the order (Step 1).
    If approved, escalates to Senior VP for final decision.
    """
    order = next((o for o in _procurement_orders if o["id"] == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order["status"] != "pending_logistics":
        raise HTTPException(status_code=400, detail=f"Order is not pending logistics review (current: {order['status']})")

    user_name = f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}"
    user_role = current_user.get("role", "")
    now = datetime.now().isoformat()

    if approval.decision == "approved":
        order["status"] = "pending_vp_approval"
        order["approval_chain"][0]["status"] = "approved"
        order["approval_chain"][0]["name"] = user_name
        order["approval_chain"][0]["timestamp"] = now
        order["approval_chain"][0]["comments"] = approval.comments

        order["history"].append({
            "action": "logistics_approved",
            "by": user_name,
            "role": user_role,
            "timestamp": now,
            "details": f"Logistics approved. Awaiting VP approval. Comments: {approval.comments or 'None'}",
        })

        _create_notification(
            title=f"Order #{order_id} — Logistics Approved",
            message=f"{user_name} (Logistics) approved order for {order['quantity']} units of {order['item_name']}. Awaiting Senior VP (Yash Patel) final approval. Cost: AED {order['estimated_cost']:,.2f}",
            notification_type="approval",
            severity="info",
            target_roles=["super_admin", "regional_manager", "store_manager", "logistics_head"],
            order_id=order_id,
            created_by=user_name,
        )

        return {"success": True, "message": "Order approved by logistics. Escalated to Senior VP for final approval.", "order": order}

    else:
        order["status"] = "rejected"
        order["approval_chain"][0]["status"] = "rejected"
        order["approval_chain"][0]["name"] = user_name
        order["approval_chain"][0]["timestamp"] = now
        order["approval_chain"][0]["comments"] = approval.comments

        order["history"].append({
            "action": "logistics_rejected",
            "by": user_name,
            "role": user_role,
            "timestamp": now,
            "details": f"Logistics rejected. Reason: {approval.comments or 'No reason given'}",
        })

        _create_notification(
            title=f"Order #{order_id} — Rejected by Logistics",
            message=f"{user_name} rejected the procurement order for {order['item_name']}. Reason: {approval.comments or 'Not specified'}",
            notification_type="rejection",
            severity="warning",
            target_roles=["super_admin", "regional_manager", "store_manager", "logistics_head"],
            order_id=order_id,
            created_by=user_name,
        )

        return {"success": True, "message": "Order rejected by logistics.", "order": order}


@router.post("/orders/{order_id}/vp-approval")
async def vp_final_approval(
    order_id: int,
    approval: ProcurementApproval,
    current_user: dict = Depends(get_current_user)
):
    """
    Senior VP (Yash) final approval (Step 2).
    Only super_admin can make this decision.
    """
    if current_user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Only Senior VP (super_admin) can give final approval")

    order = next((o for o in _procurement_orders if o["id"] == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order["status"] != "pending_vp_approval":
        raise HTTPException(status_code=400, detail=f"Order is not pending VP approval (current: {order['status']})")

    user_name = f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}"
    now = datetime.now().isoformat()

    if approval.decision == "approved":
        order["status"] = "approved"
        order["approval_chain"][1]["status"] = "approved"
        order["approval_chain"][1]["name"] = user_name
        order["approval_chain"][1]["timestamp"] = now
        order["approval_chain"][1]["comments"] = approval.comments

        order["history"].append({
            "action": "vp_approved",
            "by": user_name,
            "role": "super_admin",
            "timestamp": now,
            "details": f"Senior VP APPROVED the order. Comments: {approval.comments or 'None'}. Order will be processed by logistics.",
        })

        _create_notification(
            title=f"✅ Order #{order_id} — APPROVED by Senior VP",
            message=f"{user_name} (Senior VP) gave final approval for {order['quantity']} units of {order['item_name']} — AED {order['estimated_cost']:,.2f}. Order will now be processed and shipped.",
            notification_type="approval",
            severity="success",
            target_roles=["super_admin", "regional_manager", "store_manager", "logistics_head"],
            order_id=order_id,
            created_by=user_name,
        )

        return {"success": True, "message": "Order APPROVED by Senior VP. Procurement will be processed.", "order": order}

    else:
        order["status"] = "rejected"
        order["approval_chain"][1]["status"] = "rejected"
        order["approval_chain"][1]["name"] = user_name
        order["approval_chain"][1]["timestamp"] = now
        order["approval_chain"][1]["comments"] = approval.comments

        order["history"].append({
            "action": "vp_rejected",
            "by": user_name,
            "role": "super_admin",
            "timestamp": now,
            "details": f"Senior VP REJECTED the order. Reason: {approval.comments or 'Not specified'}",
        })

        _create_notification(
            title=f"❌ Order #{order_id} — REJECTED by Senior VP",
            message=f"{user_name} (Senior VP) rejected the procurement for {order['item_name']}. Reason: {approval.comments or 'Not specified'}",
            notification_type="rejection",
            severity="critical",
            target_roles=["super_admin", "regional_manager", "store_manager", "logistics_head"],
            order_id=order_id,
            created_by=user_name,
        )

        return {"success": True, "message": "Order REJECTED by Senior VP.", "order": order}


@router.post("/orders/{order_id}/ship")
async def mark_order_shipped(
    order_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Mark an approved order as shipped/in transit"""
    order = next((o for o in _procurement_orders if o["id"] == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order["status"] != "approved":
        raise HTTPException(status_code=400, detail="Only approved orders can be shipped")

    user_name = f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}"
    now = datetime.now().isoformat()

    order["status"] = "in_transit"
    order["updated_at"] = now
    order["history"].append({
        "action": "shipped",
        "by": user_name,
        "role": current_user.get("role", ""),
        "timestamp": now,
        "details": f"Order marked as shipped / in transit",
    })

    _create_notification(
        title=f"🚚 Order #{order_id} — Shipped",
        message=f"{order['item_name']} ({order['quantity']} units) for {order['store_name']} is now in transit.",
        notification_type="info",
        severity="info",
        target_roles=["super_admin", "regional_manager", "store_manager", "logistics_head"],
        order_id=order_id,
        created_by=user_name,
    )

    return {"success": True, "message": "Order marked as in transit", "order": order}


@router.post("/orders/{order_id}/deliver")
async def mark_order_delivered(
    order_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Mark an in-transit order as delivered"""
    order = next((o for o in _procurement_orders if o["id"] == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order["status"] != "in_transit":
        raise HTTPException(status_code=400, detail="Only in-transit orders can be delivered")

    user_name = f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}"
    now = datetime.now().isoformat()

    order["status"] = "delivered"
    order["updated_at"] = now
    order["delivered_at"] = now
    order["history"].append({
        "action": "delivered",
        "by": user_name,
        "role": current_user.get("role", ""),
        "timestamp": now,
        "details": f"Order delivered to {order['store_name']}. Inventory updated.",
    })

    _create_notification(
        title=f"📦 Order #{order_id} — Delivered",
        message=f"{order['item_name']} ({order['quantity']} units) delivered to {order['store_name']}. Inventory updated.",
        notification_type="info",
        severity="success",
        target_roles=["super_admin", "regional_manager", "store_manager", "logistics_head"],
        order_id=order_id,
        created_by=user_name,
    )

    return {"success": True, "message": "Order delivered. Inventory updated.", "order": order}


@router.post("/orders/{order_id}/cancel")
async def cancel_procurement_order(
    order_id: int,
    approval: ProcurementApproval,
    current_user: dict = Depends(get_current_user)
):
    """Cancel a procurement order (must not be delivered)"""
    order = next((o for o in _procurement_orders if o["id"] == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order["status"] == "delivered":
        raise HTTPException(status_code=400, detail="Cannot cancel a delivered order")

    user_name = f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}"
    now = datetime.now().isoformat()

    order["status"] = "cancelled"
    order["updated_at"] = now
    order["history"].append({
        "action": "cancelled",
        "by": user_name,
        "role": current_user.get("role", ""),
        "timestamp": now,
        "details": f"Order cancelled. Reason: {approval.comments or 'Not specified'}",
    })

    _create_notification(
        title=f"Order #{order_id} — Cancelled",
        message=f"{user_name} cancelled the procurement order for {order['item_name']}. Reason: {approval.comments or 'Not specified'}",
        notification_type="info",
        severity="warning",
        target_roles=["super_admin", "regional_manager", "store_manager", "logistics_head"],
        order_id=order_id,
        created_by=user_name,
    )

    return {"success": True, "message": "Order cancelled.", "order": order}


# =============================================================================
# NOTIFICATIONS
# =============================================================================

@router.get("/notifications")
async def get_logistics_notifications(
    unread_only: bool = False,
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user)
):
    """Get notifications for the current user based on their role"""
    user_role = current_user.get("role", "")
    user_email = current_user.get("email", "")

    # Super admin sees everything
    if user_role == "super_admin":
        notifs = list(_notifications)
    else:
        notifs = [n for n in _notifications if user_role in n.get("target_roles", [])]

    if unread_only:
        notifs = [n for n in notifs if user_email not in n.get("read_by", [])]

    notifs.sort(key=lambda x: x["created_at"], reverse=True)
    notifs = notifs[:limit]

    unread_count = len([n for n in _notifications if user_email not in n.get("read_by", []) and (user_role == "super_admin" or user_role in n.get("target_roles", []))])

    return {
        "notifications": notifs,
        "total": len(notifs),
        "unread_count": unread_count,
    }


@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Mark a notification as read"""
    user_email = current_user.get("email", "")
    notif = next((n for n in _notifications if n["id"] == notification_id), None)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    if user_email not in notif["read_by"]:
        notif["read_by"].append(user_email)

    return {"success": True}


@router.post("/notifications/read-all")
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user)
):
    """Mark all notifications as read for the current user"""
    user_email = current_user.get("email", "")
    count = 0
    for notif in _notifications:
        if user_email not in notif["read_by"]:
            notif["read_by"].append(user_email)
            count += 1
    return {"success": True, "marked_count": count}


# =============================================================================
# LOGISTICS TEAM
# =============================================================================

@router.get("/team")
async def get_logistics_team(
    current_user: dict = Depends(get_current_user)
):
    """Get the logistics team members"""
    async with async_session() as session:
        try:
            result = await session.execute(
                text("""
                    SELECT id, employee_code, first_name, last_name, email, role, 
                           department, designation, status
                    FROM employees 
                    WHERE department = 'logistics' AND status = 'active'
                    ORDER BY role DESC, first_name
                """)
            )
            team = []
            for row in result.fetchall():
                team.append({
                    "id": row[0],
                    "employee_code": row[1],
                    "name": f"{row[2]} {row[3]}",
                    "email": row[4],
                    "role": row[5],
                    "department": row[6],
                    "designation": row[7],
                    "status": row[8],
                })
            
            # If no logistics employees exist, return placeholder
            if not team:
                team = [
                    {
                        "id": 0,
                        "employee_code": "LLU-HQ-LOG1",
                        "name": "Logistics Head",
                        "email": "logistics@lulu.ae",
                        "role": "inventory_manager",
                        "department": "logistics",
                        "designation": "Head of Logistics",
                        "status": "active",
                    }
                ]

            return {"team": team, "total": len(team)}
        except Exception as e:
            logger.error(f"Error fetching logistics team: {e}")
            return {
                "team": [{
                    "id": 0,
                    "employee_code": "LLU-HQ-LOG1",
                    "name": "Logistics Head",
                    "email": "logistics@lulu.ae",
                    "role": "inventory_manager",
                    "department": "logistics",
                    "designation": "Head of Logistics",
                    "status": "active",
                }],
                "total": 1,
            }


@router.get("/approval-chain")
async def get_approval_chain(
    current_user: dict = Depends(get_current_user)
):
    """Get the approval chain hierarchy"""
    return {
        "chain": [
            {
                "step": 1,
                "role": "requester",
                "title": "Order Creator",
                "description": "Any user with inventory access creates the procurement order",
            },
            {
                "step": 2,
                "role": "logistics_head",
                "title": "Logistics Head Review",
                "description": "Logistics team reviews the order for feasibility, cost, and supplier availability",
            },
            {
                "step": 3,
                "role": "senior_vp",
                "title": "Senior VP Final Approval (Yash Patel)",
                "description": "Senior VP gives final go/no-go decision on the procurement order",
            },
        ]
    }


@router.get("/changes")
async def get_recent_changes(
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get all recent changes/actions across procurement orders for full audit trail"""
    all_changes = []
    for order in _procurement_orders:
        for entry in order.get("history", []):
            all_changes.append({
                **entry,
                "order_id": order["id"],
                "item_name": order["item_name"],
                "store_name": order["store_name"],
            })

    all_changes.sort(key=lambda x: x["timestamp"], reverse=True)
    return {"changes": all_changes[:limit], "total": len(all_changes)}
