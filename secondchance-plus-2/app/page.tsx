export default function Home(){
  return (<>
    <section style={{textAlign:'center',padding:'48px 0 8px'}}>
      <h1>Every pet deserves a SecondChance+.</h1>
      <p className="muted">We match adopters with the right shelter pets, then back it up with sponsored training and human help.</p>
    </section>
    <section><h2>What we do</h2>
      <div className="grid">
        <div className="card"><h3>Smart matching</h3><p>Quiz → compatibility across energy, household fit, experience.</p></div>
        <div className="card"><h3>Sponsored training</h3><p>Local trainers sponsor sessions for harder-to-place pets.</p></div>
        <div className="card"><h3>Support</h3><p>AI tips, hotline, and check-ins for the first 6 months.</p></div>
      </div>
    </section>
  </>);
}
