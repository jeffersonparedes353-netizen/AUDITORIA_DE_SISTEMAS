import { useEffect, useRef, useState } from 'react'
import {
  NIVELES, HISTORIA, MISION, ORGANIZACION, OBJETIVOS, INSIGNIAS,
  PUNTAJE_MAXIMO, UMBRAL_VICTORIA, UMBRAL_APROBACION, FACTOR_REPETICION, FACTOR_PISTA,
  valorNivel, puntosReto, cerrarNivel,
} from './data.js'

const CLAVE_MEJOR = 'auditor-simulator:mejor'
const TOTAL_RETOS = NIVELES.reduce((s, n) => s + n.retos.length, 0)
const LETRAS = ['A', 'B', 'C', 'D', 'E']

const estadoInicial = () => ({
  pantalla: 'inicio',
  nivel: 0,
  reto: 0,
  intentos: NIVELES.map(() => 0),
  resultados: NIVELES.map(() => null),
  respuestas: [],
  correctos: {},
  pistas: 0,
  custodio: false,
  final: null,
})

const leerMejor = () => {
  try { return Number(localStorage.getItem(CLAVE_MEJOR)) || 0 } catch { return 0 }
}
const guardarMejor = (valor) => {
  try { localStorage.setItem(CLAVE_MEJOR, String(valor)) } catch { /* sin almacenamiento */ }
}

const sinMovimiento = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const barajar = (lista) => {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

function puntajeTotal(s) {
  const cerrados = s.resultados.reduce((a, r) => a + (r?.aprobado ? r.puntos : 0), 0)
  if (s.pantalla !== 'reto') return cerrados
  const factor = s.intentos[s.nivel] > 1 ? FACTOR_REPETICION : 1
  return cerrados + Math.round(s.respuestas.reduce((a, r) => a + r.puntos, 0) * factor)
}

function insigniasObtenidas(s) {
  const r = s.resultados
  const ids = []
  if (r[0]?.puntos === valorNivel(NIVELES[0])) ids.push('etica')
  if (r[1]?.puntos === valorNivel(NIVELES[1])) ids.push('alcance')
  if (r[2]?.puntos === valorNivel(NIVELES[2])) ids.push('riesgos')
  if (s.custodio) ids.push('custodio')
  if (r.every((x) => x?.aprobado) && s.pistas === 0) ids.push('autonomo')
  if (s.final === 'victoria') ids.push('certificado')
  return ids
}

// ───────────────────────── Hooks de animación ─────────────────────────

function useContador(valor, desde = valor, ms = 800) {
  const [mostrado, setMostrado] = useState(desde)
  const actual = useRef(desde)
  useEffect(() => {
    const inicio = actual.current
    if (inicio === valor || sinMovimiento()) {
      actual.current = valor
      setMostrado(valor)
      return
    }
    let raf
    const t0 = performance.now()
    const paso = (t) => {
      const p = Math.min(1, (t - t0) / ms)
      const x = Math.round(inicio + (valor - inicio) * (1 - Math.pow(1 - p, 3)))
      actual.current = x
      setMostrado(x)
      if (p < 1) raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
  }, [valor, ms])
  return mostrado
}

function useMaquinaEscribir(texto, velocidad = 16) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (sinMovimiento()) return setN(texto.length)
    let i = 0
    setN(0)
    const id = setInterval(() => {
      i += 1
      setN(i)
      if (i >= texto.length) clearInterval(id)
    }, velocidad)
    return () => clearInterval(id)
  }, [texto, velocidad])
  return [texto.slice(0, n), n >= texto.length, () => setN(texto.length)]
}

// ───────────────────────── Fondo "lluvia de código" ─────────────────────────

