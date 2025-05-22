"use client"

import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function Notes() {
    const [notes, setNotes] = useState('');
    
    return (
        <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-md h-full">
                <h3 className="text-xl font-semibold text-indigo mb-4">My Journal</h3>
                <p className="text-charcoal/80 text-sm mb-4">
                Take notes as you watch the video. Your notes are saved automatically.
                </p>
                <Textarea
                className="min-h-[300px] border-indigo/30 focus:border-indigo"
                placeholder="Start typing your notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                />
            </div>
        </div>
    );
}   