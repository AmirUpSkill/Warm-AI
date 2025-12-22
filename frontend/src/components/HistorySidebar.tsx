import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { MessageSquare, Trash2, Edit2, Plus, PanelLeftClose } from 'lucide-react';
import { useChatStore } from '@/store/use-chat-store';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from '@/components/ui/sheet';
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

interface HistorySidebarProps {
    children?: React.ReactNode;
}

export function HistorySidebar({ children }: HistorySidebarProps) {
    const [open, setOpen] = useState(false);
    
    const {
        sessions,
        fetchSessions,
        currentSessionId,
        selectSession,
        createNewSession,
        deleteSession
    } = useChatStore();

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const handleSelect = async (id: number) => {
        await selectSession(id);
        setOpen(false); // Close sidebar after selecting
    };

    const handleNewChat = () => {
        createNewSession();
        setOpen(false); // Close sidebar after creating new chat
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        await deleteSession(id);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[320px] p-0 flex flex-col gap-0">
                {/* Header with brand and close button */}
                <div className="flex items-center justify-between px-4 py-4 border-b bg-muted/30">
                    <h2 className="text-lg font-semibold tracking-tight">Warm AI</h2>
                    <SheetClose asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
                            <PanelLeftClose className="h-4 w-4" />
                            <span className="sr-only">Close sidebar</span>
                        </Button>
                    </SheetClose>
                </div>

                {/* New Chat Button */}
                <div className="px-3 pt-3 pb-2">
                    <Button 
                        variant="outline" 
                        className="w-full justify-start gap-2 h-10 font-medium"
                        onClick={handleNewChat}
                    >
                        <Plus className="w-4 h-4" />
                        New chat
                    </Button>
                </div>

                <ScrollArea className="flex-1">
                    <div className="px-3 py-2 space-y-2">
                        {sessions.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8 text-sm">
                                No past conversations
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        onClick={() => handleSelect(session.id)}
                                        className={cn(
                                            "group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors relative",
                                            currentSessionId === session.id
                                                ? "bg-secondary"
                                                : "hover:bg-secondary/50"
                                        )}
                                    >
                                        <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate text-sm">
                                                {session.title || 'Untitled Conversation'}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {format(new Date(session.updated_at), 'MMM d, h:mm a')}
                                            </div>
                                        </div>

                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={(e) => { e.stopPropagation(); handleDelete(e, session.id); }}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
