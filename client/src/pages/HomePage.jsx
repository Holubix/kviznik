import { Link } from 'react-router-dom';

const HomePage = () => (
  <section className="landing">
    <div className="hero-copy">
      <h1>Vítejte v Kvizníku</h1>
      <p>
        Jednoduchý nástroj pro ceské ucitele a studenty. Spustte rychlý kvíz, nechte trídu
        odpovídat v reálném case a sledujte odpovedi z jednoho prehledu.
      </p>
      <div className="cta-row">
        <Link className="primary-button" to="/teacher">
          Jít na ucitele
        </Link>
        <Link className="secondary-button" to="/student">
          Jít na studenty
        </Link>
      </div>
    </div>

    <div className="cards">
      <div className="card-panel">
        <h3>Pro ucitele</h3>
        <p>Vytvárejte otázky, sdílejte kód, sledujte odpovedi a uklidnete chaos.</p>
        <Link className="link-button" to="/teacher">
          Otevrít panel ?
        </Link>
      </div>
      <div className="card-panel">
        <h3>Pro studenty</h3>
        <p>Zadejte kód, vyplnte odpovedi a odešlete je jedním klepnutím.</p>
        <Link className="link-button" to="/student">
          Otevrít panel ?
        </Link>
      </div>
    </div>
  </section>
);

export default HomePage;