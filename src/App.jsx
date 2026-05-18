import { supabase } from "./lib/supabase.js";
import React, { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Download,
  Edit3,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Menu,
  Package,
  Plus,
  ReceiptText,
  Search,
  Shield,
  ShoppingCart,
  Trash2,
  Truck,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { initialClients, initialProducts, initialUsers, paymentMethods, saleChannels, categories, orderStatuses } from "./data/initialData";
import { STORAGE_KEY, downloadCSV, money, roleLabel, today, uid } from "./utils";

const defaultState = {
  users: initialUsers,
  products: initialProducts,
  clients: initialClients,
  sales: [],
  expenses: [],
  stockMovements: [],
  cashMovements: [],
  settings: {
    businessName: "SF Premium",
    currency: "ARS",
  },
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultState;
    return { ...defaultState, ...JSON.parse(saved) };
  } catch {
    return defaultState;
  }
}

export default function App() {
  const [state, setState] = useState(loadState);
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sistema_mates_session")) || null;
    } catch {
      return null;
    }
  });
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  if (!state) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#080808",
        color: "white",
        fontSize: "22px",
      }}
    >
      Cargando sistema...
    </div>
  );
}

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (session) localStorage.setItem("sistema_mates_session", JSON.stringify(session));
    else localStorage.removeItem("sistema_mates_session");
  }, [session]);
useEffect(() => {
  async function cargarDatosSupabase() {
    const { data: productos, error: errorProductos } = await supabase
      .from("productos")
      .select("*")
      .order("id", { ascending: true });

    const { data: clientes, error: errorClientes } = await supabase
      .from("clientes")
      .select("*")
      .order("id", { ascending: true });

    const { data: ventas, error: errorVentas } = await supabase
      .from("ventas")
      .select(`
        *,
        clientes(nombre),
        venta_items(*, productos(nombre, sku)),
        pagos(*)
      `)
      .order("id", { ascending: false });

    const { data: caja, error: errorCaja } = await supabase
      .from("caja")
      .select("*")
      .order("id", { ascending: false });

    if (errorProductos) {
      console.error("Error cargando productos:", errorProductos);
    }

    if (errorClientes) {
      console.error("Error cargando clientes:", errorClientes);
    }

    if (errorVentas) {
      console.error("Error cargando ventas:", errorVentas);
    }

    if (errorCaja) {
      console.error("Error cargando caja:", errorCaja);
    }

    setState((prev) => ({
      ...prev,

      products: Array.isArray(productos)
  ? productos.map((p) => ({
      id: p.id,
      name: p.nombre,
      category: p.categoria,
      line: p.linea,
      salePrice: Number(p.precio_venta),
      costPrice: Number(p.precio_costo),
      stock: Number(p.stock),
      minStock: Number(p.stock_minimo),
      sku: p.sku,
      image: p.imagen_url,
      active: p.activo,
    }))
  : [],

      clients: Array.isArray(clientes)
  ? clientes.map((c) => ({
      id: c.id,
      name: c.nombre,
      phone: c.telefono,
      instagram: c.instagram,
      city: c.localidad,
      address: c.direccion,
      notes: c.observaciones,
      active: c.activo,
      tags: [],
    }))
  : [],

      sales: Array.isArray(ventas)
        ? ventas.map((v) => ({
            id: v.id,
            date: v.fecha?.slice(0, 10),
            clientId: v.cliente_id,
            clientName: v.clientes?.nombre || "Sin cliente",
            channel: v.canal,
            paymentMethod: v.metodo_pago,
            subtotal: Number(v.total),
            discount: 0,
            shippingCost: 0,
            total: Number(v.total),
            paidAmount: Number(v.abonado),
            debt: Number(v.saldo),
            installments: 1,
            dueDate: v.fecha?.slice(0, 10),
            paymentStatus: v.estado_pago,
            orderStatus: v.estado_pedido,
            notes: v.observaciones || "",
            sellerId: "",
            sellerName: "",
            items:
              v.venta_items?.map((i) => ({
                productId: i.producto_id,
                sku: i.productos?.sku || "",
                name: i.productos?.nombre || "Producto",
                qty: i.cantidad,
                salePrice: Number(i.precio_unitario),
                costPrice: Number(i.costo_unitario),
              })) || [],
            payments:
              v.pagos?.map((p) => ({
                id: p.id,
                date: p.fecha?.slice(0, 10),
                amount: Number(p.monto),
                method: p.metodo_pago,
                notes: p.observaciones || "",
              })) || [],
          }))
        : [],

      cashMovements: Array.isArray(caja)
  ? caja.map((m) => ({
      id: m.id,
      date: m.fecha?.slice(0, 10),
      type: m.tipo,
      concept: m.concepto,
      method: m.metodo_pago,
      amount: Number(m.monto),
    }))
  : [],
    }));
  }

  cargarDatosSupabase();
}, []);
function login(username, password) {
  const user = state.users.find(
    (u) =>
      u.username === username &&
      u.password === password &&
      u.active !== false
  );

  if (!user) return false;

  setSession({
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
  });

  setPage("dashboard");

  return true;
}
  function logout() {
    setSession(null);
    setPage("dashboard");
  }

  if (!session) return <LoginScreen onLogin={login} />;

  const canAdmin = session.role === "superadmin" || session.role === "admin";
  const isSuperAdmin = session.role === "superadmin";

  return (
  <>
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: "#111",
          color: "#fff",
          border: "1px solid #2a2a2a",
          borderRadius: "14px",
        },
      }}
    />

    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-logo">SF</div>
          <div>
            <h1>Sistema Mates</h1>
            <p>Gestión comercial premium</p>
          </div>
          <button className="icon-btn only-mobile" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>

        <nav className="nav">
          <NavButton icon={<BarChart3 />} label="Panel principal" active={page === "dashboard"} onClick={() => setPage("dashboard")} />
          <NavButton icon={<ShoppingCart />} label="Nueva venta" active={page === "new-sale"} onClick={() => setPage("new-sale")} />
          <NavButton icon={<ReceiptText />} label="Ventas" active={page === "sales"} onClick={() => setPage("sales")} />
          <NavButton icon={<Users />} label="Clientes" active={page === "clients"} onClick={() => setPage("clients")} />
          <NavButton icon={<Package />} label="Productos" active={page === "products"} onClick={() => setPage("products")} />
          <NavButton icon={<Boxes />} label="Stock" active={page === "stock"} onClick={() => setPage("stock")} />
          <NavButton icon={<CreditCard />} label="Deudas y cuotas" active={page === "debts"} onClick={() => setPage("debts")} />
          <NavButton icon={<Wallet />} label="Caja" active={page === "cash"} onClick={() => setPage("cash")} />
          <NavButton icon={<Truck />} label="Envíos" active={page === "shipping"} onClick={() => setPage("shipping")} />
          <NavButton icon={<ClipboardList />} label="Reportes" active={page === "reports"} onClick={() => setPage("reports")} />
          {canAdmin && <NavButton icon={<Shield />} label="Usuarios" active={page === "users"} onClick={() => setPage("users")} />}
        </nav>

        <div className="sidebar-footer">
          <div className="user-box">
            <div className="avatar"><User size={18} /></div>
            <div>
              <b>{session.name}</b>
              <span>{roleLabel(session.role)}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}><LogOut size={18} /> Salir</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="icon-btn only-mobile" onClick={() => setSidebarOpen(true)}><Menu /></button>
          <div>
            <h2>{pageTitle(page)}</h2>
            <p>Usuario activo: {session.name} · {roleLabel(session.role)}</p>
          </div>
          <button className="primary-btn" onClick={() => setPage("new-sale")}><Plus size={18} /> Nueva venta</button>
        </header>

        {page === "dashboard" && <Dashboard state={state} setPage={setPage} />}
        {page === "new-sale" && <NewSale state={state} setState={setState} setPage={setPage} session={session} />}
        {page === "sales" && <Sales state={state} setState={setState} />}
        {page === "clients" && <Clients state={state} setState={setState} />}
        {page === "products" && <Products state={state} setState={setState} canAdmin={canAdmin} />}
        {page === "stock" && <Stock state={state} setState={setState} canAdmin={canAdmin} session={session} />}
        {page === "debts" && <Debts state={state} setState={setState} />}
        {page === "cash" && <Cash state={state} setState={setState} />}
        {page === "shipping" && <Shipping state={state} setState={setState} />}
        {page === "reports" && <Reports state={state} />}
        {page === "users" && canAdmin && <UsersAdmin state={state} setState={setState} isSuperAdmin={isSuperAdmin} />}
      </main>
    </div>
  </>
);
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    const ok = onLogin(username.trim(), password);
    if (!ok) setError("Usuario o contraseña incorrectos.");
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo">SF</div>
        <h1>Sistema Interno de Gestión</h1>
        <p>Ventas, stock, clientes, deudas, caja y reportes para negocio de mates premium.</p>

        <label>Usuario</label>
        <div className="input-icon">
          <User size={18} />
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" />
        </div>

        <label>Contraseña</label>
        <div className="input-icon">
          <Lock size={18} />
          <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="admin123" />
          <button type="button" onClick={() => setShow(!show)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>

        {error && <div className="error">{error}</div>}
        <button className="primary-btn full" type="submit">Ingresar al sistema</button>

        <div className="login-help">
          <b>Usuarios de prueba</b>
          <span>Super Admin: admin / admin123</span>
          <span>Vendedor: vendedor / vendedor123</span>
        </div>
      </form>
    </div>
  );
}

