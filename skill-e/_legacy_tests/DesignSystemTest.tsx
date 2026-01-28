import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Play, Settings, Info } from "lucide-react";

/**
 * Design System Test Component
 * Verifies shadcn/ui "Mira" configuration is working correctly
 * - Style: new-york
 * - Base Color: neutral
 * - Radius: 0.5rem
 * - Font: Nunito Sans
 */
export function DesignSystemTest() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-6 shadow-lg">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Design System Test
          </h1>
          <p className="text-sm text-muted-foreground">
            Verifying shadcn/ui Mira configuration with Nunito Sans font
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Buttons</h2>
            <div className="flex flex-wrap gap-2">
              <Button variant="default">
                <Play className="mr-2 h-4 w-4" />
                Default
              </Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              Dropdown Menu
            </h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Open Menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Separator />

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Tooltip</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This is a tooltip with Nunito Sans font</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">
            Configuration
          </h2>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>✓ Style: new-york</p>
            <p>✓ Base Color: neutral</p>
            <p>✓ Radius: 0.5rem</p>
            <p>✓ Font: Nunito Sans</p>
            <p>✓ Icons: Lucide React</p>
            <p>✓ CSS Variables: enabled</p>
          </div>
        </div>
      </div>
    </div>
  );
}
