import * as React from "react";

export function WarmLogo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M20 8C13.373 8 8 13.373 8 20C8 26.627 13.373 32 20 32C26.627 32 32 26.627 32 20C32 13.373 26.627 8 20 8Z"
                fill="currentColor"
                fillOpacity="0.1"
            />
            <path
                d="M20 12V14M20 26V28M28 20H26M14 20H12M25.6569 14.3431L24.2426 15.7574M15.7574 24.2426L14.3431 25.6569M25.6569 25.6569L24.2426 24.2426M15.7574 15.7574L14.3431 14.3431"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <circle cx="20" cy="20" r="4" fill="currentColor" />
        </svg>
    );
}
