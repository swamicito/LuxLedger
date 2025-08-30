import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchFilters {
  search: string;
  category: string[];
  priceRange: [number, number];
  status: string[];
  currency: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SearchFilterProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  className?: string;
}

const categories = [
  { value: "real_estate", label: "Real Estate" },
  { value: "luxury_goods", label: "Luxury Goods" },
  { value: "vehicles", label: "Vehicles" },
  { value: "art", label: "Art" },
  { value: "jewelry", label: "Jewelry" },
];

const statuses = [
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "tokenized", label: "Tokenized" },
  { value: "listed", label: "Listed" },
];

const currencies = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "XRP", label: "XRP" },
];

const sortOptions = [
  { value: "created_at", label: "Date Created" },
  { value: "estimated_value", label: "Value" },
  { value: "title", label: "Title" },
  { value: "category", label: "Category" },
];

export function SearchFilter({ filters, onFiltersChange, className }: SearchFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const updateFilters = (updates: Partial<SearchFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleCategory = (category: string) => {
    const newCategories = filters.category.includes(category)
      ? filters.category.filter(c => c !== category)
      : [...filters.category, category];
    updateFilters({ category: newCategories });
  };

  const toggleStatus = (status: string) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    updateFilters({ status: newStatuses });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      category: [],
      priceRange: [0, 1000000],
      status: [],
      currency: "USD",
      sortBy: "created_at",
      sortOrder: "desc",
    });
  };

  const activeFiltersCount = 
    filters.category.length + 
    filters.status.length + 
    (filters.search ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000000 ? 1 : 0);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search assets..."
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="pl-10 pr-4"
        />
      </div>

      {/* Quick Sort */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">Sort by:</Label>
        <Select
          value={filters.sortBy}
          onValueChange={(value) => updateFilters({ sortBy: value })}
        >
          <SelectTrigger className="w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateFilters({ 
            sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
          })}
        >
          {filters.sortOrder === 'asc' ? '↑' : '↓'}
        </Button>
      </div>

      {/* Advanced Filters Toggle */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Advanced Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
              <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          )}
        </div>

        <CollapsibleContent className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6 space-y-6">
              {/* Categories */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Categories</Label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <div key={category.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.value}`}
                        checked={filters.category.includes(category.value)}
                        onCheckedChange={() => toggleCategory(category.value)}
                      />
                      <Label
                        htmlFor={`category-${category.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {category.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Price Range: {filters.currency} {filters.priceRange[0].toLocaleString()} - {filters.priceRange[1].toLocaleString()}
                </Label>
                <div className="space-y-3">
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) => updateFilters({ priceRange: value as [number, number] })}
                    min={0}
                    max={1000000}
                    step={1000}
                    className="w-full"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="min-price" className="text-xs">Min Price</Label>
                      <Input
                        id="min-price"
                        type="number"
                        value={filters.priceRange[0]}
                        onChange={(e) => updateFilters({ 
                          priceRange: [Number(e.target.value), filters.priceRange[1]]
                        })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-price" className="text-xs">Max Price</Label>
                      <Input
                        id="max-price"
                        type="number"
                        value={filters.priceRange[1]}
                        onChange={(e) => updateFilters({ 
                          priceRange: [filters.priceRange[0], Number(e.target.value)]
                        })}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Currency */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Currency</Label>
                <Select
                  value={filters.currency}
                  onValueChange={(value) => updateFilters({ currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  {statuses.map((status) => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status.value}`}
                        checked={filters.status.includes(status.value)}
                        onCheckedChange={() => toggleStatus(status.value)}
                      />
                      <Label
                        htmlFor={`status-${status.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {status.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: {filters.search}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => updateFilters({ search: "" })}
              />
            </Badge>
          )}
          {filters.category.map((category) => (
            <Badge key={category} variant="secondary" className="flex items-center gap-1">
              {categories.find(c => c.value === category)?.label}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => toggleCategory(category)}
              />
            </Badge>
          ))}
          {filters.status.map((status) => (
            <Badge key={status} variant="secondary" className="flex items-center gap-1">
              {statuses.find(s => s.value === status)?.label}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => toggleStatus(status)}
              />
            </Badge>
          ))}
          {(filters.priceRange[0] > 0 || filters.priceRange[1] < 1000000) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Price: {filters.currency} {filters.priceRange[0].toLocaleString()} - {filters.priceRange[1].toLocaleString()}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => updateFilters({ priceRange: [0, 1000000] })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}