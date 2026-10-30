import { MASCOTA } from './data.js'

// ───────── Sonidos generados con Web Audio (sin archivos) ─────────
const CLAVE_SONIDO = 'auditor-simulator:sonido'
let audio
let sonidoActivo = (() => {
  try { return localStorage.getItem(CLAVE_SONIDO) !== 'no' } catch { return true }
})()

export const sonidoEncendido = () => sonidoActivo
export function alternarSonido() {
  sonidoActivo = !sonidoActivo
  try { localStorage.setItem(CLAVE_SONIDO, sonidoActivo ? 'si' : 'no') } catch { /* sin almacenamiento */ }
  return sonidoActivo
}

const MELODIAS = {
  comer: { tipo: 'square', notas: [[660, 0.07], [880, 0.07], [1175, 0.1]] },
  dano: { tipo: 'sawtooth', notas: [[260, 0.12], [180, 0.18]] },
  nivel: { tipo: 'square', notas: [[523, 0.09], [659, 0.09], [784, 0.09], [1047, 0.2]] },
  muerte: { tipo: 'triangle', notas: [[440, 0.25], [349, 0.25], [262, 0.25], [175, 0.6]] },
  click: { tipo: 'square', notas: [[920, 0.03]] },
}

export function sonar(nombre) {
  if (!sonidoActivo) return
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)()
    const { tipo, notas } = MELODIAS[nombre]
    let t = audio.currentTime
    for (const [frecuencia, duracion] of notas) {
      const osc = audio.createOscillator()
      const vol = audio.createGain()
      osc.type = tipo
      osc.frequency.value = frecuencia
      vol.gain.setValueAtTime(0.05, t)
      vol.gain.exponentialRampToValueAtTime(0.001, t + duracion)
      osc.connect(vol).connect(audio.destination)
      osc.start(t)
      osc.stop(t + duracion)
      t += duracion
    }
  } catch { /* navegador sin audio */ }
}

// ───────── Estado de ánimo según la energía ─────────
export function animo(energia) {
  if (energia <= 0) return 'muerto'
  if (energia < 25) return 'critico'
  if (energia < 50) return 'preocupado'
  if (energia < 75) return 'normal'
  return 'feliz'
}

export function frase(energia, indice = 0) {
  const lista = MASCOTA.frases[animo(energia)]
  return lista[indice % lista.length]
}

