import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function AppLayout() {
    return (
        <div className="min-h-screen bg-dark-950">
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 py-8">
                <Outlet />
            </main>
        </div>
    )
}
