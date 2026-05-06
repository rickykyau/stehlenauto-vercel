"use client";

import { SignOutButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icons } from "@/components/ui/icons";
import { Stars } from "@/components/ui/stars";
import { openYmmModal } from "@/components/fitment/ymm-events";

type WishlistItem = {
  productHandle: string;
  productTitle: string;
  productImage: string | null;
  productPrice: number;
  productSku: string | null;
};

export type GarageVehicle = {
  id: string;
  year: string;
  make: string;
  model: string;
  isPrimary: boolean;
};

export type AccountOrder = {
  id: string;
  number: string;
  date: string;
  summary: string;
  itemCount: number;
  vehicle?: string;
  status: "Processing" | "In transit" | "Delivered" | "Cancelled";
  statusSub: string;
  total: number;
};

const TABS = [
  { id: "overview", label: "OVERVIEW" },
  { id: "garage", label: "GARAGE" },
  { id: "orders", label: "ORDERS" },
  { id: "addresses", label: "ADDRESSES" },
  { id: "wishlist", label: "WISHLIST" },
  { id: "settings", label: "SETTINGS" },
];

const STATUS_COLOR: Record<string, string> = {
  "In transit": "var(--color-primary)",
  Delivered: "var(--color-success)",
  Processing: "var(--color-muted)",
  Cancelled: "var(--color-destructive)",
};

const SAMPLE_ADDRESSES = [
  {
    label: "HOME · DEFAULT SHIPPING",
    name: "Mike Rodriguez",
    line1: "2418 W Cactus Rd",
    city: "Phoenix",
    state: "AZ",
    zip: "85029",
    phone: "(602) 555-0188",
    isDefault: true,
  },
];

export function AccountDashboard({
  firstName,
  email,
  memberSince,
  garage,
  orders,
  initialTab,
}: {
  firstName: string | null;
  email: string | null;
  memberSince: number | null;
  garage: GarageVehicle[];
  orders: AccountOrder[];
  initialTab: string;
}) {
  const [tab, setTab] = useState(initialTab);
  const primaryVehicle = garage.find((v) => v.isPrimary) ?? garage[0];

  return (
    <main>
      <div
        style={{
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div
          className="container-x"
          style={{ paddingTop: 48, paddingBottom: 0 }}
        >
          <div
            className="eyebrow"
            style={{ marginBottom: 8 }}
          >
            ACCOUNT{memberSince ? ` · MEMBER SINCE ${memberSince}` : ""}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 64,
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                lineHeight: 0.95,
              }}
            >
              {firstName ? `Hey, ${firstName}.` : "Welcome."}
            </h1>
            <SignOutButton>
              <button type="button" className="btn btn-sm">
                SIGN OUT
              </button>
            </SignOutButton>
          </div>
          <p
            style={{
              color: "var(--color-muted)",
              marginTop: 12,
              fontSize: 15,
            }}
          >
            Your garage, orders, and saved builds — all in one place.
          </p>
          <div
            className="no-scrollbar"
            style={{
              marginTop: 32,
              display: "flex",
              gap: 0,
              overflowX: "auto",
              borderBottom: "1px solid transparent",
            }}
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  padding: "14px 18px",
                  borderBottom:
                    tab === t.id
                      ? "2px solid var(--color-primary)"
                      : "2px solid transparent",
                  marginBottom: -1,
                  color:
                    tab === t.id
                      ? "var(--color-foreground)"
                      : "var(--color-muted)",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    fontWeight: tab === t.id ? 700 : 500,
                  }}
                >
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className="container-x"
        style={{ paddingTop: 48, paddingBottom: 64 }}
      >
        {tab === "overview" && (
          <Overview
            primary={primaryVehicle}
            garageCount={garage.length}
            orders={orders}
            onTab={setTab}
          />
        )}
        {tab === "garage" && (
          <GarageTab garage={garage} />
        )}
        {tab === "orders" && <OrdersTab orders={orders} />}
        {tab === "addresses" && <AddressesTab />}
        {tab === "wishlist" && <WishlistTab />}
        {tab === "settings" && (
          <SettingsTab firstName={firstName} email={email} />
        )}
      </div>
    </main>
  );
}

