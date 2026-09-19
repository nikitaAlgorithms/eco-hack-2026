import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, ZoomControl, useMapEvents } from 'react-leaflet'
import { Bell, ChevronRight, CircleHelp, LocateFixed, Map as MapIcon, Menu, Search, Settings, Trash2, X } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import './App.css'

const bins = [
  { id: 'MNS-024', address: 'ул. Золотая Горка, 11', type: 'Смешанные отходы', fill: 92, updated: '2 мин назад', position: [53.9164, 27.5872] },
  { id: 'MNS-118', address: 'пр-т Независимости, 47', type: 'Пластик', fill: 68, updated: '5 мин назад', position: [53.9064, 27.5754] },
  { id: 'MNS-082', address: 'ул. Киселёва, 17', type: 'Стекло', fill: 34, updated: '8 мин назад', position: [53.9088, 27.5615] },
  { id: 'MNS-201', address: 'ул. Богдановича, 23', type: 'Смешанные отходы', fill: 17, updated: '11 мин назад', position: [53.9232, 27.5777] },
  { id: 'MNS-156', address: 'ул. Сурганова, 2', type: 'Бумага', fill: 54, updated: '14 мин назад', position: [53.9281, 27.5988] },
  { id: 'MNS-044', address: 'ул. Карла Маркса, 35', type: 'Пластик', fill: 81, updated: '18 мин назад', position: [53.8979, 27.5572] },
]

const getStatus = (fill) => fill >= 80 ? 'critical' : fill >= 55 ? 'attention' : fill >= 25 ? 'normal' : 'empty'
const typeTranslations = {
  en: { 'Смешанные отходы': 'Mixed waste', 'Пластик': 'Plastic', 'Стекло': 'Glass', 'Бумага': 'Paper' },
  de: { 'Смешанные отходы': 'Gemischte Abfälle', 'Пластик': 'Kunststoff', 'Стекло': 'Glas', 'Бумага': 'Papier' },
  fr: { 'Смешанные отходы': 'Déchets mixtes', 'Пластик': 'Plastique', 'Стекло': 'Verre', 'Бумага': 'Papier' },
}

