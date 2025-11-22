import { Link, createFileRoute } from "@tanstack/react-router";
import {
	Calculator,
	Gauge,
	LineChart,
	Shield,
	Zap,
	Wind,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: App });

function App() {
	const features = [
		{
			icon: <Calculator className="w-12 h-12 text-blue-400" />,
			title: "ACCA Manual J Compliant",
			description:
				"Industry-standard calculations following ACCA Manual J 8th Edition procedures for accurate HVAC load assessment.",
		},
		{
			icon: <Zap className="w-12 h-12 text-blue-400" />,
			title: "Fast & Accurate",
			description:
				"Web worker-powered calculations deliver results instantly with precise BTU/h load calculations and equipment sizing.",
		},
		{
			icon: <Wind className="w-12 h-12 text-blue-400" />,
			title: "Comprehensive Analysis",
			description:
				"Complete load breakdown including conduction, solar gain, infiltration, internal gains, and duct losses.",
		},
		{
			icon: <Gauge className="w-12 h-12 text-blue-400" />,
			title: "Equipment Sizing",
			description:
				"Automatic tonnage and CFM calculations rounded to industry standards for proper HVAC equipment selection.",
		},
		{
			icon: <LineChart className="w-12 h-12 text-blue-400" />,
			title: "Detailed Reports",
			description:
				"Professional load breakdowns with percentage contributions and input snapshots for documentation.",
		},
		{
			icon: <Shield className="w-12 h-12 text-blue-400" />,
			title: "Climate Data Integration",
			description:
				"ZIP code-based climate data lookup with ASHRAE design temperatures for your specific location.",
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
			<section className="relative py-20 px-6 text-center overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10"></div>
				<div className="relative max-w-5xl mx-auto">
					<div className="mb-8">
						<div className="inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-6 shadow-lg shadow-blue-500/50">
							<Calculator className="w-12 h-12 md:w-16 md:h-16 text-white" />
						</div>
						<h1 className="text-5xl md:text-7xl font-black text-white mb-4">
							Manual J{" "}
							<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
								Calculator
							</span>
						</h1>
						<p className="text-xl md:text-2xl text-gray-300 mb-2 font-light">
							Professional HVAC Load Calculation Tool
						</p>
						<p className="text-base text-blue-400 font-medium mb-8">
							v8 Edition
						</p>
					</div>
					<p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8 leading-relaxed">
						Calculate heating and cooling loads for residential and commercial buildings 
						with precision. Following ACCA Manual J 8th Edition standards, our calculator 
						provides accurate equipment sizing and detailed load analysis.
					</p>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
						<Link
							to="/calculator"
							className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 hover:scale-105"
						>
							Start Calculation
						</Link>
						<a
							href="https://www.acca.org/standards/technical-manuals/manual-j"
							target="_blank"
							rel="noopener noreferrer"
							className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-gray-300 font-semibold rounded-lg transition-colors border border-slate-700 hover:border-blue-500/50"
						>
							Learn About Manual J
						</a>
					</div>
				</div>
			</section>

			<section className="py-16 px-6 max-w-7xl mx-auto">
				<h2 className="text-3xl font-bold text-white text-center mb-12">
					Features & Capabilities
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{features.map((feature) => (
						<div
							key={feature.title}
							className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
						>
							<div className="mb-4">{feature.icon}</div>
							<h3 className="text-xl font-semibold text-white mb-3">
								{feature.title}
							</h3>
							<p className="text-gray-400 leading-relaxed">
								{feature.description}
							</p>
						</div>
					))}
				</div>
			</section>

			<section    className = "py-16 px-6 max-w-6xl mx-auto">
			<div        className = "bg-gradient-to-br from-blue-900/30 to-cyan-900/30 backdrop-blur-sm border border-blue-500/30 rounded-xl p-8 md:p-12 text-center">
			<div        className = "inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full mb-6">
			<Calculator className = "w-8 h-8 text-white" />
					</div>
					<h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
						Try It Now - Live Demo
					</h2>
					<p className="text-lg text-gray-300 mb-6 max-w-2xl mx-auto">
						Experience the calculator with pre-filled sample data for a typical 
						2,000 sq ft residential building in Atlanta, GA.
					</p>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-3xl mx-auto">
						<div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
							<div className="text-3xl font-bold text-blue-400 mb-1">36,443</div>
							<div className="text-sm text-gray-400">BTU/h Total Load</div>
						</div>
						<div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
							<div className="text-3xl font-bold text-cyan-400 mb-1">3.5</div>
							<div className="text-sm text-gray-400">Tons Required</div>
						</div>
						<div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
							<div className="text-3xl font-bold text-blue-400 mb-1">1,400</div>
							<div className="text-sm text-gray-400">CFM Airflow</div>
						</div>
					</div>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
						<Link
							to="/calculator"
							className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 hover:scale-105"
						>
							Launch Calculator
						</Link>
						<Link
							to="/calculator"
							search={{ demo: true }}
							className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-gray-300 font-semibold rounded-lg transition-colors border border-slate-700 hover:border-blue-500/50"
						>
							View Example
						</Link>
					</div>
					<p className="text-xs text-gray-500 mt-6">
						* Sample calculation based on ZIP code 30301 (Atlanta, GA) with typical building parameters
					</p>
				</div>
			</section>

			<section className="py-16 px-6 max-w-4xl mx-auto">
				<div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
					<h2 className="text-2xl font-bold text-white mb-4">
						How It Works
					</h2>
					<ol className="space-y-4 text-gray-400">
						<li className="flex gap-4">
							<span className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
								1
							</span>
							<div>
								<strong className="text-white">Enter Location</strong>
								<p>Provide the project ZIP code to load climate design conditions</p>
							</div>
						</li>
						<li className="flex gap-4">
							<span className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
								2
							</span>
							<div>
								<strong className="text-white">Input Building Data</strong>
								<p>Enter envelope characteristics, occupancy, and system details</p>
							</div>
						</li>
						<li className="flex gap-4">
							<span className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
								3
							</span>
							<div>
								<strong className="text-white">Get Results</strong>
								<p>Review detailed load breakdown and equipment sizing recommendations</p>
							</div>
						</li>
					</ol>
					<div className="mt-8 pt-8 border-t border-slate-700">
						<Link
							to="/calculator"
							className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium transition-colors"
						>
							Start your first calculation
							<span aria-hidden="true">→</span>
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}
