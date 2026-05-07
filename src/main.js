import { INITIAL_DATA } from './data.js'
import './styles.css'

const STORAGE_KEY = 'sellers-logistica-v1'

const ESTADOS = [
  'Activo',
  'En Proceso',
  'En espera OL',
  'En espera Seller',
  'Seller sin respuesta'
]

const ENVIO_GRATIS = [
  'No',
  'Todos los shops',
  'Shop Promo',
  'Shop Promo 2',
  'Shop Promo 3',
  'Eficiencia Energética',
  'Regular y Promo 2',
  'Shop Regular'
]

const OPERADORES = [
  'Southpost',
  'Andreani',
  'Rapiboy',
  'HOP',
  'PICKIT',
  'Flete Propio',
  'URBANO'
]

let data = loadData()
let currentMarca = Object.keys(data)[0]
let selectedId = data[currentMarca]?.[0]?.id || null
let search = ''
let statusFilter = ''
let operatorFilter = ''
let envioFilter = ''

const app = document.querySelector('#app')

function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch (error) {
    console.warn('No se pudo leer localStorage', error)
  }
  return clone(INITIAL_DATA)
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function currentList() {
  return data[currentMarca] || []
}

function selectedSeller() {
  return currentList().find(s => s.id === selectedId) || currentList()[0] || null
}

function visibleSellers() {
  const q = search.trim().toLowerCase()
  return currentList().filter(seller => {
    const ds = seller.datosSeller
    const text = [
      ds.estado,
      ds.responsable,
      ds.razonSocial,
      ds.alias,
      ds.cuit,
      ds.mailModuloLogistico,
      seller.datosDeposito.provincia,
      seller.datosDeposito.localidad
    ].join(' ').toLowerCase()

    const matchesSearch = !q || text.includes(q)
    const matchesStatus = !statusFilter || ds.estado === statusFilter
    const matchesOperator = !operatorFilter || Boolean(seller.operadorLogistico?.[operatorFilter])
    const matchesEnvio = !envioFilter || seller.formaEnvio.envioGratis === envioFilter

    return matchesSearch && matchesStatus && matchesOperator && matchesEnvio
  })
}

function setByPath(obj, path, value) {
  const parts = path.split('.')
  let target = obj
  for (let i = 0; i < parts.length - 1; i++) target = target[parts[i]]
  target[parts.at(-1)] = value
}

function updateSelected(path, value) {
  const list = currentList()
  const index = list.findIndex(s => s.id === selectedId)
  if (index < 0) return
  setByPath(list[index], path, value)
  saveData()
  render()
}

function selectSeller(id) {
  selectedId = id
  render()
}

function switchMarca(marca) {
  currentMarca = marca
  selectedId = data[marca]?.[0]?.id || null
  search = ''
  statusFilter = ''
  operatorFilter = ''
  envioFilter = ''
  render()
}

function addSeller() {
  const nuevo = {
    id: `${currentMarca}-${Date.now()}`,
    marca: currentMarca,
    datosSeller: {
      estado: 'En Proceso',
      responsable: '',
      razonSocial: '',
      alias: 'Nuevo seller',
      cuit: '',
      mailModuloLogistico: '',
      contrasenaModuloLogistico: ''
    },
    operadorLogistico: Object.fromEntries(OPERADORES.map(op => [op, false])),
    formaEnvio: {
      envioGratis: 'No',
      sameDayNextDay: false,
      retiroSucursal: false
    },
    configuracionLogistica: {
      activoParaOperar: false,
      depositoOk: false
    },
    datosDeposito: {
      provincia: '',
      localidad: ''
    },
    retiroPorSucursal: {
      direcciones: ''
    },
    observaciones: ''
  }
  data[currentMarca].unshift(nuevo)
  selectedId = nuevo.id
  saveData()
  render()
}

