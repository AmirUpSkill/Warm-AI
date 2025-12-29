import { PanelLeft, SquarePen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/use-chat-store';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function AppHeader() {
    const { isSidebarOpen, toggleSidebar, createNewSession } = useChatStore();

    // if (isSidebarOpen) return null;

    return (
        <header className="sticky top-0 h-14 flex items-center justify-between px-4 z-30 bg-background/80 backdrop-blur-md border-b border-black/[0.03]">
            <div className={cn("flex items-center gap-2 pointer-events-auto transition-opacity duration-300", isSidebarOpen && "opacity-0 pointer-events-none")}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleSidebar}
                            className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-black/5"
                        >
                            <PanelLeft className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Open sidebar</TooltipContent>
                </Tooltip>

                <div className="flex items-center gap-2 ml-2">
                    <span className="text-sm font-serif italic text-foreground tracking-tight">warm ai</span>
                </div>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => createNewSession()}
                            className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-black/5"
                        >
                            <SquarePen className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">New chat</TooltipContent>
                </Tooltip>
            </div>
        </header>
    );
}
