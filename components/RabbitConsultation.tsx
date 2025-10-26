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
import { RabbitRabbitChatMessage } from "@/app/api/chat/route";

const convertToUIMessages = (messages: any[]): RabbitRabbitChatMessage[] => {
  if (!messages) return [];

  return messages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    parts: msg.parts,
  }));
};

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
    messages: convertToUIMessages([]),
  });

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
                <MessageContent>
                  {message.parts.map((part, index) => {
                    switch (part.type) {
                      case "text":
                        return <Response key={index}>{part.text}</Response>;

                      case "tool-convertPaceTool":
                        switch (part.state) {
                          case "output-available":
                            return (
                              <Response key={part.toolCallId}>
                                Pace converted
                              </Response>
                            );

                          case "input-available":
                          case "input-streaming":
                          default:
                            return (
                              <Response key={part.toolCallId}>
                                Converting Pace...
                              </Response>
                            );
                        }
                      case "tool-generateSingleRunningStepTool":
                        switch (part.state) {
                          case "input-available":
                          case "input-streaming":
                          default:
                            return (
                              <Response key={part.toolCallId}>
                                Generating Step...
                              </Response>
                            );
                        }
                      case "tool-generateRunningSegmentTool":
                        switch (part.state) {
                          case "input-available":
                          case "input-streaming":
                          default:
                            return (
                              <Response key={part.toolCallId}>
                                Generating Segment...
                              </Response>
                            );
                        }
                      case "tool-generateRunningWorkoutTool":
                        switch (part.state) {
                          case "output-available":
                            return (
                              <Response key={`${part.toolCallId}-output`}>
                                {JSON.stringify(part.output, null, 2)}
                              </Response>
                            );

                          case "input-available":
                          case "input-streaming":
                          default:
                            return (
                              <Response key={part.toolCallId}>
                                Generating Workout...
                              </Response>
                            );
                        }
                      default:
                        return null;
                    }
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
