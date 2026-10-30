import { test, expect } from '@playwright/test'
import { NIVELES } from '../src/data.js'

const BIEN = { acierto: true }
const MAL = { acierto: false }
const PISTA = { acierto: true, pista: true }

// Las ventanas de retroalimentación se capturan tal como se ven en pantalla; el resto, página completa.
async function captura(page, testInfo, nombre, { modal = false, espera = 900 } = {}) {
  if (!modal) await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(espera) // deja avanzar las animaciones
  await page.screenshot({
    path: `docs/capturas/${testInfo.project.name}/${nombre}.png`,
    fullPage: !modal,
    style: modal ? undefined : '.categorias { position: static !important; }',
  })
}

async function empezar(page) {
  await page.goto('/')
  await page.getByTestId('btn-comenzar').click()
  await page.getByTestId('btn-continuar').click()
  await expect(page.getByTestId('nodo-1')).toBeVisible()
}

async function puntaje(page, valor) {
  await expect(page.getByTestId('hud-puntaje')).toHaveAttribute('data-valor', String(valor))
}

async function energia(page, valor) {
  await expect(page.getByTestId('hud-energia')).toHaveAttribute('data-valor', String(valor))
}

// Juega un nivel. `plan` define, reto por reto, si se acierta, si se usa pista y, en el reto de
// clasificación, cuántos elementos se clasifican bien. Tras un acierto se alimenta a Byte.
// `alResponder(k, momento)` permite capturar pantallas: 'antes', 'despues' y 'alimentado'.
async function jugarNivel(page, indice, plan, alResponder = async () => {}) {
  await page.getByTestId(`nodo-${indice + 1}`).click()
  await page.getByTestId('btn-iniciar-nivel').click()

  for (const [k, jugada] of plan.entries()) {
    const reto = NIVELES[indice].retos[k]
    if (jugada.pista) await page.getByTestId('btn-pista').click()

    if (reto.tipo === 'clasificar') {
      const buenos = jugada.aciertos ?? reto.items.length
      for (const [i, item] of reto.items.entries()) {
        const categoria = i < buenos ? item.categoria : reto.categorias.find((c) => c !== item.categoria)
        await page.getByTestId(`item-${i}`).click()
        await page.getByTestId(`cat-${categoria}`).click()
      }
    } else {
      const opcion = jugada.acierto ? reto.correcta : reto.opciones.find((o) => o.id !== reto.correcta).id
      await page.getByTestId(`opcion-${opcion}`).click()
    }

    await alResponder(k, 'antes')
    await page.getByTestId('btn-confirmar').click()
    await expect(page.getByTestId('feedback')).toBeVisible()
    await alResponder(k, 'despues')

    const alimentar = page.getByTestId('btn-alimentar')
    if (await alimentar.isVisible()) {
      await alimentar.click()
      await alResponder(k, 'alimentado')
    }
    await page.getByTestId('btn-siguiente').click()
  }
  if (plan.length === NIVELES[indice].retos.length) await expect(page.getByTestId('resumen')).toBeVisible()
}

