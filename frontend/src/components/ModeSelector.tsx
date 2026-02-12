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
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandDialog,
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
            <ModeSelectorContent onSelect={(option) => {
                onSelect(option);
                onOpenChange(false);
            }} />
        </CommandDialog>
    );
}

interface ModeSelectorContentProps {
    onSelect: (option: ModeOption) => void;
}

export function ModeSelectorContent({ onSelect }: ModeSelectorContentProps) {
    return (
        <Command className="bg-[#fdfcfb]">
            <CommandInput placeholder="Search modes or commands..." className="h-11 border-none focus:ring-0" />
            <CommandList className="max-h-[300px] p-2">
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Modes" className="px-2">
                    {modes.map((option) => (
                        <CommandItem
                            key={option.id}
                            onSelect={() => onSelect(option)}
                            className="flex items-center gap-3 py-4 px-3 cursor-pointer data-[selected='true']:bg-black/5 transition-colors duration-200 rounded-xl"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fdfcfb] shadow-sm border border-black/[0.03] text-foreground/70 group-data-[selected='true']:text-foreground shrink-0">
                                <option.icon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="font-semibold text-sm text-foreground">{option.label}</span>
                                <span className="text-[10px] text-muted-foreground truncate">
                                    {option.description}
                                </span>
                            </div>
                            <div className="ml-auto text-[10px] font-bold tracking-widest text-primary/40 opacity-0 group-data-[selected='true']:opacity-100 uppercase translate-x-2 group-data-[selected='true']:translate-x-0 transition-all">
                                Select
                            </div>
                        </CommandItem>
                    ))}
                </CommandGroup>
                <CommandSeparator className="my-2" />
                <CommandGroup heading="Quick Actions" className="px-2">
                    <CommandItem className="py-3 px-3 rounded-xl cursor-pointer data-[selected='true']:bg-black/5">
                        <CommandIcon className="mr-3 h-4 w-4 opacity-50" />
                        <span className="text-sm font-medium">Open Help</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </Command>
    );
}
