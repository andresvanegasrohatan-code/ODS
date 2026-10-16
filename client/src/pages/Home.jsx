import { Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import ContentCard from '../components/ContentCard';
import { CONTENIDOS } from '../data/contenido';
import useOportunidades from '../hooks/useOportunidades';

const SERVICIOS = [
  {
    icono: '📘',
    titulo: 'Información',
    texto: 'Aprende sobre derechos, inclusión y prevención de la discriminación.',
    fondo: 'bg-brand-tint text-brand-dark',
    href: '#educacion',
  },
  {
    icono: '📝',
    titulo: 'Registrar',
    texto: 'Reporta una situación de discriminación o desigualdad y dale seguimiento.',
    fondo: 'bg-gold-tint text-gold',
    href: '/acceso',
  },
  {
    icono: '🎓',
    titulo: 'Oportunidades',
    texto: 'Consulta eventos, capacitaciones y actividades sobre equidad.',
    fondo: 'bg-violet-tint text-violet',
    href: '#oportunidades',
  },
];

const PILARES = [
  { numero: '01', titulo: 'Infórmate', texto: 'Conoce tus derechos y reconoce las distintas formas de desigualdad.' },
  { numero: '02', titulo: 'Busca apoyo', texto: 'Encuentra orientación y registra una situación cuando lo necesites.' },
  { numero: '03', titulo: 'Participa', texto: 'Accede a recursos y oportunidades para impulsar el cambio.' },
];

export default function Home() {
  const { oportunidades, cargando: cargandoOportunidades, error: errorOportunidades } = useOportunidades();

  return (
    <div className="bg-[#f7f2ee] text-ink">
      <PublicNavbar />

      <main>
        <section className="mx-auto max-w-7xl px-4 pb-10 pt-5 sm:px-6 lg:px-8">
          <div className="hero-panel">
            <div className="hero-content">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/90 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-[#ffb6d2]" />
                ODS 5 · Igualdad de género
              </div>

              <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                <div>
                  <h1 className="max-w-3xl font-display text-5xl leading-[0.98] text-white sm:text-6xl lg:text-[5.5rem]">
                    La igualdad se construye en comunidad.
                  </h1>
                  <p className="mt-6 max-w-xl text-lg leading-8 text-white/80 sm:text-xl">
                    Un espacio para aprender, encontrar orientación y acercarte a oportunidades que promueven una vida
                    libre de discriminación.
                  </p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link to="/acceso?modo=registro" className="btn btn-primary">
                      Únete a EquiGénero <span aria-hidden="true" className="ml-2">→</span>
                    </Link>
                    <a href="#que-es" className="btn btn-outline-light">
                      Explorar la plataforma
                    </a>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/20 bg-[#351a39]/45 p-5 backdrop-blur-md sm:p-6">
                  <div className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-[#ffd4e4]">
                    Un lugar para
                  </div>
                  <div className="space-y-4">
                    {['Informarte con confianza', 'Encontrar recursos de apoyo', 'Ser parte del cambio'].map((texto, index) => (
                      <div key={texto} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 font-display text-lg text-white">
                          0{index + 1}
                        </span>
                        <span className="text-sm font-semibold text-white sm:text-base">{texto}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="que-es" className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:items-center lg:px-8 lg:py-20">
          <div>
            <div className="pill-tag">Equidad, información y comunidad</div>
            <h2 className="mt-4 max-w-lg text-4xl leading-tight sm:text-5xl">Un espacio pensado para acompañarte.</h2>
          </div>
          <div className="rounded-[28px] border border-brand/10 bg-white p-6 shadow-soft sm:p-8">
            <p className="text-base leading-8 text-ink-soft sm:text-lg">
              EquiGénero es una plataforma de apoyo y sensibilización alineada con el Objetivo de Desarrollo Sostenible 5.
              Reúne contenido educativo, un canal para registrar situaciones y recursos para promover relaciones más
              justas e inclusivas.
            </p>
            <a href="#servicios" className="mt-5 inline-flex items-center gap-2 font-semibold text-brand-dark hover:text-brand">
              Descubre cómo funciona <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>

        <section id="servicios" className="bg-[linear-gradient(135deg,#f3e5ed_0%,#f8f1eb_50%,#ebe5f5_100%)] py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 max-w-2xl">
              <div className="pill-tag">Una plataforma para actuar</div>
              <h2 className="mt-4 text-4xl sm:text-5xl">Pequeños pasos, cambios importantes.</h2>
              <p className="mt-4 leading-7 text-ink-soft">
                Explora las herramientas de EquiGénero a tu ritmo. Puedes empezar por informarte o crear una cuenta para
                acceder a las funciones de acompañamiento.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {SERVICIOS.map((s) => {
                const contenido = (
                  <>
                    <div className={`mb-5 grid h-14 w-14 place-items-center rounded-2xl text-2xl transition group-hover:scale-105 ${s.fondo}`}>{s.icono}</div>
                    <h3 className="mb-2 text-2xl text-brand-dark">{s.titulo}</h3>
                    <p className="text-sm leading-6 text-ink-soft">{s.texto}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-dark">
                      Explorar <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span>
                    </span>
                  </>
                );
                const className = 'group rounded-[26px] border border-white/80 bg-white p-6 shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-xl sm:p-7';

                return s.href.startsWith('#') ? (
                  <a key={s.titulo} href={s.href} className={className}>{contenido}</a>
                ) : (
                  <Link key={s.titulo} to={s.href} className={className}>{contenido}</Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-8 md:grid-cols-3">
            {PILARES.map((pilar) => (
              <article key={pilar.numero} className="border-t-2 border-brand/20 pt-5">
                <span className="font-display text-4xl text-brand/60">{pilar.numero}</span>
                <h3 className="mt-3 text-2xl">{pilar.titulo}</h3>
                <p className="mt-2 leading-7 text-ink-soft">{pilar.texto}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="educacion" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <div className="pill-tag">Educación y sensibilización</div>
              <h2 className="mt-3 text-4xl sm:text-5xl">Aprender también transforma.</h2>
            </div>
            <p className="hidden max-w-md text-sm leading-6 text-ink-soft md:block">
              Información clara, accesible y útil para reconocer desigualdades, fortalecer derechos y apoyar acciones de cambio.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CONTENIDOS.map((c) => (
              <ContentCard key={c.titulo} item={c} />
            ))}
          </div>
        </section>

        <section id="oportunidades" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <div className="pill-tag">Recursos y oportunidades</div>
              <h2 className="mt-3 text-4xl sm:text-5xl">Encuentra nuevas posibilidades.</h2>
            </div>
            <p className="hidden max-w-md text-sm leading-6 text-ink-soft md:block">
              Programas, actividades, becas y eventos que impulsan la igualdad de género, la inclusión y el bienestar.
            </p>
          </div>

          {errorOportunidades ? (
            <p className="text-sm text-red-700" role="alert">{errorOportunidades}</p>
          ) : cargandoOportunidades ? (
            <p className="text-sm text-ink-soft">Cargando oportunidades…</p>
          ) : oportunidades.length === 0 ? (
            <p className="text-sm text-ink-soft">No hay oportunidades publicadas por el momento.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {oportunidades.map((o) => (
                <ContentCard key={o.id} item={o} />
              ))}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
          <div className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(115deg,#6c1339_0%,#8e1b4d_52%,#5b4a8a_100%)] p-7 text-white shadow-soft sm:p-10 lg:p-14">
            <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full border-[36px] border-white/10" aria-hidden="true" />
            <div className="relative max-w-3xl">
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#ffd4e4]">Hagámoslo posible</div>
              <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">La igualdad empieza con una conversación.</h2>
              <p className="mt-4 max-w-2xl leading-7 text-white/80">
                Crea tu cuenta para acceder al espacio de acompañamiento, registrar una situación y hacer seguimiento.
              </p>
              <Link to="/acceso?modo=registro" className="btn mt-7 bg-white text-brand-dark shadow-soft hover:bg-[#fff1f6]">
                Crear una cuenta <span aria-hidden="true" className="ml-2">→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-sidebar text-sidebar-text">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-display text-2xl text-white">EquiGénero</div>
            <p className="mt-1 text-sm">Información, acompañamiento y oportunidades para la igualdad.</p>
          </div>
          <nav aria-label="Enlaces del pie de página" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <a href="#que-es" className="transition hover:text-white">Conócenos</a>
            <a href="#educacion" className="transition hover:text-white">Educación</a>
            <a href="#oportunidades" className="transition hover:text-white">Oportunidades</a>
            <Link to="/acceso" className="transition hover:text-white">Acceder</Link>
          </nav>
          <p className="text-xs md:text-right">© {new Date().getFullYear()} EquiGénero · ODS 5</p>
        </div>
      </footer>
    </div>
  );
}