test('Prueba 1 — Partida perfecta: navega los 4 niveles, 800/800, victoria y Byte evoluciona a Guardián', async ({ page }, testInfo) => {
  await page.goto('/')
  await captura(page, testInfo, '01-inicio')
  await page.getByTestId('btn-comenzar').click()
  await expect(page.locator('.reglas-byte.visible')).toBeVisible({ timeout: 15_000 })
  await captura(page, testInfo, '02-briefing')
  await page.getByTestId('btn-continuar').click()

  await expect(page.getByTestId('nodo-1')).toHaveAttribute('data-estado', 'disponible')
  await expect(page.getByTestId('nodo-2')).toHaveAttribute('data-estado', 'bloqueado')
  await expect(page.getByTestId('mascota-mapa')).toHaveAttribute('data-etapa', '0')
  await energia(page, 100)
  await captura(page, testInfo, '03-mapa-inicial')

  const esperados = [100, 250, 500, 800]
  for (let n = 0; n < 4; n++) {
    await jugarNivel(page, n, [BIEN, BIEN, BIEN], async (k, momento) => {
      if (n === 0 && k === 0 && momento === 'antes') await captura(page, testInfo, '04-reto-opciones')
      if (n === 0 && k === 0 && momento === 'despues') await captura(page, testInfo, '05-feedback-dar-galleta', { modal: true })
      if (n === 0 && k === 0 && momento === 'alimentado') await captura(page, testInfo, '06-byte-comiendo', { modal: true, espera: 350 })
      if (n === 2 && k === 0 && momento === 'antes') await captura(page, testInfo, '07-reto-clasificacion')
      if (n === 3 && k === 1 && momento === 'antes') await captura(page, testInfo, '08-alerta-acceso-no-autorizado')
      if (n === 3 && k === 1 && momento === 'despues') await captura(page, testInfo, '09-decision-acceso-correcta', { modal: true })
    })
    await expect(page.getByTestId('resumen')).toHaveAttribute('data-aprobado', 'true')
    await puntaje(page, esperados[n])
    await energia(page, 100)
    await expect(page.getByTestId('mascota-resumen')).toHaveAttribute('data-etapa', String(n + 1))
    if (n === 0) await captura(page, testInfo, '10-resumen-evolucion-insignia')
    if (n < 3) {
      await page.getByTestId('btn-mapa').click()
      await expect(page.getByTestId(`nodo-${n + 1}`)).toHaveAttribute('data-estado', 'completado')
      await expect(page.getByTestId(`nodo-${n + 2}`)).toHaveAttribute('data-estado', 'disponible')
      if (n === 2) await captura(page, testInfo, '11-mapa-avanzado')
    }
  }

  await page.getByTestId('btn-final').click()
  await expect(page.getByTestId('final')).toHaveAttribute('data-resultado', 'victoria')
  await expect(page.getByTestId('puntaje-final')).toHaveAttribute('data-valor', '800')
  await expect(page.getByTestId('mascota-final')).toHaveAttribute('data-etapa', '4')
  await expect(page.locator('[data-testid^="insignia-"][data-obtenida="true"]')).toHaveCount(6)
  await page.waitForTimeout(1500)
  await captura(page, testInfo, '12-final-victoria')
})

test('Prueba 2 — Pistas, errores y repetición: puntaje 553 y energía de Byte calculados reto a reto', async ({ page }, testInfo) => {
  await empezar(page)

  // Nivel 1: 15 (pista) + 30 + 40 = 85 → aprobado (mín. 60)
  await jugarNivel(page, 0, [PISTA, BIEN, BIEN], async (k, momento) => {
    if (k === 0 && momento === 'antes') await captura(page, testInfo, 'P2-01-pista-usada')
  })
  await puntaje(page, 85)
  await energia(page, 100)
  await page.getByTestId('btn-mapa').click()

  // Nivel 2, intento 1: 0 + 50 + 30 (pista) = 80 → no aprobado (mín. 90); no suma
  // Energía: 100 − 20 + 15 + 8 (tope 100) − 10 (nivel no aprobado) = 90
  await jugarNivel(page, 1, [MAL, BIEN, PISTA], async (k, momento) => {
    if (k === 0 && momento === 'despues') {
      await energia(page, 80)
      await captura(page, testInfo, 'P2-02-feedback-incorrecto-byte-herido', { modal: true, espera: 600 })
    }
  })
  await expect(page.getByTestId('resumen')).toHaveAttribute('data-aprobado', 'false')
  await puntaje(page, 85)
  await energia(page, 90)
  await captura(page, testInfo, 'P2-03-nivel-no-aprobado')
  await page.getByTestId('btn-mapa').click()
  await expect(page.getByTestId('nodo-2')).toHaveAttribute('data-estado', 'repetir')
  await expect(page.getByTestId('nodo-3')).toHaveAttribute('data-estado', 'bloqueado')
  await captura(page, testInfo, 'P2-04-mapa-repetir')

  // Nivel 2, intento 2: 150 × 0,8 = 120 → total 205
  await jugarNivel(page, 1, [BIEN, BIEN, BIEN])
  await puntaje(page, 205)
  await energia(page, 100)
  await captura(page, testInfo, 'P2-05-repeticion-factor')
  await page.getByTestId('btn-mapa').click()

  // Nivel 3: 2/5 clasificados (28) + 80 + 50 (pista) = 158 → aprobado (mín. 150) → total 363
  await jugarNivel(page, 2, [{ aciertos: 2 }, BIEN, PISTA], async (k, momento) => {
    if (k === 0 && momento === 'despues') await captura(page, testInfo, 'P2-06-clasificacion-parcial', { modal: true })
  })
  await puntaje(page, 363)
  await page.getByTestId('btn-mapa').click()

  // Nivel 4: 80 + 50 (pista) + 60 (pista) = 190 → aprobado (mín. 180) → total 553
  await jugarNivel(page, 3, [BIEN, PISTA, PISTA])
  await puntaje(page, 553)
  await page.getByTestId('btn-final').click()

  await expect(page.getByTestId('final')).toHaveAttribute('data-resultado', 'observaciones')
  await expect(page.getByTestId('puntaje-final')).toHaveAttribute('data-valor', '553')
  await expect(page.getByTestId('insignia-custodio')).toHaveAttribute('data-obtenida', 'true')
  await expect(page.getByTestId('insignia-autonomo')).toHaveAttribute('data-obtenida', 'false')
  await expect(page.getByTestId('insignia-certificado')).toHaveAttribute('data-obtenida', 'false')
  await captura(page, testInfo, 'P2-07-final-observaciones')
})

