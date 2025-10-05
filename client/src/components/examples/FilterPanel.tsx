import { useState } from "react";
import FilterPanel, { type FilterState } from "../FilterPanel";

export default function FilterPanelExample() {
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    broker: "",
    minAmount: "",
    maxAmount: "",
    searchText: "",
  });

  return (
    <div className="p-4 bg-background">
      <div className="max-w-sm">
        <FilterPanel filters={filters} onFiltersChange={setFilters} />
      </div>
    </div>
  );
}
