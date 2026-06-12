import { useEffect, useState } from "react";
import { ChefHat, Check, Printer, RefreshCw, X } from "lucide-react";
import type { PosOrder } from "@restrozapp/shared";
type ReceiptType = "kot" | "token" | "bill";

const filters = ["all", "pending", "preparing", "ready", "completed", "cancelled"];

export function OrdersView({
  dataVersion,
  onChanged,
  onPrint,
}: {
  dataVersion: number;
  onChanged: () => void;
  onPrint: (order: PosOrder, type: ReceiptType) => Promise<void>;
}) {
  const [orders, setOrders] = useState<PosOrder[]>([]);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");

  async function load() {
    const result = await window.restrozapp.pos.listOrders(filter);
    if (result.ok) setOrders(result.data);
    else setMessage(result.error);
  }

  useEffect(() => {
    load();
  }, [filter, dataVersion]);

  async function update(order: PosOrder, status: PosOrder["status"], printBill = false) {
    const result = await window.restrozapp.pos.updateOrderStatus({ orderId: order.id, status });
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setMessage(`Order ${result.data.orderNumber} marked ${status}.`);
    onChanged();
    await load();
    if (printBill) await onPrint(result.data, "bill");
  }

  return (
    <section className="orders-view panel">
      <div className="orders-toolbar">
        <div className="filter-tabs">
          {filters.map((item) => (
            <button className={filter === item ? "selected" : ""} key={item} onClick={() => setFilter(item)}>
              {item}
            </button>
          ))}
        </div>
        <button className="secondary icon-button" title="Refresh orders" onClick={load}><RefreshCw size={17} /></button>
      </div>

      <div className="order-list">
        {orders.map((order) => (
          <article className="order-card" key={order.id}>
            <div className="order-token">{order.tokenNumber}</div>
            <div className="order-main">
              <div className="order-title"><b>{order.orderNumber}</b><span className={`order-status ${order.status}`}>{order.status}</span></div>
              <span>{order.orderType.replace("-", " ")}{order.tableNumber ? ` · Table ${order.tableNumber}` : ""} · {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              <p>{order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}</p>
            </div>
            <strong className="order-total">Rs {order.total.toLocaleString()}</strong>
            <div className="order-actions">
              <button className="secondary icon-button" title="Print KOT" onClick={() => onPrint(order, "kot")}><Printer size={16} /></button>
              {order.status === "pending" && <button title="Start preparing" onClick={() => update(order, "preparing")}><ChefHat size={16} /></button>}
              {order.status === "preparing" && <button title="Mark ready" onClick={() => update(order, "ready")}><Check size={16} /></button>}
              {order.status === "ready" && <button title="Complete and print bill" onClick={() => update(order, "completed", true)}><Printer size={16} /> Bill</button>}
              {order.status === "pending" && <button className="danger-button" title="Cancel order" onClick={() => update(order, "cancelled")}><X size={16} /></button>}
              {order.status === "completed" && <button title="Reprint bill" onClick={() => onPrint(order, "bill")}><Printer size={16} /> Bill</button>}
            </div>
          </article>
        ))}
        {!orders.length && <div className="empty-list">No {filter === "all" ? "" : filter} orders found.</div>}
      </div>
      {message && <p className="inline-notice">{message}</p>}
    </section>
  );
}
