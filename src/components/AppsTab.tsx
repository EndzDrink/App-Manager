import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink, Trash2 } from "lucide-react";

const apps = [
  {
    id: 1,
    name: "Netflix",
    category: "Entertainment",
    icon: "🎬",
    dailyUsage: "2h 0m",
    size: "250.5 MB",
    lastUsed: "Aug 7, 2025",
    color: "bg-red-500"
  },
  {
    id: 2,
    name: "Adobe Photoshop",
    category: "Productivity",
    icon: "🎨",
    dailyUsage: "45m",
    size: "1200 MB",
    lastUsed: "Aug 6, 2025",
    color: "bg-blue-500"
  },
  {
    id: 3,
    name: "Candy Crush",
    category: "Games",
    icon: "🍭",
    dailyUsage: "5m",
    size: "89.2 MB",
    lastUsed: "Jul 23, 2025",
    color: "bg-pink-500"
  },
  {
    id: 4,
    name: "Slack",
    category: "Communication",
    icon: "💬",
    dailyUsage: "3h 0m",
    size: "156.8 MB",
    lastUsed: "Aug 7, 2025",
    color: "bg-purple-500"
  },
  {
    id: 5,
    name: "Unused Calculator Pro",
    category: "Utilities",
    icon: "🧮",
    dailyUsage: "0m",
    size: "12.3 MB",
    lastUsed: "Jun 23, 2025",
    color: "bg-gray-400"
  }
];

export const AppsTab = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-metric-value">Your Apps</h2>
          <p className="text-sm text-metric-label">Manage and track your installed applications</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Add App
        </Button>
      </div>
      
      <div className="space-y-4">
        {apps.map((app) => (
          <Card key={app.id} className="p-4 bg-metric-card border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 ${app.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                  {app.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-metric-value">{app.name}</h3>
                  <p className="text-sm text-metric-label">{app.category}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-8">
                <div className="text-right">
                  <div className="font-medium text-metric-value">{app.dailyUsage}</div>
                  <div className="text-sm text-metric-label">daily</div>
                </div>
                
                <div className="text-right">
                  <div className="font-medium text-metric-value">{app.size}</div>
                  <div className="text-sm text-metric-label">size</div>
                </div>
                
                <div className="text-right">
                  <div className="font-medium text-metric-value">{app.lastUsed}</div>
                  <div className="text-sm text-metric-label">last used</div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="border-border text-metric-label hover:bg-secondary">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  {app.name.includes("Unused") && (
                    <Button variant="outline" size="sm" className="border-red-300 text-red-500 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};