function Dashboard({ state, setPage }) {
  const activeSales = state.sales.filter(
    (s) =>
      s.orderStatus !== "Cancelado" &&
      s.paymentStatus !== "Cancelado"
  );

  const activeProducts = state.products.filter(
    (p) => p.active !== false
  );

  const summary = useMemo(
    () =>
      getSummary({
        ...state,
        sales: activeSales,
        products: activeProducts,
      }),
    [state]
  );

  const recentSales = activeSales.slice(0, 5);

  const lowStock = activeProducts.filter(
    (p) => Number(p.stock) <= Number(p.minStock)
  );

  const cashIncome = state.cashMovements
    .filter((m) => m.type === "Ingreso")
    .reduce((acc, m) => acc + Number(m.amount || 0), 0);

  const cashExpense = state.cashMovements
    .filter((m) => m.type === "Egreso")
    .reduce((acc, m) => acc + Number(m.amount || 0), 0);

  const cashBalance = cashIncome - cashExpense;

  const topProducts = getTopProducts(activeSales).slice(0, 5);

  const bestClient = activeSales.reduce((acc, sale) => {
    const current = acc[sale.clientName] || 0;
    acc[sale.clientName] = current + Number(sale.total || 0);
    return acc;
  }, {});

  const bestClientName =
    Object.entries(bestClient).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "Sin datos";

  return (
    <section className="page dashboard-premium">
      <div className="dashboard-hero">
        <div>
          <span className="eyebrow">Resumen general</span>
          <h1>Panel principal</h1>
          <p>Vista rápida de ventas, caja, stock y rendimiento del negocio.</p>
        </div>

        <button className="primary-btn" onClick={() => setPage("new-sale")}>
          <Plus size={18} /> Nueva venta
        </button>
      </div>

      <div className="stats-grid">
        <StatCard icon={<CircleDollarSign />} label="Ventas del día" value={money(summary.todaySales)} />
        <StatCard icon={<Wallet />} label="Total cobrado" value={money(summary.totalPaid)} />
        <StatCard icon={<CreditCard />} label="Pendiente" value={money(summary.totalDebt)} danger={summary.totalDebt > 0} />
        <StatCard icon={<BarChart3 />} label="Caja / Balance" value={money(cashBalance)} danger={cashBalance < 0} />
      </div>

      <div className="dashboard-grid">
        <Card title="Últimas ventas" action={<button onClick={() => setPage("sales")}>Ver todo</button>}>
          {recentSales.length ? (
            recentSales.map((s) => <SaleMini key={s.id} sale={s} />)
          ) : (
            <Empty text="Todavía no cargaste ventas." />
          )}
        </Card>

        <Card title="Productos más vendidos">
          {topProducts.length ? (
            topProducts.map(([name, qty]) => (
              <LineItem key={name} left={name} right={`${qty} u.`} />
            ))
          ) : (
            <Empty text="Sin datos todavía." />
          )}
        </Card>

        <Card title="Alertas de stock">
          {lowStock.length ? (
            lowStock.map((p) => (
              <LineItem
                key={p.id}
                left={p.name}
                right={`Stock ${p.stock}`}
                danger
              />
            ))
          ) : (
            <Empty text="No hay productos con stock bajo." />
          )}
        </Card>

        <Card title="Cliente destacado">
          <div className="featured-box">
            <span>Mayor comprador</span>
            <b>{bestClientName}</b>
          </div>
        </Card>
      </div>
    </section>
  );
}

