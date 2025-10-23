"use client";

import { useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  usePromptInputController,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";
import { MessageCircle } from "lucide-react";

const ChatInterface = () => {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
      }),
    []
  );

  const { messages, sendMessage, status } = useChat({
    transport,
  });
  const controller = usePromptInputController();

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      {/* Header */}
      <header className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <MessageCircle className="size-6" />
          <h1 className="font-semibold text-xl">RabbitRabbit Chat</h1>
        </div>
      </header>

      {/* Conversation Area */}
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Welcome to RabbitRabbit!"
              description="Ask me anything to get started"
              icon={<MessageCircle className="size-12" />}
            />
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageAvatar
                  src={
                    message.role === "user"
                      ? "https://api.dicebear.com/7.x/avataaars/svg?seed=user"
                      : "https://api.dicebear.com/7.x/bottts/svg?seed=rabbit"
                  }
                  name={message.role === "user" ? "You" : "AI"}
                />
                <MessageContent>
                  {message.parts.map((part, index) => {
                    if (part.type === "text") {
                      return <Response key={index}>{part.text}</Response>;
                    }
                    return null;
                  })}
                </MessageContent>
              </Message>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input Area */}
      <div className="border-t p-4">
        <PromptInput
          onSubmit={(message) => {
            const text = message.text?.trim();
            if (text) {
              sendMessage({
                role: "user",
                parts: [{ type: "text", text }],
              });
            }
          }}
        >
          <PromptInputAttachments>
            {(attachment) => <PromptInputAttachment data={attachment} />}
          </PromptInputAttachments>
          <PromptInputTextarea placeholder="Type your message..." />
          <PromptInputFooter>
            <div />
            <PromptInputSubmit status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};

const RabbitConsultation = () => {
  return (
    <PromptInputProvider>
      <ChatInterface />
    </PromptInputProvider>
  );
};

export default RabbitConsultation;
