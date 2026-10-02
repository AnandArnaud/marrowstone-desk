import Link from "next/link";

const PLANS = [
  { name: "Starter", price: "$19", unit: "per agent, per month", points: ["1 queue", "Email and portal channels", "30-day history", "Community support"] },
  { name: "Team", price: "$39", unit: "per agent, per month", points: ["Unlimited queues", "SLAs and priorities", "API access and CSV export", "Email support"] },
  { name: "Business", price: "$69", unit: "per agent, per month", points: ["Everything in Team", "Custom roles", "Customer portal branding", "Priority support"] },
];

export default function Pricing() {
  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "56px 24px" }}>
      <h1 style={{ fontSize: 32, letterSpacing: "-0.03em", margin: "0 0 8px" }}>Pricing</h1>
      <p style={{ color: "#4A5661", margin: "0 0 32px" }}>Per agent, billed monthly. Customers using the portal are always free.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        {PLANS.map((plan) => (
          <div key={plan.name} style={{ background: "#fff", border: "1px solid #D9DFE3", borderRadius: 12, padding: 24 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 18 }}>{plan.name}</h2>
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em" }}>{plan.price}</div>
            <div style={{ color: "#6B7780", fontSize: 13, marginBottom: 16 }}>{plan.unit}</div>
            <ul style={{ margin: "0 0 20px", paddingLeft: 18, color: "#4A5661", fontSize: 14, lineHeight: 1.7 }}>
              {plan.points.map((point) => <li key={point}>{point}</li>)}
            </ul>
            <Link href="/login" style={{ display: "inline-block", background: "#1F5F7A", color: "#fff", padding: "10px 14px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Start with {plan.name}</Link>
          </div>
        ))}
      </div>
      <section style={{ marginTop: 48, background: "#fff", border: "1px solid #D9DFE3", borderRadius: 12, padding: 24 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 18 }}>Questions before you choose?</h2>
        <p style={{ margin: 0, color: "#4A5661", fontSize: 14 }}>
          Write to sales@marrowstone.example and a person answers within a business day.
        </p>
      </section>
    </main>
  );
}
