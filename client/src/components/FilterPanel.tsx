import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { getCategoryDotColor } from "@/lib/transactionUtils";

export interface FilterState {
  categories: string[];
  broker: string;
  minAmount: string;
  maxAmount: string;
  searchText: string;
}

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const CATEGORIES = ["Income", "Expense", "Transfer"];

export default function FilterPanel({
  filters,
  onFiltersChange,
}: FilterPanelProps) {
  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const clearFilters = () => {
    onFiltersChange({
      categories: [],
      broker: "",
      minAmount: "",
      maxAmount: "",
      searchText: "",
    });
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.broker ||
    filters.minAmount ||
    filters.maxAmount ||
    filters.searchText;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground" data-testid="heading-filters">
          Filters
        </h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            data-testid="button-clear-filters"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="search" className="text-sm font-medium">
          Search
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search transactions..."
            value={filters.searchText}
            onChange={(e) =>
              onFiltersChange({ ...filters, searchText: e.target.value })
            }
            className="pl-9"
            data-testid="input-search"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Categories</Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => {
            const isActive = filters.categories.includes(category);
            return (
              <Badge
                key={category}
                variant={isActive ? "default" : "outline"}
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={() => toggleCategory(category)}
                data-testid={`badge-category-${category.toLowerCase()}`}
              >
                <span
                  className={`w-2 h-2 rounded-full mr-1.5 ${getCategoryDotColor(category)}`}
                />
                {category}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="broker" className="text-sm font-medium">
          Broker
        </Label>
        <Input
          id="broker"
          placeholder="Filter by broker..."
          value={filters.broker}
          onChange={(e) =>
            onFiltersChange({ ...filters, broker: e.target.value })
          }
          data-testid="input-broker"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Amount Range</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input
              type="number"
              placeholder="Min"
              value={filters.minAmount}
              onChange={(e) =>
                onFiltersChange({ ...filters, minAmount: e.target.value })
              }
              data-testid="input-min-amount"
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxAmount}
              onChange={(e) =>
                onFiltersChange({ ...filters, maxAmount: e.target.value })
              }
              data-testid="input-max-amount"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
