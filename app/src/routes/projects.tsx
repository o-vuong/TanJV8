import { createFileRoute, Link } from "@tanstack/react-router";
import { useSession } from "../lib/auth/client";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { FolderOpen, Plus, Calculator, Calendar } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  useGroups,
  useCreateGroup,
  useCreateProject,
  type Group,
  type Project,
} from "../lib/queries/groups";
import { useState } from "react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export const Route = createFileRoute("/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const { data: session } = useSession();
  const { data: groups, isLoading } = useGroups();
  const createGroup = useCreateGroup();
  const createProject = useCreateProject();
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    try {
      await createGroup.mutateAsync({ name: groupName });
      setGroupName("");
      setShowCreateGroup(false);
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  };

  const handleCreateProject = async () => {
    if (!projectName.trim() || !selectedGroupId) return;
    try {
      await createProject.mutateAsync({
        name: projectName,
        description: projectDescription || undefined,
        groupId: selectedGroupId,
      });
      setProjectName("");
      setProjectDescription("");
      setShowCreateProject(false);
      setSelectedGroupId(null);
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

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
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        setSelectedGroupId(group.id);
                        setShowCreateProject(true);
                      }}
                    >
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
                                  {project.calculationCount ??
                                    project.calculations?.length ??
                                    0}{" "}
                                  calculation
                                  {(project.calculationCount ??
                                    project.calculations?.length ??
                                    0) !== 1
                                    ? "s"
                                    : ""}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {new Date(
                                    project.createdAt
                                  ).toLocaleDateString()}
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
                      <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          setSelectedGroupId(group.id);
                          setShowCreateProject(true);
                        }}
                      >
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
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowCreateGroup(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Group
              </Button>
            </div>
          )}

          {/* Create Group Modal */}
          {showCreateGroup && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Create New Group
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="group-name" className="text-gray-300">
                      Group Name
                    </Label>
                    <Input
                      id="group-name"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="mt-1 bg-slate-900 border-slate-600 text-white"
                      placeholder="e.g., Residential Projects"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateGroup(false);
                        setGroupName("");
                      }}
                      className="border-slate-600 text-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateGroup}
                      disabled={!groupName.trim() || createGroup.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {createGroup.isPending ? "Creating..." : "Create Group"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create Project Modal */}
          {showCreateProject && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Create New Project
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="project-name" className="text-gray-300">
                      Project Name
                    </Label>
                    <Input
                      id="project-name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="mt-1 bg-slate-900 border-slate-600 text-white"
                      placeholder="e.g., 123 Main St"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="project-description"
                      className="text-gray-300"
                    >
                      Description (optional)
                    </Label>
                    <Input
                      id="project-description"
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      className="mt-1 bg-slate-900 border-slate-600 text-white"
                      placeholder="Additional details..."
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateProject(false);
                        setProjectName("");
                        setProjectDescription("");
                        setSelectedGroupId(null);
                      }}
                      className="border-slate-600 text-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateProject}
                      disabled={!projectName.trim() || createProject.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {createProject.isPending
                        ? "Creating..."
                        : "Create Project"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
