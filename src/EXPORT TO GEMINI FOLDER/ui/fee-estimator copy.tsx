"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { calculateFees } from "@/api/fees";
import { type Category, type PayMethod } from "@/lib/fees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FeeEstimator() {
  const [price, setPrice] = useState(250000);
  const [category, setCategory] = useState<Category>("cars");
  const [payMethod, setPayMethod] = useState<PayMethod>("crypto");
  const [auction, setAuction] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function calc() {
    setLoading(true);
    try {
      const result = await calculateFees({ 
        category, 
        priceUSD: price, 
        payMethod, 
        auction 
      });
      setData(result);
    } catch (error) {
      console.error('Failed to calculate fees:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto" style={{ backgroundColor: 'var(--charcoal)', borderColor: 'var(--graphite)' }}>
      <CardHeader>
        <CardTitle style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
          Fee Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price" style={{ color: 'var(--ivory)' }}>Asset Price (USD)</Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(+e.target.value)}
              style={{ 
                backgroundColor: 'var(--graphite)', 
                borderColor: 'var(--gold)',
                color: 'var(--ivory)'
              }}
            />
          </div>

          <div>
            <Label htmlFor="category" style={{ color: 'var(--ivory)' }}>Category</Label>
            <Select value={category} onValueChange={(value: Category) => setCategory(value)}>
              <SelectTrigger style={{ 
                backgroundColor: 'var(--graphite)', 
                borderColor: 'var(--gold)',
                color: 'var(--ivory)'
              }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jewelry">Jewelry & Watches</SelectItem>
                <SelectItem value="cars">Vehicles (Exotic/Collector)</SelectItem>
                <SelectItem value="re_whole">Real Estate (Whole Property)</SelectItem>
                <SelectItem value="re_fractional_primary">Fractional RE (Primary)</SelectItem>
                <SelectItem value="re_fractional_secondary">Fractional RE (Secondary)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="payMethod" style={{ color: 'var(--ivory)' }}>Payment Method</Label>
            <Select value={payMethod} onValueChange={(value: PayMethod) => setPayMethod(value)}>
              <SelectTrigger style={{ 
                backgroundColor: 'var(--graphite)', 
                borderColor: 'var(--gold)',
                color: 'var(--ivory)'
              }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="crypto">Crypto (XRP/XLM)</SelectItem>
                <SelectItem value="fiat">Fiat Currency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="auction"
              checked={auction}
              onCheckedChange={(checked) => setAuction(checked as boolean)}
            />
            <Label htmlFor="auction" style={{ color: 'var(--ivory)' }}>
              Auction Premium
            </Label>
          </div>
        </div>

        <Button 
          onClick={calc} 
          disabled={loading}
          className="w-full btn-gold"
        >
          {loading ? 'Calculating...' : 'Calculate Fees'}
        </Button>

        {data && (
          <div className="space-y-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--lux-black)' }}>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--gold)' }}>Fee Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--ivory)' }}>
                  ${data.buyerFeeUSD.toLocaleString()}
                </div>
                <div className="text-sm" style={{ color: 'var(--ivory)' }}>Buyer Fee</div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--ivory)' }}>
                  ${data.sellerFeeUSD.toLocaleString()}
                </div>
                <div className="text-sm" style={{ color: 'var(--ivory)' }}>Seller Fee</div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--gold)' }}>
                  ${data.platformFeeUSD.toLocaleString()}
                </div>
                <div className="text-sm" style={{ color: 'var(--gold)' }}>Total Platform Fee</div>
              </div>
            </div>
            {data.notes && data.notes.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--gold)' }}>Notes:</h4>
                <ul className="text-sm space-y-1" style={{ color: 'var(--ivory)' }}>
                  {data.notes.map((note: string, index: number) => (
                    <li key={index}>• {note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