function deleteSeller() {
  const seller = selectedSeller()
  if (!seller) return
  if (!confirm(`¿Eliminar ${seller.datosSeller.alias || seller.datosSeller.razonSocial || 'este seller'}?`)) return
  data[currentMarca] = currentList().filter(s => s.id !== seller.id)
  selectedId = data[currentMarca]?.[0]?.id || null
  saveData()
  render()
}

function resetData() {
  if (!confirm('Esto restaurará los datos originales del Excel y borrará los cambios locales. ¿Continuar?')) return
  localStorage.removeItem(STORAGE_KEY)
  data = clone(INITIAL_DATA)
  currentMarca = Object.keys(data)[0]
  selectedId = data[currentMarca]?.[0]?.id || null
  render()
}

function flattenSeller(seller) {
  return {
    Marca: seller.marca,
    Estado: seller.datosSeller.estado,
    Responsable: seller.datosSeller.responsable,
    'Razón social': seller.datosSeller.razonSocial,
    'Alias (Nombre de Fantasía)': seller.datosSeller.alias,
    'CUIT (vinculado en el contrato)': seller.datosSeller.cuit,
    'Mail (usuario) Módulo logístico': seller.datosSeller.mailModuloLogistico,
    'Contraseña Módulo logístico': seller.datosSeller.contrasenaModuloLogistico,
    Southpost: !!seller.operadorLogistico.Southpost,
    Andreani: !!seller.operadorLogistico.Andreani,
    Rapiboy: !!seller.operadorLogistico.Rapiboy,
    HOP: !!seller.operadorLogistico.HOP,
    PICKIT: !!seller.operadorLogistico.PICKIT,
    'Flete Propio': !!seller.operadorLogistico['Flete Propio'],
    URBANO: !!seller.operadorLogistico.URBANO,
    'Envío Gratis': seller.formaEnvio.envioGratis,
    'Same Day / NextDay': !!seller.formaEnvio.sameDayNextDay,
    'Retiro en Sucursal': !!seller.formaEnvio.retiroSucursal,
    'Activo para operar': !!seller.configuracionLogistica.activoParaOperar,
    'Depósito OK': !!seller.configuracionLogistica.depositoOk,
    Provincia: seller.datosDeposito.provincia,
    Localidad: seller.datosDeposito.localidad,
    'Retiro por sucursal - direcciones': seller.retiroPorSucursal.direcciones,
    Observaciones: seller.observaciones || ''
  }
}

async function exportXlsx() {
  const button = document.querySelector('#exportBtn')
  button.disabled = true
  button.textContent = 'Generando...'

  try {
    if (!window.XLSX) {
      await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js')
    }

    const wb = XLSX.utils.book_new()
    Object.keys(data).forEach(marca => {
      const rows = data[marca].map(flattenSeller)
      const ws = XLSX.utils.json_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, marca.slice(0, 31))
    })
    XLSX.writeFile(wb, 'sellers-logistica.xlsx')
  } finally {
    button.disabled = false
    button.textContent = 'Exportar XLSX'
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) return resolve()
    const script = document.createElement('script')
    script.src = src
    script.onload = resolve
    script.onerror = reject
    document.body.appendChild(script)
  })
}

function inputField(label, path, value, type = 'text') {
  return `
    <label class="field">
      <span>${label}</span>
      <input type="${type}" value="${escapeHtml(value)}" data-path="${path}" />
    </label>
  `
}

function selectField(label, path, value, options) {
  return `
    <label class="field">
      <span>${label}</span>
      <select data-path="${path}">
        ${options.map(op => `<option value="${escapeHtml(op)}" ${op === value ? 'selected' : ''}>${escapeHtml(op)}</option>`).join('')}
      </select>
    </label>
  `
}

function checkboxField(label, path, checked) {
  return `
    <label class="check">
      <input type="checkbox" data-path="${path}" ${checked ? 'checked' : ''} />
      <span>${label}</span>
    </label>
  `
}