const translations = {
  ru: {
    brand: 'Чистый город', monitoring: 'Мониторинг города', mapTitle: 'Карта контейнеров', map: 'Карта', notifications: 'Уведомления', settings: 'Настройки', help: 'Помощь', dispatcher: 'Диспетчер', search: 'Поиск по адресу...', synced: 'Синхронизировано 2 мин назад',
    settingsApp: 'Настройки приложения', appearance: 'Внешний вид', darkTheme: 'Тёмная тема', darkThemeHint: 'Сделать интерфейс темнее', language: 'Язык интерфейса', languageHint: 'Выберите язык приложения', russian: 'Русский', english: 'English', german: 'Deutsch', french: 'Français',
    overview: 'Обзор системы', now: 'Состояние сейчас', total: 'Всего контейнеров', attention: 'Требуют внимания', nearest: 'Ближайшие контейнеры', points: 'точек', selected: 'Выбранный контейнер', working: 'В работе', pickup: 'Нужно забрать', filled: 'Заполненность', updated: 'Обновлено', empty: 'Ничего не найдено', free: 'Свободно', normal: 'В норме', critical: 'Критично', warning: 'Внимание', filledAt: 'Заполнено на', noNotifications: 'Новых уведомлений нет', centered: 'Карта центрирована на Минске', helpSoon: 'Раздел помощи пока готовится', actionsSoon: 'Действия для контейнера появятся после подключения API', selectedLanguage: 'Выбран русский язык',
  },
  en: {
    brand: 'Clean City', monitoring: 'City monitoring', mapTitle: 'Container map', map: 'Map', notifications: 'Notifications', settings: 'Settings', help: 'Help', dispatcher: 'Dispatcher', search: 'Search by address...', synced: 'Synced 2 min ago',
    settingsApp: 'Application settings', appearance: 'Appearance', darkTheme: 'Dark theme', darkThemeHint: 'Make the interface darker', language: 'Interface language', languageHint: 'Choose the application language', russian: 'Русский', english: 'English', german: 'Deutsch', french: 'Français',
    overview: 'System overview', now: 'Current status', total: 'Total containers', attention: 'Need attention', nearest: 'Nearby containers', points: 'points', selected: 'Selected container', working: 'In progress', pickup: 'Needs pickup', filled: 'Fill level', updated: 'Updated', empty: 'Nothing found', free: 'Available', normal: 'Normal', critical: 'Critical', warning: 'Attention', filledAt: 'Filled to', noNotifications: 'No new notifications', centered: 'Map centered on Minsk', helpSoon: 'Help section is coming soon', actionsSoon: 'Container actions will be available after API connection', selectedLanguage: 'English selected',
  },
  de: {
    brand: 'Saubere Stadt', monitoring: 'Stadtüberwachung', mapTitle: 'Containerkarte', map: 'Karte', notifications: 'Benachrichtigungen', settings: 'Einstellungen', help: 'Hilfe', dispatcher: 'Disponent', search: 'Nach Adresse suchen...', synced: 'Vor 2 Min. synchronisiert',
    settingsApp: 'App-Einstellungen', appearance: 'Erscheinungsbild', darkTheme: 'Dunkles Design', darkThemeHint: 'Oberfläche dunkler machen', language: 'Oberflächensprache', languageHint: 'Sprache der Anwendung auswählen', russian: 'Русский', english: 'English', german: 'Deutsch', french: 'Français',
    overview: 'Systemübersicht', now: 'Aktueller Status', total: 'Container insgesamt', attention: 'Benötigen Aufmerksamkeit', nearest: 'Nächste Container', points: 'Punkte', selected: 'Ausgewählter Container', working: 'In Bearbeitung', pickup: 'Abholung erforderlich', filled: 'Füllstand', updated: 'Aktualisiert', empty: 'Nichts gefunden', free: 'Frei', normal: 'Normal', critical: 'Kritisch', warning: 'Achtung', filledAt: 'Gefüllt zu', noNotifications: 'Keine neuen Benachrichtigungen', centered: 'Karte auf Minsk zentriert', helpSoon: 'Der Hilfebereich ist in Vorbereitung', actionsSoon: 'Containeraktionen werden nach der API-Anbindung verfügbar', selectedLanguage: 'Deutsch ausgewählt',
  },
  fr: {
    brand: 'Ville propre', monitoring: 'Surveillance de la ville', mapTitle: 'Carte des conteneurs', map: 'Carte', notifications: 'Notifications', settings: 'Paramètres', help: 'Aide', dispatcher: 'Dispatcheur', search: 'Rechercher par adresse...', synced: 'Synchronisé il y a 2 min',
    settingsApp: 'Paramètres de l’application', appearance: 'Apparence', darkTheme: 'Mode sombre', darkThemeHint: 'Assombrir l’interface', language: 'Langue de l’interface', languageHint: 'Choisissez la langue de l’application', russian: 'Русский', english: 'English', german: 'Deutsch', french: 'Français',
    overview: 'Vue d’ensemble', now: 'État actuel', total: 'Conteneurs au total', attention: 'Nécessitent une attention', nearest: 'Conteneurs à proximité', points: 'points', selected: 'Conteneur sélectionné', working: 'En cours', pickup: 'À collecter', filled: 'Niveau de remplissage', updated: 'Mis à jour', empty: 'Aucun résultat', free: 'Libre', normal: 'Normal', critical: 'Critique', warning: 'Attention', filledAt: 'Rempli à', noNotifications: 'Aucune nouvelle notification', centered: 'Carte centrée sur Minsk', helpSoon: 'La section d’aide est en préparation', actionsSoon: 'Les actions seront disponibles après la connexion à l’API', selectedLanguage: 'Français sélectionné',
  },
}

function MapBoundsListener({ onBoundsChange }) {
  useMapEvents({
    moveend: (event) => onBoundsChange(event.target.getBounds()),
  })
  return null
}

