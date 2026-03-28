import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Clock, BarChart3, Target, FileText,
  AlertTriangle, Bot, Trophy, TrendingUp, LogOut, Menu, X, Zap, Search
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard',   end: true },
  { to: '/sessions',     icon: Clock,           label: 'Sessions'    },
  { to: '/focus',        icon: Zap,             label: 'Focus Flow'  },
  { to: '/analytics',    icon: BarChart3,        label: 'Analytics'   },
  { to: '/goals',        icon: Target,           label: 'Goals'       },
  { to: '/notes',        icon: FileText,         label: 'Notes'       },
  { to: '/weakness',     icon: AlertTriangle,    label: 'Weakness'    },
  { to: '/predictions',  icon: TrendingUp,       label: 'Predictions' },
  { to: '/coach',        icon: Bot,              label: 'AI Coach'    },
  { to: '/gamification', icon: Trophy,           label: 'Achievements'},
]

function SidebarContent({ onClose, onPalette }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-sage-600 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-semibold text-gray-900 tracking-tight text-sm">NeuroTrack</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600 p-1">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Search / command palette trigger */}
      <div className="px-3 mb-3">
        <button onClick={onPalette}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
          <Search size={13} />
          <span className="text-xs">Quick nav…</span>
          <kbd className="ml-auto text-[10px] font-mono bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-400">⌘K</kbd>
        </button>
      </div>

      {/* User pill */}
      <div className="mx-3 mb-3 px-3 py-2.5 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-sage-100 flex items-center justify-center text-sage-700 text-xs font-semibold shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate">{user?.name || 'Student'}</p>
            <p className="text-[10px] text-gray-400">Level {user?.level || 1} · {user?.xp || 0} XP</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onClose}
            className={({ isActive }) => clsx('nav-item', isActive ? 'nav-item-active' : 'nav-item-inactive')}>
            <Icon size={15} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 pt-3 border-t border-gray-100 mt-2">
        <button onClick={handleLogout}
          className="nav-item nav-item-inactive w-full text-red-400 hover:bg-red-50 hover:text-red-500">
          <LogOut size={15} />
          <span>Log out</span>
        </button>
      </div>
    </div>
  )
}

export default function AppLayout({ onPalette }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F7F5]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-52 bg-white border-r border-gray-100 shrink-0">
        <SidebarContent onPalette={onPalette} />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-52 h-full bg-white shadow-xl">
            <SidebarContent onClose={() => setMobileOpen(false)} onPalette={() => { setMobileOpen(false); onPalette?.() }} />
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => setMobileOpen(true)} className="text-gray-500 p-0.5">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-sage-600 rounded-md flex items-center justify-center">
              <Zap size={11} className="text-white" />
            </div>
            <span className="font-semibold text-sm text-gray-900">NeuroTrack</span>
          </div>
          <button onClick={onPalette} className="ml-auto p-1.5 text-gray-400 hover:text-gray-600">
            <Search size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
