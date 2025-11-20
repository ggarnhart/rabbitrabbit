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
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";
import { MessageCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Message as DBMessage } from "@/lib/conversations/db";
import { GarminAuthDialog } from "@/components/GarminAuthDialog";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { convertDBMessagesToUI } from "./convertDBMessagesToUI";

interface ConversationWrapperProps {
  conversationId: string;
  initialMessages: DBMessage[];
  hasGarminAuth: boolean;
}

const ChatInterface = ({
  conversationId,
  initialMessages,
  hasGarminAuth: initialHasGarminAuth,
}: ConversationWrapperProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showGarminDialog, setShowGarminDialog] = useState(false);
  const [hasGarminAuth, setHasGarminAuth] = useState(initialHasGarminAuth);

  useEffect(() => {
    // Check if user just connected Garmin
    const garminStatus = searchParams.get("garmin");
    if (garminStatus === "connected") {
      setHasGarminAuth(true);
      // Remove query param from URL
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Show dialog if user doesn't have Garmin auth
    if (!hasGarminAuth) {
      setShowGarminDialog(true);
    }
  }, [hasGarminAuth, searchParams]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/chat?conversationId=${conversationId}`,
      }),
    [conversationId]
  );

  const { messages, sendMessage, status } = useChat({
    transport,
    messages: convertDBMessagesToUI(initialMessages),
  });

  const handleNewConversation = async () => {
    try {
      const response = await fetch("/api/conversations/new", {
        method: "POST",
      });

      if (response.ok) {
        const { conversationId } = await response.json();
        router.push(`/${conversationId}`);
      }
    } catch (error) {
      console.error("Error creating new conversation:", error);
    }
  };

  return (
    <>
      <GarminAuthDialog
        open={showGarminDialog}
        onOpenChange={setShowGarminDialog}
      />
      <div className="flex h-screen w-full flex-col bg-background">
        {/* Header */}
        <header className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="size-6" />
              <h1 className="font-semibold text-xl">RabbitRabbit Chat</h1>
            </div>
            <button
              onClick={handleNewConversation}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
            >
              <Plus className="size-4" />
              New Conversation
            </button>
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
              messages
                .filter((m) => m.role !== "system")
                .map((message, messageIndex) => {
                  // Check if this is the last message and if we're currently streaming
                  const isLastMessage = messageIndex === messages.length - 1;
                  const isStreamingMessage =
                    isLastMessage &&
                    (status === "submitted" || status === "streaming");

                  return (
                    <Message key={message.id} from={message.role}>
                      <MessageContent>
                        {message.parts.map((part, index) => {
                          // Handle tool calls separately with type assertion
                          const partType = (part as any).type as string;

                          switch (partType) {
                            case "text":
                              return (
                                <Response key={index}>{part.text}</Response>
                              );

                            case "reasoning":
                              return (
                                <Reasoning
                                  key={index}
                                  isStreaming={isStreamingMessage}
                                >
                                  <ReasoningTrigger />
                                  <ReasoningContent>
                                    {(part as any).text || ""}
                                  </ReasoningContent>
                                </Reasoning>
                              );

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

                            case "tool-findExercisesTool":
                              switch (part.state) {
                                case "output-available":
                                  const exercises = (part.output as any)?.exercises || [];
                                  return (
                                    <Response key={`${part.toolCallId}-output`}>
                                      <div className="space-y-2">
                                        <p className="font-semibold">
                                          Found {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}:
                                        </p>
                                        {exercises.map((ex: any, idx: number) => (
                                          <div key={idx} className="pl-4 border-l-2 border-indigo-500">
                                            <p className="font-medium">{ex.exerciseName}</p>
                                            <p className="text-sm text-muted-foreground">{ex.description}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                              Equipment: {ex.equipment.join(', ')}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    </Response>
                                  );

                                case "input-available":
                                case "input-streaming":
                                default:
                                  return (
                                    <Response key={part.toolCallId}>
                                      Finding exercises...
                                    </Response>
                                  );
                              }

                            case "step-start":
                              // case "step-finish":
                              // These are metadata parts, don't render them
                              return null;

                            default:
                              // Log unknown parts for debugging
                              console.log("Unknown part type:", part.type);
                              return null;
                          }
                        })}
                      </MessageContent>
                    </Message>
                  );
                })
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
    </>
  );
};

export function ConversationWrapper(props: ConversationWrapperProps) {
  return (
    <PromptInputProvider>
      <ChatInterface {...props} />
    </PromptInputProvider>
  );
}
