import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send, Bot, User, Sparkles, HelpCircle, ExternalLink, Phone } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'human';
  timestamp: string;
  type: 'text' | 'quick_reply' | 'handoff' | 'resource';
  metadata?: {
    suggestions?: string[];
    resources?: Array<{
      title: string;
      url: string;
      description: string;
    }>;
    confidence?: number;
  };
}

interface QuickAction {
  id: string;
  text: string;
  category: string;
  response: string;
}

export function AIConcierge() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatMode, setChatMode] = useState<'ai' | 'human'>('ai');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();

  const quickActions: QuickAction[] = [
    {
      id: '1',
      text: "What is an NFT?",
      category: "basics",
      response: "An NFT (Non-Fungible Token) is a unique digital certificate stored on a blockchain that proves ownership of a specific digital or physical asset. Think of it like a digital deed or certificate of authenticity. In LuxLedger, we use NFTs to represent ownership of luxury assets like art, watches, or real estate shares."
    },
    {
      id: '2',
      text: "How do I buy fractional shares?",
      category: "investing",
      response: "Fractional ownership allows you to buy a portion of a high-value asset. Here's how it works: 1) Browse our fractional offerings, 2) Choose the number of shares you want to purchase, 3) Complete the transaction with your connected wallet, 4) Receive your ownership tokens. You'll earn dividends and can sell your shares anytime on our marketplace."
    },
    {
      id: '3',
      text: "Is my investment secure?",
      category: "security",
      response: "Absolutely! LuxLedger uses multiple security layers: 1) All assets are professionally verified and appraised, 2) Blockchain technology ensures transparent ownership records, 3) We're regulated and insured, 4) Your digital wallet gives you complete control over your assets. Physical assets are stored in secure, insured facilities."
    },
    {
      id: '4',
      text: "How do auctions work?",
      category: "auctions",
      response: "Our auctions are simple and transparent: 1) Browse live auctions in the Auctions section, 2) Place your bid (higher than current bid), 3) You can set a maximum bid for automatic bidding, 4) If you win, you'll be notified and guided through payment, 5) The asset is transferred to your wallet. All auctions have clear end times and reserve prices."
    },
    {
      id: '5',
      text: "What fees do you charge?",
      category: "fees",
      response: "Our fees are transparent and competitive: 2.5% marketplace fee on completed transactions, 0.1% for cross-chain bridging, and no fees for browsing, bidding, or wallet connections. Premium members get reduced fees. All fees are clearly shown before you confirm any transaction."
    },
    {
      id: '6',
      text: "How to contact human support?",
      category: "support",
      response: "I'd be happy to connect you with our human support team! They're available 24/7 for complex questions. Would you like me to transfer you now, or would you prefer to schedule a call?"
    }
  ];

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage: ChatMessage = {
      id: '1',
      content: `Hello${user ? ` ${user.user_metadata?.full_name || 'there'}` : ''}! 👋 I'm Lily, your LuxLedger AI concierge. I'm here to help you navigate the world of luxury asset investing. I can explain concepts in simple terms, guide you through our platform, and connect you with human experts when needed. What would you like to know?`,
      sender: 'ai',
      timestamp: new Date().toISOString(),
      type: 'text',
      metadata: {
        confidence: 100,
        suggestions: [
          "Tell me about luxury investing",
          "How do I get started?",
          "What makes LuxLedger different?"
        ]
      }
    };
    
    setMessages([welcomeMessage]);
    scrollToBottom();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleQuickAction = (action: QuickAction) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: action.text,
      sender: 'user',
      timestamp: new Date().toISOString(),
      type: 'quick_reply'
    };

    setMessages(prev => [...prev, userMessage]);
    setShowQuickActions(false);

    // Simulate AI typing
    setIsTyping(true);
    
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: action.response,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        type: 'text',
        metadata: {
          confidence: 95,
          suggestions: getFollowUpSuggestions(action.category)
        }
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getFollowUpSuggestions = (category: string): string[] => {
    const suggestions: { [key: string]: string[] } = {
      basics: ["How do I connect my wallet?", "What cryptocurrencies do you accept?", "Can I invest with traditional currency?"],
      investing: ["What's the minimum investment?", "How do I track my portfolio?", "Can I sell my shares anytime?"],
      security: ["How are assets authenticated?", "What if something goes wrong?", "Do you have insurance?"],
      auctions: ["When are new auctions listed?", "Can I cancel a bid?", "What happens if I win?"],
      fees: ["Are there any hidden costs?", "How do premium memberships work?", "Do prices include taxes?"],
      support: ["Schedule a call", "Email support", "Visit help center"]
    };
    
    return suggestions[category] || ["Tell me more", "What else should I know?", "Connect me with an expert"];
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI processing
    setTimeout(async () => {
      const response = await generateAIResponse(inputMessage);
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 2000);
  };

  const generateAIResponse = async (input: string): Promise<ChatMessage> => {
    const lowerInput = input.toLowerCase();
    
    // Check for handoff requests
    if (lowerInput.includes('human') || lowerInput.includes('person') || lowerInput.includes('expert') || lowerInput.includes('complex')) {
      return {
        id: (Date.now() + 1).toString(),
        content: "I'd be happy to connect you with one of our luxury investment experts! Our human team can provide personalized advice and handle complex inquiries. Would you prefer a live chat, phone call, or scheduled consultation?",
        sender: 'ai',
        timestamp: new Date().toISOString(),
        type: 'handoff',
        metadata: {
          confidence: 100,
          suggestions: ["Start live chat", "Schedule phone call", "Continue with AI"]
        }
      };
    }

    // Knowledge base responses
    const responses: { [key: string]: string } = {
      'wallet': "To connect your wallet, click the 'Connect Wallet' button in the top right. We support XUMM for XRP Ledger, MetaMask for Ethereum, and Phantom for Solana. Your wallet is your key to owning and trading luxury assets on our platform.",
      'start': "Getting started is easy! 1) Connect your digital wallet, 2) Complete basic verification (takes 2-3 minutes), 3) Browse our curated luxury assets, 4) Start with fractional shares if you're new to investing. No minimum investment required!",
      'different': "LuxLedger is unique because we combine luxury asset expertise with blockchain technology. Every asset is professionally verified, physically secured, and comes with detailed provenance. Plus, our AI helps you make smarter investment decisions.",
      'blockchain': "Blockchain is like a digital ledger that everyone can see but no one can fake. It records who owns what assets permanently and transparently. Think of it as a super-secure, public record book for your luxury investments.",
      'minimum': "There's no minimum investment! You can start with as little as $100 in fractional shares. This makes luxury investing accessible to everyone, not just ultra-wealthy collectors."
    };

    let responseContent = "I understand your question about luxury investing. Let me help you with that! ";
    
    // Find relevant response
    for (const [key, response] of Object.entries(responses)) {
      if (lowerInput.includes(key)) {
        responseContent = response;
        break;
      }
    }

    // If no specific match, provide general helpful response
    if (responseContent.includes("I understand your question")) {
      responseContent += "Could you tell me more specifically what you'd like to know about? I can explain anything from basic concepts to advanced investment strategies. Or would you prefer to speak with one of our human experts?";
    }

    return {
      id: (Date.now() + 1).toString(),
      content: responseContent,
      sender: 'ai',
      timestamp: new Date().toISOString(),
      type: 'text',
      metadata: {
        confidence: 85,
        suggestions: ["Tell me more", "Connect with expert", "Browse assets"],
        resources: [
          {
            title: "Beginner's Guide to Luxury Investing",
            url: "/guide/luxury-investing",
            description: "Complete guide to getting started"
          },
          {
            title: "How Blockchain Works",
            url: "/guide/blockchain",
            description: "Simple explanation of blockchain technology"
          }
        ]
      }
    };
  };

  const handoffToHuman = () => {
    const handoffMessage: ChatMessage = {
      id: Date.now().toString(),
      content: "Perfect! I'm connecting you with Sarah, one of our luxury investment specialists. She'll be with you in just a moment. In the meantime, feel free to continue asking questions!",
      sender: 'ai',
      timestamp: new Date().toISOString(),
      type: 'handoff'
    };

    setMessages(prev => [...prev, handoffMessage]);
    setChatMode('human');
    
    // Simulate human agent joining
    setTimeout(() => {
      const humanMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "Hi there! I'm Sarah, a luxury investment specialist. Lily filled me in on your conversation. I'm here to help with any detailed questions about our platform or investment strategies. What would you like to discuss?",
        sender: 'human',
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, humanMessage]);
      toast.success("Connected to human expert!");
    }, 3000);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getAvatarIcon = (sender: string) => {
    switch (sender) {
      case 'ai': return <Bot className="w-4 h-4" />;
      case 'human': return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-primary" />
            AI Concierge
          </h2>
          <p className="text-muted-foreground">Get instant help with luxury investing - explained in plain English</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={chatMode === 'ai' ? 'default' : 'secondary'} className="flex items-center gap-1">
            {chatMode === 'ai' ? <Sparkles className="w-3 h-3" /> : <User className="w-3 h-3" />}
            {chatMode === 'ai' ? 'AI Assistant' : 'Human Expert'}
          </Badge>
          
          {chatMode === 'ai' && (
            <Button variant="outline" size="sm" onClick={handoffToHuman}>
              <Phone className="w-3 h-3 mr-1" />
              Human Expert
            </Button>
          )}
        </div>
      </div>

      <Card className="h-[600px] flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src="/ai-concierge-avatar.jpg" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">Lily - AI Concierge</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Online and ready to help
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : ''}`}>
              {message.sender !== 'user' && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className={message.sender === 'ai' ? 'bg-primary text-primary-foreground' : 'bg-blue-100 text-blue-600'}>
                    {getAvatarIcon(message.sender)}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-first' : ''}`}>
                <div className={`p-3 rounded-lg ${
                  message.sender === 'user' 
                    ? 'bg-primary text-primary-foreground ml-auto' 
                    : 'bg-muted'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                  {message.metadata?.confidence && message.sender === 'ai' && (
                    <span className="text-xs text-muted-foreground">
                      {message.metadata.confidence}% confidence
                    </span>
                  )}
                </div>

                {/* Suggestions */}
                {message.metadata?.suggestions && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {message.metadata.suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs h-6"
                        onClick={() => setInputMessage(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Resources */}
                {message.metadata?.resources && (
                  <div className="space-y-2 mt-3">
                    {message.metadata.resources.map((resource, index) => (
                      <div key={index} className="p-2 border rounded-lg bg-background">
                        <div className="flex items-center gap-2">
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm font-medium">{resource.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{resource.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Handoff actions */}
                {message.type === 'handoff' && message.sender === 'ai' && (
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={handoffToHuman}>
                      <Phone className="w-3 h-3 mr-1" />
                      Connect Now
                    </Button>
                    <Button variant="outline" size="sm">
                      Schedule Call
                    </Button>
                  </div>
                )}
              </div>

              {message.sender === 'user' && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Quick Actions */}
        {showQuickActions && (
          <div className="px-6 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Quick answers:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.slice(0, 4).map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 justify-start"
                  onClick={() => handleQuickAction(action)}
                >
                  {action.text}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ask me anything about luxury investing..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!inputMessage.trim() || isTyping}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Lily can explain concepts, guide you through our platform, and connect you with human experts.
          </p>
        </div>
      </Card>
    </div>
  );
}