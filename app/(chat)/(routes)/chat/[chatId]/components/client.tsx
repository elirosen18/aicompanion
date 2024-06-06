"use client";

import React, { FormEvent, useState } from "react";
import { Companion, Message } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useCompletion, useChat } from "ai/react";

import ChatHeader from "@/components/chat-header";
import ChatForm from "@/components/chat-form";
import ChatMessages from "@/components/chat-messages";
import { ChatMessageProps } from "@/components/chat-message";

interface ChatClientProps {
  companion: Companion & {
    messages: Message[];
    _count: {
      messages: number;
    };
  };
}

export default function ChatClient({ companion }: ChatClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessageProps[]>(companion.messages);

  const { input, isLoading, handleInputChange, handleSubmit, setInput } = useCompletion({
    api: `/api/chat/${companion.id}`,
    onFinish(prompt, result) {
      const systemMessage: ChatMessageProps = {
        role: "system",
        content: result
      };

      setMessages((current) => [...current, systemMessage]);
      setInput("");

      console.log("Finished streaming message:", result);

      console.log(result, prompt);
      router.refresh();
    }
  });

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission
  
    if (!input.trim()) {
      // Validate input
      console.error("Input cannot be empty");
      return;
    }
  
    const userMessage: ChatMessageProps = {
      role: "user",
      content: input
    };
  
    setMessages((current) => [...current, userMessage]);
  
    //try {
      await handleSubmit(e); // Ensure handleSubmit is an async function
    /*} catch (error) {
      console.error("Error submitting message:", error);
      if (error instanceof Response) {
        try {
          const errorData = await error.json();
          console.error("Error details:", errorData);
        } catch (jsonError) {
          console.error("Error parsing JSON response:", jsonError);
        }
      } else if (error instanceof Error) {
        console.error("Error message:", error.message);
      } else {
        console.error("Unexpected error:", error);
      }
    *///}
  };
  

  return (
    <div className="flex flex-col h-full p-4 space-y-2">
      <ChatHeader companion={companion} />
      <ChatMessages
        companion={companion}
        isLoading={isLoading}
        messages={messages}
      />
      <ChatForm
        handleInputChange={handleInputChange}
        input={input}
        onSubmit={onSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}