// ───────── Byte, el búho auditor (SVG) ─────────
export default function Mascota({ etapa = 0, energia = 100, reaccion = null, tam = 120, testId }) {
  const estado = animo(energia)
  const muerto = estado === 'muerto'
  const escala = 0.82 + etapa * 0.045

  return (
    <div
      className={`mascota animo-${estado} ${reaccion ? `reaccion-${reaccion}` : ''}`}
      style={{ width: tam, height: tam * 1.1 }}
      data-testid={testId}
      data-etapa={etapa}
      data-animo={estado}
      role="img"
      aria-label={`${MASCOTA.nombre}, ${MASCOTA.etapas[etapa]}, energía ${energia}%`}
    >
      <svg viewBox="0 0 120 132" aria-hidden="true">
        <defs>
          <radialGradient id="m-cuerpo" cx="40%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#5ff3ff" />
            <stop offset="55%" stopColor="#0aa5c9" />
            <stop offset="100%" stopColor="#0b4f7a" />
          </radialGradient>
          <radialGradient id="m-brillo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse className="m-aura" cx="60" cy="72" rx="58" ry="58" fill="url(#m-brillo)" />
        <ellipse cx="60" cy="126" rx="30" ry="4" fill="rgba(0,0,0,0.45)" className="m-sombra" />

        <g className="m-cuerpo" style={{ transform: `scale(${escala})` }}>
          {/* antena */}
          <line x1="60" y1="24" x2="60" y2="9" stroke="#7fdcf0" strokeWidth="2.5" />
          <circle className="m-antena" cx="60" cy="7" r="4.5" />

          {/* penachos */}
          <path d="M28 40 L33 14 L50 30 Z" fill="#0b6f99" />
          <path d="M92 40 L87 14 L70 30 Z" fill="#0b6f99" />

          {/* alas */}
          <ellipse className="m-ala m-ala-izq" cx="22" cy="80" rx="11" ry="24" fill="#0a7fa8" />
          <ellipse className="m-ala m-ala-der" cx="98" cy="80" rx="11" ry="24" fill="#0a7fa8" />

          {/* cuerpo y barriga con circuitos */}
          <ellipse cx="60" cy="74" rx="38" ry="45" fill="url(#m-cuerpo)" />
          <ellipse cx="60" cy="89" rx="24" ry="26" fill="#dffbff" opacity="0.92" />
          <path d="M48 82 h7 v7 h8 M70 80 v9 h-5 M52 98 h16" stroke="#18a9c9" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <circle cx="55" cy="82" r="1.8" fill="#18a9c9" />
          <circle cx="70" cy="80" r="1.8" fill="#18a9c9" />

          {/* cejas (preocupado / crítico) */}
          <path className="m-cejas" d="M32 38 L52 44 M88 38 L68 44" stroke="#063a55" strokeWidth="3" strokeLinecap="round" />

          {/* ojos */}
          <circle cx="44" cy="56" r="15" fill="#fff" />
          <circle cx="76" cy="56" r="15" fill="#fff" />
          {muerto ? (
            <path d="M37 49 l14 14 M51 49 l-14 14 M69 49 l14 14 M83 49 l-14 14" stroke="#1b2333" strokeWidth="3.5" strokeLinecap="round" />
          ) : (
            <g className="m-ojos">
              <circle className="m-pupila" cx="46" cy="57" r="7.5" fill="#06121f" />
              <circle className="m-pupila" cx="78" cy="57" r="7.5" fill="#06121f" />
              <circle cx="49" cy="54" r="2.4" fill="#fff" />
              <circle cx="81" cy="54" r="2.4" fill="#fff" />
            </g>
          )}

          {/* mejillas (feliz) */}
          <ellipse className="m-mejillas" cx="30" cy="70" rx="5" ry="3" fill="#ff7ab8" />
          <ellipse className="m-mejillas" cx="90" cy="70" rx="5" ry="3" fill="#ff7ab8" />

          {/* pico */}
          <path className="m-pico" d="M53 68 L67 68 L60 79 Z" fill="#ffb020" />

          {/* patas */}
          <path d="M48 116 l-5 7 M48 116 v8 M48 116 l5 7 M72 116 l-5 7 M72 116 v8 M72 116 l5 7" stroke="#ffb020" strokeWidth="2.6" strokeLinecap="round" />

          {/* accesorios según la evolución */}
          {etapa === 0 && (
            <path d="M24 108 l7 -9 l7 8 l8 -10 l7 9 l7 -9 l7 9 l8 -10 l7 8 l7 -7 Q60 140 24 108 Z" fill="#f2eedf" stroke="#cfc7ad" strokeWidth="1" />
          )}
          {etapa >= 2 && (
            <g stroke="#ffd23f" strokeWidth="2.6" fill="none">
              <circle cx="44" cy="56" r="17" />
              <circle cx="76" cy="56" r="17" />
              <path d="M61 55 h-2" />
            </g>
          )}
          {etapa >= 3 && (
            <g className="m-lupa">
              <circle cx="104" cy="96" r="9" fill="rgba(160,240,255,0.35)" stroke="#e7fbff" strokeWidth="2.6" />
              <path d="M97 103 l-8 9" stroke="#8a5a2b" strokeWidth="4" strokeLinecap="round" />
            </g>
          )}
          {etapa >= 4 && (
            <>
              <path className="m-corona" d="M42 26 L46 12 L53 22 L60 8 L67 22 L74 12 L78 26 Z" fill="#ffd23f" stroke="#c99700" strokeWidth="1.2" />
              <path d="M60 84 l11 4 v8 q0 9 -11 13 q-11 -4 -11 -13 v-8 Z" fill="#39ff88" stroke="#0d7a43" strokeWidth="1.5" />
              <path d="M55 95 l4 4 l7 -8" stroke="#05391f" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            </>
          )}

          {/* gota de sudor (crítico) */}
          <path className="m-sudor" d="M98 36 q4 7 0 10 q-4 -3 0 -10 Z" fill="#7fd8ff" />
        </g>

        {muerto && <ellipse className="m-halo" cx="60" cy="10" rx="20" ry="5" fill="none" stroke="#ffd23f" strokeWidth="2.5" />}
        {reaccion === 'comer' && <text className="m-galleta" x="60" y="20" textAnchor="middle" fontSize="22">🍪</text>}
      </svg>
    </div>
  )
}

export function Burbuja({ children, testId }) {
  return (
    <div className="burbuja" data-testid={testId}>
      <strong>{MASCOTA.nombre}:</strong> {children}
    </div>
  )
}

export function BarraEnergia({ energia }) {
  return (
    <div className={`barra-energia animo-${animo(energia)}`} title={`Energía de ${MASCOTA.nombre}`}>
      <i style={{ width: `${Math.max(0, energia)}%` }} />
    </div>
  )
}
