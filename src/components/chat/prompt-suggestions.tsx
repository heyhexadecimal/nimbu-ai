import React from 'react';
import { Mail, Calendar, Users, Send } from 'lucide-react';
import Image from 'next/image';
const PromptSuggestions = ({ onSuggestionClick }: { onSuggestionClick: (content: string) => void }) => {

    const SUGGESTIONS = [
        {
            text: "Summarize my recent emails",
            icon: Mail
        },
        {
            text: "What's on my schedule today?",
            icon: Calendar
        },
        {
            text: "Schedule a team meeting",
            icon: Users
        },
        {
            text: "Draft an email invitation",
            icon: Send
        }
    ];

    return (
        <div className="w-full  flex flex-col items-center justify-center gap-4 mb-40">
            <div className='w-full flex items-center justify-center flex-col' >
                <Image src="/logo.png" alt="Nimbu AI" width={200} height={200} />
                <div className="text-muted-foreground text-sm">You can ask Nimbu to do anything you want</div>
            </div>
            <div className="grid w-full grid-cols-2 gap-3">
                {SUGGESTIONS?.map((suggestion, index) => {
                    const IconComponent = suggestion.icon;
                    return (
                        <div
                            key={index}
                            onClick={() => onSuggestionClick(suggestion.text)}
                            className="group bg-card hover:bg-accent/50 border border-border 
                         px-4 py-4 rounded-lg cursor-pointer 
                         transition-all duration-200 
                         hover:shadow-md hover:border-primary/30"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg group-hover:bg-primary/15 transition-colors">
                                    <IconComponent className="w-4 h-4 text-primary" />
                                </div>
                                <p className="text-card-foreground group-hover:text-accent-foreground font-medium text-sm">
                                    {suggestion.text}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PromptSuggestions;