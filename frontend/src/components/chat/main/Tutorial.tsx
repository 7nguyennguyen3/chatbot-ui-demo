import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import React from "react";

interface TutorialProps {
  setOpenTutorial: (open: boolean) => void;
}

const Tutorial = ({ setOpenTutorial }: TutorialProps) => {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in-0"
        onClick={() => setOpenTutorial(false)}
        aria-hidden="true" // Hide decorative backdrop from screen readers
      />

      {/* Modal Container: Centered, styled, higher z-index */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-md p-6 bg-card text-card-foreground rounded-lg shadow-xl border animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="relative">
          {/* Optional Corner Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpenTutorial(false)}
            className="absolute top-2 right-2 h-6 w-6 rounded-full" // Adjust styling as needed
            aria-label="Close tutorial"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>

          {/* Modal Content */}
          <h2 className="text-xl font-semibold mb-4 text-center">
            Welcome to the Chat Demo!
          </h2>
          <p className="mb-3 text-sm text-muted-foreground">
            This demonstration includes two distinct chatbots:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-1 text-sm pl-2">
            <li>
              <strong>GrowthBot:</strong> A lead-generation assistant (like the
              one in this main chat interface) designed to help businesses
              capture potential leads.
            </li>
            <li>
              <strong>Petalsoft:</strong> A customer support chatbot tailored
              for "Petalsoft," an example online store selling skincare
              products. You might find this bot in the popup widget.
            </li>
          </ul>
          <p className="mb-3 text-sm text-muted-foreground">
            You can experience these bots through two different UIs in this
            demo:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-1 text-sm pl-2">
            {" "}
            {/* Reduced bottom margin */}
            <li>
              <strong>Main Chat UI:</strong> The full-page interface you are
              currently using, typically showcasing the GrowthBot.
            </li>
            <li>
              <strong>Popup Chat Widget:</strong> A smaller, floating chat
              interface usually accessible via an icon in the bottom-right
              corner of the screen (often demonstrating the Petalsoft support
              bot).
            </li>
          </ul>

          {/* --- ADDED MODEL INFORMATION --- */}
          <p className="mt-4 pt-4 border-t border-border text-center text-xs text-muted-foreground">
            Powered by Google's{" "}
            <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
              gemini-2.0-flash-001
            </code>{" "}
            model.
          </p>
          {/* --- END OF ADDED INFO --- */}

          <Button
            onClick={() => setOpenTutorial(false)}
            className="w-full mt-4"
          >
            Got it! Start Chatting
          </Button>
        </div>
      </div>
    </>
  );
};

export default Tutorial;
