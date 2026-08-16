import "./Orders.css"

import { useMemo, useState } from "react"

import { FAKE_ORDERS, ORDER_STATUSES } from "./ordersData"

const eur = (n) =>
	new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n)

const dateFmt = new Intl.DateTimeFormat("it-IT", {
	day: "2-digit",
	month: "short",
	year: "numeric",
})

const formatDate = (iso) => {
	const d = new Date(`${iso}T00:00:00`)
	return Number.isNaN(d.getTime()) ? iso : dateFmt.format(d)
}

const statusLabel = (id) => ORDER_STATUSES.find((s) => s.id === id)?.label ?? id

const COLUMNS = [
	{ key: "id", label: "Ordine", sortable: true },
	{ key: "customer", label: "Cliente", sortable: true },
	{ key: "channel", label: "Canale", sortable: false },
	{ key: "date", label: "Data", sortable: true },
	{ key: "status", label: "Stato", sortable: true },
	{ key: "total", label: "Totale", sortable: true, numeric: true },
]

const OPEN_STATUSES = ["pending", "paid"]

/**
 * Lista ordini del backoffice.
 *
 * `orders` sostituisce il dataset demo, `placedOrders` ci si accoda in cima: lo
 * shell passa lì gli ordini appena creati dal checkout. Senza prop il remote
 * mostra i dati demo, così resta montabile anche da solo.
 */
