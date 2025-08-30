import { quoteFees, FeeQuoteInput, FeeQuote } from '@/lib/fees';

// Mock API endpoint for fees calculation
// In a real application, this would be handled by a backend server
export async function calculateFees(input: FeeQuoteInput): Promise<FeeQuote> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  try {
    const result = quoteFees(input);
    return result;
  } catch (error) {
    throw new Error('Failed to calculate fees');
  }
}

// For compatibility with Next.js API routes format
export const POST = async (request: Request) => {
  try {
    const body = await request.json() as FeeQuoteInput;
    const result = quoteFees(body);
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
};
