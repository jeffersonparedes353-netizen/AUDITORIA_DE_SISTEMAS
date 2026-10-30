// Contenido del juego y reglas de puntuación de Auditor Simulator.

export const PUNTAJE_MAXIMO = 800
export const UMBRAL_APROBACION = 0.6 // 60 % de los puntos del nivel
export const UMBRAL_VICTORIA = 560 // 70 % de 800
export const FACTOR_REPETICION = 0.8
export const FACTOR_PISTA = 0.5

export const ORGANIZACION = 'Nexora Financiera S.A.'

export const HISTORIA = [
  `${ORGANIZACION} es una fintech con 300.000 clientes. Su sistema central, NexoCore, gestiona cuentas, créditos y datos personales.`,
  'En los últimos meses ha habido caídas del servicio, quejas por cobros extraños y rumores de un acceso indebido a la información.',
  'El Comité de Auditoría de la Junta Directiva te contrata como auditor(a) de sistemas independiente. Tienes 4 semanas.',
]

export const MISION =
  'Auditar el control de accesos y la seguridad de la información de NexoCore y entregar al Comité de Auditoría un informe final sustentado en evidencia, sin comprometer tu independencia ni la confidencialidad.'

export const OBJETIVOS = {
  O1: 'Perfil, habilidades y principios éticos del auditor',
  O2: 'Funciones y responsabilidades del auditor de sistemas',
  O3: 'Planificación y delimitación del alcance',
  O4: 'Identificación de activos, amenazas, vulnerabilidades y riesgos',
  O5: 'Recopilación y evaluación de evidencias',
  O6: 'Revisión de controles y formulación de hallazgos',
  O7: 'Elaboración de recomendaciones e informes',
}

export const INSIGNIAS = {
  etica: { icono: '🛡️', nombre: 'Guardián de la Ética', detalle: 'Nivel 1 perfecto' },
  alcance: { icono: '🧭', nombre: 'Estratega del Alcance', detalle: 'Nivel 2 perfecto' },
  riesgos: { icono: '🔍', nombre: 'Cazador de Riesgos', detalle: 'Nivel 3 perfecto' },
  custodio: { icono: '🔐', nombre: 'Custodio de la Evidencia', detalle: 'Actuaste bien ante el acceso no autorizado' },
  autonomo: { icono: '🧠', nombre: 'Auditor Autónomo', detalle: 'Sin usar pistas' },
  certificado: { icono: '🏆', nombre: 'Auditor Certificado', detalle: 'Victoria' },
}

