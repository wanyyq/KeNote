import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import BillsProvider from '@/components/BillsProvider'
import Home from '@/pages/Home'
import Bills from '@/pages/Bills'
import Tools from '@/pages/Tools'
import Console from '@/pages/Console'

export default function App() {
  return (
    <BillsProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="bills" element={<Bills />} />
          <Route path="tools" element={<Tools />} />
          <Route path="console" element={<Console />} />
        </Route>
      </Routes>
    </HashRouter>
    </BillsProvider>
  )
}
