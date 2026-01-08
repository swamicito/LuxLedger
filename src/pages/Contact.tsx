import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Mail,
  Phone,
  MessageSquare,
  ChevronLeft,
  ArrowRight,
  Clock,
  MapPin,
  Send,
} from "lucide-react";
import { SLABanner, AutoResponseDialog } from "@/components/ui/support-widgets";
import { getSupportConfig } from "@/lib/launch-config";

export default function Contact() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAutoResponse, setShowAutoResponse] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const support = getSupportConfig();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call - replace with actual endpoint
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Generate ticket ID
      const newTicketId = `LUX-${Date.now().toString(36).toUpperCase()}`;
      setTicketId(newTicketId);
      setFormData({ name: "", email: "", phone: "", message: "" });
      setShowAutoResponse(true);
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0B0B0C' }}>
      {/* Institutional Header */}
      <div className="border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.15)', backgroundColor: '#0E0E10' }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-gray-400 hover:text-white hover:bg-white/5"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-medium tracking-wide" style={{ color: '#D4AF37' }}>
                  CONTACT US
                </h1>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  Get in touch with our team
                </p>
              </div>
            </div>
            
            {/* Center: Response Time */}
            <div className="hidden md:flex items-center gap-8">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Response Time</p>
                <p className="text-sm font-medium" style={{ color: '#F5F5F7' }}>{support.slaText}</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Email</p>
                <p className="text-sm font-medium" style={{ color: '#F5F5F7' }}>{support.email}</p>
              </div>
            </div>
            
            {/* Right: Status */}
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm" style={{ color: '#22C55E' }}>Online</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">

        {/* Hero Section */}
        <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold sm:text-2xl">We'd love to hear from you</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                Have a question about our platform, need help with a transaction, or want to learn more about LuxLedger? 
                Send us a message and we'll respond within 24 hours.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Contact Info Cards */}
          <div className="space-y-4 lg:col-span-1">
            <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-900/80">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Email</p>
                    <a 
                      href="mailto:support@luxledger.io" 
                      className="text-xs text-muted-foreground hover:text-amber-400 transition-colors"
                    >
                      support@luxledger.io
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-900/80">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Response Time</p>
                    <p className="text-xs text-muted-foreground">
                      Within 24 hours
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-900/80">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Headquarters</p>
                    <p className="text-xs text-muted-foreground">
                      Global / Remote
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95 shadow-[0_18px_45px_rgba(0,0,0,0.65)] lg:col-span-2">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-amber-400" />
                <CardTitle className="text-base font-semibold">Send a Message</CardTitle>
              </div>
              <CardDescription className="text-sm text-muted-foreground">
                Fill out the form below and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            {/* SLA Banner */}
            <div className="px-6 pb-4">
              <SLABanner />
            </div>
            <CardContent className="pt-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs uppercase tracking-[0.18em]">
                      Name <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className="bg-black/40"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs uppercase tracking-[0.18em]">
                      Email <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="bg-black/40"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs uppercase tracking-[0.18em]">
                    Phone Number <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    className="bg-black/40"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-xs uppercase tracking-[0.18em]">
                    Message <span className="text-red-400">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="How can we help you? Please describe your question or issue in detail..."
                    className="min-h-[150px] bg-black/40 resize-none"
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                  <p className="text-xs text-muted-foreground">
                    <span className="text-red-400">*</span> Required fields
                  </p>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto rounded-full bg-amber-500 text-black shadow-[0_14px_40px_rgba(0,0,0,0.7)] hover:bg-amber-400 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-pulse">Sending...</span>
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Additional Help */}
        <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-900/80">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold">Need immediate help?</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Check our Help Center for answers to common questions.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/help")}
                className="shrink-0"
              >
                Visit Help Center
                <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Response Dialog */}
      <AutoResponseDialog
        isOpen={showAutoResponse}
        onClose={() => setShowAutoResponse(false)}
        ticketId={ticketId}
        type="contact"
      />
    </div>
  );
}
