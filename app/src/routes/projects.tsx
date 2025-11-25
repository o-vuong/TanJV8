import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { createApiClient } from "../lib/api/client";
import { useSession } from "../lib/auth/client";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { FolderOpen, Plus, Calculator, Calendar } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export const Route = createFileRoute("/projects")({
	component: ProjectsPage,
});

const apiClient = createApiClient({ baseUrl: "/api" });

interface Group {
	id: string;
	name: string;
	createdAt: string;
	projects: Project[];
}

interface Project {
	id: string;
	name: string;
	description: string | null;
	createdAt: string;
	calculations: Calculation[];
}

interface Calculation {
	id: string;
	version: number;
	createdAt: string;
	inputs: unknown;
	results: unknown;
}

function ProjectsPage() {
	const { data: session } = useSession();

	// Note: You'll need to create API endpoints for groups and projects
	// For now, this is a placeholder structure
	const { data: groups, isLoading } = useQuery({
		queryKey: ["groups"],
		queryFn: async () => {
			// TODO: Implement groups API endpoint
			// const response = await apiClient.get<Group[]>("/groups");
			// return response;
			return [] as Group[];
		},
		enabled: !!session?.user,
	});

	return (
		<ProtectedRoute>
			<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6">
				<div className="max-w-7xl mx-auto">
					<div className="mb-8">
						<h1 className="text-4xl font-bold text-white mb-2">My Projects</h1>
						<p className="text-gray-400">
							Organize your calculations into groups and projects
						</p>
					</div>

					{isLoading ? (
						<div className="text-center py-12">
							<p className="text-gray-400">Loading projects...</p>
						</div>
					) : groups && groups.length > 0 ? (
						<div className="space-y-8">
							{groups.map((group) => (
								<div key={group.id} className="space-y-4">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<FolderOpen className="w-6 h-6 text-blue-400" />
											<h2 className="text-2xl font-semibold text-white">
												{group.name}
											</h2>
										</div>
										<Button className="bg-blue-600 hover:bg-blue-700">
											<Plus className="w-4 h-4 mr-2" />
											New Project
										</Button>
									</div>

									{group.projects.length > 0 ? (
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
											{group.projects.map((project) => (
												<Card
													key={project.id}
													className="border-slate-700 bg-slate-800/50 hover:border-blue-500/50 transition-colors"
												>
													<CardHeader>
														<CardTitle className="text-white">
															{project.name}
														</CardTitle>
														{project.description && (
															<p className="text-sm text-gray-400 mt-1">
																{project.description}
															</p>
														)}
													</CardHeader>
													<CardContent>
														<div className="space-y-3">
															<div className="flex items-center gap-2 text-sm text-gray-400">
																<Calculator className="w-4 h-4" />
																<span>
																	{project.calculations.length} calculation
																	{project.calculations.length !== 1 ? "s" : ""}
																</span>
															</div>
															<div className="flex items-center gap-2 text-sm text-gray-400">
																<Calendar className="w-4 h-4" />
																<span>
																	{new Date(project.createdAt).toLocaleDateString()}
																</span>
															</div>
															<div className="pt-2">
																<Link
																	to="/calculator"
																	search={{ projectId: project.id }}
																>
																	<Button
																		variant="outline"
																		className="w-full border-slate-600 text-gray-300 hover:bg-slate-700"
																	>
																		View Calculations
																	</Button>
																</Link>
															</div>
														</div>
													</CardContent>
												</Card>
											))}
										</div>
									) : (
										<div className="text-center py-8 bg-slate-800/30 rounded-lg border border-slate-700">
											<p className="text-gray-400 mb-4">No projects yet</p>
											<Button className="bg-blue-600 hover:bg-blue-700">
												<Plus className="w-4 h-4 mr-2" />
												Create First Project
											</Button>
										</div>
									)}
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-12 bg-slate-800/30 rounded-lg border border-slate-700">
							<FolderOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
							<h3 className="text-xl font-semibold text-white mb-2">
								No groups yet
							</h3>
							<p className="text-gray-400 mb-6">
								Create your first group to start organizing calculations
							</p>
							<Button className="bg-blue-600 hover:bg-blue-700">
								<Plus className="w-4 h-4 mr-2" />
								Create First Group
							</Button>
						</div>
					)}
				</div>
			</div>
		</ProtectedRoute>
	);
}

