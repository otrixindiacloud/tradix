import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import VoiceControls from './voice-controls';
import { 
  Send, 
  MessageCircle, 
  User, 
  Bot, 
  Sparkles,
  FileText,
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  Calculator,
  Loader2,
  Minimize2,
  Maximize2,
  X,
  Copy,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  suggestions?: string[];
}

interface AIChatInterfaceProps {
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  { icon: FileText, label: "Create Enquiry", action: "help_create_enquiry" },
  { icon: Users, label: "Customer Info", action: "help_customer_info" },
  { icon: Package, label: "Inventory Status", action: "help_inventory_status" },
  { icon: ShoppingCart, label: "Sales Reports", action: "help_sales_reports" },
  { icon: TrendingUp, label: "Analytics", action: "help_analytics" },
  { icon: Calculator, label: "Pricing Help", action: "help_pricing" },
];

export default function AIChatInterface({ isMinimized, onToggleMinimize, onClose }: AIChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your ERP AI Assistant. I can help you with enquiries, quotations, inventory management, customer information, and much more. How can I assist you today?",
      role: 'assistant',
      timestamp: new Date(),
      suggestions: [
        "Show me recent enquiries",
        "Help me create a quotation",
        "Check inventory levels",
        "Generate sales report"
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          context: messages.slice(-5), // Send last 5 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
        suggestions: data.suggestions,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = (transcript: string) => {
    setInputValue(transcript);
    // Auto-send voice input
    setTimeout(() => handleSendMessage(transcript), 500);
  };

  const handleSpeech = (text: string) => {
    // Speech synthesis is handled in VoiceControls component
  };

  const handleQuickAction = (action: string) => {
    const actionMessages: Record<string, string> = {
      help_create_enquiry: "Help me create a new enquiry",
      help_customer_info: "Show me customer information and management options",
      help_inventory_status: "What's the current inventory status?",
      help_sales_reports: "Generate a sales report for this month",
      help_analytics: "Show me key business analytics and insights",
      help_pricing: "Help me with pricing strategies and calculations"
    };

    const message = actionMessages[action];
    if (message) {
      handleSendMessage(message);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  if (isMinimized) {
    return (
      <Card className="fixed bottom-4 right-4 w-80 shadow-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-500 text-white">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-sm">AI Assistant</CardTitle>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <Sparkles className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMinimize}
                className="h-8 w-8 p-0"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">
            I'm here to help with your ERP tasks!
          </p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.slice(0, 4).map((action) => (
              <Button
                key={action.action}
                variant="outline"
                size="sm"
                onClick={() => {
                  onToggleMinimize();
                  handleQuickAction(action.action);
                }}
                className="justify-start text-xs"
              >
                <action.icon className="h-3 w-3 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[600px] shadow-xl border-2 border-blue-200 bg-white flex flex-col">
      <CardHeader className="pb-2 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-500 text-white">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-sm">ERP AI Assistant</CardTitle>
              <p className="text-xs text-gray-600">Always here to help</p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <Sparkles className="h-3 w-3 mr-1" />
              Online
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMinimize}
              className="h-8 w-8 p-0"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-6 w-6 mt-1">
                    <AvatarFallback className="bg-blue-500 text-white text-xs">
                      <Bot className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-3 text-sm group relative",
                    message.role === 'user'
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Message actions */}
                  {message.role === 'assistant' && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -right-8 top-2 flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyMessage(message.content)}
                        className="h-6 w-6 p-0 bg-white shadow-sm"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  
                  {message.suggestions && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {message.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs bg-white/80 hover:bg-white"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {message.role === 'user' && (
                  <Avatar className="h-6 w-6 mt-1">
                    <AvatarFallback className="bg-gray-500 text-white text-xs">
                      <User className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start gap-2">
                <Avatar className="h-6 w-6 mt-1">
                  <AvatarFallback className="bg-blue-500 text-white text-xs">
                    <Bot className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <div className="border-t p-2">
          <p className="text-xs text-gray-600 mb-2">Quick Actions:</p>
          <div className="grid grid-cols-3 gap-1">
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.action}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action.action)}
                className="text-xs p-1 h-8"
              >
                <action.icon className="h-3 w-3 mr-1" />
                {action.label.split(' ')[0]}
              </Button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t p-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about your ERP..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(inputValue);
                  }
                }}
                disabled={isLoading || isListening}
                className={cn(
                  "text-sm",
                  isListening && "bg-red-50 border-red-200"
                )}
              />
            </div>
            <VoiceControls
              onVoiceInput={handleVoiceInput}
              onSpeech={handleSpeech}
              isListening={isListening}
              setIsListening={setIsListening}
            />
            <Button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading || isListening}
              size="sm"
              className="px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {isListening && (
            <p className="text-xs text-red-600 mt-1 animate-pulse">
              🎤 Listening... Speak now
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
