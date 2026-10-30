// Convierte docs/ENTREGABLES.md en docs/Auditor-Simulator-Entregables.docx
// Uso: npm run word
// Soporta: títulos, párrafos, negrita/cursiva/código en línea, listas, citas, tablas,
// bloques de código, imágenes PNG y la directiva <!-- incluir: ruta --> para insertar código fuente.

const fs = require('fs')
const path = require('path')
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, ShadingType, BorderStyle, LevelFormat,
  Footer, PageNumber,
} = require('docx')

const RAIZ = path.resolve(__dirname, '..')
const ORIGEN = path.join(__dirname, 'ENTREGABLES.md')
const DESTINO = path.join(__dirname, 'Auditor-Simulator-Entregables.docx')

const ANCHO_CONTENIDO = 9360 // DXA: carta (12240) − márgenes de 1"
const ANCHO_PX = 620 // ancho útil en píxeles (96 ppp)
const FUENTE = 'Calibri'
const MONO = 'Consolas'
const AZUL = '0B5394'

// ───────── Lectura y expansión de <!-- incluir: ruta --> ─────────
function leerMarkdown() {
  return fs.readFileSync(ORIGEN, 'utf8').replace(/<!--\s*incluir:\s*(.+?)\s*-->/g, (_, ruta) => {
    const contenido = fs.readFileSync(path.join(RAIZ, ruta), 'utf8').replace(/\s+$/, '')
    return '```\n' + contenido + '\n```'
  })
}

// ───────── Texto en línea ─────────
function runs(texto, base = {}) {
  const partes = texto.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g).filter(Boolean)
  return partes.map((p) => {
    if (p.startsWith('**')) return new TextRun({ ...base, text: p.slice(2, -2), bold: true })
    if (p.startsWith('`')) return new TextRun({ ...base, text: p.slice(1, -1), font: MONO, size: 19, color: '7A1F5C' })
    if ((p.startsWith('*') || p.startsWith('_')) && p.length > 2) return new TextRun({ ...base, text: p.slice(1, -1), italics: true })
    return new TextRun({ ...base, text: p })
  })
}

// ───────── Imágenes ─────────
function imagen(ruta, maxW, maxH) {
  const archivo = path.join(__dirname, ruta)
  if (!fs.existsSync(archivo)) return new TextRun({ text: `[Falta la imagen ${ruta}]`, color: 'C00000' })
  const datos = fs.readFileSync(archivo)
  const w = datos.readUInt32BE(16)
  const h = datos.readUInt32BE(20)
  const escala = Math.min(maxW / w, maxH / h, 1)
  return new ImageRun({
    type: 'png',
    data: datos,
    transformation: { width: Math.round(w * escala), height: Math.round(h * escala) },
  })
}

const RE_IMAGEN = /^!\[[^\]]*\]\(([^)]+)\)$/

// ───────── Bloques ─────────
const borde = { style: BorderStyle.SINGLE, size: 4, color: 'B7C4D6' }
const bordes = { top: borde, bottom: borde, left: borde, right: borde }

function tabla(filas) {
  const celdas = filas.map((f) => f.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()))
  const cabecera = celdas[0]
  const cuerpo = celdas.slice(2) // la fila 1 es el separador |---|
  const columnas = cabecera.length
  const conImagenes = cuerpo.some((f) => f.some((c) => RE_IMAGEN.test(c)))

  // Ancho de columnas proporcional al texto más largo (mínimo 12 %)
  let pesos = cabecera.map((_, i) => Math.max(...celdas.map((f) => (f[i] || '').length), 4))
  if (conImagenes) pesos = pesos.map(() => 1)
  const suma = pesos.reduce((a, b) => a + b, 0)
  let anchos = pesos.map((p) => Math.max(p / suma, 0.12))
  const total = anchos.reduce((a, b) => a + b, 0)
  anchos = anchos.map((a) => Math.floor((a / total) * ANCHO_CONTENIDO))
  anchos[columnas - 1] += ANCHO_CONTENIDO - anchos.reduce((a, b) => a + b, 0)

  const celda = (texto, i, esCabecera) => {
    const img = texto.match(RE_IMAGEN)
    const contenido = img
      ? [imagen(img[1], Math.round((anchos[i] / ANCHO_CONTENIDO) * ANCHO_PX) - 16, 560)]
      : runs(texto, { size: 19, bold: esCabecera || undefined, color: esCabecera ? 'FFFFFF' : undefined })
    return new TableCell({
      width: { size: anchos[i], type: WidthType.DXA },
      borders: bordes,
      shading: esCabecera ? { type: ShadingType.CLEAR, color: 'auto', fill: AZUL } : undefined,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({ alignment: img ? AlignmentType.CENTER : AlignmentType.LEFT, children: contenido })],
    })
  }

  return new Table({
    width: { size: ANCHO_CONTENIDO, type: WidthType.DXA },
    columnWidths: anchos,
    rows: [
      new TableRow({ tableHeader: true, children: cabecera.map((t, i) => celda(t, i, true)) }),
      ...cuerpo.map((f) => new TableRow({ cantSplit: true, children: cabecera.map((_, i) => celda(f[i] || '', i, false)) })),
    ],
  })
}

