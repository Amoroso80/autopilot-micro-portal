import "./globals.css";
import Link from "next/link";
export const metadata = { title: "SecondChance+", description: "Smart matches for shelter pets + sponsored training" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body>
      <nav className="container nav">
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <Link href="/">SecondChance+</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/donate">Donate</Link>
          <Link href="/admin">Admin</Link>
        </div>
        <div><Link className="cta" href="/pricing">Get Plus</Link></div>
      </nav>
      <main className="container">{children}</main>
      <footer className="container footer">© {new Date().getFullYear()} SecondChance+ · <Link href="/legal/privacy">Privacy</Link></footer>
    </body></html>
  );
}