function Overview({
  primary,
  garageCount,
  orders,
  onTab,
}: {
  primary?: GarageVehicle;
  garageCount: number;
  orders: AccountOrder[];
  onTab: (id: string) => void;
}) {
  const activeOrders = orders.filter((o) => o.status !== "Delivered");
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3"
      style={{ gap: 16 }}
    >
      <StatCard
        num={activeOrders.length}
        label="ACTIVE ORDERS"
        sub={
          activeOrders[0]
            ? `Most recent: ${activeOrders[0].statusSub.toLowerCase()}`
            : "All caught up"
        }
        onClick={() => onTab("orders")}
        cta="VIEW"
      />
      <StatCard
        num={garageCount}
        label="VEHICLES IN GARAGE"
        sub="Add up to 5"
        onClick={() => onTab("garage")}
        cta="MANAGE"
      />
      <StatCard
        num="$62"
        label="REWARDS AVAILABLE"
        sub="Lifetime $1,247"
        cta="REDEEM"
        highlight
      />

      <div className="md:col-span-2">
        <SectionHeading
          title="RECENT ORDERS"
          cta={orders.length > 0 ? "View all" : undefined}
          onCta={() => onTab("orders")}
        />
        {orders.length === 0 ? (
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: 24,
              color: "var(--color-muted)",
              fontSize: 14,
            }}
          >
            No orders yet — start with our most popular parts in{" "}
            <Link href="/collections" style={{ color: "var(--color-primary)" }}>
              the catalog
            </Link>
            .
          </div>
        ) : (
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            {orders.slice(0, 2).map((o, i) => (
              <OrderRow key={o.id} order={o} divider={i < 1} />
            ))}
          </div>
        )}
      </div>

      <div>
        <SectionHeading
          title="GARAGE"
          cta="Manage"
          onCta={() => onTab("garage")}
        />
        {primary ? (
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: 16,
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                background: "var(--color-surface-2)",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-primary)",
              }}
            >
              <Icons.truck size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  color: "var(--color-muted)",
                  letterSpacing: "0.1em",
                }}
              >
                {primary.year}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {primary.make} {primary.model}
              </div>
            </div>
            <span className="chip chip-success">PRIMARY</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={openYmmModal}
            style={{
              background: "transparent",
              border: "1px dashed var(--color-border-2)",
              borderRadius: "var(--radius-md)",
              padding: 24,
              color: "var(--color-muted)",
              cursor: "pointer",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icons.plus size={20} />
            <span
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
              }}
            >
              ADD A VEHICLE
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

