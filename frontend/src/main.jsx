import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import { LanguageProvider } from './contexts/LanguageContext'
import { SidebarProvider } from './contexts/SidebarContext'
import { UserMemoryProvider } from './contexts/UserMemoryContext'
import './index.css'

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<LanguageProvider>
			<SidebarProvider>
				<UserMemoryProvider>
					<App />
				</UserMemoryProvider>
			</SidebarProvider>
		</LanguageProvider>
	</StrictMode>,
)