function FondoCodigo({ intenso }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const simbolos = '01ABCDEF{}<>/#$%アイウエオカキクケコ'
    const tam = 16
    let columnas = []
    let raf
    let ultimo = 0

    const ajustar = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      columnas = Array.from({ length: Math.ceil(canvas.width / tam) }, () => Math.random() * -50)
    }
    const dibujar = (t) => {
      raf = requestAnimationFrame(dibujar)
      if (t - ultimo < 55) return
      ultimo = t
      ctx.fillStyle = 'rgba(6, 11, 20, 0.16)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = `${tam}px JetBrains Mono, monospace`
      columnas.forEach((y, i) => {
        ctx.fillStyle = Math.random() > 0.975 ? '#e7fbff' : '#00e5ff'
        ctx.fillText(simbolos[Math.floor(Math.random() * simbolos.length)], i * tam, y * tam)
        columnas[i] = y * tam > canvas.height && Math.random() > 0.975 ? 0 : y + 1
      })
    }

    ajustar()
    window.addEventListener('resize', ajustar)
    if (!sinMovimiento()) raf = requestAnimationFrame(dibujar)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', ajustar)
    }
  }, [])
  return <canvas ref={ref} className={`fondo-codigo ${intenso ? 'intenso' : ''}`} aria-hidden="true" />
}

// ───────────────────────── HUD ─────────────────────────

function Hud({ s }) {
  const total = puntajeTotal(s)
  const mostrado = useContador(total)
  const hechos =
    s.resultados.reduce((a, r, i) => a + (r?.aprobado ? NIVELES[i].retos.length : 0), 0) +
    (s.pantalla === 'reto' ? s.respuestas.length : 0)
  const progreso = Math.round((hechos / TOTAL_RETOS) * 100)

  return (
    <header className="hud">
      <div className="hud-marca">
        <span className="hud-logo">◆</span> AUDITOR<span className="acento">SIM</span>
      </div>
      <div className="hud-datos">
        <div className="hud-dato" data-testid="hud-nivel">
          <small>Nivel</small>
          <strong>{s.nivel + 1}/{NIVELES.length}</strong>
        </div>
        <div className="hud-dato" data-testid="hud-puntaje" data-valor={total}>
          <small>Puntaje</small>
          <strong>{mostrado}<span className="tenue">/{PUNTAJE_MAXIMO}</span></strong>
        </div>
        <div className="hud-dato">
          <small>Insignias</small>
          <strong>{insigniasObtenidas(s).length}</strong>
        </div>
      </div>
      <div className="hud-progreso" role="progressbar" aria-valuenow={progreso} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso de la auditoría">
        <div className="hud-barra" style={{ width: `${progreso}%` }} />
        <span className="hud-porcentaje">{hechos}/{TOTAL_RETOS} retos · {progreso}%</span>
      </div>
    </header>
  )
}

// ───────────────────────── Pantallas ─────────────────────────

function Inicio({ onComenzar, mejor }) {
  return (
    <section className="pantalla inicio">
      <p className="etiqueta parpadeo">● CONEXIÓN SEGURA ESTABLECIDA</p>
      <h1 className="glitch" data-texto="AUDITOR SIMULATOR">AUDITOR SIMULATOR</h1>
      <p className="subtitulo">Conviértete en el auditor de sistemas que {ORGANIZACION} necesita.</p>
      <div className="terminal">
        <p><span className="prompt">$</span> cargar_mision --cliente nexora</p>
        <p className="tenue">› 4 niveles · 12 retos · {PUNTAJE_MAXIMO} puntos · 6 insignias</p>
        <p><span className="prompt">$</span> esperando auditor<span className="cursor">_</span></p>
      </div>
      <button className="btn btn-primario pulso" onClick={onComenzar} data-testid="btn-comenzar">
        Comenzar auditoría ▸
      </button>
      {mejor > 0 && <p className="tenue mejor">Mejor puntaje en este equipo: <strong>{mejor}</strong></p>}
    </section>
  )
}

