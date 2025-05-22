"use client"

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useClerk } from "@clerk/nextjs";

export function GetStarted() {
    const { openSignIn } = useClerk();
    return (
        <Button 
            className="btn-secondary text-lg px-8 py-6"
            onClick={() => openSignIn()}
            >
            Get Started <ArrowRight className="ml-2" />
        </Button>
    )
}