function codigo(lineas) {
  return lineas.map(
    (l, i) =>
      new Paragraph({
        spacing: { before: 0, after: 0, line: 228 },
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F3F5F8' },
        border: {
          left: { style: BorderStyle.SINGLE, size: 12, color: AZUL, space: 6 },
          ...(i === 0 ? { top: { style: BorderStyle.SINGLE, size: 2, color: 'F3F5F8', space: 4 } } : {}),
          ...(i === lineas.length - 1 ? { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'F3F5F8', space: 4 } } : {}),
        },
        children: [new TextRun({ text: l.replace(/\t/g, '  ') || ' ', font: MONO, size: 15 })],
      }),
  )
}

function convertir(md) {
  const lineas = md.split(/\r?\n/)
  const salida = []
  let portada = true
  let listaNumerada = 0
  let enListaNumerada = false

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i]
    const t = linea.trim()
    if (!t.startsWith('1.') && !/^\d+\.\s/.test(t)) enListaNumerada = false

    if (!t) continue

    if (t.startsWith('```')) {
      const bloque = []
      while (++i < lineas.length && !lineas[i].trim().startsWith('```')) bloque.push(lineas[i])
      salida.push(...codigo(bloque), new Paragraph({ spacing: { after: 120 }, children: [] }))
      continue
    }

    if (t === '---') {
      portada = false
      continue
    }

    if (t.startsWith('|')) {
      const filas = []
      while (i < lineas.length && lineas[i].trim().startsWith('|')) filas.push(lineas[i++].trim())
      i--
      salida.push(tabla(filas), new Paragraph({ spacing: { after: 160 }, children: [] }))
      continue
    }

    const h = t.match(/^(#{1,4})\s+(.*)$/)
    if (h) {
      const nivel = h[1].length
      if (nivel === 1) {
        salida.push(new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, spacing: { before: 2400, after: 200 }, children: runs(h[2]) }))
      } else {
        const tipo = [null, null, HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][nivel]
        salida.push(new Paragraph({ heading: tipo, pageBreakBefore: nivel === 2, children: runs(h[2]) }))
      }
      continue
    }

    const img = t.match(RE_IMAGEN)
    if (img) {
      salida.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [imagen(img[1], ANCHO_PX, 760)] }))
      continue
    }

    if (t.startsWith('> ')) {
      salida.push(
        new Paragraph({
          indent: { left: 360 },
          border: { left: { style: BorderStyle.SINGLE, size: 18, color: 'C2185B', space: 10 } },
          spacing: { before: 120, after: 160 },
          children: runs(t.slice(2), { italics: true, size: 23 }),
        }),
      )
      continue
    }

    if (t.startsWith('- ')) {
      salida.push(new Paragraph({ numbering: { reference: 'vinetas', level: 0 }, spacing: { after: 60 }, children: runs(t.slice(2)) }))
      continue
    }

    const num = t.match(/^\d+\.\s+(.*)$/)
    if (num) {
      if (!enListaNumerada) listaNumerada++
      enListaNumerada = true
      salida.push(new Paragraph({ numbering: { reference: 'numeros', level: 0, instance: listaNumerada }, spacing: { after: 60 }, children: runs(num[1]) }))
      continue
    }

    // Párrafo: une líneas consecutivas de texto
    const texto = [t]
    while (i + 1 < lineas.length && lineas[i + 1].trim() && !/^(#|\||-\s|>|```|!\[|\d+\.\s|---)/.test(lineas[i + 1].trim())) {
      texto.push(lineas[++i].trim())
    }
    salida.push(
      new Paragraph({
        alignment: portada ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
        spacing: { after: portada ? 200 : 140 },
        children: runs(texto.join(' '), portada ? { size: 26 } : {}),
      }),
    )
  }
  return salida
}

// ───────── Documento ─────────
const doc = new Document({
  creator: 'Equipo Auditor Simulator',
  title: 'Auditor Simulator — Entregables',
  styles: {
    default: { document: { run: { font: FUENTE, size: 22 } } },
    paragraphStyles: [
      { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', run: { size: 60, bold: true, color: AZUL, font: FUENTE } },
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 34, bold: true, color: AZUL, font: FUENTE }, paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 27, bold: true, color: '1F2937', font: FUENTE }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1, keepNext: true } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 23, bold: true, color: '374151', font: FUENTE }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2, keepNext: true } },
    ],
  },
  numbering: {
    config: [
      { reference: 'vinetas', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'numeros', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [
    {
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'Auditor Simulator · Calidad de Software y Auditoría de Sistemas · Página ', size: 16, color: '6B7280' }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '6B7280' }),
              ],
            }),
          ],
        }),
      },
      children: convertir(leerMarkdown()),
    },
  ],
})

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(DESTINO, buffer)
  console.log(`Documento generado: ${path.relative(RAIZ, DESTINO)} (${Math.round(buffer.length / 1024)} KB)`)
})
