import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { aiConciergeService, ChatMessage, AIResponse } from '@/lib/ai-concierge';
import { useWallet } from '@/hooks/use-wallet';
import { useAuth } from '@/hooks/use-auth';
import { MessageCircle, Send, Bot, User, Minimize2, Maximize2, X } from 'lucide-react';
import { toast } from 'sonner';

interface AIChatbotProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onClose?: () => void;
}

export const AIChatbot = ({ isMinimized = false, onToggleMinimize, onClose }: AIChatbotProps) => {
  const { t } = useTranslation();
  const { walletAddress, isConnected } = useWallet();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeConcierge();
  }, [walletAddress, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeConcierge = async () => {
    if (isInitialized) return;

    try {
      await aiConciergeService.initialize({
        userId: user?.id,
        walletAddress: walletAddress || undefined,
        portfolioValue: 0, // This would come from actual portfolio data
        recentActivity: []
      });

      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: "👋 Hello! I'm your LuxLedger AI concierge. I can help you with crypto basics, platform navigation, asset information, and trading support. What would you like to know?",
        timestamp: new Date()
      };

      setMessages([welcomeMessage]);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize AI concierge:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response: AIResponse = await aiConciergeService.processMessage(inputMessage);
      
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        metadata: {
          intent: response.intent,
          confidence: response.confidence,
          suggestedActions: response.suggestedActions
        }
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Add quick replies if available
      if (response.quickReplies && response.quickReplies.length > 0) {
        const quickRepliesMessage: ChatMessage = {
          id: `quick_${Date.now()}`,
          role: 'system',
          content: 'quick_replies',
          timestamp: new Date(),
          metadata: {
            suggestedActions: response.quickReplies
          }
        };
        setMessages(prev => [...prev, quickRepliesMessage]);
      }
    } catch (error) {
      console.error('Failed to get AI response:', error);
      toast.error('Failed to get response from AI concierge');
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again or contact our support team.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (reply: string) => {
    setInputMessage(reply);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isMinimized) {
    return (
      <Card className="fixed bottom-4 right-4 w-80 shadow-lg border-2 border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bot className="h-4 w-4 text-primary" />
              AI Concierge
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={onToggleMinimize}>
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground">
            Click to expand and chat with our AI assistant
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[500px] shadow-lg border-2 border-primary/20 flex flex-col">
      <CardHeader className="pb-2 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Concierge
            <Badge variant="secondary" className="text-xs">Online</Badge>
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onToggleMinimize}>
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === 'system' && message.content === 'quick_replies' ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {message.metadata?.suggestedActions?.map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleQuickReply(action)}
                      >
                        {action}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div className={`rounded-lg p-3 ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                        <div className={`text-xs mt-1 opacity-70`}>
                          {formatTime(message.timestamp)}
                        </div>
                        
                        {message.metadata?.suggestedActions && message.metadata.suggestedActions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {message.metadata.suggestedActions.slice(0, 3).map((action, index) => (
                              <Badge key={index} variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80">
                                {action}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-lg p-3 bg-muted">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about LuxLedger..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {!isConnected && (
            <div className="text-xs text-muted-foreground mt-2">
              💡 Connect your wallet for personalized assistance
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Floating chat button component
export const ChatbotToggle = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleToggle = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
    } else {
      setIsMinimized(!isMinimized);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={handleToggle}
          className="fixed bottom-4 right-4 rounded-full w-14 h-14 shadow-lg"
          size="lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
      
      {isOpen && (
        <AIChatbot
          isMinimized={isMinimized}
          onToggleMinimize={() => setIsMinimized(!isMinimized)}
          onClose={handleClose}
        />
      )}
    </>
  );
};