export const Orders = ({ orders: baseOrders = FAKE_ORDERS, placedOrders = [] }) => {
	const orders = useMemo(
		() => [...placedOrders, ...baseOrders],
		[placedOrders, baseOrders]
	)
	const [query, setQuery] = useState("")
	const [status, setStatus] = useState("all")
	const [sort, setSort] = useState({ key: "date", dir: "desc" })
	const [selectedId, setSelectedId] = useState(null)

	const kpis = useMemo(() => {
		const revenue = orders.reduce((sum, o) => sum + o.total, 0)
		return {
			count: orders.length,
			revenue,
			open: orders.filter((o) => OPEN_STATUSES.includes(o.status)).length,
			average: orders.length ? revenue / orders.length : 0,
		}
	}, [orders])

	const visible = useMemo(() => {
		const q = query.trim().toLowerCase()
		const filtered = orders.filter((o) => {
			if (status !== "all" && o.status !== status) return false
			if (!q) return true
			return (
				o.id.toLowerCase().includes(q) ||
				o.customer.toLowerCase().includes(q) ||
				o.items.some((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
			)
		})

		const dir = sort.dir === "asc" ? 1 : -1
		return [...filtered].sort((a, b) => {
			const x = a[sort.key]
			const y = b[sort.key]
			if (typeof x === "number" && typeof y === "number") return (x - y) * dir
			return String(x).localeCompare(String(y), "it") * dir
		})
	}, [orders, query, status, sort])

	const selected = visible.find((o) => o.id === selectedId) ?? null

	const toggleSort = (key) =>
		setSort((prev) =>
			prev.key === key
				? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
				: { key, dir: key === "total" || key === "date" ? "desc" : "asc" }
		)

	const sortMark = (key) => (sort.key === key ? (sort.dir === "asc" ? " ▲" : " ▼") : "")

	return (
		<div className="mfe-orders">
			<header className="mfe-orders__header">
				<div>
					<h2 className="mfe-orders__title">Ordini</h2>
					<p className="mfe-orders__subtitle">
						{visible.length} di {orders.length} ordini — dati dimostrativi
					</p>
				</div>
			</header>

			<div className="mfe-orders__kpis">
				<Kpi label="Ordini" value={kpis.count} />
				<Kpi label="Valore totale" value={eur(kpis.revenue)} />
				<Kpi label="Da evadere" value={kpis.open} />
				<Kpi label="Scontrino medio" value={eur(kpis.average)} />
			</div>

			<div className="mfe-orders__toolbar">
				<input
					className="mfe-orders__search"
					placeholder="Cerca per ordine, cliente o articolo…"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
				/>
				<button
					type="button"
					className={`mfe-orders__chip ${status === "all" ? "mfe-orders__chip--active" : ""}`}
					onClick={() => setStatus("all")}>
					Tutti
				</button>
				{ORDER_STATUSES.map((s) => (
					<button
						key={s.id}
						type="button"
						className={`mfe-orders__chip ${status === s.id ? "mfe-orders__chip--active" : ""}`}
						onClick={() => setStatus(s.id)}>
						{s.label}
					</button>
				))}
			</div>

			<div className="mfe-orders__table-wrap">
				<table className="mfe-orders__table">
					<thead>
						<tr>
							{COLUMNS.map((col) => (
								<th
									key={col.key}
									className={`${col.sortable ? "mfe-orders__th-sortable" : ""} ${
										col.numeric ? "mfe-orders__num" : ""
									}`}
									onClick={col.sortable ? () => toggleSort(col.key) : undefined}>
									{col.label}
									{col.sortable ? sortMark(col.key) : ""}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{visible.map((order) => (
							<tr
								key={order.id}
								className={`mfe-orders__row ${
									order.id === selectedId ? "mfe-orders__row--selected" : ""
								}`}
								onClick={() => setSelectedId(order.id === selectedId ? null : order.id)}>
								<td className="mfe-orders__id">{order.id}</td>
								<td>{order.customer}</td>
								<td>{order.channel}</td>
								<td>{formatDate(order.date)}</td>
								<td>
									<span className={`mfe-orders__badge mfe-orders__badge--${order.status}`}>
										{statusLabel(order.status)}
									</span>
								</td>
								<td className="mfe-orders__num">{eur(order.total)}</td>
							</tr>
						))}
						{visible.length === 0 && (
							<tr>
								<td className="mfe-orders__empty" colSpan={COLUMNS.length}>
									Nessun ordine corrisponde ai filtri.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{selected && <OrderDetail order={selected} onClose={() => setSelectedId(null)} />}

			<p className="mfe-orders__footnote">
				Microfrontend <code>orders</code> — nessun dato reale, nessun riferimento a clienti veri.
			</p>
		</div>
	)
}

const Kpi = ({ label, value }) => (
	<div className="mfe-orders__kpi">
		<div className="mfe-orders__kpi-label">{label}</div>
		<div className="mfe-orders__kpi-value">{value}</div>
	</div>
)

const OrderDetail = ({ order, onClose }) => (
	<section className="mfe-orders__detail">
		<div className="mfe-orders__detail-head">
			<h3 className="mfe-orders__detail-title">Dettaglio {order.id}</h3>
			<button type="button" className="mfe-orders__close" onClick={onClose}>
				Chiudi
			</button>
		</div>

		<div className="mfe-orders__detail-grid">
			<DetailCell label="Cliente" value={order.customer} />
			<DetailCell label="Canale" value={order.channel} />
			<DetailCell label="Data" value={formatDate(order.date)} />
			<DetailCell label="Stato" value={statusLabel(order.status)} />
			<DetailCell label="Totale" value={eur(order.total)} />
		</div>

		<table className="mfe-orders__items">
			<thead>
				<tr>
					<th>SKU</th>
					<th>Articolo</th>
					<th className="mfe-orders__num">Q.tà</th>
					<th className="mfe-orders__num">Prezzo</th>
					<th className="mfe-orders__num">Riga</th>
				</tr>
			</thead>
			<tbody>
				{order.items.map((item) => (
					<tr key={item.sku}>
						<td className="mfe-orders__id">{item.sku}</td>
						<td>{item.name}</td>
						<td className="mfe-orders__num">{item.qty}</td>
						<td className="mfe-orders__num">{eur(item.price)}</td>
						<td className="mfe-orders__num">{eur(item.price * item.qty)}</td>
					</tr>
				))}
			</tbody>
		</table>
	</section>
)

const DetailCell = ({ label, value }) => (
	<div>
		<div className="mfe-orders__detail-label">{label}</div>
		<div className="mfe-orders__detail-value">{value}</div>
	</div>
)

export default Orders
