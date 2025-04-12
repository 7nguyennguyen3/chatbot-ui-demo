import { Button } from "@/components/ui/button";
import React from "react";

interface NewChatIntroProps {
  submitMessage: (message: string) => void;
}

const NewChatIntro = ({ submitMessage }: NewChatIntroProps) => {
  return (
    <div
      className="flex flex-col items-center text-center gap-4 w-full my-auto text-foreground 
                  px-4 mb-4"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-semibold">Welcome to GrowthBot!</h2>
        <h4 className="text-xl text-muted-foreground">
          How can I help you today?
        </h4>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {[
          "What can you do?",
          "Walk me through your services",
          "Tell me more about your company",
        ].map((prompt) => (
          <Button
            key={prompt}
            variant="outline"
            size="sm"
            onClick={() => submitMessage(prompt)}
            className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {prompt}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default NewChatIntro;
