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
      text: "How does buying work?",
      category: "basics",
      response: "Pick a listing and pay with XRP through Xaman. Your payment goes into an escrow on the XRP Ledger — not to us, not to the seller — and stays there until the carrier reports delivery and you confirm receipt. Only then do funds release to the seller."
    },
    {
      id: '2',
      text: "What does 'Listing reviewed' mean?",
      category: "trust",
      response: "Each listing shows its review state. 'Listing reviewed' means our team signed off on the listing and its documents. 'Seller listing — not independently reviewed' means we haven't reviewed it yet. Either way, every purchase is escrow-protected."
    },
    {
      id: '3',
      text: "Is my payment protected?",
      category: "security",
      response: "Yes — your payment is held in an escrow object on the XRP Ledger until delivery is confirmed. If something goes wrong you can open a dispute, which blocks release while it's reviewed."
    },
    {
      id: '4',
      text: "What happens after I buy?",
      category: "orders",
      response: "You get an order page (/order/:id) that tracks the escrow: the seller ships with an approved carrier and tracking, you confirm receipt when it arrives, and the escrow settles on-chain. You can open a dispute from the same page if the item isn't right."
    },
    {
      id: '5',
      text: "What fees do you charge?",
      category: "fees",
      response: "Sellers pay a 2.5% platform fee on completed sales. Buyers pay no platform fee. XRPL network fees are fractions of a cent."
    },
    {
      id: '6',
      text: "How to contact human support?",
      category: "support",
      response: "I can connect you with our support team for complex questions — use the contact page and we'll follow up. For order issues you can also open a dispute right from your order page."
    }
  ];

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage: ChatMessage = {
      id: '1',
      content: `Hello${user ? ` ${user.user_metadata?.full_name || 'there'}` : ''}! 👋 I'm Lily, your LuxLedger concierge. I'm here to help you navigate luxury assets with escrow-protected checkout — I can explain how buying, shipping, and settlement work. What would you like to know?`,
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
        content: "I can point you to our support team for anything complex — reach them through the contact page, or open a dispute directly from your order page if an order went wrong.",
        sender: 'ai',
        timestamp: new Date().toISOString(),
        type: 'handoff',
        metadata: {
          confidence: 100,
          suggestions: ["Contact support", "Open my order", "Continue with concierge"]
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
            Lily can explain how escrow, shipping, and settlement work, and point you to support when you need a human.
          </p>
        </div>
      </Card>
    </div>
  );
}