function render() {
  const seller = selectedSeller()
  const sellers = visibleSellers()
  const marcas = Object.keys(data)

  app.innerHTML = `
    <main class="page">
      <header class="topbar">
        <div>
          <p class="eyebrow">Panel editable</p>
          <h1>Información logística de sellers</h1>
          <p class="subtitle">Datos embebidos desde el Excel. Los cambios se guardan localmente en este navegador.</p>
        </div>
        <div class="actions">
          <button id="exportBtn" class="primary">Exportar XLSX</button>
          <button id="resetBtn" class="secondary">Restaurar Excel</button>
        </div>
      </header>

      <nav class="tabs">
        ${marcas.map(marca => `
          <button class="${marca === currentMarca ? 'active' : ''}" data-marca="${escapeHtml(marca)}">
            ${escapeHtml(marca)}
            <small>${data[marca].length}</small>
          </button>
        `).join('')}
      </nav>

      <section class="filters">
        <input id="search" placeholder="Buscar seller, razón social, CUIT, mail, provincia..." value="${escapeHtml(search)}" />
        <select id="statusFilter">
          <option value="">Todos los estados</option>
          ${ESTADOS.map(op => `<option value="${escapeHtml(op)}" ${op === statusFilter ? 'selected' : ''}>${escapeHtml(op)}</option>`).join('')}
        </select>
        <select id="operatorFilter">
          <option value="">Todos los operadores</option>
          ${OPERADORES.map(op => `<option value="${escapeHtml(op)}" ${op === operatorFilter ? 'selected' : ''}>${escapeHtml(op)}</option>`).join('')}
        </select>
        <select id="envioFilter">
          <option value="">Todos los envíos gratis</option>
          ${ENVIO_GRATIS.map(op => `<option value="${escapeHtml(op)}" ${op === envioFilter ? 'selected' : ''}>${escapeHtml(op)}</option>`).join('')}
        </select>
      </section>

      <section class="workspace">
        <aside class="seller-list">
          <div class="list-head">
            <strong>${escapeHtml(currentMarca)}</strong>
            <span>${sellers.length} visibles</span>
          </div>
          <button id="addSeller" class="add">+ Agregar seller</button>
          <div class="cards">
            ${sellers.map(item => `
              <button class="seller-card ${item.id === selectedId ? 'selected' : ''}" data-seller="${escapeHtml(item.id)}">
                <strong>${escapeHtml(item.datosSeller.alias || 'Sin alias')}</strong>
                <span>${escapeHtml(item.datosSeller.razonSocial || 'Sin razón social')}</span>
                <small>${escapeHtml(item.datosSeller.estado)} · ${escapeHtml(item.datosSeller.cuit || 'Sin CUIT')}</small>
              </button>
            `).join('') || '<p class="empty">No hay sellers para estos filtros.</p>'}
          </div>
        </aside>

        <section class="detail">
          ${seller ? detailTemplate(seller) : '<div class="empty-state">No hay seller seleccionado.</div>'}
        </section>
      </section>
    </main>
  `

  bindEvents()
}