export const NIVELES = [
  {
    titulo: 'El perfil y la ética del auditor',
    semana: 'Semana 1',
    historia: 'Primer día en Nexora. Te asignan una oficina junto al área de TI… la misma que vas a auditar.',
    mision: 'Demostrar que tienes el perfil y los principios para auditar con independencia.',
    retos: [
      {
        id: '1.1',
        titulo: 'El regalo',
        valor: 30,
        objetivos: ['O1'],
        pregunta: 'El gerente de TI, cuya área vas a auditar, te ofrece un fin de semana en un hotel "como bienvenida". ¿Qué haces?',
        opciones: [
          { id: 'A', texto: 'Aceptar: es solo una cortesía.' },
          { id: 'B', texto: 'Aceptar sin contárselo a nadie.' },
          { id: 'C', texto: 'Rechazarlo con cortesía y reportar la situación según la política de conflicto de intereses.' },
          { id: 'D', texto: 'Aceptar y suavizar los hallazgos de TI como agradecimiento.' },
        ],
        correcta: 'C',
        pista: 'Piensa en cómo vería la Junta tu imparcialidad si recibes algo del área auditada.',
        explicacion:
          'Aceptar beneficios del auditado compromete la independencia (real y aparente) y la objetividad. El auditor declina y deja constancia; ocultarlo agrava la falta.',
      },
      {
        id: '1.2',
        titulo: 'El perfil',
        valor: 30,
        objetivos: ['O1', 'O2'],
        pregunta: '¿Qué combinación describe mejor el perfil del auditor de sistemas?',
        opciones: [
          { id: 'A', texto: 'Solo conocimientos avanzados de programación.' },
          { id: 'B', texto: 'Conocimientos de TI y controles, normas y marcos (COBIT, ISO/IEC 27001), escepticismo profesional, pensamiento analítico y comunicación clara.' },
          { id: 'C', texto: 'Solo conocimientos contables y tributarios.' },
          { id: 'D', texto: 'Ser administrador de redes con acceso total a los servidores.' },
        ],
        correcta: 'B',
        pista: 'El auditor evalúa los controles; no los opera.',
        explicacion:
          'El auditor combina competencias técnicas, metodológicas y personales. Tener acceso administrativo a lo auditado sería un conflicto: el auditor evalúa los controles, no los opera.',
      },
      {
        id: '1.3',
        titulo: 'Confidencialidad',
        valor: 40,
        objetivos: ['O1'],
        pregunta: 'Revisando la base de clientes ves que una persona conocida tiene un crédito en mora. Un amigo te pregunta si esa persona es cliente de Nexora.',
        opciones: [
          { id: 'A', texto: 'Contarle, no tiene nada de malo.' },
          { id: 'B', texto: 'No revelar nada: la información obtenida en la auditoría solo se usa para la auditoría.' },
          { id: 'C', texto: 'Contarle si promete guardar el secreto.' },
          { id: 'D', texto: 'Darle una pista sin decirlo directamente.' },
        ],
        correcta: 'B',
        pista: 'La información que conoces durante la auditoría tiene un único uso.',
        explicacion:
          'El principio de confidencialidad y la protección de datos personales (Ley 1581 de 2012) prohíben divulgar la información conocida durante el trabajo.',
      },
    ],
  },
  {
    titulo: 'La planificación de la auditoría',
    semana: 'Semana 2',
    historia: 'El Comité te pide un plan antes de tocar cualquier sistema.',
    mision: 'Definir objetivos, alcance y prioridades con un enfoque basado en riesgos.',
    retos: [
      {
        id: '2.1',
        titulo: 'Primer paso',
        valor: 40,
        objetivos: ['O3'],
        pregunta: '¿Qué haces primero tras aceptar el encargo?',
        opciones: [
          { id: 'A', texto: 'Revisar logs de inmediato para buscar culpables.' },
          { id: 'B', texto: 'Entender la organización y sus procesos, y acordar objetivos, alcance, criterios y cronograma.' },
          { id: 'C', texto: 'Redactar el informe con conclusiones preliminares.' },
          { id: 'D', texto: 'Entrevistar empleados al azar sin un plan.' },
        ],
        correcta: 'B',
        pista: 'No puedes evaluar sin saber contra qué criterios y hasta dónde.',
        explicacion:
          'Sin planificación no hay criterios contra los cuales evaluar. Concluir antes de recolectar evidencia viola el principio de sustentar las conclusiones.',
      },
      {
        id: '2.2',
        titulo: 'El alcance',
        valor: 50,
        objetivos: ['O2', 'O3'],
        pregunta:
          'El alcance acordado es "control de accesos de NexoCore". Durante la planificación detectas posibles fallas en el sistema de nómina. ¿Qué haces?',
        opciones: [
          { id: 'A', texto: 'Ampliar por tu cuenta la auditoría a nómina.' },
          { id: 'B', texto: 'Ignorarlo por completo.' },
          { id: 'C', texto: 'Mantener el alcance, documentar la observación y comunicarla al Comité para que decida si amplía el alcance o lo programa en otra auditoría.' },
          { id: 'D', texto: 'Cambiar el foco a nómina porque parece más grave.' },
        ],
        correcta: 'C',
        pista: '¿Quién tiene autoridad para cambiar el alcance?',
        explicacion:
          'El auditor respeta el alcance acordado y no lo modifica unilateralmente, pero tampoco calla información relevante: la comunica a quien puede decidir.',
      },
      {
        id: '2.3',
        titulo: 'Priorizar',
        valor: 60,
        objetivos: ['O3', 'O4'],
        pregunta: 'Tienes tiempo limitado. ¿Cómo priorizas las áreas a revisar?',
        opciones: [
          { id: 'A', texto: 'Por orden alfabético.' },
          { id: 'B', texto: 'Empezando por el área con menos personal.' },
          { id: 'C', texto: 'Con enfoque basado en riesgos: primero lo de mayor impacto y probabilidad (p. ej., accesos privilegiados a datos de clientes).' },
          { id: 'D', texto: 'Empezando por el área que peor le cae a la gerencia.' },
        ],
        correcta: 'C',
        pista: 'Riesgo = probabilidad × impacto.',
        explicacion:
          'La auditoría basada en riesgos concentra los recursos donde la exposición es mayor. El criterio es técnico, no de conveniencia ni de opinión.',
      },
    ],
  },
  {
    titulo: 'Riesgos, vulnerabilidades y controles',
    semana: 'Semana 3',
    historia: 'Con el plan aprobado, entras al centro de datos y a la configuración de NexoCore.',
    mision: 'Distinguir correctamente los conceptos de seguridad y evaluar los controles existentes.',
    retos: [
      {
        id: '3.1',
        titulo: 'Clasifica',
        tipo: 'clasificar',
        valor: 70,
        objetivos: ['O4'],
        pregunta: 'Toca un elemento y luego la categoría a la que pertenece.',
        categorias: ['Activo', 'Amenaza', 'Vulnerabilidad', 'Riesgo', 'Control'],
        items: [
          { texto: 'Base de datos de clientes de NexoCore', categoria: 'Activo' },
          { texto: 'Campaña de ransomware distribuida por correos de phishing', categoria: 'Amenaza' },
          { texto: 'Servidor de base de datos con el sistema operativo sin parches de seguridad', categoria: 'Vulnerabilidad' },
          { texto: 'Probabilidad de que un atacante explote el servidor sin parches y cifre la base de clientes, interrumpiendo el servicio', categoria: 'Riesgo' },
          { texto: 'Copias de seguridad diarias, cifradas, fuera de línea y con restauración probada', categoria: 'Control' },
        ],
        pista: 'La vulnerabilidad es una debilidad propia; la amenaza viene de afuera a explotarla. El riesgo combina probabilidad e impacto.',
        explicacion:
          'Activo: lo que tiene valor. Amenaza: lo que puede causar daño. Vulnerabilidad: la debilidad que la amenaza explota. Riesgo: probabilidad × impacto de que ocurra. Control: la medida que reduce el riesgo.',
      },
      {
        id: '3.2',
        titulo: 'Tipos de control',
        valor: 80,
        objetivos: ['O6'],
        pregunta:
          'Nexora tiene: (1) política de contraseñas robustas con MFA, (2) monitoreo de logs con alertas de accesos anómalos y (3) restauración desde backup tras un incidente. ¿Cómo se clasifican?',
        opciones: [
          { id: 'A', texto: '(1) Preventivo, (2) Detectivo, (3) Correctivo.' },
          { id: 'B', texto: '(1) Detectivo, (2) Preventivo, (3) Correctivo.' },
          { id: 'C', texto: '(1) Correctivo, (2) Detectivo, (3) Preventivo.' },
          { id: 'D', texto: 'Los tres son preventivos.' },
        ],
        correcta: 'A',
        pista: 'Piensa en antes, durante y después del evento.',
        explicacion:
          'El control preventivo evita que ocurra el evento, el detectivo lo identifica cuando ocurre y el correctivo restaura y reduce el daño después.',
      },
      {
        id: '3.3',
        titulo: '¿El control funciona?',
        valor: 100,
        objetivos: ['O5', 'O6'],
        pregunta: 'La política dice que los accesos a NexoCore se revisan cada trimestre. ¿Cómo verificas que el control es efectivo?',
        opciones: [
          { id: 'A', texto: 'Leer la política: si está escrita, se cumple.' },
          { id: 'B', texto: 'Preguntarle al gerente de TI y confiar en su respuesta.' },
          { id: 'C', texto: 'Tomar una muestra de las revisiones del periodo, verificar evidencia de su ejecución (actas, aprobaciones, tickets de baja) y cruzar los usuarios activos con el personal vigente de RR. HH.' },
          { id: 'D', texto: 'Suponer que funciona porque no se han reportado incidentes.' },
        ],
        correcta: 'C',
        pista: 'Que un control esté bien diseñado no prueba que opere. Necesitas evidencia de que se ejecutó.',
        explicacion:
          'Un control bien diseñado (la política) no prueba que opere con eficacia. El auditor obtiene evidencia suficiente y fiable con muestreo, inspección y re-ejecución. En este cruce aparecen 12 cuentas activas de exempleados.',
      },
    ],
  },
  {
    titulo: 'Evidencias, hallazgos e informe final',
    semana: 'Semana 4',
    historia: 'Última semana. Revisando los logs de NexoCore encuentras algo grave.',
    mision: 'Evaluar la evidencia, actuar correctamente ante el incidente y entregar un informe sustentado.',
    retos: [
      {
        id: '4.1',
        titulo: 'Calidad de la evidencia',
        valor: 80,
        objetivos: ['O5'],
        pregunta: '¿Cuál es la evidencia más fiable?',
        opciones: [
          { id: 'A', texto: 'El comentario verbal de un operador de turno.' },
          { id: 'B', texto: 'Una captura de pantalla enviada por correo por el área auditada.' },
          { id: 'C', texto: 'Logs extraídos directamente por el auditor, con hash de integridad y corroborados con la configuración y otra fuente.' },
          { id: 'D', texto: 'Un rumor anónimo en el chat corporativo.' },
        ],
        correcta: 'C',
        pista: 'Fuente directa + integridad + corroboración.',
        explicacion:
          'La evidencia debe ser suficiente, fiable y relevante. La obtenida directamente por el auditor, íntegra y corroborada, pesa más que la entregada por el auditado o la verbal.',
      },
      {
        id: '4.2',
        titulo: 'Acceso no autorizado',
        alerta: true,
        valor: 100,
        objetivos: ['O2', 'O5'],
        pregunta:
          'Los logs muestran que la cuenta "jperez", de un exempleado retirado hace 4 meses, consultó 3.200 registros de clientes a las 2:14 a. m. ¿Qué haces?',
        evidencia: [
          '2026-10-14 02:14:07  user=jperez  src=10.4.22.81  action=SELECT  table=clientes  rows=3200',
          '2026-10-14 02:14:09  user=jperez  action=EXPORT  file=clientes_q3.csv',
          'RR.HH.: jperez — retiro 2026-06-12 — estado: INACTIVO',
        ],
        opciones: [
          {
            id: 'A',
            texto: 'Borrar tú mismo la cuenta y los logs para detener el daño.',
            consecuencia: 'Destruiste la evidencia y asumiste funciones operativas de TI. Tu independencia queda comprometida y el incidente ya no se puede investigar.',
          },
          {
            id: 'B',
            texto: 'Preservar la evidencia (copia con hash y cadena de custodia), corroborarla con otras fuentes, documentarla y comunicarla de inmediato al Comité de Auditoría y al responsable de seguridad.',
            consecuencia: 'El Comité activa la respuesta a incidentes, TI deshabilita la cuenta y la evidencia queda lista para la investigación.',
          },
          {
            id: 'C',
            texto: 'Publicarlo en el chat de la empresa para alertar a todos.',
            consecuencia: 'Violaste la confidencialidad, alertaste a un posible responsable y expusiste datos de clientes.',
          },
          {
            id: 'D',
            texto: 'Concluir que el exempleado robó los datos y escribirlo así en el informe.',
            consecuencia: 'Conclusión sin sustento: las credenciales pudieron ser robadas por un tercero. El informe pierde credibilidad.',
          },
        ],
        correcta: 'B',
        pista: 'Preserva, documenta y escala. No borres, no divulgues, no acuses.',
        explicacion:
          'Ante un hallazgo grave, el auditor no ejecuta controles operativos ni altera evidencia, no divulga fuera de los canales y no atribuye responsabilidades sin corroborarlas: preserva, documenta y escala.',
      },
      {
        id: '4.3',
        titulo: 'Redactar el hallazgo',
        valor: 120,
        objetivos: ['O6', 'O7'],
        pregunta: '¿Cuál es el hallazgo correctamente formulado para el informe final?',
        opciones: [
          { id: 'A', texto: '"El área de TI es incompetente y su gerente debe ser despedido."' },
          {
            id: 'B',
            texto:
              'Condición: 12 cuentas de exempleados siguen activas; una consultó 3.200 registros. Criterio: la política exige darlas de baja en 24 h. Causa: no hay integración entre RR. HH. y TI. Efecto: exposición de datos personales y riesgo legal y reputacional. Recomendación: automatizar la baja de accesos y hacer revisiones trimestrales evidenciadas, con responsable y fecha.',
          },
          { id: 'C', texto: '"Podría haber algún problema con algunas cuentas; se sugiere revisar."' },
          { id: 'D', texto: '"Se presume que un grupo de hackers internacionales atacó a Nexora."' },
        ],
        correcta: 'B',
        pista: 'Busca condición, criterio, causa, efecto y recomendación.',
        explicacion:
          'Un hallazgo completo incluye condición, criterio, causa, efecto y recomendación, basados en evidencia y con lenguaje objetivo y no personal. Las opiniones, las vaguedades y las suposiciones no son hallazgos.',
      },
    ],
  },
]

export const valorNivel = (nivel) => nivel.retos.reduce((s, r) => s + r.valor, 0)

// Puntos de un reto según los aciertos (1 de 1 en opción múltiple, n de 5 en clasificación) y el uso de pista.
export function puntosReto(reto, aciertos, total, usoPista) {
  const base = (reto.valor / total) * aciertos
  return Math.round(base * (usoPista ? FACTOR_PISTA : 1))
}

export function cerrarNivel(nivel, puntosBrutos, intento) {
  const aprobado = puntosBrutos >= valorNivel(nivel) * UMBRAL_APROBACION
  const factor = intento > 1 ? FACTOR_REPETICION : 1
  return { aprobado, bruto: puntosBrutos, puntos: Math.round(puntosBrutos * factor) }
}
