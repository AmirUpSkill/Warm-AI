import { useEffect } from 'react';
import { format } from 'date-fns';
import { MessageSquare, Trash2, PanelLeft, LogOut, SquarePen } from 'lucide-react';
import { useChatStore } from '@/store/use-chat-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function Sidebar() {
    const {
        sessions,
        fetchSessions,
        currentSessionId,
        selectSession,
        createNewSession,
        deleteSession,
        isSidebarOpen,
        toggleSidebar
    } = useChatStore();

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const handleSelect = async (id: number) => {
        await selectSession(id);
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        await deleteSession(id);
    };

    if (!isSidebarOpen) return null;

    return (
        <aside className="w-[280px] h-screen bg-background border-r border-black/[0.05] flex flex-col z-40 transition-all duration-300">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 h-14 border-b border-black/[0.03]">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-black/5"
                >
                    <PanelLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2 ml-1">
                    <span className="text-sm font-serif italic text-foreground tracking-tight">warm ai</span>
                </div>
            </div>

            {/* New Chat Button */}
            <div className="px-3 py-2">
                <Button
                    variant="ghost"
                    onClick={() => createNewSession()}
                    className="w-full justify-between items-center gap-2 h-11 px-3 font-medium hover:bg-black/5 rounded-xl border border-transparent hover:border-black/5 transition-all text-sm group"
                >
                    <div className="flex items-center gap-2">
                        <span>New chat</span>
                    </div>
                    <SquarePen className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                </Button>
            </div>

            {/* History Section */}
            <div className="flex-1 flex flex-col min-h-0 pt-4">
                <div className="px-5 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60">History</span>
                </div>

                <ScrollArea className="flex-1 px-3">
                    <div className="space-y-1 pb-4">
                        {sessions.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <p className="text-xs text-muted-foreground/60 italic">No recent chats</p>
                            </div>
                        ) : (
                            sessions.map((session) => (
                                <div
                                    key={session.id}
                                    onClick={() => handleSelect(session.id)}
                                    className={cn(
                                        "group flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all relative text-sm",
                                        currentSessionId === session.id
                                            ? "bg-black/[0.04] text-foreground font-medium"
                                            : "text-muted-foreground hover:bg-black/[0.02] hover:text-foreground"
                                    )}
                                >
                                    <div className="flex-1 min-w-0 pr-2">
                                        <div className="truncate">
                                            {session.title || 'Untitled Chat'}
                                        </div>
                                    </div>

                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 flex items-center bg-inherit">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Chat?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete this conversation and all its messages.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(e, session.id);
                                                        }}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

        </aside>
    );
}
