import { test, expect } from '@playwright/test'
import { NIVELES } from '../src/data.js'

const BIEN = { acierto: true }
const MAL = { acierto: false }
const PISTA = { acierto: true, pista: true }

// Las ventanas de retroalimentación se capturan tal como se ven en pantalla; el resto, página completa.
async function captura(page, testInfo, nombre, { modal = false } = {}) {
  if (!modal) await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(900) // deja terminar las animaciones
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

// Juega un nivel completo. `plan` define, reto por reto, si se acierta, si se usa pista
// y, en el reto de clasificación, cuántos elementos se clasifican bien.
async function jugarNivel(page, indice, plan, alResponder) {
  await page.getByTestId(`nodo-${indice + 1}`).click()
  await page.getByTestId('btn-iniciar-nivel').click()

  for (const [k, reto] of NIVELES[indice].retos.entries()) {
    const jugada = plan[k]
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

    if (alResponder) await alResponder(k, 'antes')
    await page.getByTestId('btn-confirmar').click()
    await expect(page.getByTestId('feedback')).toBeVisible()
    if (alResponder) await alResponder(k, 'despues')
    await page.getByTestId('btn-siguiente').click()
  }
  await expect(page.getByTestId('resumen')).toBeVisible()
}

test('Prueba 1 — Partida perfecta: navega los 4 niveles y obtiene 800/800 con victoria', async ({ page }, testInfo) => {
  await page.goto('/')
  await captura(page, testInfo, '01-inicio')
  await page.getByTestId('btn-comenzar').click()
  await expect(page.locator('.mision.visible')).toBeVisible({ timeout: 15_000 })
  await captura(page, testInfo, '02-briefing')
  await page.getByTestId('btn-continuar').click()

  await expect(page.getByTestId('nodo-1')).toHaveAttribute('data-estado', 'disponible')
  await expect(page.getByTestId('nodo-2')).toHaveAttribute('data-estado', 'bloqueado')
  await captura(page, testInfo, '03-mapa-inicial')

  const esperados = [100, 250, 500, 800]
  for (let n = 0; n < 4; n++) {
    await jugarNivel(page, n, [BIEN, BIEN, BIEN], async (k, momento) => {
      if (n === 0 && k === 0 && momento === 'antes') await captura(page, testInfo, '04-reto-opciones')
      if (n === 0 && k === 0 && momento === 'despues') await captura(page, testInfo, '05-feedback-correcto', { modal: true })
      if (n === 2 && k === 0 && momento === 'antes') await captura(page, testInfo, '06-reto-clasificacion')
      if (n === 3 && k === 1 && momento === 'antes') await captura(page, testInfo, '07-alerta-acceso-no-autorizado')
      if (n === 3 && k === 1 && momento === 'despues') await captura(page, testInfo, '08-decision-acceso-correcta', { modal: true })
    })
    await expect(page.getByTestId('resumen')).toHaveAttribute('data-aprobado', 'true')
    await puntaje(page, esperados[n])
    if (n === 0) await captura(page, testInfo, '09-resumen-nivel-insignia')
    if (n < 3) {
      await page.getByTestId('btn-mapa').click()
      await expect(page.getByTestId(`nodo-${n + 1}`)).toHaveAttribute('data-estado', 'completado')
      await expect(page.getByTestId(`nodo-${n + 2}`)).toHaveAttribute('data-estado', 'disponible')
      if (n === 2) await captura(page, testInfo, '10-mapa-avanzado')
    }
  }

  await page.getByTestId('btn-final').click()
  await expect(page.getByTestId('final')).toHaveAttribute('data-resultado', 'victoria')
  await expect(page.getByTestId('puntaje-final')).toHaveAttribute('data-valor', '800')
  await expect(page.locator('[data-testid^="insignia-"][data-obtenida="true"]')).toHaveCount(6)
  await page.waitForTimeout(1500)
  await captura(page, testInfo, '11-final-victoria')
})

test('Prueba 2 — Pistas, errores y repetición: el puntaje acumulado coincide con el cálculo manual (553)', async ({ page }, testInfo) => {
  await empezar(page)

  // Nivel 1: 15 (pista) + 30 + 40 = 85 → aprobado (mín. 60)
  await jugarNivel(page, 0, [PISTA, BIEN, BIEN], async (k, momento) => {
    if (k === 0 && momento === 'antes') await captura(page, testInfo, 'P2-01-pista-usada')
  })
  await puntaje(page, 85)
  await page.getByTestId('btn-mapa').click()

  // Nivel 2, intento 1: 0 + 50 + 30 (pista) = 80 → no aprobado (mín. 90); no suma
  await jugarNivel(page, 1, [MAL, BIEN, PISTA], async (k, momento) => {
    if (k === 0 && momento === 'despues') await captura(page, testInfo, 'P2-02-feedback-incorrecto', { modal: true })
  })
  await expect(page.getByTestId('resumen')).toHaveAttribute('data-aprobado', 'false')
  await puntaje(page, 85)
  await captura(page, testInfo, 'P2-03-nivel-no-aprobado')
  await page.getByTestId('btn-mapa').click()
  await expect(page.getByTestId('nodo-2')).toHaveAttribute('data-estado', 'repetir')
  await expect(page.getByTestId('nodo-3')).toHaveAttribute('data-estado', 'bloqueado')
  await captura(page, testInfo, 'P2-04-mapa-repetir')

  // Nivel 2, intento 2: 150 × 0,8 = 120 → total 205
  await jugarNivel(page, 1, [BIEN, BIEN, BIEN])
  await puntaje(page, 205)
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

test('Prueba 3 — Bloqueo de nivel, auditoría suspendida y reinicio del juego', async ({ page }, testInfo) => {
  await empezar(page)

  // Nivel 1, intento 1: todo incorrecto → 0 pts, nivel 2 sigue bloqueado
  await jugarNivel(page, 0, [MAL, MAL, MAL])
  await expect(page.getByTestId('resumen')).toHaveAttribute('data-aprobado', 'false')
  await puntaje(page, 0)
  await page.getByTestId('btn-mapa').click()
  await expect(page.getByTestId('nodo-1')).toHaveAttribute('data-estado', 'repetir')
  await expect(page.getByTestId('nodo-2')).toHaveAttribute('data-estado', 'bloqueado')
  await expect(page.getByTestId('nodo-2')).toBeDisabled()
  await captura(page, testInfo, 'P3-01-nivel-2-bloqueado')

  // Nivel 1, intento 2: todo incorrecto → auditoría suspendida
  await jugarNivel(page, 0, [MAL, MAL, MAL])
  await captura(page, testInfo, 'P3-02-segundo-intento-fallido')
  await page.getByTestId('btn-final').click()
  await expect(page.getByTestId('final')).toHaveAttribute('data-resultado', 'suspendida')
  await expect(page.getByTestId('puntaje-final')).toHaveAttribute('data-valor', '0')
  await captura(page, testInfo, 'P3-03-final-suspendida')

  // Volver a jugar: puntaje en 0 y progreso desde el nivel 1
  await page.getByTestId('btn-reiniciar').click()
  await expect(page.getByTestId('btn-comenzar')).toBeVisible()
  await page.getByTestId('btn-comenzar').click()
  await page.getByTestId('btn-continuar').click()
  await puntaje(page, 0)
  await expect(page.getByTestId('hud-nivel')).toContainText('1/4')
  await expect(page.getByTestId('nodo-1')).toHaveAttribute('data-estado', 'disponible')
  await expect(page.getByTestId('nodo-2')).toHaveAttribute('data-estado', 'bloqueado')
  await captura(page, testInfo, 'P3-04-reinicio')
})
