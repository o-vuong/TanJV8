import { Link } from "@tanstack/react-router";
import {
	Calculator,
	FileText,
	Home,
	Menu,
	X,
} from "lucide-react";
import { useState } from "react";

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<header className="p-4 flex items-center justify-between bg-slate-900 text-white shadow-lg border-b border-slate-800">
				<div className="flex items-center gap-4">
					<button
						type="button"
						onClick={() => setIsOpen(true)}
						className="p-2 hover:bg-slate-800 rounded-lg transition-colors md:hidden"
						aria-label="Open menu"
					>
						<Menu size={24} />
					</button>
					<Link to="/" className="flex items-center gap-3">
						<div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
							<Calculator className="w-6 h-6 text-white" />
						</div>
						<div className="flex flex-col">
							<span className="text-lg font-bold leading-tight">Manual J Calculator</span>
							<span className="text-xs text-gray-400">v8 Edition</span>
						</div>
					</Link>
				</div>

				<nav className="hidden md:flex items-center gap-2">
					<Link
						to="/"
						className="px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
						activeProps={{
							className: "px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors",
						}}
					>
						<span className="font-medium">Home</span>
					</Link>
					<Link
						to="/calculator"
						className="px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
						activeProps={{
							className: "px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors",
						}}
					>
						<span className="font-medium">Calculator</span>
					</Link>
				</nav>
			</header>

			<aside
				className={`fixed top-0 left-0 h-full w-80 bg-slate-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between p-4 border-b border-slate-800">
					<div className="flex items-center gap-3">
						<div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
							<Calculator className="w-6 h-6 text-white" />
						</div>
						<div>
							<h2 className="text-lg font-bold leading-tight">Manual J</h2>
							<p className="text-xs text-gray-400">Navigation</p>
						</div>
					</div>
					<button
						type="button"
						onClick={() => setIsOpen(false)}
						className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
						aria-label="Close menu"
					>
						<X size={24} />
					</button>
				</div>

				<nav className="flex-1 p-4 overflow-y-auto">
					<Link
						to="/"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors mb-2",
						}}
					>
						<Home size={20} />
						<span className="font-medium">Home</span>
					</Link>

					<Link
						to="/calculator"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors mb-2",
						}}
					>
						<Calculator size={20} />
						<span className="font-medium">Calculator</span>
					</Link>

					<div className="mt-8 pt-4 border-t border-slate-800">
						<p className="text-xs text-gray-500 uppercase tracking-wider mb-3 px-3">
							Resources
						</p>
						<a
							href="https://www.acca.org/standards/technical-manuals/manual-j"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors mb-2"
						>
							<FileText size={20} />
							<span className="font-medium">ACCA Manual J</span>
						</a>
					</div>
				</nav>

				<div className="p-4 border-t border-slate-800">
					<p className="text-xs text-gray-500">
						Manual J HVAC Load Calculator
						<br />
						v8 Edition
					</p>
				</div>
			</aside>
		</>
	);
}
