import * as React from "react";
import {
    MessageSquare,
    Globe,
    Users,
    Building2,
    FileText,
    Command as CommandIcon,
} from "lucide-react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { type SearchType, type ChatMode } from "@/lib/api";

export type AppMode = "chat" | "people" | "companies" | "file_search";

export interface ModeOption {
    id: string;
    label: string;
    icon: React.ElementType;
    mode: AppMode;
    chatMode?: ChatMode;
    description: string;
}

const modes: ModeOption[] = [
    {
        id: "chat-standard",
        label: "Standard Chat",
        icon: MessageSquare,
        mode: "chat",
        chatMode: "standard",
        description: "Converse with Warm AI about any topic",
    },
    {
        id: "chat-web",
        label: "Web Search",
        icon: Globe,
        mode: "chat",
        chatMode: "web_search",
        description: "Search the web for up-to-date information",
    },
    {
        id: "file-search",
        label: "File Search",
        icon: FileText,
        mode: "file_search",
        description: "Upload a document and chat with AI grounded in its content",
    },
    {
        id: "people",
        label: "People Search",
        icon: Users,
        mode: "people",
        description: "Find professionals and talent patterns",
    },
    {
        id: "companies",
        label: "Company Search",
        icon: Building2,
        mode: "companies",
        description: "Research companies and market landscapes",
    },
];

interface ModeSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (option: ModeOption) => void;
}

export function ModeSelector({ open, onOpenChange, onSelect }: ModeSelectorProps) {
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onOpenChange(!open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [open, onOpenChange]);

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput placeholder="Search modes or commands..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Modes">
                    {modes.map((option) => (
                        <CommandItem
                            key={option.id}
                            onSelect={() => {
                                onSelect(option);
                                onOpenChange(false);
                            }}
                            className="flex items-center gap-3 py-4 cursor-pointer data-[selected='true']:bg-accent transition-colors duration-200"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background shadow-sm border border-black/[0.03] text-foreground/70 group-data-[selected='true']:text-foreground">
                                <option.icon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium text-foreground">{option.label}</span>
                                <span className="text-xs text-muted-foreground">
                                    {option.description}
                                </span>
                            </div>
                            <div className="ml-auto text-[10px] font-bold tracking-widest text-muted-foreground/30 opacity-0 group-data-[selected='true']:opacity-100 uppercase">
                                Select
                            </div>
                        </CommandItem>
                    ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Quick Actions">
                    <CommandItem className="py-3">
                        <CommandIcon className="mr-2 h-4 w-4" />
                        <span>Open Help</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