function NewSale({ state, setState, setPage, session }) {
  const [query, setQuery] = useState("");
  const [clientId, setClientId] = useState(state.clients[0]?.id || "");
  const [channel, setChannel] = useState("Instagram");
  const [paymentMethod, setPaymentMethod] = useState("Mercado Pago");
  const [paidAmount, setPaidAmount] = useState("");
  const [discount, setDiscount] = useState("");
  const [installments, setInstallments] = useState(1);
  const [notes, setNotes] = useState("");
  const [shippingCompany, setShippingCompany] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [cart, setCart] = useState([]);

  const filteredProducts = state.products.filter(
    (p) =>
      p.active !== false &&
      (
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase()) ||
        p.sku.toLowerCase().includes(query.toLowerCase())
      )
  );

  const subtotal = cart.reduce((acc, item) => acc + item.salePrice * item.qty, 0);
  const total = Math.max(subtotal - Number(discount || 0) + Number(shippingCost || 0), 0);
  const paid = Number(paidAmount || 0);
  const debt = Math.max(total - paid, 0);

  function addToCart(product) {
    if (product.active === false) return toast.error("Este producto está desactivado.");
    if (product.stock <= 0) 
return toast.error("Este producto no tiene stock.");

    const existing = cart.find((i) => i.id === product.id);

    if (existing) {
      if (existing.qty >= product.stock) return toast.error("No hay más stock disponible.");
      setCart(cart.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  }

  function updateQty(id, qty) {
    const product = state.products.find((p) => p.id === id);
    if (!product) return;

    const finalQty = Math.max(1, Math.min(Number(qty || 1), product.stock));
    setCart(cart.map((i) => i.id === id ? { ...i, qty: finalQty } : i));
  }

  async function registerSale() {
    try {
      if (!cart.length) return toast.error("Agregá al menos un producto.");
      if (!clientId) return toast.error("Seleccioná un cliente.");

      const client = state.clients.find((c) => c.id === Number(clientId));

      if (!client || client.active === false) {
        toast.error("El cliente seleccionado no está activo.");
        return;
      }

      for (const item of cart) {
        const product = state.products.find((p) => p.id === item.id);

        if (!product || product.active === false) {
          alert(`El producto "${item.name}" ya no está activo.`);
          return;
        }

        if (Number(product.stock) < Number(item.qty)) {
          alert(`No hay stock suficiente para "${item.name}". Stock actual: ${product.stock}`);
          return;
        }
      }

      const ventaNueva = {
        cliente_id: Number(clientId),
        canal: channel,
        metodo_pago: paymentMethod,
        total: total,
        abonado: paid,
        saldo: debt,
        estado_pago: debt === 0 ? "Pagado" : paid > 0 ? "Parcial" : "Pendiente",
        estado_pedido: "Nuevo",
        observaciones: notes,
      };

      const { data: ventaCreada, error: errorVenta } = await supabase
        .from("ventas")
        .insert([ventaNueva])
        .select()
        .single();

      if (errorVenta) {
        console.error("ERROR GUARDANDO VENTA:", errorVenta);
        alert(errorVenta.message);
        return;
      }

      const itemsVenta = cart.map((item) => ({
        venta_id: ventaCreada.id,
        producto_id: item.id,
        cantidad: item.qty,
        precio_unitario: item.salePrice,
        costo_unitario: item.costPrice,
        subtotal: item.salePrice * item.qty,
      }));

      const { error: errorItems } = await supabase
        .from("venta_items")
        .insert(itemsVenta);

      if (errorItems) {
        console.error("ERROR GUARDANDO ITEMS:", errorItems);
        alert(errorItems.message);
        return;
      }

      if (paid > 0) {
        const { error: errorPago } = await supabase
          .from("pagos")
          .insert([
            {
              venta_id: ventaCreada.id,
              metodo_pago: paymentMethod,
              monto: paid,
              observaciones: "Pago inicial",
            },
          ]);

        if (errorPago) {
          console.error("ERROR GUARDANDO PAGO:", errorPago);
          alert(errorPago.message);
          return;
        }

        const { error: errorCaja } = await supabase
          .from("caja")
          .insert([
            {
              tipo: "Ingreso",
              concepto: `Venta #${ventaCreada.id}`,
              metodo_pago: paymentMethod,
              monto: paid,
            },
          ]);

        if (errorCaja) {
          console.error("ERROR GUARDANDO CAJA:", errorCaja);
          alert(errorCaja.message);
          return;
        }
      }

      for (const item of cart) {
        const product = state.products.find((p) => p.id === item.id);
        const nuevoStock = Number(product.stock) - Number(item.qty);

        const { error: errorStock } = await supabase
          .from("productos")
          .update({ stock: nuevoStock })
          .eq("id", item.id);

        if (errorStock) {
          console.error("ERROR ACTUALIZANDO STOCK:", errorStock);
          alert(errorStock.message);
          return;
        }

        await supabase.from("movimientos_stock").insert([
          {
            producto_id: item.id,
            tipo: "Salida por venta",
            cantidad: -Number(item.qty),
            motivo: `Venta #${ventaCreada.id}`,
          },
        ]);
      }

      const sale = {
        id: ventaCreada.id,
        date: today(),
        clientId: Number(clientId),
        clientName: client?.name || "Sin cliente",
        channel,
        paymentMethod,
        subtotal,
        discount: Number(discount || 0),
        shippingCost: Number(shippingCost || 0),
        total,
        paidAmount: paid,
        debt,
        installments: Number(installments || 1),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        paymentStatus: debt === 0 ? "Pagado" : paid > 0 ? "Parcial" : "Pendiente",
        orderStatus: "Nuevo",
        notes,
        sellerId: session.id,
        sellerName: session.name,
        items: cart.map((i) => ({
          productId: i.id,
          sku: i.sku,
          name: i.name,
          qty: i.qty,
          salePrice: i.salePrice,
          costPrice: i.costPrice,
        })),
        shipping: {
          company: shippingCompany,
          trackingCode,
          status: shippingCompany || trackingCode ? "Pendiente" : "",
        },
        payments: paid > 0 ? [{ id: uid(), date: today(), amount: paid, method: paymentMethod, notes: "Pago inicial" }] : [],
      };

      setState((prev) => ({
        ...prev,
        sales: [sale, ...prev.sales],
        products: prev.products.map((p) => {
          const item = cart.find((i) => i.id === p.id);
          return item ? { ...p, stock: Number(p.stock) - Number(item.qty) } : p;
        }),
      }));

      setCart([]);
      setPaidAmount("");
      setDiscount("");
      setNotes("");
      setShippingCompany("");
      setTrackingCode("");
      setShippingCost("");
      setPage("sales");

      toast.success("Venta guardada correctamente");
    } catch (err) {
      console.error("ERROR GENERAL VENTA:", err);
      toast.error("Error general guardando la venta");
    }
  }

  return (
    <section className="page two-columns">
      <Card title="Buscar productos">
        <div className="search-box">
          <Search size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por producto, categoría o SKU..." />
        </div>

   <div className="product-list sale-product-list">
  {filteredProducts.map((p) => (
    <button
      type="button"
      className="product-card sale-product-card"
      key={p.id}
      onClick={() => addToCart(p)}
    >
      <div className="sale-product-left">
        <div className="sale-product-img">
          {p.image ? (
            <img src={p.image} alt={p.name} />
          ) : (
            <Package size={24} />
          )}
        </div>

        <div className="sale-product-info">
          <b>{p.name}</b>
          <span>{p.category} · {p.sku}</span>
          <small className={p.stock <= p.minStock ? "danger-text" : ""}>
            Stock disponible: {p.stock}
          </small>
        </div>
      </div>

      <div className="product-price">
        <b>{money(p.salePrice)}</b>
      </div>
    </button>
  ))}
</div>
      </Card>

      <Card title="Resumen de venta">
        <div className="form-grid">
          <Field label="Cliente">
            <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
              {state.clients
                .filter((c) => c.active !== false)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </Field>

          <Field label="Canal">
            <select value={channel} onChange={(e) => setChannel(e.target.value)}>
              {saleChannels.map((x) => <option key={x}>{x}</option>)}
            </select>
          </Field>

          <Field label="Método de pago">
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {paymentMethods.map((x) => <option key={x}>{x}</option>)}
            </select>
          </Field>

          <Field label="Cuotas">
            <input type="number" min="1" value={installments} onChange={(e) => setInstallments(e.target.value)} />
          </Field>
        </div>

        <div className="cart">
  <div className="cart-header">
    <b>Productos agregados</b>

    {!!cart.length && (
      <button
        className="danger-btn"
        onClick={() => {
          if (confirm("¿Vaciar carrito completo?")) {
            setCart([]);
          }
        }}
      >
        Vaciar carrito
      </button>
    )}
  </div>

  {cart.length ? (
    cart.map((i) => {
      const stockLow = i.stock <= i.minStock;

      return (
  <div className="cart-item" key={i.id}>
    <div className="cart-info">
      <img
        src={
          i.image ||
          "https://placehold.co/100x100/111/FFF?text=Mate"
        }
        alt={i.name}
        className="cart-thumb"
      />

      <div>
        <b>{i.name}</b>

        <span>
          {money(i.salePrice)} c/u · SKU: {i.sku}
        </span>

        <small className={stockLow ? "danger-text" : ""}>
          Stock disponible: {i.stock}
        </small>
      </div>
    </div>

    <div className="cart-actions">
      <input
        type="number"
        min="1"
        max={i.stock}
        value={i.qty}
        onChange={(e) => updateQty(i.id, e.target.value)}
      />

      <b>{money(i.salePrice * i.qty)}</b>

      <button
        className="danger-btn"
        onClick={() =>
          setCart(cart.filter((x) => x.id !== i.id))
        }
      >
        <Trash2 size={18} />
      </button>
    </div>
  </div>
);
})
  ) : (
    <Empty text="Agregá productos desde el buscador." />
  )}
</div>

        <div className="form-grid">
          <Field label="Descuento">
            <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" />
          </Field>
<Field label="Monto abonado">
  <div className="payment-input">
    <input
      type="number"
      value={paidAmount}
      onChange={(e) => setPaidAmount(e.target.value)}
      placeholder="0"
    />

    <button
      type="button"
      className="secondary-btn"
      onClick={() => setPaidAmount(total)}
    >
      Pagar total
    </button>
  </div>
</Field>

          <Field label="Empresa de envío">
            <input value={shippingCompany} onChange={(e) => setShippingCompany(e.target.value)} placeholder="Correo, moto, etc." />
          </Field>

          <Field label="Costo de envío">
            <input type="number" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} placeholder="0" />
          </Field>

          <Field label="Código seguimiento">
            <input value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} />
          </Field>
        </div>

        <Field label="Observaciones">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalle adicional de la venta..." />
        </Field>

        <div className="total-box">
          <LineItem left="Subtotal" right={money(subtotal)} />
          <LineItem left="Descuento" right={money(Number(discount || 0))} />
          <LineItem left="Envío" right={money(Number(shippingCost || 0))} />
          <LineItem left="Total" right={money(total)} strong />
          <LineItem left="Saldo pendiente" right={money(debt)} danger={debt > 0} strong />
        </div>

        <button className="primary-btn full big" onClick={registerSale}>
          <CheckCircle2 size={20} /> Registrar venta
        </button>
      </Card>
    </section>
  );
}

function Sales({ state, setState }) {
  const [query, setQuery] = useState("");
  const sales = state.sales.filter((s) => s.clientName.toLowerCase().includes(query.toLowerCase()) || s.paymentMethod.toLowerCase().includes(query.toLowerCase()) || String(s.id).includes(query));

  function updateStatus(id, status) {
    setState((prev) => ({ ...prev, sales: prev.sales.map((s) => s.id === id ? { ...s, orderStatus: status } : s) }));
  }

  function addPayment(sale) {
    const amount = Number(prompt("Monto que abonó el cliente:") || 0);
    if (!amount || amount <= 0) return;
    const method = prompt("Método de pago:", "Mercado Pago") || "Mercado Pago";
    setState((prev) => ({
      ...prev,
      sales: prev.sales.map((s) => {
        if (s.id !== sale.id) return s;
        const newPaid = s.paidAmount + amount;
        const newDebt = Math.max(s.total - newPaid, 0);
        return {
          ...s,
          paidAmount: newPaid,
          debt: newDebt,
          paymentStatus: newDebt === 0 ? "Pagado" : "Parcial",
          payments: [...s.payments, { id: uid(), date: today(), amount, method, notes: "Pago registrado" }],
        };
      }),
      cashMovements: [{ id: uid(), date: today(), type: "Ingreso", concept: `Pago venta #${sale.id}`, method, amount }, ...prev.cashMovements],
    }));
  }

  async function deleteSale(sale) {
  try {
    if (!confirm("¿Seguro querés eliminar esta venta? También se devolverá el stock.")) return;

    for (const item of sale.items) {
      const product = state.products.find((p) => p.id === item.productId);
      if (!product) continue;

      const newStock = Number(product.stock) + Number(item.qty);

      const { error: errorStock } = await supabase
        .from("productos")
        .update({ stock: newStock })
        .eq("id", item.productId);

      if (errorStock) {
        console.error("ERROR DEVOLVIENDO STOCK:", errorStock);
        alert(errorStock.message);
        return;
      }

      await supabase.from("movimientos_stock").insert([
        {
          producto_id: item.productId,
          tipo: "Devolución por venta eliminada",
          cantidad: Number(item.qty),
          motivo: `Venta eliminada #${sale.id}`,
        },
      ]);
    }

    await supabase.from("pagos").delete().eq("venta_id", sale.id);
    await supabase.from("venta_items").delete().eq("venta_id", sale.id);

    const { error: errorVenta } = await supabase
      .from("ventas")
      .delete()
      .eq("id", sale.id);

    if (errorVenta) {
      console.error("ERROR ELIMINANDO VENTA:", errorVenta);
      alert(errorVenta.message);
      return;
    }

    setState((prev) => ({
      ...prev,
      sales: prev.sales.filter((s) => s.id !== sale.id),
      products: prev.products.map((p) => {
        const item = sale.items.find((i) => i.productId === p.id);
        return item ? { ...p, stock: Number(p.stock) + Number(item.qty) } : p;
      }),
    }));

    toast.success("Venta eliminada y stock devuelto correctamente");
  } catch (err) {
    console.error("ERROR GENERAL ELIMINANDO VENTA:", err);
    toast.error("Error general eliminando venta");
  }
}

  return (
    <section className="page">
      <Card title="Ventas registradas">
        <div className="search-box">
          <Search size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por cliente, método o número de venta..." />
        </div>
        <div className="table-list">
          {sales.length ? sales.map((s) => (
            <div className="sale-card" key={s.id}>
              <div className="sale-head">
                <div>
                  <b>Venta #{s.id}</b>
                  <span>{s.date} · {s.clientName} · {s.channel}</span>
                </div>
                <div className="right">
                  <b>{money(s.total)}</b>
                  <span className={s.debt > 0 ? "danger-text" : "success-text"}>{s.paymentStatus} {s.debt > 0 ? `· debe ${money(s.debt)}` : ""}</span>
                </div>
              </div>
              <div className="badges">
                {s.items.map((i) => <span key={i.productId}>{i.qty}x {i.name}</span>)}
              </div>
              <div className="sale-actions">
                <select value={s.orderStatus} onChange={(e) => updateStatus(s.id, e.target.value)}>
                  {orderStatuses.map((st) => <option key={st}>{st}</option>)}
                </select>
                {s.debt > 0 && <button className="success-btn" onClick={() => addPayment(s)}>Registrar pago</button>}
                <button className="danger-btn" onClick={() => deleteSale(s)}><Trash2 size={16} /> Eliminar</button>
              </div>
            </div>
          )) : <Empty text="No hay ventas cargadas." />}
        </div>
      </Card>
    </section>
  );
}

