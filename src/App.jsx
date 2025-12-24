import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ConfigPage from './pages/ConfigPage'
import BrowsePage from './pages/BrowsePage'
import PlayerPage from './pages/PlayerPage'

function App() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/series/new" element={<ConfigPage />} />
            <Route path="/series/:seriesId/edit" element={<ConfigPage />} />
            <Route path="/series/:seriesId" element={<BrowsePage />} />
            <Route path="/series/:seriesId/player/:episodeIndex" element={<PlayerPage />} />
        </Routes>
    )
}

export default App