function detailTemplate(seller) {
  return `
    <div class="detail-head">
      <div>
        <p class="eyebrow">Seller seleccionado</p>
        <h2>${escapeHtml(seller.datosSeller.alias || 'Sin alias')}</h2>
        <p>${escapeHtml(seller.datosSeller.razonSocial || '')}</p>
      </div>
      <button id="deleteSeller" class="danger">Eliminar</button>
    </div>

    <div class="section">
      <h3>Datos del seller</h3>
      <div class="grid">
        ${selectField('Estado', 'datosSeller.estado', seller.datosSeller.estado, ESTADOS)}
        ${inputField('Responsable', 'datosSeller.responsable', seller.datosSeller.responsable)}
        ${inputField('Razón social', 'datosSeller.razonSocial', seller.datosSeller.razonSocial)}
        ${inputField('Alias (Nombre de Fantasía)', 'datosSeller.alias', seller.datosSeller.alias)}
        ${inputField('CUIT (vinculado en el contrato)', 'datosSeller.cuit', seller.datosSeller.cuit)}
        ${inputField('Mail (usuario) Módulo logístico', 'datosSeller.mailModuloLogistico', seller.datosSeller.mailModuloLogistico, 'email')}
        ${inputField('Módulo logístico', 'datosSeller.mailModuloLogistico', seller.datosSeller.mailModuloLogistico)}
        ${inputField('Contraseña Módulo logístico', 'datosSeller.contrasenaModuloLogistico', seller.datosSeller.contrasenaModuloLogistico)}
      </div>
    </div>

    <div class="section">
      <h3>Operador logístico</h3>
      <div class="checks">
        ${OPERADORES.map(op => checkboxField(op, `operadorLogistico.${op}`, !!seller.operadorLogistico[op])).join('')}
      </div>
    </div>

    <div class="section">
      <h3>Forma de envío</h3>
      <div class="grid">
        ${selectField('Envío Gratis', 'formaEnvio.envioGratis', seller.formaEnvio.envioGratis, ENVIO_GRATIS)}
        ${checkboxField('Same Day / NextDay', 'formaEnvio.sameDayNextDay', !!seller.formaEnvio.sameDayNextDay)}
        ${checkboxField('Retiro en Sucursal', 'formaEnvio.retiroSucursal', !!seller.formaEnvio.retiroSucursal)}
      </div>
    </div>

    <div class="section">
      <h3>Configuración logística</h3>
      <div class="checks">
        ${checkboxField('Activo para operar', 'configuracionLogistica.activoParaOperar', !!seller.configuracionLogistica.activoParaOperar)}
        ${checkboxField('Depósito OK', 'configuracionLogistica.depositoOk', !!seller.configuracionLogistica.depositoOk)}
      </div>
    </div>

    <div class="section">
      <h3>Datos del depósito</h3>
      <div class="grid">
        ${inputField('Provincia', 'datosDeposito.provincia', seller.datosDeposito.provincia)}
        ${inputField('Localidad', 'datosDeposito.localidad', seller.datosDeposito.localidad)}
      </div>
    </div>

    <div class="section">
      <h3>Retiro por sucursal</h3>
      <label class="field full">
        <span>Direcciones</span>
        <textarea rows="5" data-path="retiroPorSucursal.direcciones">${escapeHtml(seller.retiroPorSucursal.direcciones)}</textarea>
      </label>
    </div>

    <div class="section">
      <h3>Observaciones del archivo</h3>
      <label class="field full">
        <span>Observaciones</span>
        <textarea rows="3" data-path="observaciones">${escapeHtml(seller.observaciones || '')}</textarea>
      </label>
    </div>
  `
}

function bindEvents() {
  document.querySelectorAll('[data-marca]').forEach(button => {
    button.addEventListener('click', () => switchMarca(button.dataset.marca))
  })

  document.querySelectorAll('[data-seller]').forEach(button => {
    button.addEventListener('click', () => selectSeller(button.dataset.seller))
  })

  document.querySelector('#exportBtn')?.addEventListener('click', exportXlsx)
  document.querySelector('#resetBtn')?.addEventListener('click', resetData)
  document.querySelector('#addSeller')?.addEventListener('click', addSeller)
  document.querySelector('#deleteSeller')?.addEventListener('click', deleteSeller)

  document.querySelector('#search')?.addEventListener('input', event => {
    search = event.target.value
    render()
  })

  document.querySelector('#statusFilter')?.addEventListener('change', event => {
    statusFilter = event.target.value
    render()
  })

  document.querySelector('#operatorFilter')?.addEventListener('change', event => {
    operatorFilter = event.target.value
    render()
  })

  document.querySelector('#envioFilter')?.addEventListener('change', event => {
    envioFilter = event.target.value
    render()
  })

  document.querySelectorAll('[data-path]').forEach(input => {
    const handler = event => {
      const value = input.type === 'checkbox' ? event.target.checked : event.target.value
      updateSelected(input.dataset.path, value)
    }
    input.addEventListener(input.tagName === 'TEXTAREA' ? 'input' : 'change', handler)
    if (input.tagName === 'INPUT' && input.type !== 'checkbox') input.addEventListener('input', handler)
  })
}

render()