function StatCard({
  num,
  label,
  sub,
  cta,
  onClick,
  highlight,
}: {
  num: string | number;
  label: string;
  sub: string;
  cta: string;
  onClick?: () => void;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background: highlight ? "var(--color-primary)" : "var(--color-surface)",
        color: highlight
          ? "var(--color-primary-foreground)"
          : "var(--color-foreground)",
        border: `1px solid ${highlight ? "var(--color-primary)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-md)",
        padding: 20,
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: "0.14em",
          fontWeight: 600,
          opacity: 0.8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 44,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          marginTop: 6,
          lineHeight: 1,
        }}
      >
        {num}
      </div>
      <div style={{ fontSize: 12, marginTop: 8, opacity: 0.75 }}>{sub}</div>
      <button
        type="button"
        onClick={onClick}
        className="btn btn-sm"
        style={{
          marginTop: 14,
          background: highlight ? "var(--color-background)" : "transparent",
          color: highlight
            ? "var(--color-foreground)"
            : "var(--color-foreground)",
          borderColor: highlight ? "var(--color-background)" : "var(--color-border)",
        }}
      >
        {cta}
      </button>
    </div>
  );
}

function SectionHeading({
  title,
  cta,
  onCta,
}: {
  title: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 12,
        marginTop: 8,
      }}
    >
      <h3
        className="mono"
        style={{
          fontSize: 12,
          letterSpacing: "0.14em",
          fontWeight: 600,
        }}
      >
        {title}
      </h3>
      {cta && (
        <button
          type="button"
          onClick={onCta}
          style={{
            background: "transparent",
            border: 0,
            color: "var(--color-muted)",
            fontSize: 11,
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          {cta}
        </button>
      )}
    </div>
  );
}

function OrderRow({
  order,
  divider,
}: {
  order: AccountOrder;
  divider?: boolean;
}) {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-[1fr_140px_130px_110px]"
      style={{
        gap: 16,
        padding: 20,
        alignItems: "center",
        borderBottom: divider ? "1px solid var(--color-border)" : 0,
      }}
    >
      <div>
        <div
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--color-muted)",
            letterSpacing: "0.08em",
          }}
        >
          ORDER {order.number} · {order.date}
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>
          {order.summary}
        </div>
        {order.vehicle && (
          <div
            style={{
              fontSize: 12,
              color: "var(--color-muted)",
              marginTop: 2,
            }}
          >
            for {order.vehicle}
          </div>
        )}
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: STATUS_COLOR[order.status],
            }}
          />
          <span
            className="mono"
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
            }}
          >
            {order.status.toUpperCase()}
          </span>
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--color-muted)",
            marginTop: 4,
          }}
        >
          {order.statusSub}
        </div>
      </div>
      <div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>
        ${order.total.toFixed(2)}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <Link
          href={`/account/orders/${order.id}`}
          className="btn btn-sm"
          style={{ justifyContent: "center" }}
        >
          DETAILS
        </Link>
      </div>
    </div>
  );
}

function GarageTab({ garage }: { garage: GarageVehicle[] }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
            }}
          >
            YOUR GARAGE
          </h2>
          <p
            style={{
              color: "var(--color-muted)",
              fontSize: 13,
              marginTop: 4,
            }}
          >
            Save up to 5 vehicles. Active vehicle filters search and PDP fitment.
          </p>
        </div>
        <button
          type="button"
          onClick={openYmmModal}
          className="btn btn-primary"
        >
          <Icons.plus size={14} /> ADD VEHICLE
        </button>
      </div>
      <div
        className="grid grid-cols-1 md:grid-cols-2"
        style={{ gap: 16 }}
      >
        {garage.map((v) => (
          <div
            key={v.id}
            style={{
              background: "var(--color-surface)",
              border: `1px solid ${v.isPrimary ? "var(--color-primary)" : "var(--color-border)"}`,
              borderRadius: "var(--radius-md)",
              padding: 24,
              position: "relative",
            }}
          >
            {v.isPrimary && (
              <span
                className="badge badge-best"
                style={{ position: "absolute", top: 12, right: 12 }}
              >
                ACTIVE
              </span>
            )}
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-primary)",
                  flexShrink: 0,
                }}
              >
                <Icons.truck size={28} />
              </div>
              <div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--color-muted)",
                    letterSpacing: "0.1em",
                  }}
                >
                  {v.year}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 22,
                    textTransform: "uppercase",
                    letterSpacing: "-0.01em",
                    marginTop: 2,
                  }}
                >
                  {v.make} {v.model}
                </h3>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: 20,
              }}
            >
              {!v.isPrimary && (
                <button type="button" className="btn btn-sm" style={{ flex: 1 }}>
                  SET ACTIVE
                </button>
              )}
              <Link
                href={`/vehicle/${v.make.toLowerCase()}-${v.model.toLowerCase().replace(/\s+/g, "-")}`}
                className="btn btn-sm"
                style={{ flex: 1, justifyContent: "center" }}
              >
                SHOP PARTS
              </Link>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={openYmmModal}
          style={{
            background: "transparent",
            border: "1px dashed var(--color-border-2)",
            borderRadius: "var(--radius-md)",
            padding: 32,
            color: "var(--color-muted)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            minHeight: 200,
            justifyContent: "center",
          }}
        >
          <Icons.plus size={24} />
          <span
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              fontWeight: 600,
            }}
          >
            ADD A VEHICLE
          </span>
          <span style={{ fontSize: 12 }}>
            {Math.max(0, 5 - garage.length)} of 5 slots remaining
          </span>
        </button>
      </div>
    </div>
  );
}

function OrdersTab({ orders }: { orders: AccountOrder[] }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            textTransform: "uppercase",
          }}
        >
          ORDER HISTORY
        </h2>
        <select className="select" style={{ width: 220 }}>
          <option>ALL ORDERS</option>
          <option>LAST 30 DAYS</option>
          <option>LAST 6 MONTHS</option>
        </select>
      </div>
      {orders.length === 0 ? (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: 24,
            color: "var(--color-muted)",
          }}
        >
          You have no orders yet.
        </div>
      ) : (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
          }}
        >
          {orders.map((o, i) => (
            <OrderRow
              key={o.id}
              order={o}
              divider={i < orders.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AddressesTab() {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            textTransform: "uppercase",
          }}
        >
          SAVED ADDRESSES
        </h2>
        <button type="button" className="btn btn-primary">
          <Icons.plus size={14} /> ADD ADDRESS
        </button>
      </div>
      <div
        className="grid grid-cols-1 md:grid-cols-2"
        style={{ gap: 16 }}
      >
        {SAMPLE_ADDRESSES.map((a, i) => (
          <div
            key={i}
            style={{
              background: "var(--color-surface)",
              border: `1px solid ${a.isDefault ? "var(--color-primary)" : "var(--color-border)"}`,
              borderRadius: "var(--radius-md)",
              padding: 20,
              position: "relative",
            }}
          >
            {a.isDefault && (
              <span
                className="badge badge-best"
                style={{ position: "absolute", top: 12, right: 12 }}
              >
                DEFAULT
              </span>
            )}
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--color-muted)",
                letterSpacing: "0.14em",
                marginBottom: 8,
              }}
            >
              {a.label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</div>
            <div
              style={{
                fontSize: 13,
                color: "var(--color-muted)",
                marginTop: 6,
                lineHeight: 1.6,
              }}
            >
              {a.line1}
              <br />
              {a.city}, {a.state} {a.zip}
              <br />
              {a.phone}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WishlistTab() {
  const [items, setItems] = useState<WishlistItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((d: { items?: WishlistItem[] }) => {
        if (!cancelled) setItems(d.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          textTransform: "uppercase",
          marginBottom: 20,
        }}
      >
        WISHLIST{items ? ` · ${items.length}` : ""}
      </h2>
      {items === null ? (
        <p style={{ color: "var(--color-muted)" }}>Loading…</p>
      ) : items.length === 0 ? (
        <div
          style={{
            padding: 24,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            textAlign: "center",
            color: "var(--color-muted)",
          }}
        >
          <Stars rating={0} size={14} />
          <p style={{ marginTop: 12 }}>
            Your wishlist is empty.{" "}
            <Link
              href="/collections"
              style={{ color: "var(--color-primary)" }}
            >
              Browse parts →
            </Link>
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-2 md:grid-cols-4"
          style={{ gap: 16 }}
        >
          {items.map((it) => (
            <Link
              key={it.productHandle}
              href={`/products/${it.productHandle}`}
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div
                className="product-img-bg"
                style={{
                  aspectRatio: "1",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {it.productImage && (
                  <Image
                    src={it.productImage}
                    alt={it.productTitle}
                    fill
                    sizes="(min-width: 768px) 25vw, 50vw"
                    style={{ objectFit: "contain", padding: "8%" }}
                  />
                )}
              </div>
              <div
                style={{
                  padding: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    minHeight: 38,
                  }}
                >
                  {it.productTitle}
                </div>
                <span
                  className="mono"
                  style={{ fontSize: 16, fontWeight: 700 }}
                >
                  ${it.productPrice}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsTab({
  firstName,
  email,
}: {
  firstName: string | null;
  email: string | null;
}) {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2"
      style={{ gap: 16 }}
    >
      <SettingCard title="PROFILE">
        <div className="label-eyebrow">FIRST NAME</div>
        <input
          className="input"
          defaultValue={firstName ?? ""}
          style={{ marginBottom: 12 }}
        />
        <div className="label-eyebrow">EMAIL</div>
        <input
          className="input"
          defaultValue={email ?? ""}
          style={{ marginBottom: 12 }}
          readOnly
        />
        <p
          style={{
            fontSize: 12,
            color: "var(--color-muted)",
            marginTop: 8,
          }}
        >
          Email is managed via your sign-in provider. Update it in Account Security.
        </p>
      </SettingCard>
      <SettingCard title="NOTIFICATIONS">
        {[
          "Order updates & shipping",
          "New product drops",
          "Promotions & sale events",
          "Install guides for items I bought",
          "Vehicle-specific recommendations",
        ].map((l, i) => (
          <label
            key={l}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 0",
              fontSize: 13,
            }}
          >
            <input type="checkbox" defaultChecked={i < 3} /> {l}
          </label>
        ))}
      </SettingCard>
    </div>
  );
}

function SettingCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: 24,
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 11,
          letterSpacing: "0.14em",
          fontWeight: 600,
          marginBottom: 16,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}