function App() {
  const [mapBins, setMapBins] = useState(bins.slice(0, 100))
  const [selectedId, setSelectedId] = useState('MNS-024')
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState('ru')
  const themeSwitchRef = useRef(null)
  const [activeSection, setActiveSection] = useState('map')
  const [toast, setToast] = useState('')
  const mapRef = useRef(null)
  const requestIdRef = useRef(0)
  const t = translations[language]
  const getBinType = (type) => language === 'ru' ? type : typeTranslations[language][type]
  const getUpdated = (updated) => language === 'ru' ? updated : language === 'en' ? updated.replace('мин назад', 'min ago') : language === 'de' ? updated.replace('мин назад', 'Min.').replace('2 Min.', 'vor 2 Min.') : updated.replace('мин назад', 'min')
  const selectedBin = mapBins.find((bin) => bin.id === selectedId) ?? mapBins[0] ?? bins[0]
  const filteredBins = useMemo(() => mapBins.filter((bin) => `${bin.address} ${bin.type}`.toLowerCase().includes(search.toLowerCase())), [mapBins, search])
  const loadBins = async (bounds) => {
    const requestId = ++requestIdRef.current
    const params = new URLSearchParams({ limit: '100' })
    if (bounds) {
      params.set('minLat', bounds.getSouth().toFixed(6))
      params.set('minLng', bounds.getWest().toFixed(6))
      params.set('maxLat', bounds.getNorth().toFixed(6))
      params.set('maxLng', bounds.getEast().toFixed(6))
    }

    try {
      const response = await fetch(`/api/bins?${params}`)
      if (!response.ok) throw new Error(`Bins request failed: ${response.status}`)
      const data = await response.json()
      const nextBins = Array.isArray(data) ? data : data.items
      if (requestId === requestIdRef.current && Array.isArray(nextBins)) setMapBins(nextBins.slice(0, 100))
    } catch {
      if (requestId === requestIdRef.current && !bounds) setMapBins(bins.slice(0, 100))
    }
  }
  useEffect(() => { loadBins() }, [])
  const showToast = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }
  const selectSection = (section) => {
    setActiveSection(section)
    setMenuOpen(false)
    if (section === 'notifications') showToast(t.noNotifications)
  }
  const toggleTheme = (nextTheme) => {
    const switchBounds = themeSwitchRef.current?.getBoundingClientRect()
    const originX = switchBounds ? switchBounds.left + (nextTheme ? switchBounds.width - 12 : 12) : window.innerWidth / 2
    const originY = switchBounds ? switchBounds.top + switchBounds.height / 2 : window.innerHeight / 2
    document.documentElement.style.setProperty('--theme-origin-x', `${originX}px`)
    document.documentElement.style.setProperty('--theme-origin-y', `${originY}px`)

    if (!document.startViewTransition) {
      setDarkMode(nextTheme)
      return
    }

    const transition = document.startViewTransition(() => flushSync(() => setDarkMode(nextTheme)))
    transition.finished.finally(() => document.documentElement.classList.remove('theme-transitioning'))
    document.documentElement.classList.add('theme-transitioning')
  }

  return (
    <main className={`app-shell ${darkMode ? 'dark-theme' : ''}`}>
      <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><Trash2 size={19} /></div><span>{t.brand}</span></div>
        <nav className="side-nav" aria-label="Основная навигация">
          <button className={`nav-item ${activeSection === 'map' ? 'active' : ''}`} onClick={() => selectSection('map')}><MapIcon size={18} /> {t.map} <span className="nav-badge">24</span></button>
          <button className={`nav-item ${activeSection === 'notifications' ? 'active' : ''}`} onClick={() => selectSection('notifications')}><Bell size={18} /> {t.notifications} <span className="notification-dot" /></button>
          <button className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`} onClick={() => selectSection('settings')}><Settings size={18} /> {t.settings}</button>
        </nav>
        <div className="sidebar-bottom"><button className="help-link" onClick={() => showToast(t.helpSoon)}><CircleHelp size={17} /> {t.help}</button><div className="user"><div className="avatar">АК</div><div><strong>Алексей К.</strong><small>{t.dispatcher}</small></div><ChevronRight size={15} /></div></div>
      </aside>
      <section className="workspace">
        <header className="topbar"><button className="icon-button menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={t.settings}><Menu size={20} /></button><div><p className="eyebrow">{t.monitoring}</p><h1>{t.mapTitle}</h1></div><div className="topbar-actions"><span className="sync-status"><i /> {t.synced}</span><button className="icon-button" onClick={() => showToast(t.noNotifications)} aria-label={t.notifications}><Bell size={19} /><span className="live-dot" /></button></div></header>
        <section className={`settings-screen ${activeSection === 'settings' ? 'is-open' : ''}`} aria-hidden={activeSection !== 'settings'}><header><div><p className="eyebrow">{t.settingsApp}</p><h2>{t.settings}</h2></div></header><div className="settings-list"><p className="eyebrow">{t.appearance}</p><label className="theme-toggle"><span><strong>{t.darkTheme}</strong><small>{t.darkThemeHint}</small></span><input type="checkbox" checked={darkMode} onChange={(event) => toggleTheme(event.target.checked)} /><i ref={themeSwitchRef} /></label><label className="language-setting"><span><strong>{t.language}</strong><small>{t.languageHint}</small></span><select value={language} onChange={(event) => { setLanguage(event.target.value); showToast(translations[event.target.value].selectedLanguage) }} aria-label={t.language}><option value="ru">{t.russian}</option><option value="en">{t.english}</option><option value="de">{t.german}</option><option value="fr">{t.french}</option></select></label></div></section>
        <div className="content-grid">
          <section className="map-card"><div className="map-toolbar"><div className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.search} aria-label={t.search} />{search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={15} /></button>}</div><button className="locate-button" onClick={() => { mapRef.current?.setView([53.91, 27.575], 14); showToast(t.centered) }} aria-label={t.centered}><LocateFixed size={18} /></button></div><MapContainer ref={mapRef} center={[53.91, 27.575]} zoom={13} zoomControl={false} className="map"><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><ZoomControl position="bottomright" /><MapBoundsListener onBoundsChange={loadBins} />{filteredBins.map((bin) => <CircleMarker key={bin.id} center={bin.position} radius={selectedId === bin.id ? 14 : 10} pathOptions={{ color: '#fff', weight: 3, fillColor: getStatus(bin.fill) === 'critical' ? '#ff5c5c' : getStatus(bin.fill) === 'attention' ? '#f5a623' : getStatus(bin.fill) === 'normal' ? '#2f9e70' : '#2f9e70', fillOpacity: 1 }} eventHandlers={{ click: () => setSelectedId(bin.id) }}><Tooltip permanent direction="center" className="bin-map-label">{bin.fill}%</Tooltip><Popup><strong>{bin.address}</strong><br />{t.filledAt} {bin.fill}%</Popup></CircleMarker>)}</MapContainer><div className="map-legend"><span><i className="legend-dot critical" /> {t.critical}</span><span><i className="legend-dot attention" /> {t.warning}</span><span><i className="legend-dot normal" /> {t.normal}</span><span><i className="legend-dot empty" /> {t.free}</span></div></section>
            <aside className="details-panel"><div className="panel-heading"><div><p className="eyebrow">{t.overview}</p><h2>{t.now}</h2></div><button className="more-button" onClick={() => showToast(t.actionsSoon)} aria-label="More actions">•••</button></div><div className="metrics"><div className="metric"><span className="metric-icon green"><Trash2 size={16} /></span><strong>128</strong><small>{t.total}</small></div><div className="metric"><span className="metric-icon red"><Bell size={16} /></span><strong>7</strong><small>{t.attention}</small></div></div><div className="panel-section"><div className="section-title"><h3>{t.nearest}</h3><span>{filteredBins.length} {t.points}</span></div><div className="bin-list">{filteredBins.map((bin) => <button key={bin.id} className={`bin-row ${selectedId === bin.id ? 'selected' : ''}`} onClick={() => setSelectedId(bin.id)}><span className={`status-indicator ${getStatus(bin.fill)}`} /><span className="bin-copy"><strong>{bin.address}</strong><small>{getBinType(bin.type)} · {getUpdated(bin.updated)}</small></span><span className={`fill-value ${getStatus(bin.fill)}`} style={{ '--fill': `${bin.fill}%` }}>{bin.fill}%</span></button>)}{filteredBins.length === 0 && <p className="empty-state">{t.empty}</p>}</div></div><div className="selected-card"><div className="selected-card-head"><div><p className="eyebrow">{t.selected}</p><h3>{selectedBin.address}</h3></div><span className={`status-pill ${getStatus(selectedBin.fill)}`}>{selectedBin.fill >= 80 ? t.pickup : t.working}</span></div><div className={`selected-ring ${getStatus(selectedBin.fill)}`} style={{ '--progress': `${selectedBin.fill}%` }}><div><strong>{selectedBin.fill}%</strong><span>{t.filled}</span></div></div><div className="selected-meta"><span>{selectedBin.id}</span><span>{t.updated} {getUpdated(selectedBin.updated)}</span></div></div></aside>
        </div>
        <nav className="mobile-nav"><button className={activeSection === 'map' ? 'active' : ''} onClick={() => selectSection('map')}><MapIcon size={19} />{t.map}</button><button className={activeSection === 'settings' ? 'active' : ''} onClick={() => selectSection('settings')}><Settings size={19} />{t.settings}</button></nav>
        {toast && <div className="toast" role="status">{toast}</div>}
      </section>
    </main>
  )
}

export default App