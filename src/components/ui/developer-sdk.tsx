import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Code, Copy, ExternalLink, Key, Globe, Zap, Shield } from "lucide-react";
import { toast } from "sonner";

interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  parameters: string[];
  response: string;
}

interface SDKExample {
  language: string;
  code: string;
}

export function DeveloperSDK() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [apiKey, setApiKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  const restEndpoints: APIEndpoint[] = [
    {
      method: "GET",
      path: "/api/v1/assets",
      description: "List all verified assets",
      parameters: ["page", "limit", "category", "region"],
      response: "Array of asset objects with metadata"
    },
    {
      method: "GET",
      path: "/api/v1/assets/{id}",
      description: "Get detailed asset information",
      parameters: ["id"],
      response: "Complete asset object with ownership history"
    },
    {
      method: "POST",
      path: "/api/v1/assets/{id}/tokenize",
      description: "Tokenize an asset on blockchain",
      parameters: ["id", "blockchain", "metadata"],
      response: "Tokenization transaction details"
    },
    {
      method: "GET",
      path: "/api/v1/auctions",
      description: "List active auctions",
      parameters: ["status", "category", "min_price", "max_price"],
      response: "Array of auction objects"
    },
    {
      method: "POST",
      path: "/api/v1/auctions/{id}/bid",
      description: "Place a bid on an auction",
      parameters: ["id", "amount", "max_bid"],
      response: "Bid confirmation and current auction state"
    }
  ];

  const graphqlQueries = [
    {
      name: "Assets Query",
      description: "Fetch assets with advanced filtering",
      query: `query GetAssets($filter: AssetFilter, $pagination: Pagination) {
  assets(filter: $filter, pagination: $pagination) {
    id
    title
    category
    estimatedValue
    currency
    images
    status
    owner {
      id
      displayName
    }
    tokenization {
      blockchain
      contractAddress
      tokenId
    }
    provenance {
      previousOwner
      transferDate
      transferPrice
    }
  }
}`
    },
    {
      name: "Auction Query",
      description: "Real-time auction data with bids",
      query: `query GetAuction($id: ID!) {
  auction(id: $id) {
    id
    asset {
      title
      images
    }
    startingPrice
    currentPrice
    reservePrice
    endTime
    status
    bids {
      amount
      bidder {
        displayName
      }
      timestamp
    }
  }
}`
    }
  ];

  const sdkExamples: { [key: string]: SDKExample[] } = {
    javascript: [
      {
        language: "JavaScript/TypeScript",
        code: `import { LuxLedgerSDK } from '@luxledger/sdk';

const client = new LuxLedgerSDK({
  apiKey: 'your-api-key',
  environment: 'production' // or 'sandbox'
});

// Fetch assets
const assets = await client.assets.list({
  category: 'art',
  priceRange: { min: 10000, max: 100000 }
});

// Place a bid
const bid = await client.auctions.placeBid('auction-id', {
  amount: 50000,
  maxBid: 75000
});

// Subscribe to real-time updates
client.subscribe('auction:auction-id', (data) => {
  console.log('New bid:', data);
});`
      }
    ],
    python: [
      {
        language: "Python",
        code: `from luxledger import LuxLedgerClient

client = LuxLedgerClient(
    api_key="your-api-key",
    environment="production"
)

# Fetch assets
assets = client.assets.list(
    category="real_estate",
    region="new_york"
)

# Create a fractional ownership offering
offering = client.fractional.create(
    asset_id="asset-123",
    total_shares=1000,
    price_per_share=100.00
)

# Get market analytics
analytics = client.analytics.get_market_trends(
    timeframe="30d",
    categories=["art", "watches"]
)`
      }
    ],
    php: [
      {
        language: "PHP",
        code: `<?php
require_once 'vendor/autoload.php';

use LuxLedger\\SDK\\Client;

$client = new Client([
    'api_key' => 'your-api-key',
    'environment' => 'production'
]);

// List assets
$assets = $client->assets()->list([
    'category' => 'jewelry',
    'verified' => true
]);

// Create webhook
$webhook = $client->webhooks()->create([
    'url' => 'https://yoursite.com/webhooks/luxledger',
    'events' => ['auction.bid_placed', 'asset.tokenized']
]);
?>`
      }
    ],
    curl: [
      {
        language: "cURL",
        code: `# List assets
curl -X GET "https://api.luxledger.com/v1/assets" \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json"

# Place bid
curl -X POST "https://api.luxledger.com/v1/auctions/123/bid" \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 50000,
    "currency": "USD",
    "max_bid": 75000
  }'

# GraphQL Query
curl -X POST "https://api.luxledger.com/graphql" \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "query { assets { id title category } }"
  }'`
      }
    ]
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const generateApiKey = () => {
    const key = `luxledger_${Math.random().toString(36).substr(2, 32)}`;
    setApiKey(key);
    toast.success("API key generated!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Code className="w-6 h-6 text-primary" />
            Developer SDK & APIs
          </h2>
          <p className="text-muted-foreground">Build powerful integrations with LuxLedger's marketplace</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rest">REST API</TabsTrigger>
          <TabsTrigger value="graphql">GraphQL</TabsTrigger>
          <TabsTrigger value="sdk">SDKs</TabsTrigger>
          <TabsTrigger value="widgets">Widgets</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-500" />
                  REST API
                </CardTitle>
                <CardDescription>RESTful endpoints for all marketplace functions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="secondary">5 endpoints</Badge>
                  <div className="text-sm text-muted-foreground">
                    Complete CRUD operations for assets, auctions, and user management
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-500" />
                  GraphQL
                </CardTitle>
                <CardDescription>Flexible queries with real-time subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="secondary">Real-time</Badge>
                  <div className="text-sm text-muted-foreground">
                    Advanced filtering, nested queries, and live auction updates
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  SDKs
                </CardTitle>
                <CardDescription>Official libraries in multiple languages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="secondary">4 languages</Badge>
                  <div className="text-sm text-muted-foreground">
                    JavaScript, Python, PHP, and native mobile SDKs
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* API Key Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Key Management
              </CardTitle>
              <CardDescription>Generate and manage your API keys</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Your API key will appear here"
                  value={apiKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button onClick={generateApiKey}>
                  Generate Key
                </Button>
                {apiKey && (
                  <Button variant="outline" onClick={() => copyToClipboard(apiKey)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Keep your API key secure. Include it in the Authorization header as a Bearer token.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rest" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>REST API Endpoints</CardTitle>
              <CardDescription>Base URL: https://api.luxledger.com/v1</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {restEndpoints.map((endpoint, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={endpoint.method === 'GET' ? 'secondary' : 'default'}>
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {endpoint.path}
                      </code>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {endpoint.description}
                    </div>
                    <div className="flex gap-4 text-xs">
                      <div>
                        <span className="font-medium">Parameters: </span>
                        {endpoint.parameters.join(', ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="graphql" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>GraphQL Endpoint</CardTitle>
              <CardDescription>https://api.luxledger.com/graphql</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {graphqlQueries.map((query, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{query.name}</h4>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(query.query)}>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">{query.description}</div>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{query.query}</code>
                  </pre>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sdk" className="space-y-6">
          <Tabs defaultValue="javascript" className="space-y-4">
            <TabsList>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="php">PHP</TabsTrigger>
              <TabsTrigger value="curl">cURL</TabsTrigger>
            </TabsList>

            {Object.entries(sdkExamples).map(([lang, examples]) => (
              <TabsContent key={lang} value={lang}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{examples[0].language} SDK</CardTitle>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(examples[0].code)}>
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{examples[0].code}</code>
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        <TabsContent value="widgets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>White-label Embed Widgets</CardTitle>
              <CardDescription>Embed LuxLedger functionality in your own website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Asset Gallery Widget</h4>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-background h-16 rounded border flex items-center justify-center text-xs">
                        Asset 1
                      </div>
                      <div className="bg-background h-16 rounded border flex items-center justify-center text-xs">
                        Asset 2
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Get Embed Code
                  </Button>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Live Auction Widget</h4>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="bg-background p-3 rounded border">
                      <div className="text-xs font-medium">Live Auction</div>
                      <div className="text-xs text-muted-foreground">Current: $45,000</div>
                      <div className="text-xs text-green-600">⚡ Active</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Get Embed Code
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Embed Configuration</h4>
                <div className="text-sm bg-muted p-4 rounded-lg font-mono">
                  {`<script src="https://cdn.luxledger.com/widgets.js"></script>
<div id="luxledger-widget" 
     data-type="gallery" 
     data-category="art"
     data-theme="light"
     data-api-key="your-api-key">
</div>`}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>Receive real-time notifications for marketplace events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Webhook URL</label>
                <Input
                  placeholder="https://yoursite.com/webhooks/luxledger"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Events</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'auction.bid_placed',
                    'auction.completed',
                    'asset.tokenized',
                    'asset.listed',
                    'transaction.completed',
                    'user.kyc_approved'
                  ].map((event) => (
                    <label key={event} className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm font-mono">{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button className="w-full">Configure Webhook</Button>

              <div className="mt-6">
                <h5 className="font-medium mb-2">Example Webhook Payload</h5>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{`{
  "event": "auction.bid_placed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "auction_id": "auction_123",
    "bid_amount": 50000,
    "bidder_id": "user_456",
    "currency": "USD"
  }
}`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}