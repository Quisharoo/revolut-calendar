import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RepeatIcon, Search, X } from "lucide-react";
import { getCategoryDotColor } from "@/lib/transactionUtils";

export interface FilterState {
  categories: string[];
  source: string;
  minAmount: string;
  maxAmount: string;
  searchText: string;
  recurringOnly: boolean;
}

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

// Transfer category exists in schema but is hidden from UI filters
// Transfers are grouped with Income (positive) or Expense (negative) in the UI
const CATEGORIES = ["Income", "Expense"];

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

  const toggleRecurringOnly = () => {
    onFiltersChange({ ...filters, recurringOnly: !filters.recurringOnly });
  };

  const clearFilters = () => {
    onFiltersChange({
      categories: [],
      source: "",
      minAmount: "",
      maxAmount: "",
      searchText: "",
      recurringOnly: false,
    });
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.source ||
    filters.minAmount ||
    filters.maxAmount ||
    filters.searchText ||
    filters.recurringOnly;

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

      <div className="space-y-3">
        <Label className="text-sm font-medium">Recurring</Label>
        <div>
          <Badge
            variant={filters.recurringOnly ? "default" : "outline"}
            className="cursor-pointer hover-elevate active-elevate-2 inline-flex items-center gap-1"
            onClick={toggleRecurringOnly}
            data-testid="badge-filter-recurring"
          >
            <RepeatIcon className="w-3 h-3" />
            Recurring
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="source" className="text-sm font-medium">
          Source
        </Label>
        <Input
          id="source"
          placeholder="Filter by merchant, broker, or counterparty..."
          value={filters.source}
          onChange={(e) =>
            onFiltersChange({ ...filters, source: e.target.value })
          }
          data-testid="input-source"
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