test('Prueba 3 — Bloqueo de nivel, Byte se apaga por falta de energía y reinicio del juego', async ({ page }, testInfo) => {
  await empezar(page)

  // Nivel 1, intento 1: todo incorrecto → 0 pts; energía 100 − 60 − 10 = 30; nivel 2 bloqueado
  await jugarNivel(page, 0, [MAL, MAL, MAL])
  await expect(page.getByTestId('resumen')).toHaveAttribute('data-aprobado', 'false')
  await puntaje(page, 0)
  await energia(page, 30)
  await page.getByTestId('btn-mapa').click()
  await expect(page.getByTestId('nodo-1')).toHaveAttribute('data-estado', 'repetir')
  await expect(page.getByTestId('nodo-2')).toHaveAttribute('data-estado', 'bloqueado')
  await expect(page.getByTestId('nodo-2')).toBeDisabled()
  await expect(page.getByTestId('mascota-mapa')).toHaveAttribute('data-animo', 'preocupado')
  await captura(page, testInfo, 'P3-01-nivel-2-bloqueado-byte-preocupado')

  // Nivel 1, intento 2: dos errores más → energía 10 y luego 0 → Byte se apaga
  await jugarNivel(page, 0, [MAL, MAL], async (k, momento) => {
    if (k === 0 && momento === 'despues') {
      await energia(page, 10)
      await captura(page, testInfo, 'P3-02-byte-critico', { modal: true, espera: 600 })
    }
    if (k === 1 && momento === 'despues') {
      await energia(page, 0)
      await expect(page.getByTestId('mascota-feedback')).toHaveAttribute('data-animo', 'muerto')
      await captura(page, testInfo, 'P3-03-byte-se-apaga', { modal: true, espera: 1700 })
    }
  })
  await expect(page.getByTestId('final')).toHaveAttribute('data-resultado', 'apagada')
  await expect(page.getByTestId('puntaje-final')).toHaveAttribute('data-valor', '0')
  await captura(page, testInfo, 'P3-04-final-byte-apagado', { espera: 1800 })

  // Volver a jugar: puntaje en 0, energía al 100 % y progreso desde el nivel 1
  await page.getByTestId('btn-reiniciar').click()
  await expect(page.getByTestId('btn-comenzar')).toBeVisible()
  await page.getByTestId('btn-comenzar').click()
  await page.getByTestId('btn-continuar').click()
  await puntaje(page, 0)
  await energia(page, 100)
  await expect(page.getByTestId('hud-nivel')).toContainText('1/4')
  await expect(page.getByTestId('nodo-1')).toHaveAttribute('data-estado', 'disponible')
  await expect(page.getByTestId('nodo-2')).toHaveAttribute('data-estado', 'bloqueado')
  await captura(page, testInfo, 'P3-05-reinicio')
})

test('Prueba adicional — Auditoría suspendida con Byte vivo (dos intentos fallidos del nivel 1)', async ({ page }, testInfo) => {
  await empezar(page)

  // Intento 1: 0 + 0 + 40 = 40 (< 60). Energía: 100 − 20 − 20 + 15 − 10 = 65
  await jugarNivel(page, 0, [MAL, MAL, BIEN])
  await expect(page.getByTestId('resumen')).toHaveAttribute('data-aprobado', 'false')
  await energia(page, 65)
  await page.getByTestId('btn-mapa').click()

  // Intento 2: igual → no aprobado otra vez. Energía: 65 − 20 − 20 + 15 − 10 = 30
  await jugarNivel(page, 0, [MAL, MAL, BIEN])
  await energia(page, 30)
  await page.getByTestId('btn-final').click()
  await expect(page.getByTestId('final')).toHaveAttribute('data-resultado', 'suspendida')
  await expect(page.getByTestId('puntaje-final')).toHaveAttribute('data-valor', '0')
  await expect(page.getByTestId('mascota-final')).toHaveAttribute('data-animo', 'preocupado')
  await captura(page, testInfo, 'P4-01-final-suspendida')
})