function Briefing({ onContinuar }) {
  const [texto, listo, saltar] = useMaquinaEscribir(HISTORIA.join('\n\n'))
  return (
    <section className="pantalla tarjeta briefing">
      <p className="etiqueta">EXPEDIENTE CONFIDENCIAL · {ORGANIZACION.toUpperCase()}</p>
      <h2>La historia</h2>
      <p className="maquina">{texto}{!listo && <span className="cursor">▌</span>}</p>
      <div className={`mision ${listo ? 'visible' : ''}`}>
        <p className="etiqueta">🎯 MISIÓN PRINCIPAL</p>
        <p>{MISION}</p>
      </div>
      <div className="acciones">
        {!listo && <button className="btn btn-fantasma" onClick={saltar}>Saltar ⏭</button>}
        <button className="btn btn-primario" onClick={onContinuar} data-testid="btn-continuar">
          Aceptar la misión ▸
        </button>
      </div>
    </section>
  )
}

function estadoNodo(s, i) {
  if (s.resultados[i]?.aprobado) return 'completado'
  const desbloqueado = i === 0 || s.resultados[i - 1]?.aprobado
  if (!desbloqueado || s.intentos[i] >= 2) return 'bloqueado'
  return s.intentos[i] === 1 ? 'repetir' : 'disponible'
}

