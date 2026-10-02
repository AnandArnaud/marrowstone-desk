export default function Customers() {
  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "56px 24px" }}>
      <h1 style={{ fontSize: 32, letterSpacing: "-0.03em", margin: "0 0 8px" }}>Customers</h1>
      <p style={{ color: "#4A5661", margin: "0 0 32px" }}>Teams in logistics, payroll and healthcare run their support on Marrowstone Desk.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        {["Northgate Freight", "Bluefin Payroll", "Larkspur Clinics"].map((name) => (
          <div key={name} style={{ background: "#fff", border: "1px solid #D9DFE3", borderRadius: 12, padding: 24, minHeight: 140 }}>
            <strong>{name}</strong>
            <p style={{ color: "#6B7780", fontSize: 14, marginBottom: 0 }}>Quote pending.</p>
          </div>
        ))}
      </div>
    </main>
  );
}