function Clients({ state, setState }) {
  const emptyClient = {
    name: "",
    phone: "",
    instagram: "",
    city: "",
    address: "",
    notes: "",
    tags: "",
  };

  const [form, setForm] = useState(emptyClient);
  const [query, setQuery] = useState("");
  const [editingClient, setEditingClient] = useState(null);
  const [editClientForm, setEditClientForm] = useState(emptyClient);

  async function saveClient() {
    try {
      if (!form.name.trim()) {
        toast.error("El cliente necesita nombre.");
        return;
      }

      const nuevoCliente = {
        nombre: form.name,
        telefono: form.phone,
        instagram: form.instagram,
        localidad: form.city,
        direccion: form.address,
        observaciones: form.notes,
        activo: true,
      };

      const { data, error } = await supabase
        .from("clientes")
        .insert([nuevoCliente])
        .select()
        .single();

      if (error) {
        console.error("ERROR SUPABASE CLIENTE:", error);
        toast.error(error.message);
        return;
      }

      const clienteFormateado = {
        id: data.id,
        name: data.nombre,
        phone: data.telefono || "",
        instagram: data.instagram || "",
        city: data.localidad || "",
        address: data.direccion || "",
        notes: data.observaciones || "",
        active: data.activo,
        tags: form.tags.split(",").map((x) => x.trim()).filter(Boolean),
      };

      setState((prev) => ({
        ...prev,
        clients: [clienteFormateado, ...prev.clients],
      }));

      setForm(emptyClient);

      toast.success("Cliente guardado correctamente");
    } catch (err) {
      console.error("ERROR GENERAL CLIENTE:", err);
      toast.error("Error general guardando cliente");
    }
  }

  function editClient(client) {
    setEditingClient(client);

    setEditClientForm({
      name: client.name || "",
      phone: client.phone || "",
      instagram: client.instagram || "",
      city: client.city || "",
      address: client.address || "",
      notes: client.notes || "",
      tags: client.tags?.join(", ") || "",
    });
  }

  async function saveEditClient() {
    try {
      if (!editingClient) return;

      if (!editClientForm.name.trim()) {
        toast.error("El cliente necesita nombre.");
        return;
      }

      const clienteActualizado = {
        nombre: editClientForm.name,
        telefono: editClientForm.phone,
        instagram: editClientForm.instagram,
        localidad: editClientForm.city,
        direccion: editClientForm.address,
        observaciones: editClientForm.notes,
      };

      const { error } = await supabase
        .from("clientes")
        .update(clienteActualizado)
        .eq("id", editingClient.id);

      if (error) {
        console.error("ERROR EDITANDO CLIENTE:", error);
        toast.error(error.message);
        return;
      }

      setState((prev) => ({
        ...prev,
        clients: prev.clients.map((c) =>
          c.id === editingClient.id
            ? {
                ...c,
                name: editClientForm.name,
                phone: editClientForm.phone,
                instagram: editClientForm.instagram,
                city: editClientForm.city,
                address: editClientForm.address,
                notes: editClientForm.notes,
                tags: editClientForm.tags
                  .split(",")
                  .map((x) => x.trim())
                  .filter(Boolean),
              }
            : c
        ),
      }));

      setEditingClient(null);
      setEditClientForm(emptyClient);

      toast.success("Cliente actualizado correctamente");
    } catch (err) {
      console.error("ERROR GENERAL EDITANDO CLIENTE:", err);
      toast.error("Error general editando cliente");
    }
  }

  async function deactivateClient(client) {
    try {
      const confirmar = confirm(
        `¿Seguro querés desactivar a "${client.name}"?\n\nNo se borrará el historial de ventas.`
      );

      if (!confirmar) return;

      const { error } = await supabase
        .from("clientes")
        .update({ activo: false })
        .eq("id", client.id);

      if (error) {
        console.error("ERROR DESACTIVANDO CLIENTE:", error);
        toast.error(error.message);
        return;
      }

      setState((prev) => ({
        ...prev,
        clients: prev.clients.map((c) =>
          c.id === client.id ? { ...c, active: false } : c
        ),
      }));

      toast.success("Cliente desactivado correctamente");
    } catch (err) {
      console.error("ERROR GENERAL DESACTIVANDO CLIENTE:", err);
      toast.error("Error general desactivando cliente");
    }
  }

  const clients = state.clients.filter(
    (c) =>
      c.active !== false &&
      (
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.phone.includes(query) ||
        c.instagram.toLowerCase().includes(query.toLowerCase())
      )
  );

  return (
    <section className="page two-columns small-left">
      <Card title="Nuevo cliente">
        <Field label="Nombre y apellido">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>

        <Field label="Teléfono">
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </Field>

        <Field label="Instagram">
          <input
            value={form.instagram}
            onChange={(e) => setForm({ ...form, instagram: e.target.value })}
          />
        </Field>

        <Field label="Localidad">
          <input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </Field>

        <Field label="Dirección">
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </Field>

        <Field label="Etiquetas separadas por coma">
          <input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="VIP, frecuente, debe dinero"
          />
        </Field>

        <Field label="Observaciones">
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </Field>

        <button className="primary-btn full" onClick={saveClient}>
          <Plus size={18} /> Guardar cliente
        </button>
      </Card>

      <Card title="Clientes">
        <div className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente..."
          />
        </div>

        <div className="client-grid">
          {clients.map((c) => {
            const clientSales = state.sales.filter((s) => s.clientId === c.id);

            const debt = clientSales.reduce(
              (acc, s) => acc + s.debt,
              0
            );

            const totalBought = clientSales.reduce(
              (acc, s) => acc + s.total,
              0
            );

            return (
              <div className="client-card premium-client-card" key={c.id}>
                <div className="client-top">
                  <div className="client-avatar">
                    {c.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="client-main">
                    <b>{c.name}</b>

                    <span>{c.phone || "Sin teléfono"}</span>

                    {c.instagram && (
                      <span>@{c.instagram.replace("@", "")}</span>
                    )}

                    <small>{c.city || "Sin localidad"}</small>
                  </div>
                </div>

                <div className="client-stats">
                  <div className="client-stat">
                    <small>Compras</small>
                    <b>{clientSales.length}</b>
                  </div>

                  <div className="client-stat">
                    <small>Total gastado</small>
                    <b>{money(totalBought)}</b>
                  </div>

                  <div className="client-stat">
                    <small>Deuda</small>
                    <b className={debt > 0 ? "danger-text" : "success-text"}>
                      {debt > 0 ? money(debt) : "Sin deuda"}
                    </b>
                  </div>
                </div>

                {clientSales.length > 0 && (
                  <div className="client-last-sale">
                    Última compra: <b>{money(clientSales[0]?.total || 0)}</b>
                  </div>
                )}

                <div className="badges">
                  {c.tags?.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>

                <div className="client-actions">
                  {c.phone && (
                    <a
                      href={`https://wa.me/${c.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="whatsapp-btn"
                    >
                      WhatsApp
                    </a>
                  )}

                  <button
                    className="secondary-btn"
                    onClick={() => editClient(c)}
                  >
                    Editar
                  </button>

                  <button
                    className="danger-btn"
                    onClick={() => deactivateClient(c)}
                  >
                    Desactivar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {editingClient && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-head">
              <h2>Editar cliente</h2>

              <button
                className="icon-btn"
                onClick={() => setEditingClient(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              <Field label="Nombre y apellido">
                <input
                  value={editClientForm.name}
                  onChange={(e) =>
                    setEditClientForm({
                      ...editClientForm,
                      name: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Teléfono">
                <input
                  value={editClientForm.phone}
                  onChange={(e) =>
                    setEditClientForm({
                      ...editClientForm,
                      phone: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Instagram">
                <input
                  value={editClientForm.instagram}
                  onChange={(e) =>
                    setEditClientForm({
                      ...editClientForm,
                      instagram: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Localidad">
                <input
                  value={editClientForm.city}
                  onChange={(e) =>
                    setEditClientForm({
                      ...editClientForm,
                      city: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Dirección">
                <input
                  value={editClientForm.address}
                  onChange={(e) =>
                    setEditClientForm({
                      ...editClientForm,
                      address: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Etiquetas">
                <input
                  value={editClientForm.tags}
                  onChange={(e) =>
                    setEditClientForm({
                      ...editClientForm,
                      tags: e.target.value,
                    })
                  }
                  placeholder="VIP, frecuente, debe dinero"
                />
              </Field>
            </div>

            <Field label="Observaciones">
              <textarea
                value={editClientForm.notes}
                onChange={(e) =>
                  setEditClientForm({
                    ...editClientForm,
                    notes: e.target.value,
                  })
                }
              />
            </Field>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => setEditingClient(null)}
              >
                Cancelar
              </button>

              <button className="primary-btn" onClick={saveEditClient}>
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Products({ state, setState, canAdmin }) {
  const emptyProduct = {
    name: "",
    category: "Línea Oro",
    line: "Premium",
    salePrice: "",
    costPrice: "",
    stock: "",
    minStock: 2,
    description: "",
    active: true,
  };

  const [form, setForm] = useState(emptyProduct);
  const [query, setQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState(emptyProduct);

  async function uploadImage(file) {
    if (!file) return "";

    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("productos")
      .upload(fileName, file);

    if (error) {
      console.error("ERROR STORAGE:", error);
      toast.error(error.message);
      return "";
    }

    const { data } = supabase.storage
      .from("productos")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function saveProduct() {
    try {
      if (!form.name.trim()) {
        toast.error("El producto necesita nombre.");
        return;
      }

      const prefix = form.category
        .slice(0, 3)
        .toUpperCase()
        .replace("Í", "I");

      const sku = `${prefix}-${String(state.products.length + 1).padStart(3, "0")}`;
      const imageUrl = await uploadImage(form.imageFile);

      const nuevoProducto = {
        nombre: form.name,
        categoria: form.category,
        linea: form.line,
        precio_venta: Number(form.salePrice || 0),
        precio_costo: Number(form.costPrice || 0),
        stock: Number(form.stock || 0),
        stock_minimo: Number(form.minStock || 0),
        sku,
        imagen_url: imageUrl,
        activo: true,
      };

      const { data, error } = await supabase
        .from("productos")
        .insert([nuevoProducto])
        .select()
        .single();

      if (error) {
        console.error("ERROR SUPABASE:", error);
        toast.error(error.message);
        return;
      }

      const productoFormateado = {
        id: data.id,
        name: data.nombre,
        category: data.categoria,
        line: data.linea,
        salePrice: Number(data.precio_venta),
        costPrice: Number(data.precio_costo),
        stock: Number(data.stock),
        minStock: Number(data.stock_minimo),
        sku: data.sku,
        image: data.imagen_url,
        description: form.description || "",
        active: data.activo,
      };

      setState((prev) => ({
        ...prev,
        products: [productoFormateado, ...prev.products],
      }));

      setForm(emptyProduct);

      toast.success("Producto guardado correctamente");
    } catch (err) {
      console.error("ERROR GENERAL:", err);
      toast.error("Error general revisá consola");
    }
  }

  function editProduct(product) {
    setEditingProduct(product);

    setEditForm({
      name: product.name || "",
      category: product.category || "Línea Oro",
      line: product.line || "Premium",
      salePrice: product.salePrice || "",
      costPrice: product.costPrice || "",
      stock: product.stock || "",
      minStock: product.minStock || 2,
      description: product.description || "",
      image: product.image || "",
      imageFile: null,
      imagePreview: product.image || "",
    });
  }

  async function saveEditProduct() {
    try {
      if (!editingProduct) return;

      let imageUrl = editForm.image || "";

      if (editForm.imageFile) {
        imageUrl = await uploadImage(editForm.imageFile);
      }

      const productoActualizado = {
        nombre: editForm.name,
        categoria: editForm.category,
        linea: editForm.line,
        precio_venta: Number(editForm.salePrice || 0),
        precio_costo: Number(editForm.costPrice || 0),
        stock: Number(editForm.stock || 0),
        stock_minimo: Number(editForm.minStock || 0),
        imagen_url: imageUrl,
      };

      const { error } = await supabase
        .from("productos")
        .update(productoActualizado)
        .eq("id", editingProduct.id);

      if (error) {
        console.error("ERROR EDITANDO PRODUCTO:", error);
        toast.error(error.message);
        return;
      }

      setState((prev) => ({
        ...prev,
        products: prev.products.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: editForm.name,
                category: editForm.category,
                line: editForm.line,
                salePrice: Number(editForm.salePrice || 0),
                costPrice: Number(editForm.costPrice || 0),
                stock: Number(editForm.stock || 0),
                minStock: Number(editForm.minStock || 0),
                description: editForm.description || "",
                image: imageUrl,
              }
            : p
        ),
      }));

      setEditingProduct(null);
      setEditForm(emptyProduct);

      toast.success("Producto actualizado correctamente");
    } catch (err) {
      console.error("ERROR GENERAL EDITANDO PRODUCTO:", err);
      toast.error("Error general editando producto");
    }
  }

  async function deactivateProduct(product) {
    try {
      const confirmar = confirm(
        `¿Seguro querés desactivar "${product.name}"?\n\nNo se borrará el historial de ventas.`
      );

      if (!confirmar) return;

      const { error } = await supabase
        .from("productos")
        .update({ activo: false })
        .eq("id", product.id);

      if (error) {
        console.error("ERROR DESACTIVANDO PRODUCTO:", error);
        toast.error(error.message);
        return;
      }

      setState((prev) => ({
        ...prev,
        products: prev.products.map((p) =>
          p.id === product.id ? { ...p, active: false } : p
        ),
      }));

      toast.success("Producto desactivado correctamente");
    } catch (err) {
      console.error("ERROR GENERAL DESACTIVANDO PRODUCTO:", err);
      toast.error("Error general desactivando producto");
    }
  }

  const products = state.products.filter(
    (p) =>
      p.active !== false &&
      (
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase()) ||
        p.sku.toLowerCase().includes(query.toLowerCase())
      )
  );

  return (
    <section className={`page ${canAdmin ? "two-columns small-left" : ""}`}>
      {canAdmin && (
        <Card title="Nuevo producto">
          <Field label="Nombre">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>

          <Field label="Categoría">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="Línea">
            <input
              value={form.line}
              onChange={(e) => setForm({ ...form, line: e.target.value })}
            />
          </Field>

          <div className="form-grid">
            <Field label="Precio venta">
              <input
                type="number"
                value={form.salePrice}
                onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
              />
            </Field>

            <Field label="Costo">
              <input
                type="number"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
              />
            </Field>

            <Field label="Stock">
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </Field>

            <Field label="Stock mínimo">
              <input
                type="number"
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Descripción">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>

          <Field label="Imagen del producto">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];

                if (!file) return;

                setForm({
                  ...form,
                  imageFile: file,
                  imagePreview: URL.createObjectURL(file),
                });
              }}
            />
          </Field>

          {form.imagePreview && (
            <div className="product-image-preview">
              <img src={form.imagePreview} alt="Vista previa" />
            </div>
          )}

          <button className="primary-btn full" onClick={saveProduct}>
            <Plus size={18} />
            Guardar producto
          </button>
        </Card>
      )}

      <Card title="Productos">
        <div className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar producto..."
          />
        </div>

        <div className="product-table">
          {products.map((p) => (
            <div className="product-row" key={p.id}>
              <div className="product-info">
                <div className="product-thumb">
                  {p.image ? (
                    <img src={p.image} alt={p.name} />
                  ) : (
                    <div className="no-image">
                      <Package size={22} />
                    </div>
                  )}
                </div>

                <div>
                  <b>{p.name}</b>
                  <span>{p.category} · SKU {p.sku}</span>
                </div>
              </div>

              <div>
                <span>Venta</span>
                <b>{money(p.salePrice)}</b>
              </div>

              <div>
                <span>Costo</span>
                <b>{money(p.costPrice)}</b>
              </div>

              <div>
                <span>Ganancia</span>
                <b>{money(p.salePrice - p.costPrice)}</b>
              </div>

              <div>
                <span>Stock</span>
                <b className={p.stock <= p.minStock ? "danger-text" : ""}>
                  {p.stock}
                </b>
              </div>

              {canAdmin && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="secondary-btn"
                    onClick={() => editProduct(p)}
                  >
                    Editar
                  </button>

                  <button
                    className="danger-btn"
                    onClick={() => deactivateProduct(p)}
                  >
                    Desactivar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {editingProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-head">
              <h2>Editar producto</h2>

              <button
                className="icon-btn"
                onClick={() => setEditingProduct(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              <Field label="Nombre">
                <input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
              </Field>

              <Field label="Categoría">
                <select
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm({ ...editForm, category: e.target.value })
                  }
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>

              <Field label="Línea">
                <input
                  value={editForm.line}
                  onChange={(e) =>
                    setEditForm({ ...editForm, line: e.target.value })
                  }
                />
              </Field>

              <Field label="Precio venta">
                <input
                  type="number"
                  value={editForm.salePrice}
                  onChange={(e) =>
                    setEditForm({ ...editForm, salePrice: e.target.value })
                  }
                />
              </Field>

              <Field label="Costo">
                <input
                  type="number"
                  value={editForm.costPrice}
                  onChange={(e) =>
                    setEditForm({ ...editForm, costPrice: e.target.value })
                  }
                />
              </Field>

              <Field label="Stock">
                <input
                  type="number"
                  value={editForm.stock}
                  onChange={(e) =>
                    setEditForm({ ...editForm, stock: e.target.value })
                  }
                />
              </Field>

              <Field label="Stock mínimo">
                <input
                  type="number"
                  value={editForm.minStock}
                  onChange={(e) =>
                    setEditForm({ ...editForm, minStock: e.target.value })
                  }
                />
              </Field>
            </div>

            <Field label="Descripción">
              <textarea
                value={editForm.description || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
              />
            </Field>

            <Field label="Cambiar imagen">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];

                  if (!file) return;

                  setEditForm({
                    ...editForm,
                    imageFile: file,
                    imagePreview: URL.createObjectURL(file),
                  });
                }}
              />
            </Field>

            {editForm.imagePreview && (
              <div className="product-image-preview">
                <img src={editForm.imagePreview} alt="Vista previa" />
              </div>
            )}

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => setEditingProduct(null)}
              >
                Cancelar
              </button>

              <button className="primary-btn" onClick={saveEditProduct}>
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Stock({ state, setState, canAdmin, session }) {
  const [stockModal, setStockModal] = useState(null);
  const [stockForm, setStockForm] = useState({
    type: "add",
    qty: "",
    reason: "Ingreso de mercadería",
  });

  function openStockModal(product, type) {
    if (!canAdmin) {
      toast.error("Solo administrador puede modificar stock.");
      return;
    }

    setStockModal(product);

    setStockForm({
      type,
      qty: type === "set" ? product.stock : "",
      reason: type === "add" ? "Ingreso de mercadería" : "Corrección manual",
    });
  }

  function closeStockModal() {
    setStockModal(null);

    setStockForm({
      type: "add",
      qty: "",
      reason: "Ingreso de mercadería",
    });
  }

  async function saveStockMovement() {
    try {
      if (!stockModal) return;

      const product = stockModal;
      const type = stockForm.type;
      const qty = Number(stockForm.qty || 0);
      const reason = stockForm.reason || "";

      if (qty < 0) {
        toast.error("La cantidad no puede ser negativa.");
        return;
      }

      const newStock =
        type === "add"
          ? Number(product.stock) + qty
          : qty;

      const movementQty =
        type === "add"
          ? qty
          : qty - Number(product.stock);

      const { error: errorStock } = await supabase
        .from("productos")
        .update({ stock: newStock })
        .eq("id", product.id);

      if (errorStock) {
        console.error("ERROR ACTUALIZANDO STOCK:", errorStock);
        alert(errorStock.message);
        return;
      }

      const { error: errorMovimiento } = await supabase
        .from("movimientos_stock")
        .insert([
          {
            producto_id: product.id,
            tipo: type === "add" ? "Ingreso" : "Corrección",
            cantidad: movementQty,
            motivo: reason,
          },
        ]);

      if (errorMovimiento) {
        console.error("ERROR GUARDANDO MOVIMIENTO:", errorMovimiento);
        alert(errorMovimiento.message);
        return;
      }

      setState((prev) => ({
        ...prev,

        products: prev.products.map((p) =>
          p.id === product.id
            ? { ...p, stock: newStock }
            : p
        ),

        stockMovements: [
          {
            id: uid(),
            date: today(),
            productId: product.id,
            productName: product.name,
            type: type === "add" ? "Ingreso" : "Corrección",
            qty: movementQty,
            reason,
            user: session.name,
          },
          ...prev.stockMovements,
        ],
      }));

      closeStockModal();

      toast.success("Stock actualizado correctamente");
    } catch (err) {
      console.error("ERROR GENERAL STOCK:", err);
      toast.error("Error general actualizando stock");
    }
  }

  return (
    <section className="page two-columns">
      <Card title="Control de stock">
        {state.products.map((p) => (
          <div className="stock-row" key={p.id}>
            <div className="stock-product">
              <div className="stock-image">
                {p.image ? (
                  <img src={p.image} alt={p.name} />
                ) : (
                  <Package size={22} />
                )}
              </div>

              <div className="stock-info">
                <b>{p.name}</b>

                <span>
                  {p.category} · SKU {p.sku}
                </span>
              </div>
            </div>

            <div className="stock-values">
              <div>
                <small>Actual</small>
                <b>{p.stock}</b>
              </div>

              <div>
                <small>Mínimo</small>
                <b>{p.minStock}</b>
              </div>

              <div>
                <small>Estado</small>

                <b className={p.stock <= p.minStock ? "danger-text" : "success-text"}>
                  {p.stock <= p.minStock ? "Bajo" : "OK"}
                </b>
              </div>
            </div>

            <div className="row-actions">
              <button
                className="secondary-btn"
                onClick={() => openStockModal(p, "add")}
              >
                <Plus size={16} />
                Sumar
              </button>

              <button
                className="secondary-btn"
                onClick={() => openStockModal(p, "set")}
              >
                <Edit3 size={16} />
                Corregir
              </button>
            </div>
          </div>
        ))}
      </Card>

      <Card title="Movimientos de stock">
        {state.stockMovements.length ? (
          state.stockMovements.map((m) => (
            <LineItem
              key={m.id}
              left={`${m.date} · ${m.productName}`}
              right={`${m.qty > 0 ? "+" : ""}${m.qty}`}
            />
          ))
        ) : (
          <Empty text="Todavía no hay movimientos." />
        )}
      </Card>

      {stockModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-head">
              <div>
                <h2>
                  {stockForm.type === "add"
                    ? "Sumar stock"
                    : "Corregir stock"}
                </h2>

                <p>{stockModal.name}</p>
              </div>

              <button
                className="icon-btn"
                onClick={closeStockModal}
              >
                <X size={18} />
              </button>
            </div>

            <div className="total-box">
              <LineItem
                left="Stock actual"
                right={`${stockModal.stock} unidades`}
              />

              <LineItem
                left="Stock mínimo"
                right={`${stockModal.minStock} unidades`}
              />
            </div>

            <div className="form-grid">
              <Field
                label={
                  stockForm.type === "add"
                    ? "Cantidad a sumar"
                    : "Nuevo stock correcto"
                }
              >
                <input
                  type="number"
                  value={stockForm.qty}
                  onChange={(e) =>
                    setStockForm({
                      ...stockForm,
                      qty: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Tipo de movimiento">
                <select
                  value={stockForm.type}
                  onChange={(e) =>
                    setStockForm({
                      ...stockForm,
                      type: e.target.value,
                      reason:
                        e.target.value === "add"
                          ? "Ingreso de mercadería"
                          : "Corrección manual",
                    })
                  }
                >
                  <option value="add">Ingreso / sumar</option>
                  <option value="set">Corrección manual</option>
                </select>
              </Field>
            </div>

            <Field label="Motivo del movimiento">
              <textarea
                value={stockForm.reason}
                onChange={(e) =>
                  setStockForm({
                    ...stockForm,
                    reason: e.target.value,
                  })
                }
              />
            </Field>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={closeStockModal}
              >
                Cancelar
              </button>

              <button
                className="primary-btn"
                onClick={saveStockMovement}
              >
                Guardar movimiento
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Debts({ state, setState }) {
  const debts = state.sales.filter((s) => s.debt > 0);

  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "Mercado Pago",
    notes: "Pago registrado",
  });

  function openPaymentModal(sale) {
    setPaymentModal(sale);

    setPaymentForm({
      amount: sale.debt || "",
      method: "Mercado Pago",
      notes: "Pago registrado",
    });
  }

  function closePaymentModal() {
    setPaymentModal(null);

    setPaymentForm({
      amount: "",
      method: "Mercado Pago",
      notes: "Pago registrado",
    });
  }

  async function savePayment() {
    try {
      if (!paymentModal) return;

      const sale = paymentModal;
      const amount = Number(paymentForm.amount || 0);
      const method = paymentForm.method || "Mercado Pago";

      if (!amount || amount <= 0) {
        toast.error("Ingresá un monto válido.");
        return;
      }

      const newPaid = Number(sale.paidAmount || 0) + amount;

      const newDebt = Math.max(
        Number(sale.total || 0) - newPaid,
        0
      );

      const newStatus =
        newDebt === 0 ? "Pagado" : "Parcial";

      const { error: errorPago } = await supabase
        .from("pagos")
        .insert([
          {
            venta_id: sale.id,
            metodo_pago: method,
            monto: amount,
            observaciones: paymentForm.notes || "Pago registrado",
          },
        ]);

      if (errorPago) {
        console.error(errorPago);
        alert(errorPago.message);
        return;
      }

      const { error: errorVenta } = await supabase
        .from("ventas")
        .update({
          abonado: newPaid,
          saldo: newDebt,
          estado_pago: newStatus,
        })
        .eq("id", sale.id);

      if (errorVenta) {
        console.error(errorVenta);
        alert(errorVenta.message);
        return;
      }

      setState((prev) => ({
        ...prev,

        sales: prev.sales.map((s) => {
          if (s.id !== sale.id) return s;

          return {
            ...s,
            paidAmount: newPaid,
            debt: newDebt,
            paymentStatus: newStatus,
            payments: [
              ...(s.payments || []),
              {
                id: uid(),
                date: today(),
                amount,
                method,
                notes: paymentForm.notes || "Pago registrado",
              },
            ],
          };
        }),

        cashMovements: [
          {
            id: uid(),
            date: today(),
            type: "Ingreso",
            concept: `Pago venta #${sale.id}`,
            method,
            amount,
          },
          ...prev.cashMovements,
        ],
      }));

      closePaymentModal();

      toast.success("Pago registrado correctamente");
    } catch (err) {
      console.error(err);
      toast.error("Error general registrando pago");
    }
  }

  return (
    <section className="page">
      <Card title="Deudas y cuotas pendientes">
        {debts.length ? (
          debts.map((s) => (
            <div className="debt-row" key={s.id}>
              <div>
                <b>{s.clientName}</b>

                <span>
                  Venta #{s.id} · vencimiento {s.dueDate} · {s.installments} cuota/s
                </span>
              </div>

              <b className="danger-text">{money(s.debt)}</b>

              <button
                className="success-btn"
                onClick={() => openPaymentModal(s)}
              >
                Registrar pago
              </button>
            </div>
          ))
        ) : (
          <Empty text="No hay deudas pendientes." />
        )}
      </Card>

      {paymentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-head">
              <div>
                <h2>Registrar pago</h2>
                <p>
                  Venta #{paymentModal.id} · {paymentModal.clientName}
                </p>
              </div>

              <button
                className="icon-btn"
                onClick={closePaymentModal}
              >
                <X size={18} />
              </button>
            </div>

            <div className="total-box">
              <LineItem
                left="Total venta"
                right={money(paymentModal.total)}
              />

              <LineItem
                left="Ya abonado"
                right={money(paymentModal.paidAmount)}
              />

              <LineItem
                left="Saldo pendiente"
                right={money(paymentModal.debt)}
                danger
                strong
              />
            </div>

            <div className="form-grid">
              <Field label="Monto abonado">
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      amount: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Método de pago">
                <select
                  value={paymentForm.method}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      method: e.target.value,
                    })
                  }
                >
                  {paymentMethods.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Observaciones">
              <textarea
                value={paymentForm.notes}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    notes: e.target.value,
                  })
                }
              />
            </Field>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={closePaymentModal}
              >
                Cancelar
              </button>

              <button
                className="primary-btn"
                onClick={savePayment}
              >
                Guardar pago
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Cash({ state, setState }) {
  const [form, setForm] = useState({ type: "Egreso", concept: "", method: "Efectivo", amount: "" });
  const totals = state.cashMovements.reduce((acc, m) => {
    if (m.type === "Ingreso") acc.income += Number(m.amount);
    else acc.expense += Number(m.amount);
    return acc;
  }, { income: 0, expense: 0 });

  async function saveMovement() {
  try {
    console.log("ENTRÓ A SAVE MOVEMENT SUPABASE");
    if (!form.concept || !form.amount) {
      toast.error("Completá concepto e importe.");
      return;
    }

    const movimiento = {
      tipo: form.type,
      concepto: form.concept,
      metodo_pago: form.method,
      monto: Number(form.amount),
    };

    const { error } = await supabase
      .from("caja")
      .insert([movimiento]);

    if (error) {
      console.error("ERROR CAJA:", error);
      toast.error(error.message);
      return;
    }

    setState((prev) => ({
      ...prev,
      cashMovements: [
        {
          id: uid(),
          date: today(),
          type: form.type,
          concept: form.concept,
          method: form.method,
          amount: Number(form.amount),
        },
        ...prev.cashMovements,
      ],
    }));

    setForm({
      type: "Egreso",
      concept: "",
      method: "Efectivo",
      amount: "",
    });

    toast.success("Movimiento de caja guardado correctamente");

  } catch (err) {
    console.error(err);
    toast.error("Error general guardando caja");
  }
}

  return (
    <section className="page two-columns small-left">
      <Card title="Nuevo movimiento">
        <Field label="Tipo"><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>Ingreso</option><option>Egreso</option></select></Field>
        <Field label="Concepto"><input value={form.concept} onChange={(e) => setForm({ ...form, concept: e.target.value })} placeholder="Compra de mercadería, gasto, etc." /></Field>
        <Field label="Método"><select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>{paymentMethods.map((m) => <option key={m}>{m}</option>)}</select></Field>
        <Field label="Importe"><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
        <button className="primary-btn full" onClick={saveMovement}>Guardar movimiento</button>
      </Card>
      <Card title="Caja">
        <div className="stats-grid two">
          <StatCard label="Ingresos" value={money(totals.income)} icon={<Wallet />} />
          <StatCard label="Egresos" value={money(totals.expense)} icon={<Wallet />} danger />
        </div>
        {state.cashMovements.map((m) => <LineItem key={m.id} left={`${m.date} · ${m.type} · ${m.concept}`} right={money(m.amount)} danger={m.type === "Egreso"} />)}
      </Card>
    </section>
  );
}

function Shipping({ state, setState }) {
  const salesWithShipping = state.sales.filter(
    (s) =>
      s.orderStatus !== "Cancelado" &&
      (s.shipping?.company || s.shipping?.trackingCode)
  );

  async function updateShipping(id, status) {
    try {
      const { error } = await supabase
        .from("ventas")
        .update({ estado_pedido: status })
        .eq("id", id);

      if (error) {
        console.error("ERROR ACTUALIZANDO ENVÍO:", error);
        toast.error(error.message);
        return;
      }

      setState((prev) => ({
        ...prev,
        sales: prev.sales.map((s) =>
          s.id === id
            ? {
                ...s,
                orderStatus: status,
                shipping: {
                  ...s.shipping,
                  status,
                },
              }
            : s
        ),
      }));
    } catch (err) {
      console.error("ERROR GENERAL ENVÍO:", err);
      toast.error("Error general actualizando envío");
    }
  }

  return (
    <section className="page">
      <Card title="Envíos">
        {salesWithShipping.length ? (
          salesWithShipping.map((s) => (
            <div className="sale-card" key={s.id}>
              <div className="sale-head">
                <div>
                  <b>Venta #{s.id} · {s.clientName}</b>
                  <span>
                    {s.shipping.company || "Sin empresa"} · Seguimiento:{" "}
                    {s.shipping.trackingCode || "Sin código"}
                  </span>
                </div>

                <select
                  value={s.shipping.status || s.orderStatus || "Pendiente"}
                  onChange={(e) => updateShipping(s.id, e.target.value)}
                >
                  <option>Pendiente</option>
                  <option>Despachado</option>
                  <option>En camino</option>
                  <option>Entregado</option>
                </select>
              </div>
            </div>
          ))
        ) : (
          <Empty text="Todavía no hay ventas con datos de envío." />
        )}
      </Card>
    </section>
  );
}

function Reports({ state }) {
  const activeSales = state.sales.filter(
    (s) => s.orderStatus !== "Cancelado" && s.paymentStatus !== "Cancelado"
  );

  const summary = getSummary({
    ...state,
    sales: activeSales,
  });

  const cashIncome = state.cashMovements
    .filter((m) => m.type === "Ingreso")
    .reduce((acc, m) => acc + Number(m.amount || 0), 0);

  const cashExpense = state.cashMovements
    .filter((m) => m.type === "Egreso")
    .reduce((acc, m) => acc + Number(m.amount || 0), 0);

  const cashBalance = cashIncome - cashExpense;

  const topClients = Object.entries(
    activeSales.reduce((acc, sale) => {
      acc[sale.clientName] = (acc[sale.clientName] || 0) + Number(sale.total || 0);
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const topProducts = getTopProducts(activeSales);

  function exportSales() {
    const rows = [
      [
        "Fecha",
        "Venta",
        "Cliente",
        "Canal",
        "Método",
        "Total",
        "Abonado",
        "Deuda",
        "Estado pago",
        "Estado pedido",
      ],
    ];

    activeSales.forEach((s) =>
      rows.push([
        s.date,
        s.id,
        s.clientName,
        s.channel,
        s.paymentMethod,
        s.total,
        s.paidAmount,
        s.debt,
        s.paymentStatus,
        s.orderStatus,
      ])
    );

    downloadCSV("reporte_ventas.csv", rows);
  }

  function exportProducts() {
    const rows = [
      [
        "SKU",
        "Producto",
        "Categoría",
        "Venta",
        "Costo",
        "Ganancia unitaria",
        "Stock",
        "Mínimo",
        "Activo",
      ],
    ];

    state.products.forEach((p) =>
      rows.push([
        p.sku,
        p.name,
        p.category,
        p.salePrice,
        p.costPrice,
        Number(p.salePrice || 0) - Number(p.costPrice || 0),
        p.stock,
        p.minStock,
        p.active === false ? "No" : "Sí",
      ])
    );

    downloadCSV("reporte_productos_stock.csv", rows);
  }

  function exportCash() {
    const rows = [["Fecha", "Tipo", "Concepto", "Método", "Importe"]];

    state.cashMovements.forEach((m) =>
      rows.push([m.date, m.type, m.concept, m.method, m.amount])
    );

    downloadCSV("reporte_caja.csv", rows);
  }

  return (
    <section className="page">
      <div className="stats-grid">
        <StatCard
          icon={<ReceiptText />}
          label="Total vendido"
          value={money(summary.totalSales)}
        />

        <StatCard
          icon={<Wallet />}
          label="Total cobrado"
          value={money(summary.totalPaid)}
        />

        <StatCard
          icon={<CreditCard />}
          label="Total pendiente"
          value={money(summary.totalDebt)}
          danger={summary.totalDebt > 0}
        />

        <StatCard
          icon={<BarChart3 />}
          label="Caja / Balance"
          value={money(cashBalance)}
          danger={cashBalance < 0}
        />
      </div>

      <Card title="Exportaciones">
        <div className="export-actions">
          <button className="primary-btn" onClick={exportSales}>
            <Download size={18} /> Exportar ventas CSV
          </button>

          <button className="primary-btn" onClick={exportProducts}>
            <Download size={18} /> Exportar stock CSV
          </button>

          <button className="primary-btn" onClick={exportCash}>
            <Download size={18} /> Exportar caja CSV
          </button>

          <button className="secondary-btn" onClick={() => window.print()}>
            <Download size={18} /> Imprimir / guardar PDF
          </button>
        </div>
      </Card>

      <div className="grid-3">
        <Card title="Ranking de productos">
          {topProducts.length ? (
            topProducts.map(([name, qty]) => (
              <LineItem key={name} left={name} right={`${qty} unidades`} />
            ))
          ) : (
            <Empty text="Sin ventas registradas." />
          )}
        </Card>

        <Card title="Mejores clientes">
          {topClients.length ? (
            topClients.map(([name, total]) => (
              <LineItem key={name} left={name} right={money(total)} />
            ))
          ) : (
            <Empty text="Sin clientes con compras." />
          )}
        </Card>

        <Card title="Resumen de caja">
          <LineItem left="Ingresos" right={money(cashIncome)} />
          <LineItem left="Egresos" right={money(cashExpense)} danger />
          <LineItem
            left="Balance"
            right={money(cashBalance)}
            danger={cashBalance < 0}
            strong
          />
        </Card>
      </div>
    </section>
  );
}

function UsersAdmin({ state, setState, isSuperAdmin }) {
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "vendedor" });
  function saveUser() {
    if (!isSuperAdmin) return toast.error("Solo el Super Admin puede crear usuarios.");
    if (!form.name || !form.username || !form.password) return toast.error("Completá todos los datos.");
    if (state.users.some((u) => u.username === form.username)) return toast.error("Ese usuario ya existe.");
    setState((prev) => ({ ...prev, users: [{ id: uid(), ...form, active: true }, ...prev.users] }));
    setForm({ name: "", username: "", password: "", role: "vendedor" });
  }
  function toggleUser(user) {
    if (!isSuperAdmin) return toast.error("Solo el Super Admin puede modificar usuarios.");
    if (user.role === "superadmin") return toast.error("No se puede desactivar el Super Admin principal.");
    setState((prev) => ({ ...prev, users: prev.users.map((u) => u.id === user.id ? { ...u, active: !u.active } : u) }));
  }
  return (
    <section className="page two-columns small-left">
      <Card title="Crear usuario">
        <Field label="Nombre"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Usuario"><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
        <Field label="Contraseña"><input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <Field label="Rol"><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="vendedor">Vendedor</option><option value="admin">Administrador</option></select></Field>
        <button className="primary-btn full" onClick={saveUser}>Crear usuario</button>
      </Card>
      <Card title="Usuarios">
        {state.users.map((u) => (
          <div className="user-row" key={u.id}>
            <div><b>{u.name}</b><span>{u.username} · {roleLabel(u.role)}</span></div>
            <button className={u.active ? "success-btn" : "danger-btn"} onClick={() => toggleUser(u)}>{u.active ? "Activo" : "Inactivo"}</button>
          </div>
        ))}
      </Card>
    </section>
  );
}

function getSummary(state) {
  const todayDate = today();

  const activeSales = state.sales.filter(
    (s) =>
      s.orderStatus !== "Cancelado" &&
      s.paymentStatus !== "Cancelado"
  );

  let totalSales = 0;
  let todaySales = 0;
  let totalPaid = 0;
  let totalDebt = 0;
  let costSold = 0;

  activeSales.forEach((s) => {
    const saleTotal = Number(s.total || 0);
    const salePaid = Number(s.paidAmount || 0);
    const saleDebt = Number(s.debt || 0);

    totalSales += saleTotal;
    totalPaid += salePaid;
    totalDebt += saleDebt;

    if (s.date === todayDate) {
      todaySales += saleTotal;
    }

    (s.items || []).forEach((i) => {
      costSold += Number(i.costPrice || 0) * Number(i.qty || 0);
    });
  });

  return {
    totalSales,
    todaySales,
    totalPaid,
    totalDebt,
    estimatedProfit: totalSales - costSold,
  };
}

function getTopProducts(sales) {
  const map = {};
  sales.forEach((s) => s.items.forEach((i) => { map[i.name] = (map[i.name] || 0) + i.qty; }));
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

function NavButton({ icon, label, active, onClick }) {
  return <button className={`nav-btn ${active ? "active" : ""}`} onClick={onClick}>{React.cloneElement(icon, { size: 19 })}<span>{label}</span></button>;
}
function Card({ title, action, children }) {
  return <div className="card"><div className="card-head"><h3>{title}</h3>{action}</div>{children}</div>;
}
function StatCard({ icon, label, value, danger }) {
  return <div className={`stat-card ${danger ? "danger" : ""}`}><div className="stat-icon">{icon}</div><span>{label}</span><b>{value}</b></div>;
}
function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}
function Empty({ text }) {
  return <div className="empty">{text}</div>;
}
function LineItem({ left, right, danger, strong }) {
  return <div className={`line-item ${danger ? "danger-line" : ""} ${strong ? "strong" : ""}`}><span>{left}</span><b>{right}</b></div>;
}
function SaleMini({ sale }) {
  return <div className="mini-sale"><div><b>{sale.clientName}</b><span>{sale.date} · {sale.paymentMethod}</span></div><b>{money(sale.total)}</b></div>;
}
function pageTitle(page) {
  const map = {
    dashboard: "Panel principal",
    "new-sale": "Nueva venta",
    sales: "Ventas",
    clients: "Clientes",
    products: "Productos",
    stock: "Stock",
    debts: "Deudas y cuotas",
    cash: "Caja",
    shipping: "Envíos",
    reports: "Reportes",
    users: "Usuarios",
  };
  return map[page] || "Sistema";
}