function Mapa({ s, onElegir }) {
  return (
    <section className="pantalla mapa">
      <h2>Mapa de la auditoría</h2>
      <p className="tenue">Aprueba cada nivel con al menos el {UMBRAL_APROBACION * 100}% de sus puntos para desbloquear el siguiente.</p>
      <ol className="nodos">
        {NIVELES.map((n, i) => {
          const estado = estadoNodo(s, i)
          const r = s.resultados[i]
          const activo = estado === 'disponible' || estado === 'repetir'
          return (
            <li key={i} className={`nodo ${estado}`} style={{ animationDelay: `${i * 90}ms` }}>
              <button
                className="nodo-btn"
                disabled={!activo}
                onClick={() => onElegir(i)}
                data-testid={`nodo-${i + 1}`}
                data-estado={estado}
              >
                <span className="nodo-icono">
                  {estado === 'completado' ? '✓' : estado === 'bloqueado' ? '🔒' : i + 1}
                </span>
                <span className="nodo-texto">
                  <small>{n.semana} · {valorNivel(n)} pts</small>
                  <strong>{n.titulo}</strong>
                  <em>
                    {estado === 'completado' && `Completado: ${r.puntos} pts`}
                    {estado === 'disponible' && 'Disponible ▸'}
                    {estado === 'repetir' && `Repetir (puntaje × ${FACTOR_REPETICION}) ▸`}
                    {estado === 'bloqueado' && 'Bloqueado'}
                  </em>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function IntroNivel({ indice, intento, onIniciar, onVolver }) {
  const n = NIVELES[indice]
  return (
    <section className="pantalla tarjeta intro-nivel">
      <p className="etiqueta">NIVEL {indice + 1} · {n.semana.toUpperCase()}</p>
      <h2>{n.titulo}</h2>
      <p className="historia">{n.historia}</p>
      <div className="mision visible">
        <p className="etiqueta">🎯 MISIÓN</p>
        <p>{n.mision}</p>
      </div>
      <ul className="chips">
        {n.retos.map((r) => (
          <li key={r.id}>Reto {r.id} · {r.valor} pts</li>
        ))}
      </ul>
      {intento > 0 && (
        <p className="aviso">⚠ Segundo intento: el puntaje de este nivel se multiplicará por {FACTOR_REPETICION}.</p>
      )}
      <div className="acciones">
        <button className="btn btn-fantasma" onClick={onVolver}>◂ Mapa</button>
        <button className="btn btn-primario" onClick={onIniciar} data-testid="btn-iniciar-nivel">
          Iniciar misión ▸
        </button>
      </div>
    </section>
  )
}

function Reto({ s, onResponder, onSiguiente }) {
  const nivel = NIVELES[s.nivel]
  const reto = nivel.retos[s.reto]
  const clasificar = reto.tipo === 'clasificar'
  const [opciones] = useState(() => (clasificar ? [] : barajar(reto.opciones)))
  const [items] = useState(() => (clasificar ? barajar(reto.items.map((it, i) => ({ ...it, i }))) : []))
  const [seleccion, setSeleccion] = useState(null)
  const [asignadas, setAsignadas] = useState({})
  const [pista, setPista] = useState(false)
  const [resultado, setResultado] = useState(null)
  const valor = pista ? Math.round(reto.valor * FACTOR_PISTA) : reto.valor

  const listo = clasificar ? Object.keys(asignadas).length === reto.items.length : seleccion !== null

  const asignar = (categoria) => {
    if (seleccion === null || resultado) return
    const nuevas = { ...asignadas, [seleccion]: categoria }
    setAsignadas(nuevas)
    const siguiente = items.find((it) => nuevas[it.i] === undefined)
    setSeleccion(siguiente ? siguiente.i : null)
  }

  const confirmar = () => {
    if (!listo || resultado) return
    let aciertos, total, opcion
    if (clasificar) {
      total = reto.items.length
      aciertos = reto.items.filter((it, i) => asignadas[i] === it.categoria).length
    } else {
      total = 1
      aciertos = seleccion === reto.correcta ? 1 : 0
      opcion = reto.opciones.find((o) => o.id === seleccion)
    }
    const puntos = puntosReto(reto, aciertos, total, pista)
    const res = { id: reto.id, puntos, correcto: aciertos === total, aciertos, total, pista, alerta: !!reto.alerta, opcion }
    setResultado(res)
    onResponder(res)
  }

  return (
    <section className={`pantalla reto ${reto.alerta ? 'alerta' : ''}`}>
      {reto.alerta && <div className="banner-alerta">⚠ ALERTA DE SEGURIDAD · POSIBLE ACCESO NO AUTORIZADO</div>}
      <div className="reto-cabecera">
        <span className="etiqueta">NIVEL {s.nivel + 1} · RETO {s.reto + 1}/{nivel.retos.length}</span>
        <span className={`valor ${pista ? 'reducido' : ''}`}>{valor} pts</span>
      </div>
      <h2>{reto.titulo}</h2>
      <p className="pregunta">{reto.pregunta}</p>

      {reto.evidencia && (
        <pre className="evidencia" aria-label="Evidencia">
          {reto.evidencia.map((l) => `${l}\n`)}
        </pre>
      )}

      {clasificar ? (
        <div className="clasificador">
          <ul className="items">
            {items.map((it, k) => {
              const asignada = asignadas[it.i]
              const estado = resultado ? (asignada === it.categoria ? 'ok' : 'mal') : ''
              return (
                <li key={it.i} style={{ animationDelay: `${k * 70}ms` }}>
                  <button
                    className={`item ${seleccion === it.i ? 'seleccionado' : ''} ${estado}`}
                    onClick={() => !resultado && setSeleccion(it.i)}
                    data-testid={`item-${it.i}`}
                  >
                    <span>{it.texto}</span>
                    <span className="chip-cat">
                      {asignada ?? 'Sin clasificar'}
                      {resultado && asignada !== it.categoria && ` → ${it.categoria}`}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="categorias">
            {reto.categorias.map((c) => (
              <button key={c} className="btn btn-cat" disabled={seleccion === null || !!resultado} onClick={() => asignar(c)} data-testid={`cat-${c}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ul className="opciones">
          {opciones.map((o, k) => {
            const estado = resultado ? (o.id === reto.correcta ? 'ok' : o.id === seleccion ? 'mal' : 'apagada') : ''
            return (
              <li key={o.id} style={{ animationDelay: `${k * 80}ms` }}>
                <button
                  className={`opcion ${seleccion === o.id ? 'seleccionada' : ''} ${estado}`}
                  onClick={() => !resultado && setSeleccion(o.id)}
                  aria-pressed={seleccion === o.id}
                  data-testid={`opcion-${o.id}`}
                >
                  <span className="letra">{LETRAS[k]}</span>
                  <span>{o.texto}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {pista && <p className="pista-texto">💡 {reto.pista}</p>}

      <div className="acciones">
        <button className="btn btn-fantasma" onClick={() => setPista(true)} disabled={pista || !!resultado} data-testid="btn-pista">
          💡 Pista (−{FACTOR_PISTA * 100}%)
        </button>
        <button className="btn btn-primario" onClick={confirmar} disabled={!listo || !!resultado} data-testid="btn-confirmar">
          {reto.alerta ? 'Tomar decisión ▸' : 'Confirmar ▸'}
        </button>
      </div>

      {resultado && <Retroalimentacion reto={reto} res={resultado} onSiguiente={onSiguiente} ultimo={s.reto === nivel.retos.length - 1} />}
    </section>
  )
}

function Retroalimentacion({ reto, res, onSiguiente, ultimo }) {
  const tipo = res.correcto ? 'ok' : res.aciertos > 0 ? 'parcial' : 'mal'
  const titulo = { ok: '¡Decisión correcta!', parcial: 'Parcialmente correcto', mal: 'Decisión incorrecta' }[tipo]
  const correcta = reto.opciones?.find((o) => o.id === reto.correcta)
  const boton = useRef(null)
  useEffect(() => boton.current?.focus(), [])

  return (
    <div className="capa" role="dialog" aria-modal="true" aria-labelledby="fb-titulo">
      <div className={`feedback ${tipo}`} data-testid="feedback" data-correcto={res.correcto}>
        <div className="fb-icono">{tipo === 'ok' ? '✓' : tipo === 'parcial' ? '◐' : '✕'}</div>
        <h3 id="fb-titulo">{titulo}</h3>
        <p className="fb-puntos">
          +{res.puntos} pts
          {res.total > 1 && <span className="tenue"> · {res.aciertos}/{res.total} bien clasificados</span>}
          {res.pista && <span className="tenue"> · pista usada</span>}
        </p>
        {res.opcion?.consecuencia && (
          <p className="fb-consecuencia"><strong>Consecuencia:</strong> {res.opcion.consecuencia}</p>
        )}
        {!res.correcto && correcta && (
          <p className="fb-correcta"><strong>Lo que haría un auditor:</strong> {correcta.texto}</p>
        )}
        <p className="fb-explicacion">{reto.explicacion}</p>
        <button ref={boton} className="btn btn-primario" onClick={onSiguiente} data-testid="btn-siguiente">
          {ultimo ? 'Ver resultado del nivel ▸' : 'Siguiente reto ▸'}
        </button>
      </div>
    </div>
  )
}

function Resumen({ s, onMapa, onFinal }) {
  const i = s.nivel
  const n = NIVELES[i]
  const r = s.resultados[i]
  const max = valorNivel(n)
  const ultimoNivel = i === NIVELES.length - 1
  const sinIntentos = !r.aprobado && s.intentos[i] >= 2
  const nuevas = insigniasObtenidas(s).filter((id) =>
    ({ 0: ['etica'], 1: ['alcance'], 2: ['riesgos'], 3: ['custodio'] })[i]?.includes(id),
  )

  return (
    <section className="pantalla tarjeta resumen" data-testid="resumen" data-aprobado={r.aprobado}>
      <p className="etiqueta">RESULTADO · NIVEL {i + 1}</p>
      <h2 className={r.aprobado ? 'texto-ok' : 'texto-mal'}>{r.aprobado ? 'Nivel aprobado' : 'Nivel no aprobado'}</h2>
      <Anillo valor={r.bruto} max={max} />
      <p>
        Obtuviste <strong>{r.bruto}</strong> de {max} pts (mínimo {Math.ceil(max * UMBRAL_APROBACION)}).
        {s.intentos[i] > 1 && r.aprobado && <> Con el factor de repetición suman <strong>{r.puntos}</strong>.</>}
      </p>
      {!r.aprobado && !sinIntentos && (
        <p className="aviso">Los puntos de este intento no se suman. Puedes repetir el nivel una vez (puntaje × {FACTOR_REPETICION}).</p>
      )}
      {sinIntentos && <p className="aviso mal">No aprobaste el nivel en el segundo intento. La auditoría será suspendida.</p>}
      {nuevas.length > 0 && (
        <div className="insignias nuevas">
          {nuevas.map((id) => <Insignia key={id} id={id} obtenida sello />)}
        </div>
      )}
      <div className="acciones">
        {(r.aprobado && ultimoNivel) || sinIntentos ? (
          <button className="btn btn-primario" onClick={onFinal} data-testid="btn-final">Ver informe final ▸</button>
        ) : (
          <button className="btn btn-primario" onClick={onMapa} data-testid="btn-mapa">Volver al mapa ▸</button>
        )}
      </div>
    </section>
  )
}

function Anillo({ valor, max, grande }) {
  const mostrado = useContador(valor, 0, 1100)
  const radio = 52
  const circ = 2 * Math.PI * radio
  const pct = max ? mostrado / max : 0
  return (
    <div className={`anillo ${grande ? 'grande' : ''}`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={radio} className="anillo-fondo" />
        <circle cx="60" cy="60" r={radio} className="anillo-valor" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} />
      </svg>
      <div className="anillo-texto">
        <strong>{mostrado}</strong>
        <span>/{max}</span>
      </div>
    </div>
  )
}

function Insignia({ id, obtenida, sello }) {
  const ins = INSIGNIAS[id]
  return (
    <div className={`insignia ${obtenida ? 'obtenida' : ''} ${sello ? 'sello' : ''}`} data-testid={`insignia-${id}`} data-obtenida={obtenida}>
      <span className="insignia-icono">{ins.icono}</span>
      <strong>{ins.nombre}</strong>
      <small>{ins.detalle}</small>
    </div>
  )
}

function Confeti() {
  const piezas = useRef(
    Array.from({ length: 50 }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      dur: 2.5 + Math.random() * 2,
      color: ['#00e5ff', '#39ff88', '#ff2bd6', '#ffd23f'][Math.floor(Math.random() * 4)],
    })),
  )
  return (
    <div className="confeti" aria-hidden="true">
      {piezas.current.map((p, i) => (
        <span key={i} style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }} />
      ))}
    </div>
  )
}

const RESULTADOS = {
  victoria: { icono: '🏆', titulo: 'Victoria: auditoría exitosa', texto: 'El Comité aprobó tu informe. Tus hallazgos están sustentados y tus recomendaciones serán implementadas.' },
  observaciones: { icono: '📋', titulo: 'Auditoría completada con observaciones', texto: `Entregaste el informe, pero no alcanzaste los ${UMBRAL_VICTORIA} pts necesarios para la certificación. Repasa los conceptos marcados abajo.` },
  suspendida: { icono: '⛔', titulo: 'Auditoría suspendida', texto: 'El Comité suspendió el encargo por no superar uno de los niveles. Revisa los principios y vuelve a intentarlo.' },
}

function Final({ s, onReiniciar }) {
  const total = puntajeTotal(s)
  const res = RESULTADOS[s.final]
  const obtenidas = insigniasObtenidas(s)
  const aprendizajes = Object.entries(OBJETIVOS).map(([id, texto]) => {
    const retos = NIVELES.flatMap((n) => n.retos).filter((r) => r.objetivos.includes(id))
    const bien = retos.filter((r) => s.correctos[r.id]).length
    return { id, texto, logrado: bien / retos.length >= 0.5 }
  })

  return (
    <section className={`pantalla tarjeta final ${s.final}`} data-testid="final" data-resultado={s.final}>
      {s.final === 'victoria' && <Confeti />}
      <div className="final-icono">{res.icono}</div>
      <h2 className={s.final === 'suspendida' ? 'glitch pequeno' : ''} data-texto={res.titulo}>{res.titulo}</h2>
      <p className="tenue">{res.texto}</p>
      <div data-testid="puntaje-final" data-valor={total}>
        <Anillo valor={total} max={PUNTAJE_MAXIMO} grande />
      </div>
      <p className="tenue">Victoria desde {UMBRAL_VICTORIA} pts · Pistas usadas: {s.pistas}</p>

      <h3>Insignias ({obtenidas.length}/{Object.keys(INSIGNIAS).length})</h3>
      <div className="insignias">
        {Object.keys(INSIGNIAS).map((id) => <Insignia key={id} id={id} obtenida={obtenidas.includes(id)} />)}
      </div>

      <h3>Aprendizajes alcanzados</h3>
      <ul className="aprendizajes">
        {aprendizajes.map((a) => (
          <li key={a.id} className={a.logrado ? 'logrado' : ''}>
            <span>{a.logrado ? '✓' : '○'}</span> {a.texto}
          </li>
        ))}
      </ul>

      <button className="btn btn-primario pulso" onClick={onReiniciar} data-testid="btn-reiniciar">↻ Volver a jugar</button>
    </section>
  )
}

// ───────────────────────── App ─────────────────────────

export default function App() {
  const [s, setS] = useState(estadoInicial)
  const [mejor, setMejor] = useState(leerMejor)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: sinMovimiento() ? 'auto' : 'smooth' })
  }, [s.pantalla, s.reto, s.nivel])

  useEffect(() => {
    if (s.pantalla !== 'final') return
    const total = puntajeTotal(s)
    if (total > mejor) {
      setMejor(total)
      guardarMejor(total)
    }
  }, [s, mejor])

  const ir = (pantalla, extra = {}) => setS((p) => ({ ...p, pantalla, ...extra }))

  const iniciarNivel = () =>
    setS((p) => {
      const intentos = [...p.intentos]
      intentos[p.nivel] += 1
      return { ...p, intentos, reto: 0, respuestas: [], pantalla: 'reto' }
    })

  const responder = (res) =>
    setS((p) => ({
      ...p,
      respuestas: [...p.respuestas, res],
      correctos: { ...p.correctos, [res.id]: res.correcto },
      pistas: p.pistas + (res.pista ? 1 : 0),
      custodio: p.custodio || (res.alerta && res.correcto),
    }))

  const siguiente = () =>
    setS((p) => {
      const nivel = NIVELES[p.nivel]
      if (p.reto < nivel.retos.length - 1) return { ...p, reto: p.reto + 1 }
      const bruto = p.respuestas.reduce((a, r) => a + r.puntos, 0)
      const resultados = [...p.resultados]
      resultados[p.nivel] = cerrarNivel(nivel, bruto, p.intentos[p.nivel])
      return { ...p, resultados, pantalla: 'resumen' }
    })

  const terminar = () =>
    setS((p) => {
      const total = puntajeTotal(p)
      const completo = p.resultados.every((r) => r?.aprobado)
      const final = !completo ? 'suspendida' : total >= UMBRAL_VICTORIA ? 'victoria' : 'observaciones'
      return { ...p, final, pantalla: 'final' }
    })

  const conHud = ['mapa', 'intro', 'reto', 'resumen'].includes(s.pantalla)
  const clave = `${s.pantalla}-${s.nivel}-${s.reto}-${s.intentos[s.nivel]}`

  return (
    <div className="app">
      <FondoCodigo intenso={s.pantalla === 'inicio'} />
      <div className="scanlines" aria-hidden="true" />
      {conHud && <Hud s={s} />}
      <main className="contenido" key={clave}>
        {s.pantalla === 'inicio' && <Inicio mejor={mejor} onComenzar={() => ir('briefing')} />}
        {s.pantalla === 'briefing' && <Briefing onContinuar={() => ir('mapa')} />}
        {s.pantalla === 'mapa' && <Mapa s={s} onElegir={(i) => ir('intro', { nivel: i })} />}
        {s.pantalla === 'intro' && (
          <IntroNivel indice={s.nivel} intento={s.intentos[s.nivel]} onIniciar={iniciarNivel} onVolver={() => ir('mapa')} />
        )}
        {s.pantalla === 'reto' && <Reto s={s} onResponder={responder} onSiguiente={siguiente} />}
        {s.pantalla === 'resumen' && <Resumen s={s} onMapa={() => ir('mapa')} onFinal={terminar} />}
        {s.pantalla === 'final' && <Final s={s} onReiniciar={() => setS(estadoInicial())} />}
      </main>
      <footer className="pie">Auditor Simulator · Calidad de Software y Auditoría de Sistemas · Pascual Bravo 2026-2</footer>
    </div>
  )
}
